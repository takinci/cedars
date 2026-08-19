// CEDARS model layer — the department calculation engine (buildFleet / computeDashboard /
// computeInterventions) plus the pure, icon-free data tables they read. Extracted verbatim from
// main.jsx so the calculation logic is a single source of truth that runs headlessly and is
// unit-tested in model.test.js. Depends only on ./calc.js — no React, no DOM, no lucide icons.
// UI/presentation data (equipment cards, presets, AI model library, tooltips) stays in main.jsx.
import { getCI, CARBON_INTENSITY } from './calc.js';

// Imaging data storage — per-study file sizes (MB) by modality (Doo et al. JACR 2024, Fig 2;
// CT with reformats from Jia et al. Eur Radiol 2026). Editable estimates; vary by site/compression.
const MODALITY_MB = {MRI:350, CT:700, 'PET-CT':1700, 'Radiography':10, Ultrasound:300, 'Angio/IR':350, Fluoroscopy:120};

// Storage energy intensity (kWh per TB per year, all-in incl. servers, network, PUE) — corrected
// 2026-08. Jia et al. 2026's own formula (HDD + servers ÷ TB/server + network ÷ TB/server, × PUE)
// gave 600 kWh/TB/yr on-prem, but that used a 136 kWh/TB HDD figure and 12 TB/server density
// implying older/smaller drives and a small dense-compute-style server, not a real bulk archive.
// Re-run with concretely-sourced modern hardware instead: Seagate Exos X24 (24 TB nearline HDD,
// exactly Jia's "HDD" category) datasheet power 6.3-8.9 W — ≈2.74 kWh/TB/yr blended, ~50x lower
// than Jia's 136; Backblaze's published Storage Pod design (60 drives/4U, a real high-density
// archive-server architecture, not a guess) → 1,440 TB/server, giving ≈1.43 kWh/TB/yr for the
// server term (unchanged 2059 kWh/server/yr from Jia) and ≈0.22 for network. IT total ≈4.39
// kWh/TB/yr, × Jia's own PUE 1.8 (kept for methodological consistency — this is a hardware/
// density fix, not a PUE argument) ≈ 7.9 on-prem. Cloud uses PUE 1.1 (matches CEDARS's own
// Google Cloud PUE default) ≈ 4.8. See sources.md for the full derivation and its residual
// uncertainty (server density and PUE choice are reasoned assumptions, not one directly-reported
// end-to-end figure — no single paper publishes a modern bulk-medical-archive kWh/TB number).
const STORAGE_KWH_PER_TB_ONPREM = 7.9;

const STORAGE_KWH_PER_TB_CLOUD  = 4.8;

const TIME_MULT = {Monthly: 1, Quarterly: 3, Annual: 12};

const TIME_LABEL = {Monthly: "/mo", Quarterly: "/qtr", Annual: "/yr"};

// Per-unit equipment specs — one row = one machine/set. Power values from literature (see sources.md).
// MRI specs originally calibrated to MODALITY_BENCHMARKS annual kWh (Chaban JMRI 2023, Vosshenrich
//   2024, Klein 2024): 0.35T permanent magnet → ≈18 MWh/yr (unaffected, still holds). 1.5T and 3T
//   were revised 2026-08 against directly-measured power-state data (Woolen et al. 2023,
//   Radiol-230441 — see idle_kw/off_kw note below) and no longer match the original
//   MODALITY_BENCHMARKS targets: 1.5T is now ≈123 MWh/yr (was ≈233 MWh/yr — the original target
//   was itself built on an idle_kw that turned out to exceed active_kw, a pattern Woolen's real
//   scanner data never shows). 3T is ≈131 MWh/yr (~131 MWh/yr target, effectively unchanged).
//   7T research → ≈196 MWh/yr, untouched (no comparable direct-measurement data available).
// CT: corrected 2026-08 from an earlier 60/8/3/0.2 kW default that cited Acra-2024/CJRS-2022 as
//   supporting "40-80 kW active" — checking both papers directly, neither reports anything near
//   that for any state they measure (Acra-2024: idle ≈2.6 kW, low-power ≈0.89 kW, off <0.01 kW;
//   CJRS-2022, a real 128-slice CT: "System ON" ≈3 kW, "Computer ON" ≈1.5 kW, shutdown ≈0.5 kW).
//   60 kW was very likely a peak/instantaneous X-ray-exposure spec misapplied as a sustained
//   active-hours average. Now anchored directly to CJRS-2022's measured states (active≈"System
//   ON", idle≈"Computer ON", off≈shutdown; standby interpolated, no 4th measured state exists).
//   These are overnight/non-operational measurements, so active_kw likely still somewhat
//   understates true daytime per-scan throughput — see sources.md.
// PET-CT: 22 kW active + 5 kW idle calibrated exactly to MODALITY_BENCHMARKS 66,150 kWh/yr.
// PACS/servers was NOT cross-checked against an annual-kWh benchmark (no MODALITY_BENCHMARKS
// entry) and its citation doesn't hold up under scrutiny either — see sources.md, unverified.
// MRI idle_kw/off_kw (1.5T/3T — superconducting): corrected 2026-08 using Woolen et al. 2023
// (Radiol-230441, Table 1 in Chaban et al. 2024 JMRI review) — direct power-meter data, 4 real
// scanners, 3 vendors: Idle 10–15 kW, Off 7–10 kW (upper bound used for both here; the paper's
// range isn't broken out by field strength, so 1.5T and 3T share it pending better data).
// mri_15t idle_kw was previously 32 kW (exceeding its own active_kw of 22 — a pattern that
// doesn't occur in ANY of Woolen's 4 real scanners; power rises monotonically idle→prepared-to-
// scan→scan) — now 15 kW, cutting its annual total by ~28% (242→175 MWh/yr). off_kw supersedes
// an earlier 75%-of-idle approximation now that Woolen's own off-state range is available directly.
// A superconducting magnet's cryocooler cannot be switched off without risking magnet quench
// (helium boil-off), so "off" still draws substantial power — this is why off_kw (7–10 kW) is so
// much higher than a simple "powered down" assumption, not because off_h itself is large.
// Separately worth flagging: the earlier version of this note miscited "MRI off state consumes
// 35-47 MWh/yr (31-38% of annual total)" to Woolen et al. — that figure is actually from Heye et
// al. 2020 (Radiology 295:593-605), an independent, earlier study Woolen's own Discussion cites
// for comparison, not Woolen's own result (see sources.md, corrected 2026-08). Woolen's own
// Table 3 shows off-mode duration is highly variable (2.5%-59.5% of time across their 4
// scanners, driven by site policy, not a physical constant) — the one unit actually run in off
// mode implies ~434 h/month, far above this table's off_h=34/month, but there's no single
// Woolen-derived default to replace it with. That's a much bigger, cross-cutting change (the
// 160/300/250/34 hour split is shared by nearly every EQUIPMENT_UNITS row, not just MRI) and is
// NOT applied here — flagging for a dedicated follow-up rather than folding into this power-value fix.
// mri_7t idle_kw/off_kw unchanged — Woolen's study didn't include 7T (research-only) scanners,
// and higher idle/off draw is physically plausible for their larger, more complex cryo/RF systems.
// 0.35T (mri_035t) is unaffected — permanent magnet, no cryocooler, off ≈ idle already holds.
// Workstations: corrected 2026-08 from an earlier 2 kW/0.8 kW/0.2 kW/0.05 kW default (which was
// ~24x too high) to values directly measured by Büttner et al. 2021 (Eur J Radiol Open, "Switching
// off for future" — direct power measurement of a real reading workstation): 117.4 W powered on,
// 54.2 W standby, 18.2 W off. Deliberately NOT sourced from any paper used as a validation
// benchmark elsewhere for this tool — see sources.md. Büttner's model doesn't distinguish "idle"
// from "on" (a workstation not yet in standby draws the same whether actively used or just
// sitting there), so idle_kw = active_kw here.
const EQUIPMENT_UNITS = {
  mri_035t:    {name:"MRI (0.35T)",    modality:"MRI",        active_kw:6,   idle_kw:1.5, standby_kw:0.5, off_kw:0.05, active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:80,  scans:800},
  mri_15t:     {name:"MRI (1.5T)",     modality:"MRI",        active_kw:22,  idle_kw:15,  standby_kw:7.5, off_kw:10,   active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:1000},
  mri_3t:      {name:"MRI (3T)",       modality:"MRI",        active_kw:30,  idle_kw:15,  standby_kw:5,   off_kw:10,   active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:1200},
  mri_7t:      {name:"MRI (7T)",       modality:"MRI",        active_kw:45,  idle_kw:22,  standby_kw:8,   off_kw:16.5, active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:150, scans:300},
  ct:          {name:"CT Scanner",     modality:"CT",         active_kw:3,   idle_kw:1.5, standby_kw:1.0, off_kw:0.5,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:1800},
  petct:       {name:"PET-CT",         modality:"PET-CT",     active_kw:22,  idle_kw:5,   standby_kw:2,   off_kw:0.3,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:100, scans:400},
  xray:        {name:"Radiography Room",     modality:"Radiography",      active_kw:12,  idle_kw:2,   standby_kw:0.6, off_kw:0.1,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
  ultrasound:  {name:"Ultrasound",     modality:"Ultrasound", active_kw:1.5, idle_kw:0.4, standby_kw:0.1, off_kw:0.02, active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
  // Corrected 2026-08 (was active 5 kW / idle 1 kW / standby 0.3 kW / off 0.1 kW — implied
  // ~10,190 kWh/yr, 4-6x above real measurement). Rossini et al. 2026 (Eur Radiol, 3 real
  // mammography units, minute-by-minute power monitoring) report ~1660-2300 kWh/yr per
  // machine and net (incremental exposure) energy of only 0.05-0.09 kWh/exam — mammography's
  // x-ray exposure itself is brief and low-power, unlike CT/MRI. The paper measures two states
  // (net/active vs. blended baseload), not CEDARS's 4-state model, so active_kw/idle_kw/
  // standby_kw/off_kw here are back-solved to reproduce the real annual total at this table's
  // own hour split and scan volume — see sources.md for the derivation.
  mammography: {name:"Mammography",    modality:"Radiography",      active_kw:0.5, idle_kw:0.2, standby_kw:0.15, off_kw:0.1,  active_h:100, idle_h:250, standby_h:300, off_h:94, avoidable_idle_h:80,  scans:800},
  pacs:        {name:"PACS / Servers", modality:"PACS/RIS",   active_kw:4,   idle_kw:4,   standby_kw:4,   off_kw:4,    active_h:160, idle_h:300, standby_h:250, off_h:34,  avoidable_idle_h:120, scans:0},
  workstations:{name:"Workstations",   modality:"Workstation",active_kw:0.1174, idle_kw:0.1174, standby_kw:0.0542, off_kw:0.0182, active_h:160, idle_h:300, standby_h:250, off_h:34,  avoidable_idle_h:120, scans:0},
  // Interventional imaging — power from direct sensor measurements (Vosshenrich et al., AJR 2024, 10.2214/AJR.24.30988).
  // Hours from paper Table 3 annual projections ÷ 12. No distinct standby mode; standby_kw = off_kw.
  // IR suite = Artis pheno (monoplanar). Fluoroscopy = Artis zee multipurpose. Chiller not included in sensor.
  angio:       {name:"Angio / IR Suite",  modality:"Angio/IR",    active_kw:7.5, idle_kw:6.9, standby_kw:1.1, off_kw:1.1, active_h:105, idle_h:116, standby_h:0, off_h:509, avoidable_idle_h:120, scans:80},
  fluoro:      {name:"Fluoroscopy Unit",  modality:"Fluoroscopy", active_kw:3.1, idle_kw:2.8, standby_kw:0.6, off_kw:0.6, active_h:107, idle_h:118, standby_h:0, off_h:505, avoidable_idle_h:90,  scans:120},
};

// Start empty — no equipment preselected, so the landing page reads as a blank, editable form
// (nothing is "already computed") until the user adds devices or picks a Quick-start preset.
const DEFAULT_EQUIPMENT = {mri_035t:0, mri_15t:0, mri_3t:0, mri_7t:0, ct:0, petct:0, angio:0, fluoro:0, xray:0, ultrasound:0, mammography:0, pacs:0, workstations:0};

// Per-device fields a user can override with their own measured data (scanner logs, utility
// bills, published benchmarks) — anything not present in `overrides[key]` keeps the
// EQUIPMENT_UNITS literature default. Hours (active_h/idle_h/standby_h/off_h) are not yet
// overridable — deferred; the plumbing below is field-agnostic so it's a one-line extension.
const OVERRIDABLE_FIELDS = ['active_kw', 'idle_kw', 'standby_kw', 'off_kw', 'scans'];

// Build a fleet array from equipment counts — scales power by count, hours stay per-unit.
// `overrides` is a sparse {deviceKey: {field: value}} map (see OVERRIDABLE_FIELDS); devices/
// fields absent from it keep the EQUIPMENT_UNITS default. Rows with an active override are
// flagged `overridden: true` so computeDashboard can report confidence:"measured" for them.
function buildFleet(equipment, overrides = {}) {
  return Object.entries(equipment ?? DEFAULT_EQUIPMENT)
    .filter(([, n]) => typeof n === 'number' && n > 0)
    .map(([key, n]) => {
      const base = EQUIPMENT_UNITS[key];
      if (!base) return null;
      const ov = (overrides ?? {})[key] ?? {};
      const setFields = OVERRIDABLE_FIELDS.filter(f => ov[f] != null && ov[f] !== '' && !isNaN(parseFloat(ov[f])));
      const overridden = setFields.length > 0;
      const u = overridden
        ? {...base, ...Object.fromEntries(setFields.map(f => [f, parseFloat(ov[f])]))}
        : base;
      return {
        ...u,
        count:      n,                    // unit count — used to scale embodied carbon per device
        name:       n > 1 ? `${n}× ${u.name}` : u.name,
        active_kw:  u.active_kw  * n,
        idle_kw:    u.idle_kw    * n,
        standby_kw: u.standby_kw * n,
        off_kw:     u.off_kw     * n,
        scans:      u.scans      * n,
        overridden,
      };
    })
    .filter(Boolean);
}

// Monthly kWh savings per intervention — conservative departmental estimates.
// Sources: McKee 2024 (10.1148/radiol.240219), ESR Position Paper 2025, JMRI 2023 (10.1002/jmri.28994),
// IJHCQA 2016 (10.1108/IJHCQA-10-2016-0153), Radiol 2023 (10.1148/radiol.230441), AJR 2023 (10.2214/AJR.23.30189),
// LLM-Energy PDF (model efficiency), Clinical-AI PDF (virtualisation).
// Replace kwh values with before/after metering for your department.
const INTERVENTIONS = {
  // idle 15 kW × 8 h/night × ~20 nights ≈ 2 400 kWh/month (JMRI-2023, Radiol-243453)
  "Turn MRI/CT scanners off overnight":      {kwh: 2400, note: "Eliminates ~8 h/night idle draw on MRI and CT. (JMRI 2023, Radiol 2024)"},
  // standby ~40–60 % lower than idle (Herrmann 2012, CJRS 2022)
  "Use standby mode during inactive periods":{kwh: 1200, note: "Drops idle to standby during low-activity windows. (Herrmann 2012, CJRS 2022)"},
  // reducing 5–10 % unnecessary scans (McKee 2024, ESR PP 2025)
  "Reduce low-value imaging":                {kwh:  800, note: "Appropriateness-guided ordering (ACR Appropriateness Criteria, Choosing Wisely, ESR iGuide) cuts inappropriate exams — fewer scans, less active operation time, and better-targeted care. (McKee 2024; ESR PP 2025)"},
  // tighter scheduling cuts dead-time idle (IJHCQA 2016)
  "Optimize scheduling":                     {kwh:  600, note: "Tighter scheduling reduces dead-time idle energy. (IJHCQA 2016)"},
  // protocol compression reduces per-scan active time (Radiol 2023, EurRad 2024)
  "Shorten protocols":                       {kwh:  450, note: "Shorter scan times reduce active energy per study. (Radiol 2023, EurRad 2024)"},
  // each avoided CT ≈ 0.5 kWh; ~1 800 repeats/month = 900 kWh (AJR 2023)
  "Reduce repeat scans":                     {kwh:  900, note: "Each avoided repeat saves full scan energy. (AJR 2023)"},
  // grid swap from 0.38 to ≤0.10 kgCO₂e/kWh saves up to 75 % of Scope 2 (OWID)
  "Move computation to lower-carbon regions":{kwh:    0, co2Pct: 30, note: "Same energy, lower-carbon grid. (OWID carbon intensity data)"},
  // Scope 2 elimination via green tariff or PPA (ESR Green Imaging)
  "Use renewable electricity":               {kwh:    0, co2Pct: 80, note: "Scope 2 decarbonisation via green tariff or PPA. (ESR Green Imaging)"},
  // film processor and laser printer loads — uncited, editable estimate
  "Reduce paper and film printing":          {kwh:  120, note: "Printer and film processor elimination."},
  // embodied carbon amortised over more years (ESR PP 2025, Scope 3)
  "Extend hardware lifetime":                {kwh:    0, co2Pct: 15, note: "Amortises embodied carbon over more years. (ESR PP 2025)"},
  // virtualisation / right-sizing (Clinical-AI PDF, Doo 2024)
  "Consolidate servers":                     {kwh:  500, note: "Virtualisation reduces physical server count. (Doo 2024, Clinical-AI)"},
  // lighter models use less inference compute (LLM-Energy PDF)
  "Use smaller or more efficient AI models": {kwh:   80, note: "Lighter AI models use less inference compute. (LLM-Energy PDF)"},
  // data storage levers — savings computed dynamically against the storage footprint (Jia 2026; Doo 2024)
  "Store only acquired axial series (avoid reformats)": {kwh: 0, note: "Avoid storing non-essential CT/PET reformats — up to ~69% less CT storage, automatable, no clinical downside. (Jia 2026)"},
  "Migrate imaging archive to cloud":                   {kwh: 0, note: "Efficient cloud data centres cut archive storage energy ~40%. (Jia 2026; Doo 2024)"},
  "Apply an imaging data-retention policy":             {kwh: 0, note: "Move older studies to deep / low-power archive after ~8 years, shrinking the live archive. (Jia 2026)"},
};

// Cloud provider PUE and global fleet carbon intensity defaults.
// PUE sources: AWS 2022 Sustainability Report, Microsoft 2023 Environmental Report, Google 2023 Environmental Report.
// Carbon intensity is global fleet average — regional deployments vary substantially.
// Clinical AI footprint framing: Doo 2024 (10.1148/radiol.232030); lifecycle methodology: Clinical-AI PDF.
const CLOUD = {
  "Local compute": {pue: 1.50, ci: 0.25}, // typical on-premise server room (ASHRAE)
  "AWS":           {pue: 1.15, ci: 0.20}, // AWS 2022 Sustainability Report
  "Azure":         {pue: 1.15, ci: 0.18}, // Microsoft 2023 Environmental Report
  "Google Cloud":  {pue: 1.10, ci: 0.12}, // Google 2023 Environmental Report (lowest industry PUE)
};

// Cooling water: L per kWh. Google 2023 Env Report 0.45 L/kWh; typical data centre 1.5–2.5 L/kWh (ASHRAE)
const WATER_PER_KWH = 1.8;

// Embodied carbon amortised over hardware lifespan (kgCO₂e / month)
// MRI 3T: ~70 tCO₂e manufacturing / 15-yr lifespan (ESR PP 2025)
// CT: ~20 tCO₂e / 12 yr; Radiography: ~4 tCO₂e / 10 yr; Ultrasound: ~1 tCO₂e / 7 yr
const EMBODIED_KG_MO = {
  "MRI": 389, "CT": 139, "PET-CT": 278, "Angio/IR": 200, "Fluoroscopy": 80,
  "Radiography": 33, "Ultrasound": 12, "PACS/RIS": 30, "Workstation": 5,
};

const PATIENT_KM_RT    = 20;   // avg round-trip patient travel km — replace with local data (ESR sustainability guidance)

const CAR_CO2_KG_KM    = 0.17; // kgCO₂e/km average car (DEFRA 2023)

const PAPER_G_PER_ENC  = 25;   // g paper per encounter in digital workflow (ESR Green Imaging)

const HAZ_WASTE_G_SCAN = 50;   // g hazardous waste per imaging scan — contrast media disposal estimate

// Contrast media — fixed literature-default parameters (institution-dependent; editable in future).
// Iodinated (ICM) for CT/PET-CT/angio/fluoro; gadolinium (GBCA) for MRI. Excreted contrast passes
// through wastewater treatment largely unremoved (esp. gadolinium) → environmental contamination.
// Verified 2026-08 (see sources.md "Contrast media and contamination" for full citations/gaps):
// CT 40% ~matches Goldfarb 2023 (36.2% in 2013 Medicare claims, rising trend since); PET-CT 30% is
// a rough midpoint of a genuinely bimodal international-survey distribution (~30% of sites <20%
// ceCT, ~30% >80% ceCT) — real institutional practice clusters at the extremes, not the middle;
// MRI raised 0.35→0.40 (low end of the 40-50% range in Iyad et al. 2023, itself a review's
// secondary figure, not primary measured data — weakest-tier evidence). Angio/IR (90%) and
// Fluoroscopy (50%) have NO located literature source — retained as clinically-grounded expert
// estimates, not literature-sourced values; flagged as such in sources.md rather than presented
// as verified.
const CONTRAST = {
  fraction:      {CT: 0.40, "PET-CT": 0.30, "Angio/IR": 0.90, Fluoroscopy: 0.50, MRI: 0.40}, // % of exams using contrast
  icmMlPerExam:  100,   // mL iodinated contrast per enhanced exam
  iodineMgPerMl: 350,   // mgI/mL (typical 300–370)
  gbcaMlPerExam: 15,    // mL gadolinium agent per enhanced MRI (0.5 M)
  gadGramsPerExam: 1.0, // ~0.1 mmol/kg × 70 kg → ~1 g Gd per exam
  wasteFraction: 0.10,  // fraction of drawn contrast discarded unused (overfill/leftover)
  densityGPerMl: 1.4,   // approx density of iodinated contrast for waste-mass estimate
};

const ICM_MODALITIES = ["CT", "PET-CT", "Angio/IR", "Fluoroscopy"];

// ── Calculation functions ─────────────────────────────────────────────────────
const rnd = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function computeDashboard(region, timePeriod, equipment = DEFAULT_EQUIPMENT, customCi, clinicalAdj = {}, storage = {}, overrides = {}) {
  const ci       = getCI(region, customCi);
  const mult     = TIME_MULT[timePeriod] ?? 1;
  const fleet    = buildFleet(equipment, overrides);

  const byEquipment = fleet.map(eq => {
    const kwh          = (eq.active_kw*eq.active_h + eq.idle_kw*eq.idle_h + eq.standby_kw*eq.standby_h + eq.off_kw*eq.off_h) * mult;
    const activeKwh    = eq.active_kw * eq.active_h * mult;
    const idleKwh      = (eq.idle_kw * eq.idle_h + eq.standby_kw * eq.standby_h) * mult;
    const kgco2e       = kwh * ci;
    const idleWasteKwh = eq.idle_kw * eq.avoidable_idle_h * mult;
    const scans        = eq.scans * mult;
    const isImaging    = ["MRI","CT","PET-CT","Radiography","Ultrasound"].includes(eq.modality);
    return {equipment: eq.name, modality: eq.modality,
            kwh: rnd(kwh), activeKwh: rnd(activeKwh), idleKwh: rnd(idleKwh),
            kgco2e: rnd(kgco2e), scans,
            // energyPerScan only meaningful for patient-imaging rows; null for PACS/Workstation
            energyPerScan: isImaging ? rnd(kwh / scans, 3) : null,
            idleWasteKwh: rnd(idleWasteKwh), confidence: eq.overridden ? "measured" : "estimated"};
  });

  let   totalKwh       = byEquipment.reduce((s, e) => s + e.kwh, 0);
  let   totalActiveKwh = byEquipment.reduce((s, e) => s + e.activeKwh, 0);
  const totalIdleKwh   = byEquipment.reduce((s, e) => s + e.idleKwh, 0);
  let   totalCo2       = byEquipment.reduce((s, e) => s + e.kgco2e, 0);
  const totalScans     = byEquipment.reduce((s, e) => s + e.scans, 0);
  const totalIdle      = byEquipment.reduce((s, e) => s + e.idleWasteKwh, 0);
  const label          = TIME_LABEL[timePeriod];

  // Patient-generating imaging scans only (MRI/CT/Radiography/US) — excludes PACS and Workstation rows
  let imagingScans = fleet
    .filter(e => ["MRI","CT","PET-CT","Angio/IR","Fluoroscopy","Radiography","Ultrasound"].includes(e.modality))
    .reduce((s, e) => s + e.scans * mult, 0);

  // ── Deployed clinical AI adjustment ──────────────────────────────────────────
  // Clinical AI changes operations: adds inference/amortised-training compute, and
  // subtracts scanner energy (avoided low-value scans + shorter protocols) and contrast.
  // Reassigning the base totals here means every derived figure below (scopes, per-scan,
  // resources, contrast, equivalencies) recomputes from the adjusted values automatically.
  const _avoid    = Math.min(0.95, Math.max(0, clinicalAdj.avoidedFrac  || 0));
  const _scanT    = Math.min(0.95, Math.max(0, clinicalAdj.scanTimeFrac || 0));
  const _contrast = Math.min(0.95, Math.max(0, clinicalAdj.contrastFrac || 0));
  const _aiKwh    = rnd(imagingScans * (clinicalAdj.inferKwhPerStudy || 0) + (clinicalAdj.trainKwhMonthly || 0) * mult, 2);
  const _scannerSaved = totalActiveKwh * Math.min(0.95, _avoid + _scanT);
  const contrastScale = (1 - _avoid) * (1 - _contrast);
  totalKwh       = rnd(Math.max(0, totalKwh - _scannerSaved + _aiKwh), 2);
  totalActiveKwh = rnd(Math.max(0, totalActiveKwh - _scannerSaved + _aiKwh), 2);
  totalCo2       = totalKwh * ci;
  imagingScans   = imagingScans * (1 - _avoid);
  const clinicalMeta = {aiKwh: _aiKwh, scannerSavedKwh: rnd(_scannerSaved, 1),
    avoidedPct: rnd(_avoid*100, 0), scanTimePct: rnd(_scanT*100, 0), contrastPct: rnd(_contrast*100, 0),
    active: _aiKwh > 0 || _scannerSaved > 0};

  // ── Data storage & archiving (Jia et al. 2026; Doo et al. 2024) ──────────────
  // Fleet-driven: annual data = Σ (studies/yr × MB/study); held for `retentionYears` at a per-TB/yr
  // energy intensity (on-prem or cloud). Axial-only avoids non-essential CT/PET reformats. The
  // period-scaled result is added to the department totals, so it flows into carbon, cost, and grade.
  const _retention  = Math.max(0, parseFloat(storage.retentionYears ?? 10) || 0);
  const _reformat   = mod => (storage.reformats === 'axial' && (mod === 'CT' || mod === 'PET-CT')) ? 0.4 : 1;
  const _annualDataTB = fleet.reduce((s, eq) => s + (eq.scans * 12) * (MODALITY_MB[eq.modality] || 0) * _reformat(eq.modality), 0) / 1e6;
  const _storedTB   = _annualDataTB * _retention;
  // Custom intensity (measured server density/PUE) fully overrides whichever on-prem/cloud
  // default would otherwise apply — see sources.md Data storage section.
  const _customInt  = parseFloat(storage.intensityCustom);
  const _storageInt = _customInt > 0 ? _customInt : (storage.cloud ? STORAGE_KWH_PER_TB_CLOUD : STORAGE_KWH_PER_TB_ONPREM);
  const storageKwh  = rnd(_storedTB * _storageInt * mult / 12, 2);   // annual → period
  totalKwh = rnd(totalKwh + storageKwh, 2);
  totalCo2 = totalKwh * ci;

  // GHG Protocol scope breakdown
  // Scope 1: direct fuel/gas estimated at 8% of Scope 2 (backup generators, medical gas) — McKee 2024
  // Scope 3 embodied: hardware manufacturing amortised (ESR PP 2025) — use fleet for profile-awareness
  // Scope 3 travel: patient travel at PATIENT_KM_RT × CAR_CO2_KG_KM (DEFRA 2023)
  const scope2Kg       = rnd(totalCo2);
  const scope1Kg       = rnd(scope2Kg * 0.08);
  const scope3EmbKg    = rnd(fleet.reduce((s, eq) => s + (EMBODIED_KG_MO[eq.modality] ?? 0) * (eq.count ?? 1) * mult, 0));
  const scope3TravelKg = rnd(imagingScans * PATIENT_KM_RT * CAR_CO2_KG_KM);
  const scope3Kg       = rnd(scope3EmbKg + scope3TravelKg);

  // Resource metrics
  const waterLitres  = rnd(totalKwh * WATER_PER_KWH, 0);
  const paperKg      = rnd(imagingScans * PAPER_G_PER_ENC / 1000, 1);

  // Contrast media & contamination — from per-modality exam counts × fixed literature defaults
  let icmExams = 0, gbcaExams = 0;
  byEquipment.forEach(e => {
    const f = CONTRAST.fraction[e.modality] || 0;
    if (f <= 0) return;
    if (e.modality === 'MRI')                 gbcaExams += e.scans * f;
    else if (ICM_MODALITIES.includes(e.modality)) icmExams += e.scans * f;
  });
  icmExams  *= contrastScale;   // clinical AI: fewer contrast exams (avoided scans + contrast reduction)
  gbcaExams *= contrastScale;
  const icmVolumeL   = icmExams  * CONTRAST.icmMlPerExam  / 1000;
  const gbcaVolumeL  = gbcaExams * CONTRAST.gbcaMlPerExam / 1000;
  const iodineKg     = rnd(icmExams * CONTRAST.icmMlPerExam * CONTRAST.iodineMgPerMl / 1e6, 1); // mg → kg
  const gadKg        = rnd(gbcaExams * CONTRAST.gadGramsPerExam / 1000, 2);                     // g → kg
  const contrastVolumeL   = rnd(icmVolumeL + gbcaVolumeL, 0);
  const contrastWastedL   = rnd((icmVolumeL + gbcaVolumeL) * CONTRAST.wasteFraction, 1);
  const contrastHazKg     = rnd(contrastWastedL * CONTRAST.densityGPerMl, 1); // discarded contrast mass
  const hazardousKg  = rnd(imagingScans * HAZ_WASTE_G_SCAN / 1000, 1);
  const contrast = {
    enhancedExams: Math.round(icmExams + gbcaExams), icmExams: Math.round(icmExams), gbcaExams: Math.round(gbcaExams),
    iodineKg, gadKg, gadGrams: rnd(gbcaExams * CONTRAST.gadGramsPerExam, 0),
    volumeL: contrastVolumeL, wastedL: contrastWastedL, hazKg: contrastHazKg,
  };

  return {
    byEquipment,
    topOpportunities: [...byEquipment].sort((a, b) => b.idleWasteKwh - a.idleWasteKwh).slice(0, 5),
    totals: {
      kwh: rnd(totalKwh), mwh: rnd(totalKwh / 1000),
      tonnesCo2e: rnd(totalCo2 / 1000, 3),
      co2Kg: totalCo2,  // raw Scope 2 kg — used by computeInterventions to avoid double-rounding
      // divide by imagingScans (MRI/CT/Radiography/US only) not totalScans (which inflates via PACS/WS placeholders)
      energyPerScan: imagingScans > 0 ? rnd(totalKwh / imagingScans, 3) : 0,
      idleWasteKwh: rnd(totalIdle), label,
      activeKwh: rnd(totalActiveKwh), idleKwh: rnd(totalIdleKwh),
      activePct: totalKwh > 0 ? rnd(totalActiveKwh / totalKwh * 100, 1) : 0,
      idlePct:   totalKwh > 0 ? rnd(totalIdleKwh   / totalKwh * 100, 1) : 0,
    },
    scopes:    {scope1Kg, scope2Kg, scope3EmbKg, scope3TravelKg, scope3Kg, imagingScans},
    resources: {waterLitres, paperKg, hazardousKg, contrast},
    storage:   {kwh: storageKwh, storedTB: rnd(_storedTB, 1), annualDataTB: rnd(_annualDataTB, 2),
      retentionYears: _retention, cloud: !!storage.cloud, reformats: storage.reformats || 'all',
      co2: rnd(storageKwh * ci, 1), intensity: _storageInt},
    clinicalMeta,
    equivalencies: {
      car_km:          rnd(totalCo2 / 0.17,   0),
      phone_charges:   rnd(totalKwh / 0.012,  0),
      household_years: rnd(totalKwh / 3500,   2),
      trees_year:      rnd(totalCo2 / 21,     1), // 1 tree absorbs ~21 kgCO₂/yr
      flights_short:   rnd(totalCo2 / 255,    1), // avg short-haul economy seat ~255 kgCO₂ (ICAO 2023)
    },
    ci, region, timePeriod,
  };
}

// Which interventions are driven by which extra control
const SCANNER_STATE_INTERVENTIONS = new Set([
  'Turn MRI/CT scanners off overnight',
  'Use standby mode during inactive periods',
]);

const CLOUD_INTERVENTIONS = new Set([
  'Move computation to lower-carbon regions',
  'Consolidate servers',
  'Use renewable electricity',
]);

// Data-storage levers — savings computed dynamically against the archive footprint (delta from
// the user's current storage config, so they never double-count the storage-module toggles).
const STORAGE_AXIAL_LEVER     = 'Store only acquired axial series (avoid reformats)';

const STORAGE_CLOUD_LEVER     = 'Migrate imaging archive to cloud';

const STORAGE_RETENTION_LEVER = 'Apply an imaging data-retention policy';

const STORAGE_INTERVENTIONS   = new Set([STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER]);

// Combined impact of a SET of interventions (the "intervention program"). Single source of
// truth for both the Interventions tab and the EcoLabel. Computes each lever's dynamic,
// fleet-based saving, then combines: the two idle-reduction levers overlap on the same
// avoidable-idle pool (standby ⊇ scanners-off) so we take the deepest ONE rather than summing;
// all other energy levers add; carbon-% levers stack multiplicatively. Everything floors at 0.
function computeInterventions(names, region, timePeriod, equipment, customCi, cloudProvider, scannerState, storage = {}, overrides = {}) {
  const list  = Array.isArray(names) ? names.filter(n => INTERVENTIONS[n]) : (names && INTERVENTIONS[names] ? [names] : []);
  const ci    = getCI(region, customCi);
  const mult  = TIME_MULT[timePeriod] ?? 1;
  const base  = computeDashboard(region, timePeriod, equipment, customCi, {}, storage, overrides);
  const fleet = buildFleet(equipment, overrides);
  const cf    = CLOUD[cloudProvider] ?? CLOUD["Local compute"];
  const STATE_FIELD = {Active:'active_kw', Idle:'idle_kw', Standby:'standby_kw', Off:'off_kw'};
  const targetField = STATE_FIELD[scannerState] ?? 'standby_kw';

  // Per-lever energy saving (kWh, at this period's scale).
  const leverKwh = name => {
    if (name === 'Turn MRI/CT scanners off overnight')
      return rnd(fleet.filter(eq => ['MRI','CT','PET-CT'].includes(eq.modality))
        .reduce((s, eq) => s + Math.max(0, eq.idle_kw - (eq[targetField] ?? 0)) * eq.avoidable_idle_h * mult, 0));
    if (name === 'Use standby mode during inactive periods')
      return rnd(fleet
        .reduce((s, eq) => s + Math.max(0, eq.idle_kw - (eq[targetField] ?? 0)) * eq.avoidable_idle_h * mult, 0));
    if (name === 'Consolidate servers') {
      const localPue = CLOUD["Local compute"].pue;
      const computeKwh = fleet.filter(eq => ['PACS/RIS','Workstation'].includes(eq.modality))
        .reduce((s, eq) => s + (eq.active_kw*eq.active_h + eq.idle_kw*eq.idle_h + eq.standby_kw*eq.standby_h + eq.off_kw*eq.off_h) * mult, 0);
      return rnd(computeKwh * Math.max(0, 1 - cf.pue / localPue));
    }
    return rnd((INTERVENTIONS[name]?.kwh ?? 0) * mult);
  };
  // Per-lever operational-CO₂ % reduction (multiplicative levers).
  const leverCo2Pct = name => {
    if (name === 'Move computation to lower-carbon regions') {
      const computeCo2 = fleet.filter(eq => ['PACS/RIS','Workstation'].includes(eq.modality))
        .reduce((s, eq) => s + (eq.active_kw*eq.active_h + eq.idle_kw*eq.idle_h + eq.standby_kw*eq.standby_h + eq.off_kw*eq.off_h) * mult * ci, 0);
      const ciDeltaFraction = ci > cf.ci ? (ci - cf.ci) / ci : 0;
      return base.totals.co2Kg > 0 ? rnd(computeCo2 * ciDeltaFraction / base.totals.co2Kg * 100, 1) : 0;
    }
    return INTERVENTIONS[name]?.co2Pct ?? 0;
  };

  // Data-storage levers: recompute archive energy under the selected strategies vs the current
  // config, and take the delta — so ticking a lever the storage module already applies saves 0.
  const stgRet    = Math.max(0, parseFloat(storage.retentionYears ?? 10) || 0);
  const stgCloud  = !!storage.cloud;
  const stgRef    = storage.reformats === 'axial' ? 'axial' : 'all';
  const stgCustom = parseFloat(storage.intensityCustom);
  const storageKwhFor = (cloud, reformats, retention) => {
    const rf = mod => (reformats === 'axial' && (mod === 'CT' || mod === 'PET-CT')) ? 0.4 : 1;
    const annualTB = fleet.reduce((s, eq) => s + (eq.scans * 12) * (MODALITY_MB[eq.modality] || 0) * rf(eq.modality), 0) / 1e6;
    const intensity = stgCustom > 0 ? stgCustom : (cloud ? STORAGE_KWH_PER_TB_CLOUD : STORAGE_KWH_PER_TB_ONPREM);
    return annualTB * retention * intensity * mult / 12;
  };
  const stgCurrent = storageKwhFor(stgCloud, stgRef, stgRet);
  const stgAfter   = storageKwhFor(
    list.includes(STORAGE_CLOUD_LEVER)     ? true : stgCloud,
    list.includes(STORAGE_AXIAL_LEVER)     ? 'axial' : stgRef,
    list.includes(STORAGE_RETENTION_LEVER) ? Math.min(stgRet, 8) : stgRet);
  const storageSaving = rnd(Math.max(0, stgCurrent - stgAfter), 2);

  const idleLevers  = list.filter(n => SCANNER_STATE_INTERVENTIONS.has(n));
  const idleSaving  = idleLevers.length ? Math.max(...idleLevers.map(leverKwh)) : 0;      // overlap → deepest one
  const otherSaving = list.filter(n => !SCANNER_STATE_INTERVENTIONS.has(n) && !STORAGE_INTERVENTIONS.has(n)).reduce((s, n) => s + leverKwh(n), 0);
  const kwhSaved    = rnd(Math.min(base.totals.kwh, idleSaving + otherSaving + storageSaving));
  const co2Fraction = 1 - list.reduce((f, n) => f * (1 - (leverCo2Pct(n) / 100)), 1);      // stack multiplicatively

  const projectedKwh = Math.max(0, rnd(base.totals.kwh - kwhSaved));
  const baseCo2kg    = rnd(base.totals.co2Kg, 1);
  const projectedCo2 = Math.max(0, rnd(baseCo2kg * (1 - co2Fraction) - kwhSaved * ci, 1));
  const co2Saved     = rnd(baseCo2kg - projectedCo2, 1);
  const pctEnergy    = base.totals.kwh > 0 ? rnd((kwhSaved / base.totals.kwh) * 100, 1) : 0;
  const pctCo2       = baseCo2kg > 0 ? rnd((co2Saved / baseCo2kg) * 100, 1) : 0;

  return {
    selected: list, count: list.length, timePeriod,
    usesScanner: list.some(n => SCANNER_STATE_INTERVENTIONS.has(n)),
    usesCloud:   list.some(n => CLOUD_INTERVENTIONS.has(n)),
    monthlyKwhSaved: rnd(kwhSaved / mult, 1),
    baseline:  {kwh: base.totals.kwh, co2: baseCo2kg},
    projected: {kwh: projectedKwh,    co2: projectedCo2},
    savings:   {kwh: kwhSaved, co2: co2Saved, pctEnergy, pctCo2, co2Fraction},
  };
}

export {
  MODALITY_MB,
  STORAGE_KWH_PER_TB_ONPREM,
  STORAGE_KWH_PER_TB_CLOUD,
  TIME_MULT,
  TIME_LABEL,
  EQUIPMENT_UNITS,
  DEFAULT_EQUIPMENT,
  OVERRIDABLE_FIELDS,
  buildFleet,
  INTERVENTIONS,
  CLOUD,
  WATER_PER_KWH,
  EMBODIED_KG_MO,
  PATIENT_KM_RT,
  CAR_CO2_KG_KM,
  PAPER_G_PER_ENC,
  HAZ_WASTE_G_SCAN,
  CONTRAST,
  ICM_MODALITIES,
  rnd,
  computeDashboard,
  SCANNER_STATE_INTERVENTIONS,
  CLOUD_INTERVENTIONS,
  STORAGE_AXIAL_LEVER,
  STORAGE_CLOUD_LEVER,
  STORAGE_RETENTION_LEVER,
  STORAGE_INTERVENTIONS,
  computeInterventions,
};
