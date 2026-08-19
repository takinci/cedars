# CEDARS — Sources and Assumption Governance

CEDARS stores uncertain literature values as transparent, editable defaults with citation fields. Local measured data — procurement records, utility bills, scanner logs, PACS/cloud invoices, and country-specific carbon factors — should replace defaults wherever available.

---

## General datasets

| ID | Source | Used for |
|----|--------|----------|
| OWID-CI | Our World in Data. *Carbon Intensity of Electricity*. https://ourworldindata.org/grapher/carbon-intensity-electricity | Regional kgCO₂e/kWh defaults in `CARBON_INTENSITY` |
| eGRID-2023 | US EPA. *Emissions & Generation Resource Integrated Database (eGRID2023).* https://www.epa.gov/egrid | US subregion grid intensity — SERC Tennessee Valley (SRTV) total output rate ≈903 lbCO₂e/MWh = **0.41 kgCO₂e/kWh** (the `US SERC-TVA` option, for US-Southeast validation) |
| GPP | GlobalPetrolPrices. *Electricity Prices*. https://www.globalpetrolprices.com/electricity_prices/ | Optional future cost module |

**Notes on `CARBON_INTENSITY` defaults (all kgCO₂e/kWh, OWID 2022–2023):**
- Switzerland 0.10 — hydro + nuclear dominant grid
- France 0.06 — ~70 % nuclear
- Germany 0.36 — mixed fossil/renewable transition
- United States 0.38 — national average
- US SERC-TVA (Tennessee Valley / SRTV) 0.41 — EPA eGRID2023 subregion total output rate (≈903 lbCO₂e/MWh); added for validation against US-Southeast studies. Other SERC subregions for reference: SRVC (Virginia/Carolina) 0.27, SRSO (South) 0.38, SRMV (Mississippi Valley) 0.34
- United Kingdom 0.20 — gas + growing offshore wind
- EU average 0.25 — Eurostat/EEA mean
- Editable custom 0.30 — placeholder; replace with local utility data

---

## Radiology sustainability and planetary health

| ID | Citation |
|----|---------|
| McKee-2024 | McKee BJ et al. *Planetary Health and Radiology: Why We Should Care and What We Can Do.* Radiology 2024. DOI: [10.1148/radiol.240219](https://doi.org/10.1148/radiol.240219). Used for intervention framing and the operational sustainability action categories. |
| Doo-2024 | Doo FX et al. *Environmental Sustainability and AI in Radiology: A Double-Edged Sword.* Radiology 2024. DOI: [10.1148/radiol.232030](https://doi.org/10.1148/radiol.232030). Used for AI footprint vs. operational benefit framework; cloud PUE and carbon intensity discussion. |
| Doo-JACR-2024 | Doo FX, Parekh VS, Kanhere A, et al. *Evaluation of Climate-Aware Metrics Tools for Radiology Informatics and Artificial Intelligence: Toward a Potential Radiology Ecolabel.* J Am Coll Radiol 2024;21(2):239–247. DOI: [10.1016/j.jacr.2023.11.019](https://doi.org/10.1016/j.jacr.2023.11.019). This is the primary framework document referenced throughout CEDARS as "Implementation Guide". Provides: (1) GHG Protocol Scope 1/2/3 structure for radiology departments; (2) the "Recycling Pyramid" (Prevent unnecessary scans → Reduce scan energy → Recover/recycle) for AI sustainability prioritisation; (3) Scope 3 inclusions for radiology — staff commute, DICOM data transfer; (4) AI lifecycle metric definitions (§4): training energy (Metric 1), inference energy (Metric 2), per-study Software Carbon Intensity; (5) AI efficiency ratio (accuracy % per kWh). All "Implementation Guide §N" and "Doo et al. JACR 2024" references in the UI and `computeAI()` source code comments refer to this paper. |
| ESR-GI | ESR Green Imaging Department self-assessment tool. https://www.myesr.org/greenid/. Intervention categories and self-assessment framing. |
| ESR-eBook | ESR. *Sustainable Imaging* (eBook 28). https://www.myesr.org/app/uploads/2025/05/ESR_Modern_eBook_28.pdf. Comprehensive practice guidance. |
| ESR-PP-2025 | *Sustainability in Radiology: Position Paper and Call to Action.* European Society of Radiology 2025. Intervention priorities and Scope 1/2/3 framing. |

---

## CT energy and carbon

| ID | Citation |
|----|---------|
| Acra-2024 | Bastian S et al. DOI: [10.1016/j.acra.2024.05.004](https://doi.org/10.1016/j.acra.2024.05.004). Academic Radiology 2024. 3-scanner dual-energy-CT study on *low-utilization-time* power specifically — reports idle/low-power/off states (idle ≈2.6 kW, low-power ≈0.89 kW, off <0.01 kW), not an active-scanning figure. Corroborating context for `EQUIPMENT_BASE` idle/off, not the active-power reference it was previously described as. |
| AJR-2025-CT | DOI: [10.2214/AJR.25.33951](https://doi.org/10.2214/AJR.25.33951). AJR 2025. CT and radiography sustainability review. |
| CJRS-2022 | Brown M et al. DOI: [10.1177/08465371221133074](https://doi.org/10.1177/08465371221133074). Canadian Association of Radiologists Journal 2022. Real-world power-meter study on a Siemens dual-source 128-slice CT — "System ON" ≈3 kW, "Computer ON" ≈1.5 kW, full shutdown ≈0.5 kW. **Primary source for the corrected `EQUIPMENT_BASE` active/idle/off defaults** (see below). |
| AJR-2023-CT | DOI: [10.2214/AJR.23.30189](https://doi.org/10.2214/AJR.23.30189). AJR 2023. CT carbon footprint; per-scan energy benchmarks. |
| Radiol-253128 | DOI: [10.1148/radiol.253128](https://doi.org/10.1148/radiol.253128). Radiology 2025. Multi-modality environmental footprint; covers CT + MRI. |

**CT `EQUIPMENT_BASE` defaults — corrected 2026-08 (3 kW active, 1.5 kW idle, 1 kW standby, 0.5 kW off; was 60 / 8 / 3 / 0.2 kW):** the prior default cited Acra-2024 and CJRS-2022 as supporting "40–80 kW active." Checking both directly, neither reports anything near that for any state they measure: Acra-2024 (Bastian et al., a 3-scanner dual-energy-CT study on *low-utilization-time* power) reports idle ≈2.6 kW, low-power ≈0.89 kW, off <0.01 kW; CJRS-2022 (Brown et al., a real Siemens dual-source 128-slice CT) reports "System ON" (powered, non-scanning) ≈3 kW, "Computer ON" idle ≈1.5 kW, full shutdown ≈0.5 kW. The likely explanation for the old default: 40–80 kW is a peak/instantaneous X-ray-tube-exposure power spec (correct for the few seconds a tube actually fires) misapplied as a *sustained* active-hours average — which alone would explain a several-fold CT overestimate found in independent departmental validation.

`active_kw`/`idle_kw`/`off_kw` are now anchored directly to CJRS-2022's three measured states (`standby_kw` is interpolated — CJRS only reports three states, not CEDARS's four). Caveat: CJRS-2022's figures are **overnight/non-operational measurements** — a scanner running back-to-back patients during business hours likely draws somewhat more than this "powered, not scanning" baseline (brief per-exposure spikes averaged over high throughput), so `active_kw` may still understate true daytime energy for a busy department, just far less than the old 60 kW did. This evidence is from summarized paper retrieval, not the full published tables — verify against the primary sources or your own scanner logs (**Advanced equipment parameters** override) for reporting of record, especially for a pre-~2015 or single/dual-detector scanner, which should be materially lower still.

---

## MRI energy and carbon

| ID | Citation |
|----|---------|
| JMRI-2023 | Chaban YV et al. *Environmental Sustainability and MRI: Challenges, Opportunities, and a Call for Action.* J Magn Reson Imaging 2023. DOI: [10.1002/jmri.28994](https://doi.org/10.1002/jmri.28994). Reports mean 3T MRI active draw of ~30 kW; primary reference for `EQUIPMENT_BASE` MRI active_kw. |
| EurRad-2024-MRI | DOI: [10.1007/s00330-024-11056-0](https://doi.org/10.1007/s00330-024-11056-0). European Radiology 2024. MRI energy across field strengths and clinical sites. |
| Radiol-230441 | Woolen SA et al. *Ecodesign and Operational Strategies to Reduce the Carbon Footprint of MRI for Energy Cost Savings.* Radiology 2023;307:e230441. DOI: [10.1148/radiol.230441](https://doi.org/10.1148/radiol.230441). Direct power-meter measurements (1 Hz sampling, 39 days) on 4 real outpatient MRI scanners across 3 vendors, segmented into 5 modes: **off 7–10 kW, idle 10–15 kW, prepared-to-scan 17–26 kW, scan 29–48 kW, power-save 5–8 kW**. Also reports (Table 3) that measured off-mode *duration* is highly site-dependent — 59.5% of total time for one unit (~434 h/month) vs 9.7%/2.5% for two others (whose "off" figures came from a single forced 30-minute test, not real operating practice) — see the flagged hour-allocation question below. **Primary source for the corrected MRI `idle_kw`/`off_kw` values** (1.5T/3T) below — a 5-mode measurement doesn't map 1:1 onto CEDARS's 4-state active/idle/standby/off model, and isn't broken out by field strength, so `idle_kw`/`off_kw` use the range's upper bound for both 1.5T and 3T pending better field-strength-specific data. |
| Radiol-243453 | Woolen SA et al. *Low-Carbon MRI: Acceleration Strategies to Reduce Emissions and Expand Imaging Capacity.* Radiology 2025;315(1):e243453. DOI: [10.1148/radiol.243453](https://doi.org/10.1148/radiol.243453). **Corrected 2026-08** — previously mischaracterized here as an "idle/standby power validation" source; it's actually about DL/parallel-imaging acceleration cutting *scan* time and per-examination energy, not idle-state power. Reports mean **per-examination** energy of 15.5±5.6 kWh (3T), 13.6±5.4 kWh (1.5T), 9.9±3.3 kWh (0.55T) over 377 real exams — useful context for `active_kw`, not `idle_kw`. The "idle_kw ≈ 50% of active" claim previously attributed to this paper here has been removed; it isn't supported by anything this paper reports. |
| Radiol-2020-Heye | Heye T, Knoerl R, Wehrle T, et al. *The Energy Consumption of Radiology: Energy- and Cost-saving Opportunities for CT and MRI Operation.* Radiology 2020;295(3):593–605. DOI: [10.1148/radiol.2020192084](https://doi.org/10.1148/radiol.2020192084). **Added 2026-08**, correcting a misattribution (see flagged note below). Reports MRI "off" state consumes 35–47 MWh/yr per scanner (31–38% of total annual energy) — an independent, earlier study by the same senior-author group as Radiol-230441, with different scanners/methodology; Woolen et al. 2023 cite this as prior literature in their own Discussion, it is not their own finding. |
| Radiol-230874 | Vosshenrich J, Heye T. *Small Steps toward a More Sustainable and Energy-efficient Operation of MRI.* Radiology 2023;307(4):e230874. DOI: [10.1148/radiol.230874](https://doi.org/10.1148/radiol.230874). **Added 2026-08.** Editorial companion to Radiol-230441 in the same journal issue; source (via Chaban et al. 2023 review, ref 13) for "anecdotal evidence suggests more than 50% of MRI scanners worldwide are not switched off during nonproductive hours" — this claim is not from Woolen et al. 2023's own data. |
| Herrmann-2012 | Herrmann C. *Energy Efficiency of MRI.* Stanford 2012. http://large.stanford.edu/courses/2012/ph240/nam2/docs/herrmann.pdf. Early detailed power-mode breakdown for clinical MRI; source for "standby ~40–60% lower than idle." |
| Neurad-2024 | DOI: [10.1016/j.neurad.2023.12.001](https://doi.org/10.1016/j.neurad.2023.12.001). Journal of Neuroradiology 2024. Helium cooling and operational energy for high-field MRI. |
| IJHCQA-2016 | DOI: [10.1108/IJHCQA-10-2016-0153](https://doi.org/10.1108/IJHCQA-10-2016-0153). Int J Health Care Quality Assurance 2016. MRI operational efficiency and scheduling; supports avoidable_idle_h estimate. |
| Radiol-253128 | See CT section (multi-modality paper covering MRI). |

**MRI `EQUIPMENT_BASE` active_kw (30 kW for 3T):** JMRI-2023 (Chaban et al.) reports a mean of 30.1 kW for active 3T scanners. Replace with scanner logs via the **Advanced equipment parameters** override — see "Measured-data equipment overrides" below. The default `scans`/month per device is a literature-informed illustrative volume, not a site-specific estimate; when validating against a specific department's reported annual study counts (any modality), enter that department's actual volume through the same override mechanism rather than relying on the default.

**MRI `idle_kw`/`off_kw`/`standby_kw` for 1.5T and 3T — corrected 2026-08 (1.5T: idle 32→15 kW, standby 25→7.5 kW, off 1.5→10 kW; 3T: off 0.2→10 kW, idle unchanged at 15 kW):** the prior `mri_15t` idle_kw (32 kW) exceeded its own active_kw (22 kW) — a pattern that doesn't occur in *any* of the 4 real scanners Woolen et al. measured directly (power rises monotonically idle→prepared-to-scan→scan; idle never exceeds active/scan). `idle_kw` and `off_kw` for both 1.5T and 3T are now anchored directly to Woolen et al. 2023's measured ranges (idle 10–15 kW, off 7–10 kW; upper bound used, see Radiol-230441 above), replacing an earlier `off_kw` estimate that used a 75%-of-idle proportional approximation — now unnecessary since Woolen's own off-state range is available directly. `mri_15t`'s `standby_kw` was also reduced (25→7.5 kW) to stay below the corrected idle_kw, consistent with "standby ~40–60% lower than idle" (Herrmann-2012, CJRS-2022 — the same rule already governing the standby-mode intervention elsewhere in this document); the old standby_kw of 25 kW was implicitly calibrated against the wrong (32 kW) idle value and no longer made sense once idle was corrected. Net effect: `mri_15t`'s annual total drops from ≈233 MWh/yr to ≈123 MWh/yr; `mri_3t` is only marginally affected (≈131 MWh/yr, essentially unchanged). `mri_035t` (permanent magnet, no cryocooler) is unaffected — its existing "idle ≈ off" assumption already holds physically. `mri_7t` is also unaffected — Woolen's study didn't include 7T (research-only) scanners, and higher idle/off draw is physically plausible for their larger, more complex cryo/RF systems, so there's no direct evidence to correct against.

> ⚠️ **Flagged for review, not yet corrected: the `off_h` hour allocation (34 h/month) is likely far too low — citations corrected 2026-08.** This note previously attributed two figures to Woolen et al. 2023 that are actually from two *different* papers: (1) "off state consumes 35–47 MWh/yr, 31–38% of total annual energy" is from **Heye et al. 2020** (Radiol-2020-Heye) — an earlier, independent study Woolen et al. cite as prior literature in their own Discussion (ref 5), not their own result; (2) "more than 50% of MRI scanners worldwide are not switched off during nonproductive hours" is from **Vosshenrich & Heye 2023** (Radiol-230874), the editorial companion to Woolen's paper, cited via the Chaban et al. 2023 review (ref 13) — also not from Woolen et al. 2023 directly.
>
> With `off_kw` now at 10 kW, the (corrected-citation) Heye et al. 2020 figure implies roughly 3,500–4,700 off-hours/year (~290–390 h/month) — but that mixes one study's aggregate MWh/yr with another study's per-mode kW, so treat it as a rough sanity check, not a derivation. Woolen et al. 2023's **own** directly-measured off-mode duration (Radiol-230441, Table 3) is far more variable than a clean 31–38%: 59.5% of time for one scanner (~434 h/month, real operating practice) vs only 9.7% and 2.5% for two others — and those two units' "off" figures came from a single forced 30-minute test, not how they were actually run (both were habitually left idle throughout the study). So there's no single Woolen-derived default to drop in either.
>
> Net effect: the *direction* of this flag still holds — CEDARS's 34 h/month off allocation is almost certainly low relative to real-world off-mode operation, and the one Woolen unit that was actually run in off mode (~434 h/month) is a real data point far above it. This remains a structural question, not specific to MRI: the `active_h`/`idle_h`/`standby_h`/`off_h` split (160/300/250/34) is shared by nearly every row in `EQUIPMENT_UNITS`, so revisiting it is a much larger change than the power-value fixes above and needs its own dedicated review rather than being folded in here. Note this may be *intentional* — CEDARS's baseline may be modelling a typical, unoptimized department, with the low `off_h` representing realistic current practice and the "Turn scanners off overnight" intervention modelling the *opportunity*, not a baseline error — but the specific 34 h/month figure doesn't appear to be sourced from anywhere and is worth checking against real scheduling data.

---

## Angiography, fluoroscopy, and interventional radiology

| ID | Citation |
|----|---------|
| AJR-2024-Angio | Vosshenrich J et al. *Interventional Imaging Systems in Radiology, Cardiology, and Urology: Energy Consumption, Carbon Emissions, and Electricity Costs.* AJR 2024; 222:e2430988. DOI: [10.2214/AJR.24.30988](https://doi.org/10.2214/AJR.24.30988). Direct power-sensor measurements (2 Hz, 4-week periods) on 7 systems: IR suite (Artis pheno), INR suite (Artis icono biplane), radiology fluoroscopy unit (Artis zee), EP lab, cath lab, and 2 urology fluoroscopy units. **Primary source for `EQUIPMENT_UNITS` `angio` and `fluoro` entries.** Key measured values: IR suite idle 6.9 kW, active 7.5 kW, off 1.1 kW, 25,525 kWh/yr; fluoroscopy unit idle 2.8 kW, active 3.1 kW, off 0.6 kW, 11,439 kWh/yr. Nonproductive energy 89–99% of total per system. Switching from idle to off overnight + weekends saves 18.6 mtCO₂eq/yr across 7 systems (CH grid 0.128 kgCO₂eq/kWh). Chiller power NOT included in sensor measurements. |

---

## Mammography

| ID | Citation |
|----|---------|
| EurRad-2026-Mammo | DOI: [10.1007/s00330-026-12373-2](https://doi.org/10.1007/s00330-026-12373-2). European Radiology 2026. Environmental footprint of mammography screening programmes. |

---

## PACS/servers and reading workstations

| ID | Citation |
|----|---------|
| Buttner-2021 | Büttner L, Posch H, Auer T, et al. *Switching off for future—Cost estimate and a simple approach to improving the ecological footprint of radiological departments.* Eur J Radiol Open 2021;8:100320. DOI: [10.1016/j.ejro.2020.100320](https://doi.org/10.1016/j.ejro.2020.100320). Direct power measurement of 3 real reading workstations over a 6-month routine-use period plus a 6-month intervention period: **117.4 W powered on, 54.2 W standby, 18.2 W off**. Primary source for the **workstation** `EQUIPMENT_UNITS` default. Deliberately not sourced from any paper used as a validation benchmark for this tool. |
| DC-Rack-General | General data-center engineering references (e.g. industry rack-power guides; ASHRAE-adjacent commercial literature), not medical-specific. Typical fully-populated 42U server rack: 3–5 kW (up to 10–15 kW for high-performance configurations). Coarse corroborating context for the **PACS/servers** default — not a substitute for a dedicated medical-PACS power study, which doesn't appear to exist in the reviewed literature. |

**Workstations `EQUIPMENT_UNITS` default — corrected 2026-08 (was 2 kW / 0.8 kW / 0.2 kW / 0.05 kW, now 0.1174 kW / 0.1174 kW / 0.0542 kW / 0.0182 kW):** the prior default overstated Büttner et al.'s directly-measured active power (117.4 W) by **~17×** — most likely a transcription error when the default was first entered. `active_kw`, `standby_kw`, and `off_kw` are now direct matches to Büttner's own three measured states; Büttner's model doesn't distinguish "idle" from "powered on" (a workstation not yet in standby draws the same whether being actively used or just sitting there), so `idle_kw = active_kw` here — a genuine simplification, not a lower-confidence extrapolation the way the previous fix's idle/standby/off figures were. Override via **Advanced equipment parameters** if you have metered data for your own reading stations.

**PACS/servers `EQUIPMENT_UNITS` default (4 kW, near-constant across all power states) — unverified, number unchanged.** No dedicated medical-PACS power study was found to anchor this precisely. Checked against general (non-medical-specific) data-center literature instead: a single fully-populated 42U server rack typically draws 3–5 kW (up to 10–15 kW for high-performance configurations), so 4 kW is a **plausible, unremarkable figure for one modest server/switch closet** — not contradicted, but not independently verified either. Treat as a coarse, low-confidence general-IT estimate rather than a validated radiology-specific figure, and override via **Advanced equipment parameters** if you know your actual server count/specs.

**Measured-data equipment overrides.** Every `EQUIPMENT_UNITS` field above that materially affects the department footprint (`active_kw`, `idle_kw`, `standby_kw`, `off_kw`, and monthly `scans`/study-volume) can be overridden per device type via the **Advanced equipment parameters** panel on the Home page (shown for each device type once you've added it) — implementing assumption principle #1 ("prefer measured data") directly in the UI rather than requiring a source-code edit. An overridden row is flagged `confidence: "measured"` instead of `"estimated"` in the results table and CSV export. Operating hours (`active_h`/`idle_h`/`standby_h`/`off_h`) are not yet overridable through this panel.

---

## Reviews covering multiple modalities

| ID | Citation |
|----|---------|
| EUF-2023 | DOI: [10.1016/j.euf.2023.09.009](https://doi.org/10.1016/j.euf.2023.09.009). European Urology Focus 2023. Systematic review of radiology environmental sustainability across modalities. |
| MOU-2024 | Vosshenrich R et al. DOI: [10.1097/MOU.0000000000001337](https://doi.org/10.1097/MOU.0000000000001337). Current Opinion in Urology 2024. Multi-modality carbon benchmarks; primary source for `MODALITY_BENCHMARKS` annual kWh values displayed in the Dashboard Infrastructure section, and for global average (0.473 kgCO₂e/kWh) and EU average (0.237 kgCO₂e/kWh) carbon intensity defaults cited throughout the UI. **The benchmark's energy (kWh/yr) is shown as reported by each source publication; the CO₂ column is not stored but derived at render from a single common factor (`BENCHMARK_CI` = global average 0.473 kgCO₂e/kWh) so rows are directly comparable — the source publications themselves reported CO₂ at varying local grids (~0.20–0.24). This benchmark table is a reference display only and does not feed the footprint calculation, which always uses the user's selected regional grid factor.** |

---

## AI sustainability, cloud infrastructure, and data centres

| ID | Citation |
|----|---------|
| Doo-2024 | See Radiology sustainability section. Primary reference for `computeAI()` footprint vs. benefit logic. |
| Doo-JACR-2024 | See Radiology sustainability section. Defines the AI lifecycle phases used in `computeAI()`: Phase 1 training (one-time, amortised over deployment lifespan), Phase 2 testing/validation (one-time inference over hold-out set), Phase 3 inference/deployment (recurring, dominates lifetime cost). Sections §1–§4 define metrics referenced in AI Dashboard UI notes and card sub-texts. The "Recycling Pyramid" (Prevent → Reduce → Recover) displayed in the AI Dashboard header comes from §1. |
| LLM-Energy | Doo FX, Savani D, Kanhere A, Carlos RC, Joshi A, Yi PH, Parekh VS. *Optimal Large Language Model Characteristics to Balance Accuracy and Energy Use for Sustainable Medical Applications.* Radiology 2024;312(2). DOI: [10.1148/radiol.240320](https://doi.org/10.1148/radiol.240320). Inference energy scaling with model size; underpins the model-efficiency intervention note. |
| GreenAI-2020 | Schwartz R, Dodge J, Smith NA, Etzioni O. *Green AI.* Commun ACM 2020;63(12):54–63. DOI: [10.1145/3381831](https://doi.org/10.1145/3381831). Establishes **FLOPs** (∝ model size × number of input elements) as the hardware-independent measure of compute, and hence energy — the basis for CEDARS scaling inference energy with **pixels (2D) / voxels (3D)**. |
| Selvan-2022 | Selvan R, Bhagwat A, Wolff Anthony LF, Kanding B, Dam EB. *Carbon Footprint of Selecting and Training Deep Learning Models for Medical Image Analysis.* MICCAI 2022, LNCS 13435. DOI: [10.1007/978-3-031-16443-9_49](https://doi.org/10.1007/978-3-031-16443-9_49). Empirical energy/carbon of medical-imaging deep learning (including volumetric data) — supports voxel-count as an energy driver for 3D segmentation. |
| Planet-Health | Same as McKee-2024 above (DOI: [10.1148/radiol.240219](https://doi.org/10.1148/radiol.240219)). McKee BJ et al. *Planetary Health and Radiology: Why We Should Care and What We Can Do.* Radiology 2024. Framework for scoping AI footprint inside departmental Scope 2. |
| AI-Sustainability | Same as Doo-2024 above (DOI: [10.1148/radiol.232030](https://doi.org/10.1148/radiol.232030)). Doo FX et al. *Environmental Sustainability and AI in Radiology: A Double-Edged Sword.* Radiology 2024. AI operational lifecycle, cloud carbon, and procurement guidance. |
| Clinical-AI | Kocak B, Ponsiglione A, Romeo V, Ugga L, Huisman M, Cuocolo R. *Radiology AI and sustainability paradox: environmental, economic, and social dimensions.* Insights Imaging 2025;16(1):88. DOI: [10.1186/s13244-025-01962-2](https://doi.org/10.1186/s13244-025-01962-2). AI governance, model efficiency, infrastructure carbon, and lifecycle assessment methodology. |

**Cloud `CLOUD` defaults (PUE and kgCO₂e/kWh):**
- Local compute PUE 1.50 — typical on-premise **server room** (ASHRAE standard reference), i.e. a colocated rack with facility power-distribution and cooling overhead. This does **not** represent a single lab workstation/GPU measured directly (e.g. via CodeCarbon or `nvidia-smi`), which has no such overhead — reproducing a paper that measured a single GPU this way should use a **Custom PUE** of ~1.0 (Advanced model parameters, AI Model & Informatics page), not the 1.50 server-room default, or the training/inference energy will be inflated by the PUE ratio for overhead that wasn't present in that measurement.
- AWS PUE 1.15 — AWS 2022 Sustainability Report.
- Azure PUE 1.15 — Microsoft 2023 Environmental Sustainability Report.
- Google Cloud PUE 1.10 — Google 2023 Environmental Report (lowest industry PUE).
- Carbon intensity values are global fleet averages; regional deployments vary. See Doo-2024 for clinical AI footprint discussion.
- **CEDARS's training/inference energy model is GPU-power-only** (`gpuKw`/GPU-preset TDP × time), for both the default and measured-GPU-hours paths. It does not have a CPU/RAM/system power field, so it structurally cannot capture a paper's *total* system energy (GPU + CPU + RAM) when that's reported separately from GPU-only energy — expect CEDARS's figure to sit below a paper's *total* measured training/inference energy by roughly the non-GPU share, even with GPU wattage, hours, and PUE all correctly matched. Note this as a scope limitation rather than trying to "correct" it with an input.
- **`Inference time (s/study)` assumes 100% GPU utilisation for its full duration** — it is meant to be GPU-active compute seconds, not end-to-end wall-clock latency. A paper's reported per-case time (e.g. from a volumetric pipeline with substantial I/O, preprocessing, or postprocessing) can be much longer than actual GPU-active time; feeding the longer wall-clock figure into this field will overstate inference energy. A sanity check: back-solve the paper's own reported kWh/study against a plausible GPU wattage (150–700 W) — if the implied power is far outside that range (e.g. single-digit watts), the reported time and energy are very likely describing different things and shouldn't be combined via `kW × time`. In that case, enter the paper's kWh/study **directly** into the **`Inference energy (kWh/study)`** field (AI Model page, Advanced model parameters, next to `Inference time`) rather than deriving it from time. This field is the single source of truth for measured per-study energy: once set, it drives **both** the Testing/Validation total (`= kWh/study × test-set size`) **and** the Phase 3 deployment per-study figure identically, bypassing `gpuKw × inferSec × PUE` entirely for both — `Inference time` becomes purely informational at that point. (The Research label has its own separate `Inference kWh/study` field, populated by "Pre-fill from dashboards" from this one — set the value here first, on the Model page, not there directly, so both Testing/Validation and the Research label agree.)
- **`ai.cloudCi` (AI Model page) and the Research label's own region/CI setting are intentionally independent**, not a synced pair: the Model page's Cloud CI reflects whatever deployment region you've configured there (e.g. "On-premise (Switzerland)" ≈ 0.10 kgCO₂e/kWh), for operational/dashboard purposes; the Research label defaults to **"Global average" (0.473 kgCO₂e/kWh)** specifically so a disclosed model's footprint is comparable across papers/deployments regardless of where any one department happens to be, per its own framing ("no department context"). Seeing different values in the two places is expected, not a bug — "Pre-fill from dashboards" does not copy the region/CI setting for this reason. Change the Research label's own region field directly if you want it to match a specific deployment instead of the global-average default.
- **Custom PUE is set independently on the AI Model page and the Research label** — they are two separate fields, not synced except when "Pre-fill from dashboards" is clicked (which copies the Model page's value at that moment; editing either afterward does not propagate to the other). If you set a Custom PUE for a specific comparison (e.g. `1.0` to reproduce a single lab GPU measurement), set it on **both** pages if you're citing figures from both, or rely on "Pre-fill from dashboards" run *after* setting it on the Model page.

---

## AI model library (`AI_MODEL_LIBRARY`) and performance governance

The AI Dashboard ships a library of task-family templates spanning the real space of radiology AI. **Each template is an editable starting point, not an authoritative spec.** The fields divide into two categories with very different epistemic status:

- **Energy drivers** (`paramsM`, `dim`, `resolution`, `slices`, `inferSec`, `gpuKw`, `trainMwh`, `embCo2Kg`) — physically grounded. Inference time auto-scales with `params × (number of input elements)` relative to the template's measured base — that element count is `resolution² × slices`, where **`slices` is the number of inference passes/elements per study, independent of whether the underlying architecture is 2D or 3D**. A true 3D/volumetric architecture processes an in-plane² × through-plane-slices voxel grid in one pass; a 2D-input architecture applied slice-by-slice over a volume (e.g. per-slice CT/MRI segmentation, as in KiTS-style pipelines) processes the same number of elements per study across many individual passes — both cases should set `slices` to the actual per-study slice count, not just the library default of 1. Energy then follows from GPU power, PUE, and precision. This follows the standard result that compute (FLOPs) scales ~linearly with processed spatial elements for a fixed architecture (GreenAI-2020; Selvan-2022). The **default training** estimate scales by the *same* size ratio (`params × input-elements` vs the library reference), so training, inference and the amortised per-study total all scale consistently with model size and slice count — an unedited library entry has ratio 1 (unchanged), and a measured GPU-hours entry overrides the estimate entirely. These are defensible *relative* estimates anchored to a real datapoint, not absolute FLOPs claims. Training cost also depends on **dataset size × epochs** — modelled **optionally**: if the user supplies a training-set size and an epoch count, the default training estimate is additionally scaled by (images × epochs) ÷ (50,000 × 100, the reference the library `trainMwh` values are assumed to represent); left blank, training is unchanged. Note this reference dataset size is a count of individual training **images fed to the network per epoch** — for a 2D-per-slice pipeline that means 2D slices, not 3D volumes/patients; entering a volume/patient count instead will understate the ratio by roughly the average slice count per volume.

A **measured GPU-hours entry** (`Training GPU` preset × `# GPUs` × `Hours`, under "Training assumptions") **fully overrides the training energy estimate** — this is the correct path whenever a paper reports actual training GPU-hours, rather than relying on the params×voxels scaling above. Both the GPU preset and Hours must be filled in together to engage this bypass; selecting a GPU preset alone (Hours left blank) does **not** change the training energy total, which stays on the literature-default estimate — but it *does* change the **Estimated GPU compute** readout, which uses the selected GPU's power draw instead of the template's own (inference/deployment-anchored, often much lower-power) `gpuKw` once a preset is chosen. This matters because a template's `gpuKw` default reflects realistic *inference* deployment hardware (e.g. an on-prem T4/A6000-class card), not necessarily the higher-power GPU (V100/A100/H100-class) a training run would actually use — leaving that field on "model default" while filling in only a GPU-hours estimate elsewhere will misstate the implied wattage.
- **Performance fields** (`accuracyPct`, `accuracyMetric`, `scanTimeReductPct`, `lowValueReductPct`) — **NOT predicted by CEDARS.** They default to the cited reference's reported value and are presented as editable, user-owned numbers. CEDARS never infers accuracy from model size or architecture; the user must enter their own validation results for any published figure.

**Governing principle:** carbon/energy may be modelled (it is physics); model *performance* may only be recorded (it is not predictable from architecture). The accuracy-vs-carbon trade-off the dashboard surfaces is therefore a comparison of *user-supplied* performance under a consistent carbon methodology.

**Template reference anchors** (defaults only — replace with your own measured GPU-hours, inference time, and validation metrics):

| Template | Reference model | Citation |
|----------|-----------------|----------|
| Classification / triage | CheXNet (DenseNet-121) | Rajpurkar P et al. 2017, arXiv:1711.05225 |
| Lesion / nodule detection | RetinaNet-style detector | Lin TY et al. 2017 (focal loss), arXiv:1708.02002; task-specific |
| Organ segmentation (2D) | U-Net | Ronneberger O et al. 2015, MICCAI, DOI: [10.1007/978-3-319-24574-4_28](https://doi.org/10.1007/978-3-319-24574-4_28) |
| Volumetric segmentation (3D) | nnU-Net | Isensee F et al. 2021, Nat Methods 18:203–211, DOI: [10.1038/s41592-020-01008-z](https://doi.org/10.1038/s41592-020-01008-z) |
| Reconstruction / denoising | DL recon (low-dose CT / fast MRI) | Radiology 2023, DOI: [10.1148/radiol.230441](https://doi.org/10.1148/radiol.230441) |
| Image synthesis (diffusion) | Diffusion model (e.g. MRI→CT) | Kazerouni A et al. 2023, Med Image Anal 88:102846, DOI: [10.1016/j.media.2023.102846](https://doi.org/10.1016/j.media.2023.102846) |
| Report generation (LLM / VLM) † | Radiology report-generation LLM | Doo FX et al. 2024, Radiology, DOI: [10.1148/radiol.240320](https://doi.org/10.1148/radiol.240320) (LLM-Energy) |
| Agentic workflow (LLM orchestration) † | Multi-step LLM agent (planning · retrieval · tool use · self-critique) | Illustrative; token-based (see below) |
| Foundation / prompt model | MedSAM (Segment Anything, medical) | Ma J et al. 2024, Nat Commun 15:654, DOI: [10.1038/s41467-024-44824-z](https://doi.org/10.1038/s41467-024-44824-z) |
| Custom / blank | User-defined | — |

† **Token-based** entries (see next subsection). All other templates are GPU-seconds–based.

Energy-scaling methodology references: `LLM-Energy` (inference energy vs. model size), `GreenAI-2020` / `Selvan-2022` (compute/energy vs. input-element count — pixels for 2D, voxels for 3D), and `Doo-JACR-2024` §4 (training/testing/inference lifecycle phases), all above. GPU power draw from `GPU_PRESETS` (see GPU hardware specifications section); PUE from `CLOUD` defaults above.

### Token-based inference for LLM and agentic models

Vision models (classification, detection, segmentation, reconstruction) are metered in **GPU-power × seconds**, which is the natural unit for a single forward pass. **Large language models and agentic workflows are not** — their inference energy is driven by the **number of tokens processed**, so CEDARS meters them in tokens instead:

```
inference kWh/study = (tokens per study ÷ 1000) × (Wh per 1,000 tokens) ÷ 1000 × PUE × precision-factor
tokens per study    = calls per task × tokens per call
```

- **Single-pass LLM** (e.g. report generation): `calls per task = 1`; tokens/study = prompt + context in, plus report out (default ≈ 2,500).
- **Agentic workflow**: one clinical *task* fans out into **multiple** model calls — planning, retrieval (RAG), tool use, self-critique, and retries — each carrying a growing context. Default ≈ **10 calls × 4,000 tokens = 40,000 tokens/study**, ~10–100× a single-pass classification. This multi-call blow-up is the sharpest edge of the "double-edged sword" (Doo 2024) and is invisible to any GPU-seconds model.

**Energy intensity default (`whPer1kTokens` ≈ 0.4 Wh per 1,000 tokens).** Public per-token figures are sparse, contested, and hardware/model-dependent; anchors span roughly 0.1–0.2 (small/efficient), 0.3–0.5 (standard), and 1–3 Wh/1k (large/frontier) models. Primary reference: **Luccioni AS, Jernite Y, Strubell E. Power Hungry Processing: Watts Driving the Cost of AI Deployment? (2024), arXiv:2311.16863** — measured per-inference energy across task types, with generative text far above discriminative tasks. All three token parameters (`whPer1kTokens`, `callsPerTask`, `tokensPerCall`) are **user-editable estimates**, not measurements; enter metered values (e.g. datacentre energy ÷ tokens served) for any reporting of record. The `callsPerTask` multiplier is a pragmatic bridge between a token count and CEDARS' kWh pipeline, not a precise physical model of attention-level compute.

### AI research label: two-phase footprint and amortised grade

An AI model has two structurally different costs, and the research label reports both rather than collapsing them:

- **Training** — a *one-time capital cost* (`trainCo2`, total kgCO₂e for all runs incl. failed/HPO experiments). Disclosed as an absolute footprint with a human-scale equivalency (short-haul flights, ICAO 2023 ~255 kgCO₂/economy seat). **Not graded on size** — a large one-time research cost is not "bad," and grading it would simply penalise capable/foundation models.
- **Inference** — a *marginal, recurring cost* paid on every study (`perInferCo2g` = inference kWh/study × effective grid CI). This is the fair, comparable, scalable number.

**Grade basis.** The 0–100 Score grades the **amortised in-use footprint** — `effective gCO₂e/study = (training CO₂ ÷ lifetime studies) + inference CO₂/study`, where `lifetime studies = monthly volume × deployment months`. When no deployment volume is given, the grade falls back to inference-only; with neither, the label is disclosure-only (no grade). A **break-even** point (`training CO₂ ÷ inference CO₂ per study`) marks where cumulative inference equals the training cost. This mirrors the department label's per-study *efficiency* philosophy and rewards models that are deployed at scale rather than merely small. Band constants `CEDARS_AIUSE_LO = 0.2`, `CEDARS_AIUSE_HI = 40` gCO₂e/study are **illustrative anchors**, not a validated standard — replace with measured deployment data for reporting of record. Reporting-field basis: Doo FX et al. *Radiology* 2024 (DOI 10.1148/radiol.232030).

---

## Intervention savings defaults

Baseline kWh savings in `INTERVENTIONS` are conservative departmental estimates informed by the sources below. Replace with measured before/after metering.

| Intervention | Basis |
|-------------|-------|
| Turn MRI/CT off overnight | JMRI-2023 and Radiol-230441 (Woolen et al. 2023 — direct power-meter idle/off measurements, corrected citation 2026-08, was mistakenly Radiol-243453): idle draws of 15 kW over 8 h/night on MRI alone = 120 kWh/night × ~20 nights ≈ 2 400 kWh/month. |
| Standby mode during inactive periods | Herrmann-2012 and CJRS-2022: standby typically 40–60 % lower than idle; ~1 200 kWh/month estimated saving across MRI + CT fleet. |
| Reduce low-value imaging | McKee-2024 and ESR-PP-2025: reducing 5–10 % unnecessary scans; ~800 kWh/month estimated. |
| Optimise scheduling | IJHCQA-2016: tighter scheduling reduces dead-time idle; ~600 kWh/month. |
| Shorten protocols | Radiol-243453 (Woolen et al. 2025 — DL/parallel-imaging acceleration study, corrected citation 2026-08, was mistakenly Radiol-230441): protocol compression reduces per-scan active time; ~450 kWh/month. |
| Reduce repeat scans | AJR-2023-CT: each avoided CT ≈ 0.5 kWh; reducing repeats by ~1 800/month = 900 kWh/month. |
| Move computation to lower-carbon region | OWID-CI: same energy, grid swap from 0.38 to 0.06–0.10 kgCO₂e/kWh = up to 80 % CO₂ reduction on compute. |
| Use renewable electricity | ESR-GI: Scope 2 decarbonisation via green tariff or PPA; effectively zeroes grid carbon. |
| Reduce paper and film printing | Film processor and laser printer loads ~120 kWh/month in typical department — **[uncited, editable estimate]**. |
| Extend hardware lifetime | ESR-PP-2025: embodied carbon amortised over more years; ~15 % Scope 3 reduction. |
| Consolidate servers | Clinical-AI: virtualisation / right-sizing reduces physical server count; ~500 kWh/month. |
| Use smaller or more efficient AI models | LLM-Energy: lighter models use substantially less inference compute; ~80 kWh/month. |

---

## Equivalencies and human-scale comparisons

Used in the Dashboard "What it means" tab and the Home page result panel to express CO₂ in everyday terms.

| ID | Source | Factor used |
|----|--------|------------|
| DEFRA-2023 | UK Department for Environment, Food & Rural Affairs. *Greenhouse Gas Reporting: Conversion Factors 2023.* https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023 | Car transport: **0.17 kgCO₂e/km** (average petrol passenger car) |
| ICAO-2023 | International Civil Aviation Organization. *Carbon Emissions Calculator Methodology.* https://www.icao.int/environmental-protection/CarbonOffset/Pages/default.aspx | Short-haul flight: **255 kgCO₂e/seat**; long-haul: **1,200 kgCO₂e/seat** (economy, radiative forcing excluded) |
| EEA-2023 | European Environment Agency. *Final Energy Consumption by Sector.* EEA 2023. https://www.eea.europa.eu/data-and-maps/indicators/final-energy-consumption-by-sector-11 | EU average household electricity: **3,500 kWh/yr**; EU average car: **2.1 tCO₂e/yr** |
| EPA-CRF | US Environmental Protection Agency. *Emission Factors for Greenhouse Gas Inventories.* 2023. https://www.epa.gov/ghgemissions/emission-factors-ghg-inventories | Crude oil combustion: **430 kgCO₂e/barrel** |
| FAO-FRA | FAO. *Global Forest Resources Assessment 2020.* https://www.fao.org/forest-resources-assessment/ | Temperate managed forest carbon sequestration: **5.5 tCO₂/ha/yr** |
| IPCC-2006 | IPCC. *2006 IPCC Guidelines for National Greenhouse Gas Inventories,* Vol. 2, Ch. 2. https://www.ipcc-nggip.iges.or.jp/public/2006gl/ | Hard coal combustion: **2,350 kgCO₂/tonne** |
| Tree-21 | Commonly cited figure; consistent with Nowak et al. (2013), *Urban Forest & Urban Greening* and ESR Green Imaging references. | One mature tree sequesters ~**21 kgCO₂/yr** |
| Phone-12Wh | IEA. *Digitisation and Energy.* IEA 2017; hardware specs for modern smartphones. | Smartphone full charge: ~**12 Wh** |

---

## Scope 3 metrics: staff commute, DICOM data transfer, and Software Carbon Intensity

These three metrics were added to CEDARS based on gaps identified in Doo et al. JACR 2024 relative to common departmental reporting practice.

| ID | Citation |
|----|---------|
| Doo-JACR-2024 | See Radiology sustainability section. Framework source for the departmental Scope 3 additions (DICOM data transfer) and the per-study SCI metric — described as actionable Scope 3 additions most departments omit. For **staff commute** specifically, see Rockall-2025 / Tennison-2021 / Malik-2021 below, which support it more directly. |
| DEFRA-2023 | See Equivalencies section. Staff commute emission factor: **0.17 kgCO₂e/km** (average petrol passenger car, round trip). Used in `staffCommuteCo2`: `staffCount × commuteKm × 2 × STAFF_DAYS_PER_MO × timeMult × 0.17`. |
| Rockall-2025 | Rockall AG, Allen B, Brown MJ, et al. *Sustainability in Radiology: Position Paper and Call to Action from ACR, AOSR, ASR, CAR, CIR, ESR, ESRNM, ISR, IS3R, RANZCR, and RSNA.* J Am Coll Radiol 2025;22(9):1082–1090. DOI: [10.1016/j.jacr.2025.02.009](https://doi.org/10.1016/j.jacr.2025.02.009) (open access; simultaneously published in European Radiology [10.1007/s00330-025-11413-7], Radiology [10.1148/radiol.250325] and others — either DOI may be cited). Multi-society (11 societies) radiology-specific support for treating **staff/employee travel** as part of imaging's footprint and a mitigation target: *"Decreasing the energy consumption of imaging requires reducing the need for patient and employee travel to monolithic health care facilities"* and *"reducing emissions from patient and staff travel and transportation."* Qualitative (position paper) — establishes relevance, not quantities. |
| Tennison-2021 | Tennison I, Roschnik S, Ashby B, et al. *Health care's response to climate change: a carbon footprint assessment of the NHS in England.* Lancet Planet Health 2021;5(2):e84–e92. DOI: [10.1016/S2542-5196(20)30271-0](https://doi.org/10.1016/S2542-5196(20)30271-0). Quantitative healthcare Scope 3 evidence: decomposes the NHS footprint by source, with **staff commuting** (alongside business and patient/visitor travel) as a distinct, material category — the empirical basis for including staff commute in a departmental footprint. |
| Malik-2021 | Malik A, Padget M, Carter S, et al. *Environmental impacts of Australia's largest health system.* Resour Conserv Recycl 2021;169:105556. DOI: [10.1016/j.resconrec.2021.105556](https://doi.org/10.1016/j.resconrec.2021.105556). Input–output life-cycle assessment of a national health system capturing Scope 3 including employee **commuting/travel** — corroborates staff commute as a non-trivial healthcare emissions category. |
| Aslan-2018 | Aslan S, Mayers C, Koomey JG, France C. *Electricity Intensity of Internet Data Transmission: Untangling the Estimates.* J Industrial Ecology 2018;23(1):182–194. DOI: [10.1111/jiec.12630](https://doi.org/10.1111/jiec.12630). Fixed-line data-centre network average: **0.001 kWh/GB** (NET_KWH_PER_GB). Used for DICOM network transfer CO₂: `imagingScans × 0.3 GB/study × 0.001 kWh/GB × gridCI`. Note: covers data-centre network segment only; last-mile and end-user device energy not included. |
| GSF-SCI | Green Software Foundation. *Software Carbon Intensity (SCI) Specification v1.0.* https://greensoftware.foundation/articles/software-carbon-intensity. DOI: [10.5281/zenodo.8369519](https://doi.org/10.5281/zenodo.8369519). Formula: **SCI = (E × I + M) / R** where E = operational energy (kWh), I = carbon intensity (kgCO₂e/kWh), M = embodied carbon, R = functional unit (one imaging study). Used in the "SCI — carbon per imaging study" card in the Dashboard. Cited alongside Doo-JACR-2024 as the standard metric for per-study carbon reporting. |

**Staff count estimation from device fleet (`STAFF_PER_DEVICE`):**

Staff commute headcount is derived automatically from the equipment configuration using NHS/British Institute of Radiology (BIR) workforce planning ratios. These represent whole-department FTE (radiologists, radiographers, nurses, physicists, admin, IT) per active device unit — not technologist-only counts. These are indicative defaults; replace with actual HR data for publication.

| Device type | FTE/unit | Basis |
|-------------|----------|-------|
| MRI (0.35T) | 4 | Simple open-bore, less complex workflow |
| MRI (1.5T / 3T) | 5 | Standard clinical MRI; BIR staffing norms |
| MRI (7T) | 6 | Research / specialist; additional physicists |
| CT | 4 | Standard clinical CT |
| PET-CT | 5 | Specialist techs + radiologist + physicist |
| Angio / IR suite | 6 | Radiologist + 2–3 techs/nurses + scrub |
| Fluoroscopy | 3 | Shared tech + radiologist |
| Radiography room | 3 | 1–2 radiographers + shared radiologist |
| Ultrasound | 2 | Sonographer + shared radiologist |
| Mammography | 2 | Radiographer + shared radiologist |
| PACS / Servers | 2 | IT support staff |
| Workstations | 1 | One reading radiologist per station |

**References:** British Institute of Radiology. *Radiology Workforce Census.* 2023. https://www.bir.org.uk/. NHS England. *Diagnostic Imaging Dataset Statistical Release.* 2023. https://www.england.nhs.uk/statistics/statistical-work-areas/diagnostic-imaging-dataset/.

---

## Contrast media and contamination (`CONTRAST`)

Estimates the iodinated (ICM — CT, PET-CT, angiography, fluoroscopy) and gadolinium-based (GBCA — MRI) contrast footprint from the fleet's per-modality exam counts × fixed literature defaults. Two distinct concerns: **waste** (contrast drawn but discarded) and **contamination** (administered contrast excreted by patients into wastewater). Both agent classes pass through wastewater treatment largely unremoved, so environmental release ≈ administered dose (a defensible mass-balance).

> ⚠️ **Verification status — completed 2026-08.** Every flagged parameter below was checked against real literature. Result: 3 of 5 use-fractions now have a genuine (if imperfect) primary or survey source; **2 (Angio/IR, Fluoroscopy) have no located percentage-level literature at all** and are retained as clinically-grounded expert estimates, not verified defaults — this distinction matters and shouldn't be flattened by a generic "**[verify]**" tag. Contrast-use fractions vary widely by institution and indication; treat all fractions here as editable defaults, confirm against local pharmacy/procurement data before publication.

**Default parameters (`CONTRAST`):**

| Parameter | Default | Basis |
|-----------|---------|-------------------|
| % CT with contrast | 40% | Goldfarb 2023 (Contrast-Utilization-2023): 36.2% of CT exams contrast-enhanced in 2013 US Medicare claims data, with both enhanced/unenhanced volumes rising through 2019 — 40% is a reasonable current extrapolation of that rising trend, though the source is US-Medicare-specific (older population), not a global figure. |
| % PET-CT with contrast | 30% | Annunziata 2023 (PETCT-Contrast-Survey-2023), international survey: usage is genuinely **bimodal**, not centered — ~30% of responding sites use contrast-enhanced CT on <20% of PET/CT studies, another ~30% on >80%. 30% is a rough midpoint of a distribution that doesn't actually cluster there; real institutional practice is closer to "rarely" or "almost always." |
| % Angio/IR with contrast | 90% | **No percentage-level literature source located.** Clinically plausible — contrast is intrinsic to angiographic visualization technique — but retained as an expert estimate, not a literature-verified figure. |
| % Fluoroscopy with contrast | 50% | **No percentage-level literature source located.** "Fluoroscopy" spans both iodinated procedures (GU, arthrography, myelography) and non-iodinated barium GI studies; no study aggregates a usage rate across this heterogeneous category. Retained as an expert estimate. |
| % MRI with gadolinium | 40% (was 35%) | Iyad et al. 2023 (Gd-Review-2023) states 40–50% of MRI exams use GBCA; **this is itself a review's secondary figure, not a primary measured dataset** — weakest tier of evidence found, but it's real and it contradicted the prior 35% default, so the default was raised to the low end of the cited range. **Corrected 2026-08.** |
| Iodinated volume | 100 mL/exam | Personalized-dosing literature (JBSR-2024-ContrastVol) reports typical ranges of 40–120 mL depending on protocol/body weight, with 100 mL a common fixed-protocol figure for chest/abdomen/pelvis studies; volume is inherently protocol/weight-dependent so no single "typical" number exists, but 100 mL sits centrally in the commonly reported range. |
| Iodine concentration | 350 mgI/mL | Common agents 300–370 mgI/mL. |
| Gadolinium per exam | ~1.0 g Gd | Standard 0.1 mmol/kg × ~70 kg = 7 mmol × 157 g/mol ≈ 1.1 g. |
| GBCA volume | 15 mL/exam | ~15 mL of a 0.5 M macrocyclic agent. |
| Waste fraction | 10% | Robinson et al. 2013 (Contrast-Stewardship) directly measures vial-packaging-driven contrast waste (overfill/leftover from weight-based dosing vs. fixed single-dose vials) and confirms the *mechanism*, but doesn't report a single clean "10%" figure — treat as directionally supported, not a precise match. |
| Contrast density | 1.4 g/mL | For discarded-mass (hazardous-waste) estimate. |

**Environmental / methodology references — verified 2026-08:**

| ID | Citation |
|----|---------|
| Contrast-Utilization-2023 | Goldfarb JW. *National trends in contrast media enhanced and unenhanced computed tomography use.* Clin Imaging 2023;93:103–105. DOI: [10.1016/j.clinimag.2022.11.009](https://doi.org/10.1016/j.clinimag.2022.11.009). US Medicare claims data: 36.2% of CT exams contrast-enhanced in 2013, rising through 2019 (COVID dip, then rebound). Primary source for CT contrast-use fraction. |
| PETCT-Contrast-Survey-2023 | Annunziata S, Testart N, Auf der Springe K, et al. *Contrast enhanced CT on PET/CT imaging in clinical routine: an international survey.* Front Med 2023;10:1290956. DOI: [10.3389/fmed.2023.1290956](https://doi.org/10.3389/fmed.2023.1290956). 191 responders, mostly academic-hospital nuclear medicine physicians; usage is bimodal (~30% of sites <20% contrast-enhanced CT, ~30% >80%). Primary source for PET-CT contrast-use fraction. |
| Gd-Review-2023 | Iyad N, Ahmad MS, Alkhatib SG, Hjouj M. *Gadolinium contrast agents – challenges and opportunities of a multidisciplinary approach: Literature review.* Eur J Radiol Open 2023;11:100503. DOI: [10.1016/j.ejro.2023.100503](https://doi.org/10.1016/j.ejro.2023.100503). States 40–50% of MRI exams use GBCA (a review's secondary figure, not primary measured data). Source for MRI contrast-use fraction. |
| JBSR-2024-ContrastVol | *Personalized Contrast Agent Volumes in Abdominal CT: Bridging Theory with Practice.* J Belg Soc Radiol 2024. DOI: [10.5334/jbsr.3906](https://doi.org/10.5334/jbsr.3906). Reviews weight-based/personalized dosing (typically 40–120 mL) vs. fixed-volume protocols (~100 mL for chest/abdomen/pelvis); no single "typical" figure exists since volume is protocol/weight-dependent. |
| Contrast-Stewardship | Robinson JD, Mitsumori LM, Linnau KF. *Evaluating Contrast Agent Waste and Costs of Weight-Based CT Contrast Bolus Protocols Using Single- or Multiple-Dose Packaging.* AJR 2013;200(6):W617–W620. DOI: [10.2214/AJR.12.9479](https://doi.org/10.2214/AJR.12.9479). Directly measures (1,341 exams) that weight-based dosing + multi-dose (500 mL) vial packaging reduces total ICM volume/vial requirements vs. single-dose packaging — supports both the waste-fraction estimate and the stewardship co-benefit claim below, though it doesn't itself report a single clean "10% waste" figure. **Corrected 2026-08** — replaces a generic, unsourced "ESR/ACR guidance" placeholder. |
| Gd-Environment | Rogowska J, Olkowska E, Ratajczyk W, Wolska L. *Gadolinium as a new emerging contaminant of aquatic environments.* Environ Toxicol Chem 2018;37(6):1523–1534. DOI: [10.1002/etc.4116](https://doi.org/10.1002/etc.4116). **Corrected 2026-08** — journal was previously misstated as *Environ Sci Technol*; it's *Environmental Toxicology and Chemistry*. Brünjes R, Hofmann T. *Anthropogenic gadolinium in freshwater and drinking water systems.* Water Res 2020;182:115966. DOI: [10.1016/j.watres.2020.115966](https://doi.org/10.1016/j.watres.2020.115966) — confirmed correct as previously cited. |
| ICM-Environment | Sengar A, Vijayanandan A. *Comprehensive review on iodinated X-ray contrast media: Complete fate, occurrence, and formation of disinfection byproducts.* Sci Total Environ 2021;769:144846. DOI: [10.1016/j.scitotenv.2020.144846](https://doi.org/10.1016/j.scitotenv.2020.144846). Review synthesis. For direct experimental evidence: Duirk SE et al. *Chlorination of Source Water Containing Iodinated X-Ray Contrast Media: Mutagenicity and Identification of New Iodinated Disinfection By-products.* Environ Sci Technol 2018;52(22):13047–13056. DOI: [10.1021/acs.est.8b04625](https://doi.org/10.1021/acs.est.8b04625). |
| Doo-2024 | Doo FX et al. *Environmental Sustainability and AI in Radiology: A Double-Edged Sword.* Radiology 2024. DOI: [10.1148/radiol.232030](https://doi.org/10.1148/radiol.232030). (See AI sustainability section.) Discusses contrast media as part of radiology's environmental footprint within the broader sustainability framework; not a source of specific contrast-fraction numbers. |

**Co-benefit note:** reducing unnecessary contrast-enhanced imaging cuts patient risk (contrast reactions, gadolinium retention) *and* environmental contamination — a "sustainable = higher-value care" lever, linked to the appropriateness framing in the intervention set. A contrast-media **carbon (LCA)** figure is deliberately **not** reported yet: per-mL life-cycle CO₂e factors for contrast are sparse and would need a sourced LCA before inclusion; the resource/contamination masses above are more defensible.

---

## Data storage & archiving (`MODALITY_MB`, `STORAGE_KWH_PER_TB_*`)

Long-term PACS/archive storage is a growing, frequently-omitted footprint. CEDARS models it fleet-driven: annual data generated = Σ (studies/yr × per-modality file size), held over a retention period at a per-TB/yr energy intensity, added to the department total (so it flows into carbon, cost, water, and the Score).

**Per-modality file sizes (`MODALITY_MB`, MB/study).** Doo FX et al., *J Am Coll Radiol* 2024 (DOI: [10.1016/j.jacr.2023.11.011](https://doi.org/10.1016/j.jacr.2023.11.011)), Fig 2: XR ~10, US ~300, CT ~300, MR ~300, mammography ~10, tomosynthesis ~400, PET-CT ~1700 MB. CT is set to ~700 MB to represent a study **with reformats** (Jia et al., below, median CT-CAP 787 MB all-series vs 290 MB axial-only). All values are editable estimates; file sizes vary widely by site, protocol, slice thickness, and compression.

**Storage energy intensity (`STORAGE_KWH_PER_TB_ONPREM = 7.9`, `STORAGE_KWH_PER_TB_CLOUD = 4.8` kWh/TB/yr) — corrected 2026-08 (was 600 / 360).** Jia Y et al., *Eur Radiol* 2026 (DOI: [10.1007/s00330-025-12023-z](https://doi.org/10.1007/s00330-025-12023-z)) supply the **formula**, which is sound and kept: HDD kWh/TB/yr + servers (kWh/server ÷ TB/server) + network (devices/server × kWh/device ÷ TB/server), × PUE. Their own **inputs**, though, implied older/smaller drives and a small dense-compute-style server (136 kWh/TB HDD term, 12 TB/server), giving 600 kWh/TB/yr on-premises. Storage kWh/TB is not a fixed physical constant; it depends heavily on drive generation and server density, so the fix here was re-running Jia's own formula with concretely-sourced modern hardware rather than guessing a replacement number:

- **HDD term**: Seagate Exos X24, a currently-shipping 24 TB nearline enterprise drive — exactly Jia's "HDD" category, just current-generation. Datasheet power 6.3 W idle / 8.9 W max; blended ≈7.5 W (a cold archive is mostly idle — Jia et al. themselves note under 10% of images are accessed after 60 days) → ≈2.74 kWh/TB/yr, ~50× lower than Jia's 136.
- **Server term**: Backblaze's published Storage Pod design (a real, widely-cited open storage-server architecture, not an assumption) — 60 drives per 4U server. At 24 TB/drive that's 1,440 TB/server, vs Jia's 12 TB/server. Server chassis/CPU/RAM/PSU overhead (2059 kWh/server/yr) is unchanged from Jia et al. — only the TB/server denominator changes → ≈1.43 kWh/TB/yr.
- **Network term**: same 0.1 devices/server × 3197 kWh/device as Jia, redivided by the new 1,440 TB/server → ≈0.22 kWh/TB/yr.
- **IT total**: ≈4.39 kWh/TB/yr. **On-prem** uses Jia's own PUE 1.8 (kept for methodological consistency — this is a hardware/density fix, not a PUE argument) → **≈7.9 kWh/TB/yr**. **Cloud** uses PUE 1.1 (matching CEDARS's own Google Cloud PUE default elsewhere in this file) → **≈4.8 kWh/TB/yr**.

This is still a **derived** figure (server density and PUE are reasoned choices, not one directly-reported end-to-end number — no single paper publishes a modern bulk-medical-archive kWh/TB figure), so treat it as a much-better-grounded default rather than a final authority. Deliberately not benchmarked here against any paper used as a validation target for this tool — every input above (Jia's formula, the Seagate and Backblaze datasheets) is independent of that. The **Custom intensity (kWh/TB/yr)** field (Home page, Data storage & archiving section) remains available to enter your own metered figure (facility or cloud invoices) for reporting of record, or a different architecture's figure entirely.

| ID | Citation |
|----|---------|
| Seagate-ExosX24 | Seagate Technology. *Exos X24 Data Sheet.* https://www.seagate.com/products/enterprise-drives/exos/exos-x/x24/. 24 TB nearline enterprise HDD; idle 6.3 W, max 8.9 W. Source for the corrected HDD term above. |
| Backblaze-StoragePod | Backblaze. *Storage Pod 6.0: Building a 60 Drive 480TB Storage Server.* https://www.backblaze.com/blog/open-source-data-storage-server/. Published open-source 4U/60-drive storage-server design; source for the corrected server-density term above (rescaled to 24 TB drives = 1,440 TB/server). |

**Mitigation levers.** (1) *Axial-only* — avoid non-essential CT/PET reformats (factor 0.4 on CT/PET-CT; Jia et al. report up to **69%** less CT storage, zero clinical downside, automatable via workflow). (2) *Cloud archive* — ~40% lower energy at efficient-PUE data centres. (3) *Retention policy* — shorter retention shrinks the held archive (Jia: ~38% from an 8-year policy; combined strategies up to **89%**).

**Boundary / caveats.** Kept **separate** from the flat PACS/reading-server device power and from the per-GB DICOM *transfer* line (Aslan 2018) to avoid double-counting. Excludes security **backups** and **embodied** storage-hardware carbon (both omitted in Jia et al. too), so the figure **undercounts**. `eq.scans` is treated as monthly (× 12 for annual). Cloud service **fees** ($/GB, Doo et al. archival ≈ $0.028/GB/month) are noted in-app but not added to the electricity-cost figure, which reflects energy cost at the user's tariff.

---

## Electricity price (`ELECTRICITY_PRICE`)

Cost = energy (kWh) × electricity price, mirroring the carbon calculation (kWh × grid intensity). Per-region **commercial/industrial** defaults (hospitals pay commercial, not residential, rates) with a currency symbol; blank input falls back to the region default, a typed value overrides. Rough 2024–25 commercial rates: Switzerland CHF 0.27, France €0.23, Germany €0.28, United States $0.13, United Kingdom £0.28, EU average €0.24, Global $0.15 per kWh. These are **volatile, region- and contract-specific estimates** — enter your actual tariff. Cost is **decoupled** from carbon (a low-carbon grid is not necessarily cheap); the two are reported separately. Cost appears on the equivalencies page, the Interventions before/after (annual saving), and the data-storage element. Only **electricity** cost is modelled (not hardware capital, staff, or cloud service fees).

---

## Cloud Carbon Tracker regional data

| ID | Source | Used for |
|----|--------|----------|
| ElectricityMaps-2023 | Electricity Maps. *Annual Average Carbon Intensity by Region.* 2023. https://electricitymaps.com | Regional kgCO₂e/kWh values in `CLOUD_REGIONS` for the Cloud Carbon Tracker (AWS, Azure, GCP region selector). Values represent 2023 annual average marginal/average carbon intensity per cloud region. |

---

## GPU hardware specifications

| ID | Source | Used for |
|----|--------|----------|
| NVIDIA-DC-Specs | NVIDIA. *Data Center GPU Specifications.* https://www.nvidia.com/en-us/data-center/ | TDP values (watts) for A100 SXM4 (400 W), H100 SXM5 (700 W), V100 SXM2 (300 W), A40 (300 W), L40S (350 W), RTX 4090 (450 W), RTX 3090 (350 W), RTX A6000 (300 W) used in `GPU_PRESETS` for AI energy estimation. |
| AMD-Instinct-Specs | AMD. *Instinct GPU Specifications.* https://www.amd.com/en/products/accelerators/instinct.html | TDP value for MI300X (750 W) used in `GPU_PRESETS`. |

---

## Assumption principles

1. **Prefer measured data.** Energy from scanner logs, smart meters, facility meters, or cloud invoices always overrides literature defaults — implemented for the Department module via the **Advanced equipment parameters** override panel and the storage **Custom intensity** field (see "Measured-data equipment overrides" under PACS/servers and reading workstations, and "Storage energy intensity" under Data storage & archiving), and for the AI module via the Advanced model parameters panel and direct measured-GPU-hours entry.
2. **Literature values are transparent defaults**, not authoritative truth.
3. **Mark every input** as `measured`, `estimated`, or `assumed` (see confidence field in dashboard CSV) — a device row overridden via Advanced equipment parameters is automatically flagged `measured`.
4. **Carbon intensity must be editable and region-specific.** National averages underestimate variation by utility or time of day.
5. **Separate AI gross footprint from estimated sustainability benefits.** Net AI impact can be negative (net-positive) if AI reduces unnecessary scans.
6. **Report Scope 1, 2, and 3 separately** where the data model supports it. The Scope 1/2/3 structure follows the GHG Protocol as applied to radiology departments by **Doo-JACR-2024**. Scope 3 inclusions (embodied carbon, patient travel, staff commute, DICOM data transfer) are drawn from that framework. Embodied (manufacturing) carbon (`EMBODIED_KG_MO`, amortised monthly) is applied **per device unit** — scaled by the number of units of each device type, consistent with how operational energy and study volume scale — so a fleet of four CT scanners carries four times the embodied carbon of one.
7. **Update defaults annually** as grids decarbonise and scanner technology improves.
8. **AI lifecycle reporting follows Doo-JACR-2024 §4.** Training (Phase 1), testing/validation (Phase 2), and inference/deployment (Phase 3) are the three phases. Per-study Software Carbon Intensity (SCI) per the Green Software Foundation specification is the recommended single-number comparison metric for AI tools.
9. **Model energy may be modelled; model performance may only be recorded.** AI inference/training energy is estimated from physical drivers (parameters, resolution, dimensionality, GPU power, PUE). Diagnostic performance (accuracy, Dice, AUC, etc.) and clinical co-benefits are **never predicted** — they default to a cited reference and must be replaced with the user's own validation results. See the AI model library section.
