import React, {useState, useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Bar, Doughnut} from 'react-chartjs-2';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend} from 'chart.js';
import {Leaf, Brain, Download, Activity, Gauge, TrendingDown, Droplets, FileText, Trash2, Cpu, Car, TreePine, Plane, Factory, Zap, Target, AlertTriangle, BarChart3} from 'lucide-react';
import './styles.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ── Reference tables ──────────────────────────────────────────────────────────

// kgCO₂e/kWh per region — Our World in Data (OWID), Carbon Intensity of Electricity, 2022-2023 national averages
// https://ourworldindata.org/grapher/carbon-intensity-electricity
// Replace with local utility/Eurostat data where available.
const CARBON_INTENSITY = {
  "Switzerland":    0.10, // hydro + nuclear dominant; OWID 2023
  "France":         0.06, // ~70 % nuclear; OWID 2023
  "Germany":        0.36, // coal/gas/renewable mix; OWID 2023
  "United States":  0.38, // national grid average; OWID 2023
  "United Kingdom": 0.20, // gas + offshore wind; OWID 2023
  "EU average":     0.25, // Eurostat/EEA mean; OWID 2023
  "Editable custom":0.30, // placeholder — replace with measured utility factor
};

const TIME_MULT = {Monthly: 1, Quarterly: 3, Annual: 12};
const TIME_LABEL = {Monthly: "/mo", Quarterly: "/qtr", Annual: "/yr"};

// Monthly power-mode data per equipment. All active_kw values are literature-derived defaults;
// replace with scanner logs, OEM data sheets, or smart-meter readings.
//
// MRI:  active 30 kW — Heye et al. JMRI 2023 (DOI: 10.1002/jmri.28994) reports mean 30.1 kW for 3T;
//        supported by Radiol 2024 (10.1148/radiol.243453) and EurRad 2024 (10.1007/s00330-024-11056-0).
//        idle ~50 % of active per Herrmann 2012 (Stanford PDF); standby ~15 kW via cryocooler load (Neurad 10.1016/j.neurad.2023.12.001).
// CT:   active 60 kW mid-range — Acra 2024 (10.1016/j.acra.2024.05.004) and CJRS 2022 (10.1177/08465371221133074)
//        report 40–80 kW for modern MDCT; AJR 2023 (10.2214/AJR.23.30189) confirms idle significance.
// X-ray/Ultrasound/PACS/WS: estimated from Radiol 2024 (10.1148/radiol.240398) multi-modality IT survey.
const EQUIPMENT_BASE = [
  {name:"MRI 3T A",              modality:"MRI",         active_kw:30,  idle_kw:15,  standby_kw:5,   off_kw:0.5,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:1200},
  {name:"CT Scanner A",          modality:"CT",          active_kw:60,  idle_kw:8,   standby_kw:3,   off_kw:0.2,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:1800},
  {name:"Digital X-ray Room",    modality:"X-ray",       active_kw:12,  idle_kw:2,   standby_kw:0.6, off_kw:0.1,  active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
  {name:"Ultrasound Fleet",      modality:"Ultrasound",  active_kw:1.5, idle_kw:0.4, standby_kw:0.1, off_kw:0.02, active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
  {name:"PACS Storage",          modality:"PACS/RIS",    active_kw:4,   idle_kw:4,   standby_kw:4,   off_kw:4,    active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
  {name:"Reporting Workstations", modality:"Workstation", active_kw:2,  idle_kw:0.8, standby_kw:0.2, off_kw:0.05, active_h:160, idle_h:300, standby_h:250, off_h:34, avoidable_idle_h:120, scans:2500},
];

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
  "Reduce low-value imaging":                {kwh:  800, note: "Fewer scans = less active operation time. (McKee 2024, ESR PP 2025)"},
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
  // film processor and laser printer loads (Radiol 2024, 10.1148/radiol.240398)
  "Reduce paper and film printing":          {kwh:  120, note: "Printer and film processor elimination. (Radiol 2024)"},
  // embodied carbon amortised over more years (ESR PP 2025, Scope 3)
  "Extend hardware lifetime":                {kwh:    0, co2Pct: 15, note: "Amortises embodied carbon over more years. (ESR PP 2025)"},
  // virtualisation / right-sizing (Clinical-AI PDF, Doo 2024)
  "Consolidate servers":                     {kwh:  500, note: "Virtualisation reduces physical server count. (Doo 2024, Clinical-AI)"},
  // lighter models use less inference compute (LLM-Energy PDF)
  "Use smaller or more efficient AI models": {kwh:   80, note: "Lighter AI models use less inference compute. (LLM-Energy PDF)"},
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

// ── AI model library ─────────────────────────────────────────────────────────
// GPU power, inference latency, and training energy from LLM-Energy PDF and Doo 2024.
// Clinical benefit estimates from sources: scan time reduction (Radiol 2023 10.1148/radiol.230441),
// low-value imaging reduction McKee 2024 (10.1148/radiol.240219), ESR PP 2025.
// Embodied GPU CO₂ from ESR PP 2025 / Clinical-AI PDF.
const AI_MODELS = {
  "Small (< 100M params)": {
    gpuKw: 0.08, inferSec: 2.5,  trainMwh: 0.5,  accuracy: 0.88,
    scanTimeReductPct: 30, lowValueReductPct: 10, embCo2Kg: 50,
  },
  "Medium (100M–1B params)": {
    gpuKw: 0.15, inferSec: 5,    trainMwh: 5,    accuracy: 0.93,
    scanTimeReductPct: 60, lowValueReductPct: 15, embCo2Kg: 80,
  },
  "Large (> 1B params)": {
    gpuKw: 0.25, inferSec: 10,   trainMwh: 50,   accuracy: 0.96,
    scanTimeReductPct: 75, lowValueReductPct: 20, embCo2Kg: 150,
  },
};
// Automatic Mixed Precision (AMP) reduces inference energy ~40% (float32→float16)
// Source: LLM-Energy PDF; Clinical-AI PDF
const PRECISION_FACTOR = {
  "float32 (standard)":   1.0,
  "float16 / AMP":        0.6,
};

// ── Resource & scope constants ────────────────────────────────────────────────

// Cooling water: L per kWh. Google 2023 Env Report 0.45 L/kWh; typical data centre 1.5–2.5 L/kWh (ASHRAE)
const WATER_PER_KWH = 1.8;

// Embodied carbon amortised over hardware lifespan (kgCO₂e / month)
// MRI 3T: ~70 tCO₂e manufacturing / 15-yr lifespan (ESR PP 2025, Radiol 10.1148/radiol.240398)
// CT: ~20 tCO₂e / 12 yr; X-ray: ~4 tCO₂e / 10 yr; Ultrasound: ~1 tCO₂e / 7 yr
const EMBODIED_KG_MO = {
  "MRI": 389, "CT": 139, "X-ray": 33, "Ultrasound": 12, "PACS/RIS": 30, "Workstation": 5,
};

const PATIENT_KM_RT    = 20;   // avg round-trip patient travel km — replace with local data (ESR sustainability guidance)
const CAR_CO2_KG_KM    = 0.17; // kgCO₂e/km average car (DEFRA 2023)
const PAPER_G_PER_ENC  = 25;   // g paper per encounter in digital workflow (ESR Green Imaging)
const HAZ_WASTE_G_SCAN = 50;   // g hazardous waste per imaging scan — contrast media disposal estimate

const META = {
  profiles:      ["Hospital radiology", "Outpatient imaging center", "Research imaging lab", "Teleradiology / informatics-heavy workflow"],
  intendedUses:  ["Estimate annual footprint", "Compare modalities", "Track monthly sustainability KPIs", "Evaluate AI tool impact", "Estimate savings from an intervention"],
  regions:       Object.keys(CARBON_INTENSITY),
  metricTypes:   ["Energy", "Carbon", "Water", "AI net impact"],
  timePeriods:   Object.keys(TIME_MULT),
  interventions: Object.keys(INTERVENTIONS),
  cloudProviders:Object.keys(CLOUD),
  scannerStates: ["Active", "Idle", "Standby", "Off"],
  modelSizes:    Object.keys(AI_MODELS),
  precisions:    Object.keys(PRECISION_FACTOR),
};

// ── Calculation functions ─────────────────────────────────────────────────────
const rnd = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function computeDashboard(region, timePeriod) {
  const ci   = CARBON_INTENSITY[region] ?? 0.25;
  const mult = TIME_MULT[timePeriod] ?? 1;

  const byEquipment = EQUIPMENT_BASE.map(eq => {
    const kwh          = (eq.active_kw*eq.active_h + eq.idle_kw*eq.idle_h + eq.standby_kw*eq.standby_h + eq.off_kw*eq.off_h) * mult;
    const activeKwh    = eq.active_kw * eq.active_h * mult;
    const idleKwh      = (eq.idle_kw * eq.idle_h + eq.standby_kw * eq.standby_h) * mult;
    const kgco2e       = kwh * ci;
    const idleWasteKwh = eq.idle_kw * eq.avoidable_idle_h * mult;
    const scans        = eq.scans * mult;
    return {equipment: eq.name, modality: eq.modality,
            kwh: rnd(kwh), activeKwh: rnd(activeKwh), idleKwh: rnd(idleKwh),
            kgco2e: rnd(kgco2e), scans, energyPerScan: rnd(kwh / scans, 3),
            idleWasteKwh: rnd(idleWasteKwh), confidence: "estimated"};
  });

  const totalKwh       = byEquipment.reduce((s, e) => s + e.kwh, 0);
  const totalActiveKwh = byEquipment.reduce((s, e) => s + e.activeKwh, 0);
  const totalIdleKwh   = byEquipment.reduce((s, e) => s + e.idleKwh, 0);
  const totalCo2       = byEquipment.reduce((s, e) => s + e.kgco2e, 0);
  const totalScans     = byEquipment.reduce((s, e) => s + e.scans, 0);
  const totalIdle      = byEquipment.reduce((s, e) => s + e.idleWasteKwh, 0);
  const label          = TIME_LABEL[timePeriod];

  // Patient-generating imaging scans only (excludes PACS/workstation virtual entries)
  const imagingScans = EQUIPMENT_BASE
    .filter(e => ["MRI","CT","X-ray","Ultrasound"].includes(e.modality))
    .reduce((s, e) => s + e.scans * mult, 0);

  // GHG Protocol scope breakdown
  // Scope 1: direct fuel/gas estimated at 8% of Scope 2 (backup generators, medical gas) — McKee 2024
  // Scope 3 embodied: hardware manufacturing amortised (ESR PP 2025)
  // Scope 3 travel: patient travel at PATIENT_KM_RT × CAR_CO2_KG_KM (DEFRA 2023)
  const scope2Kg       = rnd(totalCo2);
  const scope1Kg       = rnd(scope2Kg * 0.08);
  const scope3EmbKg    = rnd(EQUIPMENT_BASE.reduce((s, eq) => s + (EMBODIED_KG_MO[eq.modality] ?? 0) * mult, 0));
  const scope3TravelKg = rnd(imagingScans * PATIENT_KM_RT * CAR_CO2_KG_KM);
  const scope3Kg       = rnd(scope3EmbKg + scope3TravelKg);

  // Resource metrics
  const waterLitres  = rnd(totalKwh * WATER_PER_KWH, 0);
  const paperKg      = rnd(imagingScans * PAPER_G_PER_ENC / 1000, 1);
  const hazardousKg  = rnd(imagingScans * HAZ_WASTE_G_SCAN / 1000, 1);

  return {
    byEquipment,
    topOpportunities: [...byEquipment].sort((a, b) => b.idleWasteKwh - a.idleWasteKwh).slice(0, 5),
    totals: {
      kwh: rnd(totalKwh), mwh: rnd(totalKwh / 1000),
      tonnesCo2e: rnd(totalCo2 / 1000, 3),
      energyPerScan: rnd(totalKwh / totalScans, 3),
      idleWasteKwh: rnd(totalIdle), label,
      activeKwh: rnd(totalActiveKwh), idleKwh: rnd(totalIdleKwh),
      activePct: totalKwh > 0 ? rnd(totalActiveKwh / totalKwh * 100, 1) : 0,
      idlePct:   totalKwh > 0 ? rnd(totalIdleKwh   / totalKwh * 100, 1) : 0,
    },
    scopes:    {scope1Kg, scope2Kg, scope3EmbKg, scope3TravelKg, scope3Kg, imagingScans},
    resources: {waterLitres, paperKg, hazardousKg},
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

function computeScenario(intervention, region, timePeriod) {
  const ci   = CARBON_INTENSITY[region] ?? 0.25;
  const mult = TIME_MULT[timePeriod] ?? 1;
  const eff  = INTERVENTIONS[intervention] ?? {kwh: 0};
  const base = computeDashboard(region, timePeriod);

  const kwhSaved  = rnd((eff.kwh ?? 0) * mult);
  const co2PctOff = (eff.co2Pct ?? 0) / 100;
  const projectedKwh  = rnd(base.totals.kwh - kwhSaved);
  const baseCo2kg     = rnd(base.totals.tonnesCo2e * 1000, 1);
  const projectedCo2  = rnd(baseCo2kg * (1 - co2PctOff) - kwhSaved * ci, 1);
  const co2Saved      = rnd(baseCo2kg - projectedCo2, 1);
  const pctEnergy     = base.totals.kwh > 0 ? rnd((kwhSaved / base.totals.kwh) * 100, 1) : 0;

  return {
    intervention, timePeriod, note: eff.note ?? "",
    baseline:  {kwh: base.totals.kwh, co2: baseCo2kg},
    projected: {kwh: projectedKwh,    co2: projectedCo2},
    savings:   {kwh: kwhSaved, co2: co2Saved, pctEnergy},
  };
}

function computeAI(cloudProvider, region, modelSize, precision) {
  const cf    = CLOUD[cloudProvider]    ?? CLOUD["Local compute"];
  const ci    = CARBON_INTENSITY[region] ?? 0.25;
  const model = AI_MODELS[modelSize]    ?? AI_MODELS["Small (< 100M params)"];
  const ampF  = PRECISION_FACTOR[precision] ?? 1.0;
  const STUDIES = 1800; // imaging studies per month (matches EQUIPMENT_BASE)
  const AVG_SCAN_KWH = 0.5; // kWh per imaging study (mid-range from CT/MRI defaults)

  // ── 1. Operational energy ────────────────────────────────────────────────
  // Inference energy per study and monthly total, including PUE and AMP factor
  // Source: Doo 2024 (10.1148/radiol.232030); LLM-Energy PDF
  const inferKwhPerStudy  = rnd(model.gpuKw * (model.inferSec / 3600) * cf.pue * ampF, 6);
  const inferenceKwh      = rnd(inferKwhPerStudy * STUDIES, 3);
  // Training energy amortised over 3-year (36-month) deployment lifespan
  const trainKwhTotal     = model.trainMwh * 1000;
  const trainKwhAmortised = rnd(trainKwhTotal / 36, 2);
  const totalKwh          = rnd(inferenceKwh + trainKwhAmortised, 3);
  const ampSavingPct      = rnd((1 - ampF) * 100, 0);

  // ── 2. Carbon emissions ──────────────────────────────────────────────────
  // AI operational carbon uses cloud provider CI; clinical savings use local grid CI
  const grossKgCo2e  = rnd(totalKwh * cf.ci, 3);
  // Embodied GPU carbon amortised over 3-year lifespan (ESR PP 2025, Clinical-AI PDF)
  const embGpuKgCo2e = rnd(model.embCo2Kg / 36, 2);

  // ── 4. Clinical co-benefits (needed for net carbon) ──────────────────────
  // Scan time reduction → direct scanner energy savings
  // Radiol 2023 (10.1148/radiol.230441): AI reconstruction can cut scan time 45–89%
  const scanEnergySaved  = rnd(STUDIES * AVG_SCAN_KWH * (model.scanTimeReductPct / 100), 1);
  // Low-value imaging reduction → avoided scans
  // McKee 2024 (10.1148/radiol.240219): up to 20% unnecessary imaging reduction
  const scansAvoided     = Math.round(STUDIES * (model.lowValueReductPct / 100));
  const scanCo2Saved     = rnd((scanEnergySaved + scansAvoided * AVG_SCAN_KWH) * ci, 2);
  const savingsKgCo2e    = scanCo2Saved;
  const netKgCo2e        = rnd(grossKgCo2e + embGpuKgCo2e - savingsKgCo2e, 3);

  // ── 3. Infrastructure & efficiency ───────────────────────────────────────
  const waterLitres      = rnd(totalKwh * WATER_PER_KWH, 1);
  // Efficiency ratio: model accuracy % per kWh of monthly inference
  // Captures diminishing accuracy returns of larger models vs energy cost (Green AI concept)
  const efficiencyRatio  = inferenceKwh > 0 ? rnd((model.accuracy * 100) / inferenceKwh, 1) : 0;
  // Rebound risk: rapid throughput gains may induce more scan orders, negating savings
  const reboundRisk      = model.scanTimeReductPct > 60 ? "High" : model.scanTimeReductPct > 30 ? "Moderate" : "Low";

  return {
    // meta
    name: "Chest CT triage AI", deployment: cloudProvider, modelSize, precision,
    // 1. operational energy
    inferKwhPerStudy, inferenceKwh, trainKwhAmortised, totalKwh, ampSavingPct,
    // 2. carbon
    grossKgCo2e, embGpuKgCo2e, savingsKgCo2e, netKgCo2e, cloudCi: cf.ci,
    // 3. infrastructure
    pue: cf.pue, waterLitres, efficiencyRatio, accuracy: model.accuracy,
    // 4. clinical
    scanTimeReductPct: model.scanTimeReductPct,
    lowValueReductPct: model.lowValueReductPct,
    scansAvoided, scanEnergySaved, reboundRisk,
  };
}

// ── UI components ─────────────────────────────────────────────────────────────
function Logo({dark = false}) {
  return (
    <div className="brand">
      <img src="./logo.png" alt="EcoRad logo" style={{width:46, height:46, objectFit:'contain', filter: dark ? 'brightness(1.8)' : 'none'}}/>
      <div><strong>EcoRad</strong><span>Sustainable Intelligence for Radiology</span></div>
    </div>
  );
}

function Card({title, value, sub, icon}) {
  return (
    <section className="card">
      <div className="cardHead">{icon}<span>{title}</span></div>
      <b>{value}</b>
      <p>{sub}</p>
    </section>
  );
}

function Sel({label: lbl, value, options, onChange}) {
  return (
    <label>
      {lbl}
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function downloadCSV(dash) {
  const headers = ["equipment","modality","kwh","kgco2e","scans","energyPerScan","idleWasteKwh","confidence"];
  const rows = dash.byEquipment.map(r => headers.map(h => r[h]).join(','));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], {type:'text/csv'}));
  a.download = 'ecorad_dashboard.csv';
  a.click();
}

const CHART_COLORS = ['#2E7D32','#26A69A','#66BB6A','#4DB6AC','#A5D6A7','#80CBC4'];

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState('landing');

  // Shared settings — drive all calculations
  const [settings, setSettings] = useState({
    profile: "Hospital radiology",
    intendedUse: "Estimate annual footprint",
    region: "Switzerland",
    metricType: "Energy",
    timePeriod: "Monthly",
  });
  const [scen, setScen] = useState({
    intervention: "Turn MRI/CT scanners off overnight",
    cloudProvider: "Local compute",
    scannerState: "Standby",
    modelSize: "Small (< 100M params)",
    precision: "float32 (standard)",
  });

  const set = (key, val) => setSettings(s => ({...s, [key]: val}));
  const setS = (key, val) => setScen(s => ({...s, [key]: val}));

  // Recalculate whenever settings change
  const dash     = useMemo(() => computeDashboard(settings.region, settings.timePeriod), [settings.region, settings.timePeriod]);
  const scenario = useMemo(() => computeScenario(scen.intervention, settings.region, settings.timePeriod), [scen.intervention, settings.region, settings.timePeriod]);
  const ai       = useMemo(() => computeAI(scen.cloudProvider, settings.region, scen.modelSize, scen.precision), [scen.cloudProvider, settings.region, scen.modelSize, scen.precision]);

  const chartEnergy = {
    labels: dash.byEquipment.map(x => x.modality),
    datasets: [{label:`kWh${dash.totals.label}`, data: dash.byEquipment.map(x => x.kwh),
                backgroundColor:'#A5D6A7', borderColor:'#2E7D32', borderWidth:1}],
  };
  const chartCo2 = {
    labels: dash.byEquipment.map(x => x.modality),
    datasets: [{label:'kgCO₂e', data: dash.byEquipment.map(x => x.kgco2e), backgroundColor: CHART_COLORS}],
  };
  const chartScenario = {
    labels: ['Baseline', 'After intervention'],
    datasets: [
      {label:`Energy kWh${dash.totals.label}`, data:[scenario.baseline.kwh, scenario.projected.kwh], backgroundColor:['#A5D6A7','#2E7D32']},
      {label:'Carbon kgCO₂e', data:[scenario.baseline.co2, scenario.projected.co2], backgroundColor:['#80CBC4','#26A69A']},
    ],
  };

  const pages = ['landing','input','dashboard','ai','scenario','export'];

  return (
    <>
      <header>
        <Logo/>
        <nav>
          {pages.map(p => (
            <button key={p} className={page===p?'on':''} onClick={()=>setPage(p)}>{p}</button>
          ))}
        </nav>
      </header>

      {/* ── Landing ── */}
      {page==='landing' && (
        <main className="hero">
          <div>
            <p className="eyebrow">Radiology + AI + Planetary Health</p>
            <h1>Measure. Optimize. Sustain.</h1>
            <p>EcoRad estimates environmental impact from imaging operations, infrastructure, consumables, patient workflows, and AI tool use.</p>
            <button onClick={()=>setPage('input')}>Get started →</button>
          </div>
          <div className="heroVisual">
            <Logo/>
            <p>Set your region and time period on the <strong>input</strong> page to customise every number in the dashboard.</p>
          </div>
        </main>
      )}

      {/* ── Input ── */}
      {page==='input' && (
        <main>
          <h1>Data input</h1>
          <p className="note">These settings recalculate the entire dashboard in real time.</p>
          <div className="grid">
            <Sel label="Department profile" value={settings.profile}     options={META.profiles}     onChange={v=>set('profile',v)}/>
            <Sel label="Intended use"       value={settings.intendedUse} options={META.intendedUses} onChange={v=>set('intendedUse',v)}/>
            <Sel label="Region / grid"      value={settings.region}      options={META.regions}      onChange={v=>set('region',v)}/>
            <Sel label="Metric type"        value={settings.metricType}  options={META.metricTypes}  onChange={v=>set('metricType',v)}/>
            <Sel label="Time period"        value={settings.timePeriod}  options={META.timePeriods}  onChange={v=>set('timePeriod',v)}/>
          </div>
          <div className="inputSummary">
            <p>Carbon intensity for <strong>{settings.region}</strong>: <strong>{(CARBON_INTENSITY[settings.region]??0.25)} kgCO₂e/kWh</strong> <span className="note">— Our World in Data, 2022–2023 national average. Replace with local utility data for higher accuracy.</span></p>
            <p>Showing <strong>{settings.timePeriod.toLowerCase()}</strong> figures — multiplier ×{TIME_MULT[settings.timePeriod]}</p>
            <p className="note">Equipment power defaults: MRI 30 kW active (Heye et al., JMRI 2023 · DOI 10.1002/jmri.28994); CT 60 kW active (Acra 2024 · DOI 10.1016/j.acra.2024.05.004). See <a href="https://github.com/takinci/EcoRad/blob/main/sources.md" style={{color:'#2E7D32'}} target="_blank" rel="noreferrer">sources.md</a> for all citations.</p>
            <button onClick={()=>setPage('dashboard')} style={{marginTop:16}}>View dashboard →</button>
          </div>
        </main>
      )}

      {/* ── Dashboard ── */}
      {page==='dashboard' && (
        <main>
          <h1>Demo Academic Radiology <span className="badge">{settings.region}</span> <span className="badge">{settings.timePeriod}</span></h1>

          {/* ── 1. Energy consumption ── */}
          <section style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:12}}>1. Energy consumption</h2>
            <div className="cards">
              <Card icon={<Gauge/>}       title={`Total electricity ${dash.totals.label}`}   value={`${dash.totals.mwh} MWh`}                sub="All scanners, PACS, workstations, and servers."/>
              <Card icon={<Activity/>}    title={`Active scanning ${dash.totals.label}`}      value={`${dash.totals.activeKwh.toLocaleString()} kWh`} sub={`${dash.totals.activePct}% of total — energy during actual scan acquisition.`}/>
              <Card icon={<TrendingDown/>} title={`Idle + standby ${dash.totals.label}`}      value={`${dash.totals.idleKwh.toLocaleString()} kWh`}   sub={`${dash.totals.idlePct}% of total — between scans and overnight. Primary optimisation target.`}/>
              <Card icon={<TrendingDown/>} title={`Avoidable idle ${dash.totals.label}`}      value={`${dash.totals.idleWasteKwh.toLocaleString()} kWh`} sub="Recoverable by standby / power-off policies."/>
            </div>
            <div className="cards" style={{marginTop:12}}>
              <Card icon={<Activity/>}    title="Energy per imaging scan"                     value={`${dash.totals.energyPerScan} kWh`}       sub="Total ÷ all scans. Use for modality benchmarking and protocol optimisation."/>
            </div>
          </section>

          {/* ── 2. Carbon emissions ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>2. Carbon emissions — GHG Protocol scopes</h2>
            <p className="note" style={{marginBottom:12}}>Scope 1: direct fuel (estimated). Scope 2: purchased electricity (calculated). Scope 3: hardware embodied carbon + patient travel (estimated). All {dash.totals.label}.</p>
            <div className="cards">
              <Card icon={<Factory/>}    title="Scope 1 — Direct"             value={`${rnd(dash.scopes.scope1Kg/1000,3)} tCO₂e`}       sub="Backup generators, medical gas. Estimated 8% of Scope 2 (McKee 2024)."/>
              <Card icon={<Gauge/>}      title="Scope 2 — Electricity"        value={`${dash.totals.tonnesCo2e} tCO₂e`}                  sub={`Grid at ${dash.ci} kgCO₂e/kWh (${settings.region}). Primary measured scope.`}/>
              <Card icon={<Cpu/>}        title="Scope 3 — Embodied carbon"    value={`${rnd(dash.scopes.scope3EmbKg/1000,3)} tCO₂e`}    sub="Hardware manufacturing amortised over lifespan. Extend lifetime to reduce."/>
              <Card icon={<Car/>}        title="Scope 3 — Patient travel"     value={`${rnd(dash.scopes.scope3TravelKg/1000,3)} tCO₂e`} sub={`${dash.scopes.imagingScans.toLocaleString()} scans × ${PATIENT_KM_RT} km avg round trip at ${CAR_CO2_KG_KM} kgCO₂e/km.`}/>
            </div>
          </section>

          {/* ── Charts ── */}
          <div className="charts" style={{marginTop:28}}>
            <section><h2>Energy by equipment</h2><Bar data={chartEnergy}/></section>
            <section><h2>Carbon (Scope 2) by equipment</h2><Doughnut data={chartCo2}/></section>
          </div>

          {/* ── 3. Infrastructure ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>3. Infrastructure and hardware</h2>
            <div className="cards">
              <Card icon={<Cpu/>}         title="Top idle waster"               value={dash.topOpportunities[0]?.equipment ?? '—'}               sub={`${dash.topOpportunities[0]?.idleWasteKwh.toLocaleString()} kWh avoidable idle${dash.totals.label}. Highest single-unit saving.`}/>
              <Card icon={<Activity/>}    title="Hardware lifespans"             value="MRI 15 yr / CT 12 yr"                                      sub="X-ray 10 yr, Ultrasound 7 yr. Extend to reduce Scope 3 embodied carbon."/>
              <Card icon={<TrendingDown/>} title="Carbon intensity"              value={`${dash.ci} kgCO₂e/kWh`}                                  sub={`${settings.region} grid. Move to renewable tariff or lower-carbon region to cut Scope 2.`}/>
              <Card icon={<Gauge/>}       title="Scope 3 total"                  value={`${rnd(dash.scopes.scope3Kg/1000,3)} tCO₂e`}              sub="Embodied + patient travel combined. Often larger than Scope 2 in a full lifecycle view."/>
            </div>
            <section style={{marginTop:12}}>
              <h2>Top 5 improvement opportunities — idle energy</h2>
              {dash.topOpportunities.map((x,i) => (
                <div key={i} className="row">
                  <b>{x.equipment}</b>
                  <span>{x.idleWasteKwh.toLocaleString()} kWh avoidable idle{dash.totals.label}</span>
                  <small>{x.confidence}</small>
                </div>
              ))}
            </section>
          </section>

          {/* ── 4. Resource metrics ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>4. Resource footprint</h2>
            <p className="note" style={{marginBottom:12}}>Replace defaults with procurement records, waste manifests, and water bills for publication-quality figures.</p>
            <div className="cards">
              <Card icon={<Droplets/>}   title={`Water footprint ${dash.totals.label}`}       value={`${dash.resources.waterLitres.toLocaleString()} L`} sub={`${WATER_PER_KWH} L/kWh cooling estimate. Google Cloud 0.45 L/kWh; local servers ~2 L/kWh.`}/>
              <Card icon={<FileText/>}   title={`Paper consumption ${dash.totals.label}`}     value={`${dash.resources.paperKg} kg`}                     sub={`~${PAPER_G_PER_ENC}g/encounter digital workflow. Full film-based: ~200g. (ESR Green Imaging)`}/>
              <Card icon={<Trash2/>}     title={`Hazardous waste ${dash.totals.label}`}       value={`${dash.resources.hazardousKg} kg`}                 sub="Contrast media disposal, sharps. Replace with waste manifest data."/>
              <Card icon={<Leaf/>}       title={`Total Scope 2 carbon ${dash.totals.label}`}  value={`${dash.totals.tonnesCo2e} tCO₂e`}                 sub="All electricity-derived emissions. Primary target for renewable energy procurement."/>
            </div>
          </section>

          {/* ── 5. Equivalencies ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>5. Real-world equivalencies</h2>
            <div className="cards">
              <Card icon={<Car/>}        title="Car km equivalent"      value={dash.equivalencies.car_km.toLocaleString()}           sub="km driven by average petrol car at 0.17 kgCO₂/km (DEFRA 2023)."/>
              <Card icon={<Activity/>}   title="Phone charges"          value={dash.equivalencies.phone_charges.toLocaleString()}    sub="Smartphone full charges at 12 Wh each."/>
              <Card icon={<TreePine/>}   title="Tree-years to offset"   value={dash.equivalencies.trees_year.toLocaleString()}       sub="Trees growing for 1 year absorbing ~21 kgCO₂/yr each."/>
              <Card icon={<Plane/>}      title="Short-haul flights"     value={dash.equivalencies.flights_short.toLocaleString()}    sub="Economy passenger seats at 255 kgCO₂ each (ICAO 2023)."/>
            </div>
            <p className="note" style={{marginTop:12}}>Also equivalent to <strong>{dash.equivalencies.household_years}</strong> household electricity years (3 500 kWh/yr average).</p>
          </section>
        </main>
      )}

      {/* ── AI ── */}
      {page==='ai' && (
        <main>
          <h1>AI sustainability dashboard <span className="badge">{settings.region}</span></h1>
          <div className="grid" style={{marginBottom:24}}>
            <Sel label="Cloud / deployment"  value={scen.cloudProvider} options={META.cloudProviders} onChange={v=>setS('cloudProvider',v)}/>
            <Sel label="Model size"          value={scen.modelSize}     options={META.modelSizes}     onChange={v=>setS('modelSize',v)}/>
            <Sel label="Precision / AMP"     value={scen.precision}     options={META.precisions}     onChange={v=>setS('precision',v)}/>
          </div>

          {/* ── 1. Operational energy ── */}
          <section style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:12}}>1. Operational energy and computation</h2>
            <p className="note" style={{marginBottom:12}}>Training is a one-time cost amortised over 36 months. Inference scales with every study — the dominant lifetime cost. (LLM-Energy PDF; Doo 2024)</p>
            <div className="cards">
              <Card icon={<Zap/>}         title="Total energy/month"         value={`${ai.totalKwh} kWh`}             sub="Inference + amortised training. Primary driver of AI environmental footprint."/>
              <Card icon={<Activity/>}    title="Inference per study"        value={`${ai.inferKwhPerStudy} kWh`}     sub={`${ai.inferenceKwh} kWh/month across 1 800 studies. Scales with every request.`}/>
              <Card icon={<Brain/>}       title="Training (amortised)"       value={`${ai.trainKwhAmortised} kWh/mo`} sub={`One-time training divided over 36-month deployment. ${AI_MODELS[scen.modelSize].trainMwh * 1000} kWh total training cost.`}/>
              <Card icon={<Gauge/>}       title="AMP energy saving"          value={ai.ampSavingPct > 0 ? `−${ai.ampSavingPct}%` : "None"}  sub="float16 / AMP reduces inference energy ~40% with minimal accuracy loss. (LLM-Energy PDF)"/>
            </div>
          </section>

          {/* ── 2. Carbon emissions ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>2. Carbon emissions and intensity</h2>
            <p className="note" style={{marginBottom:12}}>AI operational carbon uses the cloud provider's grid CI. Clinical savings use the local grid CI ({settings.region}: {CARBON_INTENSITY[settings.region]} kgCO₂e/kWh).</p>
            <div className="cards">
              <Card icon={<Leaf/>}        title="Gross CO₂e/month"           value={`${ai.grossKgCo2e} kgCO₂e`}      sub={`${ai.deployment} grid: ${ai.cloudCi} kgCO₂e/kWh. Includes amortised training.`}/>
              <Card icon={<Cpu/>}         title="Embodied GPU carbon"        value={`${ai.embGpuKgCo2e} kgCO₂e/mo`}  sub={`GPU manufacturing amortised over 36 months. Total: ${AI_MODELS[scen.modelSize].embCo2Kg} kgCO₂e. (ESR PP 2025)`}/>
              <Card icon={<TrendingDown/>} title="Clinical savings"          value={`−${ai.savingsKgCo2e} kgCO₂e/mo`} sub="Scanner time + avoided scans at local grid CI. Replace with measured before/after data."/>
              <section className="card">
                <div className="cardHead"><BarChart3/><span>Net AI impact</span></div>
                <b style={{color: ai.netKgCo2e < 0 ? '#2E7D32' : '#c62828'}}>{ai.netKgCo2e} kgCO₂e/mo</b>
                <p>{ai.netKgCo2e < 0 ? "Net positive — clinical savings outweigh AI footprint." : "Net negative — AI costs exceed measured savings."}</p>
              </section>
            </div>
          </section>

          {/* ── 3. Infrastructure & efficiency ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>3. Infrastructure and efficiency ratios</h2>
            <div className="cards">
              <Card icon={<Gauge/>}       title="PUE"                        value={ai.pue}                           sub={`${ai.deployment} data centre Power Usage Effectiveness. 1.0 = perfect; higher = more cooling overhead.`}/>
              <Card icon={<Droplets/>}    title="Water footprint/month"      value={`${ai.waterLitres} L`}            sub={`${WATER_PER_KWH} L/kWh cooling estimate. Google Cloud ~0.45 L/kWh; local servers ~2 L/kWh.`}/>
              <Card icon={<Target/>}      title="Model accuracy"             value={`${rnd(ai.accuracy * 100, 0)}%`}  sub={`${scen.modelSize}. Larger models gain marginal accuracy at disproportionate energy cost.`}/>
              <Card icon={<BarChart3/>}   title="Efficiency ratio"           value={`${ai.efficiencyRatio}`}          sub="Accuracy % per kWh of monthly inference. Captures diminishing returns of larger models. (Green AI concept)"/>
            </div>
          </section>

          {/* ── 4. Clinical co-benefits ── */}
          <section style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>4. Clinical sustainability co-benefits</h2>
            <p className="note" style={{marginBottom:12}}>AI acts as an assistive sustainability tool when it reduces unnecessary imaging and scan duration. (McKee 2024; Radiol 2023)</p>
            <div className="cards">
              <Card icon={<TrendingDown/>} title="Scan time reduction"       value={`${ai.scanTimeReductPct}%`}        sub={`AI reconstruction / denoising shortens scan duration. ${ai.scanEnergySaved} kWh/month scanner energy saved. (Radiol 2023: 45–89% range)`}/>
              <Card icon={<Leaf/>}         title="Low-value imaging avoided" value={`${ai.lowValueReductPct}%`}        sub={`~${ai.scansAvoided} scans/month avoided via clinical decision support. (McKee 2024: up to 20%)`}/>
              <Card icon={<Activity/>}     title="Total clinical energy saved" value={`${ai.scanEnergySaved} kWh/mo`} sub="Direct scanner energy saved from shorter protocols and avoided studies."/>
              <Card icon={<AlertTriangle/>} title="Rebound effect risk"      value={ai.reboundRisk}                   sub="Risk that faster reads induce more scan orders, cancelling efficiency gains. Monitor scan volumes after deployment."/>
            </div>
          </section>
        </main>
      )}

      {/* ── Scenario ── */}
      {page==='scenario' && (
        <main>
          <h1>Scenario comparison</h1>
          <div className="grid" style={{marginBottom:24}}>
            <Sel label="Intervention"   value={scen.intervention}  options={META.interventions}   onChange={v=>setS('intervention',v)}/>
            <Sel label="Cloud provider" value={scen.cloudProvider} options={META.cloudProviders}  onChange={v=>setS('cloudProvider',v)}/>
            <Sel label="Scanner state target" value={scen.scannerState} options={META.scannerStates} onChange={v=>setS('scannerState',v)}/>
          </div>
          <p className="note" style={{marginBottom:16}}>{scenario.note}</p>
          <div className="scenarioGrid">
            <section className="card">
              <div className="cardHead"><Gauge/><span>Baseline ({settings.timePeriod})</span></div>
              <p><b>{scenario.baseline.kwh.toLocaleString()} kWh</b></p>
              <p>{scenario.baseline.co2.toLocaleString()} kgCO₂e</p>
            </section>
            <section className="card savings">
              <div className="cardHead"><TrendingDown/><span>Projected savings</span></div>
              <b>−{scenario.savings.kwh.toLocaleString()} kWh</b>
              <p>−{scenario.savings.co2.toLocaleString()} kgCO₂e</p>
              <p><span className="badge">{scenario.savings.pctEnergy}% energy reduction</span></p>
            </section>
            <section className="card">
              <div className="cardHead"><Leaf/><span>After intervention</span></div>
              <p><b>{scenario.projected.kwh.toLocaleString()} kWh</b></p>
              <p>{scenario.projected.co2.toLocaleString()} kgCO₂e</p>
            </section>
          </div>
          <div className="charts" style={{marginTop:24}}>
            <section><h2>Before vs after</h2><Bar data={chartScenario}/></section>
          </div>
          <p className="note" style={{marginTop:12}}>Region: {settings.region} — {settings.timePeriod} figures. Change region or time period on the Input page.</p>
        </main>
      )}

      {/* ── Export ── */}
      {page==='export' && (
        <main>
          <h1>Export report</h1>
          <p>Every report should include the assumptions table, confidence level, units, and citation fields.</p>
          <button className="download" onClick={()=>downloadCSV(dash)}><Download/>Download CSV ({settings.timePeriod})</button>
          <button className="download" onClick={()=>window.print()} style={{marginLeft:'12px'}}><Download/>Print / Save as PDF</button>
          <section style={{marginTop:24}}>
            <h2>Key assumptions and sources</h2>
            <p className="note">Carbon intensity: Our World in Data 2022–2023 national averages (ourworldindata.org/grapher/carbon-intensity-electricity).</p>
            <p className="note">MRI active power 30 kW: Heye et al. J Magn Reson Imaging 2023 · DOI 10.1002/jmri.28994.</p>
            <p className="note">CT active power 60 kW: Acra 2024 · DOI 10.1016/j.acra.2024.05.004; CJRS 2022 · DOI 10.1177/08465371221133074.</p>
            <p className="note">AI footprint methodology: Doo et al. Radiology 2024 · DOI 10.1148/radiol.232030.</p>
            <p className="note">Intervention savings: McKee et al. Radiology 2024 · DOI 10.1148/radiol.240219; ESR Position Paper 2025.</p>
            <p className="note">Full reference list: <a href="https://github.com/takinci/EcoRad/blob/main/sources.md" style={{color:'#2E7D32'}} target="_blank" rel="noreferrer">sources.md on GitHub</a>. All numbers are defaults — replace with locally measured values for publication-quality reporting.</p>
          </section>
        </main>
      )}

      <footer>
        <Logo dark/>
        <span>ESG-ready sustainability intelligence for academic hospitals, enterprise healthcare systems, radiology AI teams, and scientific reporting.</span>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
