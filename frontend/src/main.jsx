import React, {useState, useMemo, useEffect, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend} from 'chart.js';

const Bar      = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Bar})));
const Doughnut = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Doughnut})));
const Scatter  = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Scatter})));
import {Leaf, Brain, Download, Activity, Gauge, TrendingDown, Droplets, FileText, Trash2, Cpu, Car, TreePine, Plane, Factory, Zap, Target, AlertTriangle, BarChart3, Home, Flame, Lightbulb, Coffee, Monitor, Server, Database, Wifi, Cloud, Plus, ArrowRight, HardDrive, Globe, Heart, Scan, Bot, Save} from 'lucide-react';
import './styles.css';
import { CARBON_INTENSITY, ELECTRICITY_PRICE, getCI, getPrice, currencySym, CEDARS_RATINGS, cedarsRating, cedarsScore, CEDARS_DEPT_LO, CEDARS_DEPT_HI, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI } from './calc.js';
import { encodeConfig, decodeConfig, SETTINGS_DEFAULTS, SCEN_DEFAULTS } from './urlstate.js';
import { ExternalLinkProvider, ExternalLink, Ref, ReferenceList } from './Refs.jsx';
import { REFS, refUrl } from './refs.js';
import { labelFromScen, computeAiLabel, LABEL_TO_SCEN, migrateLegacyLabel, PROVENANCE } from './ailabel.js';
import { AiEntryStep, AiRouteStrip, AiDeploymentContext, AI_ENTRY_REFS } from './AiEntry.jsx';
import { MeasureChooser } from './MeasureChooser.jsx';
import { AI_EXAMPLES, VOLUME_ESTIMATES } from './aiExamples.js';
import AboutPage from './AboutPage.jsx';
import { GuidedDemo, GuidedDemoLauncher } from './GuidedDemo.jsx';
import SaveSharePanel from './SaveSharePanel.jsx';
import SaveUtility from './SaveUtility.jsx';
import ContributionModal from './ContributionModal.jsx';
import { buildAssessmentSnapshot, parseAssessmentText, saveAssessmentLocally, loadLocalAssessment, clearLocalAssessment, assessmentFilename } from './assessment.js';
import { modelRecordFromScen, modelScenFromRecord, migrateLegacyAiState, toolFromDeployment } from './aiRecords.js';
import { getDepartmentScoreReadiness, getAiScoreReadiness } from './scoreReadiness.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend);

const CONTRIBUTION_ENDPOINT = import.meta.env.VITE_CEDARS_CONTRIBUTE_URL || '';
const TURNSTILE_SITEKEY = import.meta.env.VITE_CEDARS_TURNSTILE_SITEKEY || '';

// ── Reference tables ──────────────────────────────────────────────────────────

// kgCO₂e/kWh per region — Our World in Data (OWID), Carbon Intensity of Electricity, 2022-2023 national averages
// https://ourworldindata.org/grapher/carbon-intensity-electricity
// Global average (0.473) and EU average (0.237) from Vosshenrich et al. (cited in Implementation Guide).
// Replace with local utility/Eurostat data where available.
// CARBON_INTENSITY and ELECTRICITY_PRICE (with getCI/getPrice/currencySym) live in ./calc.js.

// Feedback → pre-filled GitHub issue on the CEDARS repo (no backend; community-visible).
const FEEDBACK_URL = 'https://github.com/takinci/cedars/issues/new?labels=feedback&title=' +
  encodeURIComponent('Feedback: ') + '&body=' + encodeURIComponent(
    "Thanks for helping improve CEDARS!\n\n" +
    "**What works well:**\n\n\n" +
    "**What could be improved (or a bug):**\n\n\n" +
    "**Suggestion / feature idea:**\n\n\n" +
    "---\nSubmitted from cedarsleaf.com"
  );

// Accordion section ids (for expand/collapse-all) on the Radiology Department and AI pages.
const DASH_SECTIONS = ['efficiency','energy','carbon','charts','infrastructure','resources'];
const AI_SECTIONS   = ['model','training','testing','inference','carbon','clinical','infra','benchmark'];

// Improve-page presentation metadata. These labels explain the existing intervention engine;
// they do not introduce a second calculation path.
const IMPROVE_INTERVENTION_META = {
  'Turn MRI/CT scanners off overnight': {
    description:'Power down eligible MRI/CT systems outside operating hours when vendor guidance and service requirements allow.',
    category:'Idle energy', status:'Modeled',
    reason:'Driven by MRI/CT idle and off-state energy in your entered fleet.',
    links:[['Woolen et al., Radiology 2023','https://doi.org/10.1148/radiol.230441'],['Heye et al., Radiology 2020','https://doi.org/10.1148/radiol.2020192084']],
  },
  'Use standby mode during inactive periods': {
    description:'Use a lower-power standby state during inactive periods when full shutdown is not appropriate.',
    category:'Idle energy', status:'Modeled',
    reason:'Driven by the gap between idle and standby energy in your entered fleet.',
    links:[['Brown et al., CARJ 2022','https://doi.org/10.1177/08465371221133074']],
  },
  'Reduce low-value imaging': {
    description:'Reduce imaging that is unlikely to add clinical value through appropriateness and ordering strategies.',
    category:'Active scanning', status:'Scenario estimate',
    reason:'Acts on the active-scanner energy pool using the stated scenario reduction.',
    links:[['McKee et al., Radiology 2024','https://doi.org/10.1148/radiol.240219'],['Rockall et al., JACR 2025','https://doi.org/10.1016/j.jacr.2025.02.009']],
  },
  'Optimize scheduling': {
    description:'Reduce avoidable idle time by aligning scanner availability, staffing, and patient flow.',
    category:'Idle energy', status:'Scenario estimate',
    reason:'Acts on the avoidable-idle pool in your entered fleet.',
    links:[['MRI scheduling / operational efficiency','https://doi.org/10.1108/IJHCQA-10-2016-0153']],
  },
  'Shorten protocols': {
    description:'Reduce active acquisition time when shorter protocols remain clinically appropriate.',
    category:'Active scanning', status:'Scenario estimate',
    reason:'Acts on remaining active-scanner energy after any avoided-study effect.',
    links:[['Woolen et al., Radiology 2025','https://doi.org/10.1148/radiol.243453']],
  },
  'Reduce repeat scans': {
    description:'Reduce repeat or rejected examinations through protocol, acquisition, and quality-improvement measures.',
    category:'Active scanning', status:'Scenario estimate',
    reason:'Acts on remaining active-scanner energy using the stated repeat-scan scenario.',
    links:[['AJR CT footprint study 2023','https://doi.org/10.2214/AJR.23.30189']],
  },
  'Move computation to lower-carbon regions': {
    description:'Run eligible computation in a lower-carbon region or provider when clinical, privacy, and legal requirements allow.',
    category:'Compute', status:'Modeled',
    reason:'Changes the carbon intensity of the computation pool without claiming an energy reduction.',
    links:[['Our World in Data — electricity carbon intensity','https://ourworldindata.org/grapher/carbon-intensity-electricity']],
  },
  'Use renewable electricity': {
    description:'Increase the renewable share of local operational electricity rather than crediting the same renewable supply twice.',
    category:'Electricity supply', status:'Modeled',
    reason:'Uses the renewable share already entered for this assessment and models only the remaining change.',
    links:[['ESR Green Imaging Department','https://www.myesr.org/greenid/']],
  },
  'Reduce paper and film printing': {
    description:'Reduce unnecessary paper and film use; CEDARS does not award automatic electricity savings without measured printer/processor data.',
    category:'Materials', status:'Planning guidance',
    reason:'No automatic numerical credit is applied without local measured equipment or material data.',
    links:[['CEDARS methods & sources','https://github.com/takinci/cedars/blob/main/sources.md']],
  },
  'Extend hardware lifetime': {
    description:'Extend safe, supportable equipment life to spread manufacturing emissions over a longer service period.',
    category:'Hardware', status:'Scenario estimate',
    reason:'Changes embodied Scope 3 only; it does not reduce operational electricity.',
    links:[['Rockall et al., JACR 2025','https://doi.org/10.1016/j.jacr.2025.02.009']],
  },
  'Consolidate servers': {
    description:'Consolidate under-used server capacity through right-sizing or virtualization where reliability requirements permit.',
    category:'Compute', status:'Modeled',
    reason:'Acts on the modeled server/compute energy pool rather than the entire department.',
    links:[['Doo et al., JACR 2024','https://doi.org/10.1016/j.jacr.2023.11.011']],
  },
  'Use smaller or more efficient AI models': {
    description:'Prefer the least resource-intensive model that still meets the required clinical performance.',
    category:'AI inference', status:'Scenario estimate',
    reason:'Acts only on deployed Clinical AI inference energy when Clinical AI is configured.',
    links:[['Doo et al., Radiology 2024','https://doi.org/10.1148/radiol.240320']],
  },
  'Store only acquired axial series (avoid reformats)': {
    description:'Avoid retaining non-essential reformatted CT/PET series when local clinical and legal requirements permit.',
    category:'Data storage', status:'Modeled',
    reason:'Recalculates the archive from the study volumes and storage practice entered in this assessment.',
    links:[['Jia et al., European Radiology 2026','https://doi.org/10.1007/s00330-025-12023-z']],
  },
  'Migrate imaging archive to cloud': {
    description:'Test a more energy-efficient cloud archive using its own storage energy and carbon context.',
    category:'Data storage', status:'Modeled',
    reason:'Recalculates archive energy and carbon from the current storage configuration.',
    links:[['Jia et al., European Radiology 2026','https://doi.org/10.1007/s00330-025-12023-z'],['Doo et al., JACR 2024','https://doi.org/10.1016/j.jacr.2023.11.011']],
  },
  'Apply an imaging data-retention policy': {
    description:'Move older studies to lower-power archival storage according to an appropriate retention policy.',
    category:'Data storage', status:'Modeled',
    reason:'Recalculates the held archive against the current retention period.',
    links:[['Jia et al., European Radiology 2026','https://doi.org/10.1007/s00330-025-12023-z']],
  },
  'Right-size contrast vials to dose (vial optimization)': {
    description:'Match iodinated contrast vial size more closely to the required dose to reduce supply-chain waste.',
    category:'Contrast', status:'Scenario estimate',
    reason:'Changes modeled iodinated-contrast Scope 3 rather than department electricity.',
    links:[['Nghiem et al., JACR 2026','https://doi.org/10.1016/j.jacr.2025.09.027']],
  },
  'Switch to multidose contrast injector system': {
    description:'Test a multidose vial/injector strategy that reduces iodinated-contrast and packaging waste.',
    category:'Contrast', status:'Scenario estimate',
    reason:'Changes modeled iodinated-contrast Scope 3 rather than department electricity.',
    links:[['Nghiem et al., JACR 2026','https://doi.org/10.1016/j.jacr.2025.09.027']],
  },
};

const IMPROVE_WORKFLOW_STAGES = [
  {key:'order', step:'1', title:'Order / need', subtitle:'Appropriateness & demand'},
  {key:'schedule', step:'2', title:'Schedule / prepare', subtitle:'Flow & idle time'},
  {key:'acquire', step:'3', title:'Acquire', subtitle:'Scanning, repeats & contrast'},
  {key:'process', step:'4', title:'Process / interpret', subtitle:'Compute, servers & AI'},
  {key:'store', step:'5', title:'Store / follow-up', subtitle:'Archive & retention'},
  {key:'infrastructure', step:'+', title:'Infrastructure & lifecycle', subtitle:'Power, hardware & materials'},
];
function improveWorkflowStage(name) {
  if (name === 'Reduce low-value imaging') return 'order';
  if (name === 'Optimize scheduling') return 'schedule';
  if (['Shorten protocols','Reduce repeat scans','Right-size contrast vials to dose (vial optimization)','Switch to multidose contrast injector system'].includes(name)) return 'acquire';
  if (['Move computation to lower-carbon regions','Consolidate servers','Use smaller or more efficient AI models'].includes(name)) return 'process';
  if (['Store only acquired axial series (avoid reformats)','Migrate imaging archive to cloud','Apply an imaging data-retention policy'].includes(name)) return 'store';
  return 'infrastructure';
}

const AI_IMPROVE_LIFECYCLE = {
  develop:[
    {key:'define',step:'1',title:'Define',subtitle:'Goal, task & compute budget'},
    {key:'build',step:'2',title:'Build & train',subtitle:'Training, experiments & checkpoints'},
    {key:'validate',step:'3',title:'Validate',subtitle:'Performance at efficient settings'},
    {key:'deploy',step:'4',title:'Deploy & serve',subtitle:'Hardware, serving & compute region'},
    {key:'monitor',step:'5',title:'Monitor & update',subtitle:'Retraining, demand & lifecycle'},
  ],
  procure:[
    {key:'define',step:'1',title:'Define need',subtitle:'Clinical value & requirements'},
    {key:'compare',step:'2',title:'Compare & disclose',subtitle:'Candidates & vendor evidence'},
    {key:'validate',step:'3',title:'Local validate',subtitle:'Performance & deployment assumptions'},
    {key:'deploy',step:'4',title:'Deploy & integrate',subtitle:'Serving, hosting & workflow'},
    {key:'monitor',step:'5',title:'Monitor & update',subtitle:'Updates, demand & governance'},
  ],
};
function aiImproveLifecycleStage(title, mode) {
  if (mode === 'develop') {
    if (['Set an experiment / compute budget','Right-size the model and workflow'].includes(title)) return 'define';
    if (['Measure the full development footprint','Use an explicit stopping & checkpoint policy'].includes(title)) return 'build';
    if (title === 'Use efficient numerical precision') return 'validate';
    if (title === 'Optimize machine, datacenter, and compute location') return 'deploy';
    return 'monitor';
  }
  if (title === 'Do not trade away clinical fit for efficiency') return 'define';
  if (['Compare candidates like-for-like','Request lifecycle disclosure from the vendor'].includes(title)) return 'compare';
  if (title === 'Validate your deployment assumptions') return 'validate';
  if (title === 'Ask for efficient deployment options') return 'deploy';
  return 'monitor';
}

const AI_IMPROVE_DEVELOP = [
  {tier:'first', priority:'Recommended', mode:'CEDARS input', title:'Measure the full development footprint', applies:'All internally developed, fine-tuned, or retrained models', inputs:'Training kWh · inference energy · run count · compute context', body:'Measure training energy and representative inference energy on the hardware you actually use. Count experiments, tuning runs, and repeats rather than reporting only the final successful training run.', refs:['doo-jacr-2024','strubell-nlp-2019','henderson-reporting-2020','codecarbon']},
  {tier:'first', priority:'Recommended', mode:'Planning guidance', title:'Use an explicit stopping & checkpoint policy', applies:'Iterative model training', inputs:'Training hours · training kWh · number of runs', body:'Define validation-based stopping criteria and retain the best checkpoint rather than automatically training to a fixed epoch count. In the cited chest-radiograph study, prospective early stopping preserved macro-AUC while reducing total training emissions 31–38% versus fixed 20-epoch training; the exact benefit is task- and architecture-specific.', refs:['dietrich-training-policy-2026']},
  {tier:'first', priority:'Recommended', mode:'Planning guidance', title:'Set an experiment / compute budget', applies:'Model selection and hyperparameter tuning', inputs:'Run count · GPU-hours · training kWh', body:'Predefine the scientific objective, search space, and stopping rule for experimentation. Avoid redundant full training runs and unnecessarily broad hyperparameter searches; reuse checkpoints or pretrained representations when methodologically appropriate.', refs:['strubell-nlp-2019','schwartz-green-ai-2020','henderson-reporting-2020']},
  {tier:'first', priority:'Recommended', mode:'Planning guidance', title:'Right-size the model and workflow', applies:'When more than one viable design meets the task', inputs:'Model size · image resolution · calls/tokens · inference energy', body:'Match model size, image resolution, dimensionality, ensemble or test-time augmentation, LLM calls/tokens, or diffusion steps to the clinical requirement rather than assuming more compute is better.', refs:['doo-radiology-llm-2024','patterson-4ms-2022','oviedo-inference-2025']},
  {tier:'optimize', priority:'Consider', mode:'Planning guidance', title:'Use efficient numerical precision', applies:'Compatible models, kernels, and hardware', inputs:'Training kWh · inference energy', body:'Use mixed precision where supported and validated. INT8 or lower-bit quantization can further reduce resource use for compatible deployment stacks, but it is not a universal default and requires task-specific performance revalidation.', refs:['doo-radiology-llm-2024','fernandez-llm-energy-2025']},
  {tier:'optimize', priority:'Consider', mode:'Planning guidance', title:'Optimize machine, datacenter, and compute location', applies:'Training and inference infrastructure', inputs:'Hardware · PUE · compute region · carbon intensity', body:'Improve accelerator utilization and right-size hardware; batch or cache when appropriate; and distinguish energy efficiency from carbon efficiency when choosing when and where computation runs. A lower-carbon location can reduce carbon without necessarily reducing kWh.', refs:['patterson-4ms-2022','hanafy-war-efficiencies-2023','doo-jacr-cloud-2024']},
  {tier:'optimize', priority:'Consider', mode:'Planning guidance', title:'Minimize avoidable data and hardware overhead', applies:'Data pipelines and infrastructure', inputs:'Storage · reformats · hardware lifecycle', body:'Avoid unnecessary duplicate datasets or reformats, use fit-for-purpose retention and archives, and extend suitable hardware life when performance, security, and reliability permit.', refs:['jia-eurradiol-2026','doo-jacr-2024']},
];

const AI_IMPROVE_PROCURE = [
  {tier:'first', priority:'Recommended', mode:'CEDARS workflow', title:'Compare candidates like-for-like', applies:'Procurement / model selection', inputs:'Clinical task · endpoint · workload · compute context', body:'Hold the clinical task, endpoint, validation context, workload, compute region, and comparison basis constant. Compare environmental burden only after the performance comparison is clinically meaningful.', refs:['kpodzro-haip-2026','doo-radiology-llm-2024']},
  {tier:'first', priority:'Recommended', mode:'Planning guidance', title:'Request lifecycle disclosure from the vendor', applies:'Vendor or externally developed AI', inputs:'Training energy · inference energy · hardware · hosting', body:'Ask for model/version identity, training hardware and energy when available, inference energy or throughput on the proposed hardware, deployment region, PUE or data-centre assumptions, and how updates change those values.', refs:['kpodzro-haip-2026','doo-jacr-2024']},
  {tier:'first', priority:'Recommended', mode:'CEDARS input', title:'Validate your deployment assumptions', applies:'All deployments', inputs:'Studies/month · calls/tokens · deployment period · inference energy', body:'Replace generic defaults with your expected study volume, calls/tokens, serving hardware, compute region, deployment period, and measured inference energy when available.', refs:['doo-jacr-cloud-2024','oviedo-inference-2025']},
  {tier:'first', priority:'Recommended', mode:'Planning guidance', title:'Ask for efficient deployment options', applies:'Vendor discussion / implementation', inputs:'Model tier · precision · batching/caching · hosting', body:'Ask whether the same validated product can use a smaller model tier, mixed precision, batching, caching, autoscaling, or lower-carbon hosting without changing the cleared or locally validated clinical behavior.', refs:['fernandez-llm-energy-2025','oviedo-inference-2025','hanafy-war-efficiencies-2023']},
  {tier:'govern', priority:'Guardrail', mode:'Planning guidance', title:'Do not trade away clinical fit for efficiency', applies:'Selection and local validation', inputs:'No automatic score change', body:'Environmental efficiency is a secondary decision dimension after intended use, safety, performance, local validation, integration, and workflow fit are acceptable for the clinical setting.', refs:['kpodzro-haip-2026']},
  {tier:'govern', priority:'Consider', mode:'Planning guidance', title:'Plan monitoring, updates, and demand growth', applies:'Contracts and post-deployment governance', inputs:'Workload · calls/tokens · hosting · model/version', body:'Document how model updates, hosting changes, additional agent calls, workflow expansion, or increased use will be communicated so the environmental record can be refreshed rather than treated as permanently fixed.', refs:['kpodzro-haip-2026','oviedo-inference-2025','wright-efficiency-not-enough-2023']},
];

import {
  MODALITY_MB, STORAGE_KWH_PER_TB_ONPREM, STORAGE_KWH_PER_TB_CLOUD, TIME_MULT, TIME_LABEL, EQUIPMENT_UNITS, DEFAULT_EQUIPMENT, buildFleet, INTERVENTIONS, CLOUD, WATER_PER_KWH, EMBODIED_KG_MO, PATIENT_KM_RT, CAR_CO2_KG_KM, PAPER_G_PER_ENC, HAZ_WASTE_G_SCAN, CONTRAST, ICM_MODALITIES, IMAGING_MODALITIES, rnd, computeClinicalScannerSavings, computeUtilizationAdjustedEnergy, computeDashboard, SCANNER_STATE_INTERVENTIONS, CLOUD_INTERVENTIONS, STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER, STORAGE_INTERVENTIONS, computeInterventions,
} from './model.js';




// Realistic department archetypes — a quick-start starting fleet; every count stays editable.
// Illustrative sizes, not authoritative. Only non-zero devices listed; the rest reset to 0 on apply.
const DEPARTMENT_PRESETS = [
  {key:'community',  label:'Community hospital',  desc:'Small general hospital',            equipment:{mri_15t:1, ct:1, xray:2, ultrasound:2, mammography:1, pacs:1, workstations:6}},
  {key:'regional',   label:'Regional hospital',   desc:'Mid-size hospital with IR',         equipment:{mri_15t:1, mri_3t:1, ct:2, fluoro:1, angio:1, xray:3, ultrasound:3, mammography:1, pacs:1, workstations:12}},
  {key:'academic',   label:'Academic center',     desc:'Large academic medical center',     equipment:{mri_15t:2, mri_3t:2, mri_7t:1, ct:4, petct:1, angio:2, fluoro:2, xray:5, ultrasound:6, mammography:2, pacs:2, workstations:30}},
  {key:'outpatient', label:'Outpatient imaging',  desc:'Outpatient / ambulatory centre',    equipment:{mri_15t:1, ct:1, xray:2, ultrasound:3, mammography:1, pacs:1, workstations:6}},
  {key:'telerad',    label:'Teleradiology hub',   desc:'Reading / informatics — no scanners', equipment:{pacs:2, workstations:15}},
];

// Estimated FTE per device — illustrative expert estimate, not a literature-sourced figure
// (one exception: `angio`, partially corroborated by RCR Census 2023's 1:6 IR consultant rota
// recommendation for a 24/7 service). Corrected 2026-08: no per-device-unit whole-department FTE
// benchmark exists in the published literature (checked directly against the UK RCR workforce
// census, NHS DID, and a dedicated radiographer-staffing methodology paper) — see sources.md
// "Staff count estimation from device fleet" for the full research trail. Replace with your own
// department's HR/rostering data.
// Imaging devices include technologists, radiologist share, nursing/admin; PACS = IT; workstations = reading radiologists.
const STAFF_PER_DEVICE = {mri_035t:4, mri_15t:5, mri_3t:5, mri_7t:6, ct:4, petct:5, angio:6, fluoro:3, xray:3, ultrasound:2, mammography:2, pacs:2, workstations:1};


// MRI cards rendered as a separate grouped section; other cards below.
// Equipment card tooltips — cite primary source for each modality's power/energy assumptions.
const MRI_035T_TOOLTIP  = 'Permanent magnet; no cryocooler, so idle ≈ off. Active 6 kW estimated from low-field data in EurRad 2024 (doi:10.1007/s00330-024-11056-0) and Chaban et al. JMRI 2023 (doi:10.1002/jmri.28994). Projected ~18 MWh/yr — far lower than superconducting systems.';
const MRI_15T_TOOLTIP   = 'Superconducting: idle 15 kW and off 10 kW from direct power-meter measurements across 4 real scanners, 3 vendors (Woolen et al. Radiology 2023, doi:10.1148/radiol.230441, Table 1: idle 10-15 kW, off 7-10 kW). The cryocooler cannot fully stop without risking magnet quench (helium boil-off), so "off" still draws substantial power — but idle never exceeds active/scan power in any real scanner Woolen measured. Active 22 kW: Chaban et al. JMRI 2023 (doi:10.1002/jmri.28994), EurRad 2024 (doi:10.1007/s00330-024-11056-0). Off-hours ≈390/month (52% of total) from Heye et al. 2020, via Chaban et al. 2024 JMRI review Table 1: off 107-147 kWh/day ÷ 10 kW off_kw. Projected ~116 MWh/yr.';
const MRI_3T_TOOLTIP    = 'Active 30 kW from measured mean of 3T scanners: Chaban et al. JMRI 2023 (doi:10.1002/jmri.28994). Idle 15 kW and off 10 kW: direct power-meter data across 4 real scanners (Woolen et al. Radiology 2023, doi:10.1148/radiol.230441, Table 1: idle 10-15 kW, off 7-10 kW) — the cryocooler cannot fully stop without risking quench, so off draws substantially more than a simple "powered down" assumption. Standby 5 kW: cryocooler minimum (Herrmann 2012). Off-hours ≈390/month (52% of total) from Heye et al. 2020, via Chaban et al. 2024 JMRI review Table 1. Projected ~129 MWh/yr. Replace with scanner logs if available.';
const MRI_7T_TOOLTIP    = 'No published sustainability benchmark specific to 7T. Active 45 kW and idle 22 kW extrapolated from high-field MRI data in Neurad 2024 (doi:10.1016/j.neurad.2023.12.001) and EurRad 2024 (doi:10.1007/s00330-024-11056-0). Off 16.5 kW — cryocooler continues running even "off" (Woolen et al. Radiology 2023, doi:10.1148/radiol.230441). Treat as estimate; replace with vendor TDP.';
const CT_TOOLTIP        = 'Active 3 kW ("System ON" state, measured on a real 128-slice CT), idle 2.6 kW, off 0.5 kW (shutdown). Active/off from CJRS 2022 (doi:10.1177/08465371221133074); idle raised from CJRS-2022\'s own 1.5 kW ("Computer ON") after four independent real-world sources — Heye et al. 2020 (real 3-CT-scanner year), a 2025 multi-study review (18,520-33,580 kWh/yr real range), Carver et al. 2026, and an IR-suite plug-load audit — converged on CT idle draw being higher than that single reading, while staying below active_kw so idle never exceeds active (no real scanner shows that pattern). Corrected 2026-08 — the prior 60 kW default cited CJRS-2022 (and Acra-2024) for "40-80 kW active," but neither paper reports anything near that; 60 kW was very likely a peak X-ray-exposure spec misapplied as a sustained active-hours average. active_kw is still from overnight/non-operational measurements, so it may understate true high-throughput daytime draw — enter scanner logs if available.';
const PETCT_TOOLTIP     = 'Active 22 kW calibrated to ~68,050 kWh/yr, within the Vosshenrich et al. Curr Opin Urol 2025 benchmark range (doi:10.1097/MOU.0000000000001337). Off-hours corrected 2026-08: Hernandez et al. 2026 (doi:10.1148/radiol.253128) found a real PET-CT is kept idle overnight rather than fully off (~12h recalibration cost) — off_h reduced accordingly. Cyclotron energy for isotope production is external and not included here. Embodied carbon ~278 kgCO₂/month.';
const ANGIO_TOOLTIP     = 'Direct power-sensor measurements on an IR suite (Artis pheno). Idle 6.9 kW, active 7.5 kW, off 1.1 kW; annual ~25,525 kWh. For biplane INR suites idle is ~7.4 kW; cath labs ~4.5 kW. Chiller not included. (Vosshenrich et al. AJR 2024, doi:10.2214/AJR.24.30988)';
const FLUORO_TOOLTIP    = 'Direct power-sensor measurements on a multipurpose fluoroscopy unit (Artis zee). Idle 2.8 kW, active 3.1 kW; annual ~11,439 kWh. 96% of energy is nonproductive — powering down overnight is the dominant savings lever. (Vosshenrich et al. AJR 2024, doi:10.2214/AJR.24.30988)';
const XRAY_TOOLTIP      = 'Active 12 kW estimated from AJR 2025 CT/radiography energy review (doi:10.2214/AJR.25.33951) and AJR 2023 (doi:10.2214/AJR.23.30189). Idle substantially lower than CT due to absence of high-power x-ray tube standby. High throughput (2,500+ scans/month) gives low per-scan footprint.';
const ULTRASOUND_TOOLTIP= 'Active draw ~1.5 kW — lowest energy imaging modality by a large margin. References: EUF 2023 systematic review (doi:10.1016/j.euf.2023.09.009), Vosshenrich et al. Curr Opin Urol 2024 (doi:10.1097/MOU.0000000000001337). High scan volumes give lowest kWh/scan across all modalities.';
const MAMMO_TOOLTIP     = 'Corrected 2026-08: Rossini et al. 2026 (doi:10.1007/s00330-026-12373-2), minute-by-minute power monitoring on 3 real mammography units, reports ~1,660-2,300 kWh/yr per machine — mammography’s x-ray exposure is brief and low-power (net energy just 0.05-0.09 kWh/exam), so power draw here is dominated by idle/standby baseload, not active scanning. Screening programmes have seasonal throughput variation — adjust scans accordingly.';
const PACS_TOOLTIP      = 'Server/PACS infrastructure draws near-constant power in all states (4 kW baseline per rack/server set). Coarse estimate from general data-center literature (a fully-populated 42U rack typically draws 3-5 kW) — no dedicated medical-PACS power study found. Virtualisation and server consolidation can reduce this by 20–40% (Doo 2024, doi:10.1148/radiol.232030).';
const WS_TOOLTIP        = 'Active 117.4 W, standby 54.2 W, off 18.2 W per workstation — direct power measurements (3 workstations, 6-month routine-use period) from Büttner et al. 2021 (Eur J Radiol Open, doi:10.1016/j.ejro.2020.100320), "Switching off for future." Büttner\'s model doesn\'t distinguish idle from powered-on, so idle = active here. A 4-workstation department uses ~3.3 MWh/yr; screen-saver and end-of-day shutdown policies capture most of the avoidable idle energy. Count shared reading stations only.';

const MRI_CARDS = [
  {key:'mri_035t', label:'MRI 0.35T', sublabel:'Low-field / permanent magnet', Icon:Brain, tooltip:MRI_035T_TOOLTIP},
  {key:'mri_15t',  label:'MRI 1.5T',  sublabel:'Superconducting (high off-draw)', Icon:Brain, tooltip:MRI_15T_TOOLTIP},
  {key:'mri_3t',   label:'MRI 3T',    sublabel:'State-of-the-art',              Icon:Brain, tooltip:MRI_3T_TOOLTIP},
  {key:'mri_7t',   label:'MRI 7T',    sublabel:'Research scanner',              Icon:Brain, tooltip:MRI_7T_TOOLTIP},
];
// AI tool presets — GPU/hours defaults from literature benchmarks.
// Classification/segmentation: typical clinical deployment GPU (Doo 2024, Kocak 2025).
// LLM: A100-class cloud GPU for report generation (LLM-Energy PDF, Radiology 2024).
// Reconstruction: on-site low-latency inference (Radiol 2023, doi:10.1148/radiol.230441).
const AI_PRESETS = [
  {key:'cad',   label:'Classification / triage', Icon:Target,  gpu:'NVIDIA RTX A6000',       hoursPerDay:'6',  numGpus:'1', deployment:'Local compute', sublabel:'Findings classification / triage',
   tooltip:'RTX A6000 (300 W TDP) — typical dedicated workstation GPU for on-site classification/triage inference. 6 h/day reflects active clinical hours for real-time triage of incoming studies. Local deployment for low-latency PACS integration. Sources: Doo et al. Radiology 2024 (doi:10.1148/radiol.232030); Kocak et al. Insights Imaging 2025 (doi:10.1186/s13244-025-01962-2); NVIDIA DC Specs.'},
  {key:'llm',   label:'Report generation',     Icon:Brain,     gpu:'NVIDIA A100 (40GB PCIe)',hoursPerDay:'8',  numGpus:'1', deployment:'AWS',           sublabel:'LLM / VLM report drafting',
   tooltip:'A100 40 GB PCIe (250 W TDP) — sufficient VRAM for medical LLM inference without full SXM power draw. 8 h/day = active clinical day. AWS reflects common cloud hosting of large language models for scalability and model update flexibility. Sources: Doo et al. Radiology 2024 (doi:10.1148/radiol.240320, LLM energy scaling); Kocak et al. Insights Imaging 2025 (doi:10.1186/s13244-025-01962-2).'},
  {key:'recon', label:'Reconstruction / denoising', Icon:Cpu,  gpu:'NVIDIA RTX A6000',       hoursPerDay:'12', numGpus:'1', deployment:'Local compute', sublabel:'MR/CT deep-learning recon',
   tooltip:'RTX A6000 (300 W TDP) for inline MR/CT reconstruction (denoising, acceleration, or synthetic imaging). 12 h/day accounts for reconstruction running during scanning hours plus overnight batch jobs. Local deployment required for low-latency integration with scanner console. Sources: Radiol 2023 (doi:10.1148/radiol.230441); Doo 2024 (doi:10.1148/radiol.232030).'},
  {key:'seg',   label:'Segmentation',          Icon:BarChart3, gpu:'NVIDIA T4',              hoursPerDay:'4',  numGpus:'1', deployment:'Local compute', sublabel:'Organ / lesion U-Net',
   tooltip:'NVIDIA T4 (70 W TDP) — energy-efficient inference GPU well-matched to U-Net segmentation models. 4 h/day for scheduled batch processing (often overnight or off-peak). Local deployment for data-privacy compliance. T4 TDP significantly lower than data-centre GPUs — a good default for lightweight segmentation. Sources: Kocak et al. Insights Imaging 2025 (doi:10.1186/s13244-025-01962-2); Doo 2024 (doi:10.1148/radiol.232030); NVIDIA DC Specs.'},
  {key:'custom',label:'Custom',                Icon:Plus,      gpu:'NVIDIA A100 (80GB SXM4)',hoursPerDay:'8',  numGpus:'1', deployment:'Local compute', sublabel:'Set all parameters manually',
   tooltip:null},
];

const OTHER_CARDS = [
  {key:'ct',          label:'CT',              Icon:Activity, tooltip:CT_TOOLTIP},
  {key:'petct',       label:'PET-CT',          Icon:Cpu,      tooltip:PETCT_TOOLTIP},
  {key:'angio',       label:'Angio / IR Suite',Icon:Heart,    sublabel:'Interventional suite',   tooltip:ANGIO_TOOLTIP},
  {key:'fluoro',      label:'Fluoroscopy',     Icon:Scan,     sublabel:'Diagnostic / basic IR',  tooltip:FLUORO_TOOLTIP},
  {key:'xray',        label:'Radiography',           Icon:Zap,      tooltip:XRAY_TOOLTIP},
  {key:'ultrasound',  label:'Ultrasound',      Icon:Droplets, tooltip:ULTRASOUND_TOOLTIP},
  {key:'mammography', label:'Mammography',     Icon:Target,   tooltip:MAMMO_TOOLTIP},
  {key:'pacs',        label:'PACS/Servers',    Icon:Server,   tooltip:PACS_TOOLTIP},
  {key:'workstations',label:'Workstations',    Icon:Monitor,  tooltip:WS_TOOLTIP},
];

const EQUIPMENT_BASE = buildFleet(DEFAULT_EQUIPMENT);



// GPU TDP reference for eco-label energy estimation.
// Sources: NVIDIA product datasheets; AWS/GCP GPU instance specs.
// Researchers should prefer measured energy (CodeCarbon, nvidia-smi) over these estimates.
const GPU_PRESETS = {
  "NVIDIA H100 (80GB SXM5)":  {tdpKw: 0.700},
  "NVIDIA A100 (80GB SXM4)":  {tdpKw: 0.400},
  "NVIDIA A100 (40GB PCIe)":  {tdpKw: 0.250},
  "NVIDIA V100 (32GB SXM2)":  {tdpKw: 0.300},
  "NVIDIA RTX 4090":           {tdpKw: 0.450},
  "NVIDIA RTX 3090":           {tdpKw: 0.350},
  "NVIDIA T4":                 {tdpKw: 0.070},
  "NVIDIA RTX A6000":          {tdpKw: 0.300},
  "AMD MI250X":                {tdpKw: 0.500},
  "Custom (enter TDP below)":  {tdpKw: 0.000},
};

// The AI Research EcoLabel is a view of the single AI model record (`scen`); see ailabel.js.
// Task-type shown on the label when the record has none of its own: derived from the library entry.
const LIB_TASK = {cad:'Classification', detect:'Detection', seg2d:'Segmentation', seg3d:'Segmentation', recon:'Reconstruction',
  synth:'Image synthesis', report:'Report generation', agentic:'Agentic workflow', foundation:'Segmentation', custom:'Other'};

// ── Cloud carbon tracking data ────────────────────────────────────────────────
// Per-region carbon intensity (kgCO₂e/kWh) and provider PUE.
// Sources: Cloud Carbon Footprint methodology (cloudcarbonfootprint.org);
// Electricity Maps 2023 annual averages; AWS/Azure/GCP sustainability reports 2022–2023.
// CI values are grid annual averages — real-time and location-matched values improve accuracy.
const CLOUD_REGIONS = {
  AWS: {
    label: 'Amazon Web Services', pue: 1.15,
    regions: {
      'eu-north-1 (Stockholm, SE)':     0.013,
      'eu-west-3 (Paris, FR)':          0.056,
      'us-west-2 (Oregon, US)':         0.109,
      'ca-central-1 (Canada)':          0.120,
      'eu-west-2 (London, UK)':         0.193,
      'eu-west-1 (Ireland)':            0.278,
      'eu-central-1 (Frankfurt, DE)':   0.338,
      'us-east-1 (N. Virginia, US)':    0.379,
      'us-east-2 (Ohio, US)':           0.410,
      'ap-southeast-1 (Singapore)':     0.408,
      'ap-northeast-1 (Tokyo, JP)':     0.506,
      'ap-southeast-2 (Sydney, AU)':    0.790,
    },
  },
  Azure: {
    label: 'Microsoft Azure', pue: 1.15,
    regions: {
      'swedencentral (Sweden)':         0.013,
      'francecentral (France)':         0.056,
      'westus2 (West US 2)':            0.109,
      'uksouth (UK South)':             0.193,
      'northeurope (Ireland)':          0.278,
      'germanywestcentral (Germany)':   0.338,
      'westeurope (Netherlands)':       0.390,
      'eastus (East US)':               0.379,
      'southeastasia (Singapore)':      0.408,
      'japaneast (Japan)':              0.506,
      'australiaeast (Australia)':      0.790,
    },
  },
  'Google Cloud': {
    label: 'Google Cloud Platform', pue: 1.10,
    regions: {
      'europe-north1 (Finland)':        0.067,
      'us-west1 (Oregon, US)':          0.075,
      'europe-west6 (Zürich, CH)':      0.095,
      'europe-west1 (Belgium)':         0.167,
      'europe-west4 (Netherlands)':     0.390,
      'us-east1 (S. Carolina, US)':     0.423,
      'us-central1 (Iowa, US)':         0.484,
      'asia-northeast1 (Tokyo, JP)':    0.506,
      'asia-east1 (Taiwan)':            0.541,
      'australia-southeast1 (Sydney)':  0.790,
    },
  },
  'Local compute': {
    label: 'Local / on-premise', pue: 1.50,
    regions: {
      'On-premise (Switzerland)':       0.100,
      'On-premise (France)':            0.056,
      'On-premise (Germany)':           0.360,
      'On-premise (UK)':                0.193,
      'On-premise (US average)':        0.380,
      'On-premise (global average)':    0.473,
    },
  },
};

// Instance power draw (watts) including CPU, GPU, memory, storage I/O at typical utilisation.
// GPU instances: 100% GPU utilisation assumed (training/inference).
// CPU instances: 50% average utilisation (Masanet 2020 Science).
// Sources: SPEC Power database; AWS/GCP/Azure instance specs; Cloud Carbon Footprint.
const CLOUD_INSTANCES = {
  'GPU: NVIDIA T4 (g4dn.xlarge / n1-std-4+T4)':         {watt: 170,  category: 'gpu', desc: 'Inference, lightweight training. Common in medical AI deployment.'},
  'GPU: NVIDIA A10G (g5.xlarge / NC A10 v5)':             {watt: 300,  category: 'gpu', desc: 'Efficient training & inference. Good energy-per-accuracy balance.'},
  'GPU: NVIDIA V100 16GB (p3.2xlarge / NCv3-6)':          {watt: 500,  category: 'gpu', desc: 'Research training. Widely used in published medical AI literature.'},
  'GPU: NVIDIA A100 40GB (a2-highgpu-1g / ND A100 v4)':  {watt: 500,  category: 'gpu', desc: 'High-performance training. Common in MICCAI / Radiology AI papers.'},
  'GPU: NVIDIA A100 80GB ×8 (p4d.24xlarge)':             {watt: 4800, category: 'gpu', desc: 'Multi-GPU training node. 8× A100 SXM4. Large-scale experiments only.'},
  'GPU: NVIDIA H100 ×8 (p5.48xlarge)':                    {watt: 6400, category: 'gpu', desc: 'Highest-tier node. 8× H100 SXM5. Substantial carbon commitment.'},
  'CPU: Small (2–4 vCPU, 8–16 GB)':                      {watt: 30,   category: 'cpu', desc: 'DICOM router, lightweight API, scheduler.'},
  'CPU: Medium (8–16 vCPU, 32–64 GB)':                   {watt: 75,   category: 'cpu', desc: 'PACS backend, AI inference API, database server.'},
  'CPU: Large (32–64 vCPU, 128–256 GB)':                 {watt: 150,  category: 'cpu', desc: 'Heavy preprocessing, multi-model inference pipeline.'},
  'CPU: Memory-optimised (64+ vCPU, 512 GB+)':           {watt: 250,  category: 'cpu', desc: 'In-memory DICOM cache, large-scale analytics.'},
  'Custom (enter watts)':                                  {watt: 0,    category: 'custom', desc: 'Enter measured or vendor-specified TDP for your exact instance.'},
};

// Storage energy intensity in Wh per TB-hour.
// Sources: Masanet et al. 2020 (Science); Cloud Carbon Footprint methodology.
const STORAGE_WH_PER_TB_HR = {
  'SSD / NVMe (block storage)':       1.20,
  'HDD (object storage — S3 / Blob)': 0.65,
  'Archive / cold storage (Glacier)': 0.10,
};

const NETWORK_KWH_PER_GB = 0.001; // kWh/GB — fixed-line DC average (Aslan et al. 2018)

// ── AI architecture library ───────────────────────────────────────────────────
// trainFactor / inferFactor multiply base model energy by architecture complexity.
// Sources: LLM-Energy PDF; Clinical-AI PDF; Doo 2024 (10.1148/radiol.232030)
const AI_ARCHITECTURES = {
  "CNN / ResNet": {
    trainFactor: 1.0, inferFactor: 1.0,
    desc: "Convolutional network. Efficient for classification and detection. Standard radiology AI baseline.",
  },
  "U-Net (segmentation)": {
    trainFactor: 1.2, inferFactor: 1.15,
    desc: "Encoder-decoder for organ/lesion segmentation. Widely deployed in radiology AI workflows.",
  },
  "EfficientNet": {
    trainFactor: 0.85, inferFactor: 0.80,
    desc: "Compound-scaled CNN. Better accuracy per FLOP than ResNet. Recommended for energy-efficient deployment. (LLM-Energy PDF)",
  },
  "Vision Transformer (ViT)": {
    trainFactor: 1.8, inferFactor: 1.5,
    desc: "Attention-based transformer. Higher accuracy potential at significantly greater compute cost vs CNN.",
  },
  "Diffusion / Generative AI": {
    trainFactor: 3.5, inferFactor: 2.5,
    desc: "For image reconstruction, synthesis, and augmentation. Highest energy footprint per inference. Use AMP.",
  },
  "LLM / Agent (transformer)": {
    trainFactor: 4.0, inferFactor: 1.5,
    desc: "Large language / vision-language model, single-pass or agentic (multi-step). Inference energy is token-driven, not GPU-seconds — see the token parameters below.",
  },
};

// Annual modality energy benchmarks — reference values for comparison only (NOT used in the
// footprint calculation, which always uses the user's selected grid factor). Energy (kWh/yr) is the
// exact value reported by each source publication; the CO₂ column is normalised at render to a
// single common factor (BENCHMARK_CI) so the rows are directly comparable. The source publications
// themselves reported CO₂ at varying local grids (~0.20–0.24 kgCO₂e/kWh), which is why their
// original CO₂ figures are not directly comparable and are recomputed here.
// Source: Vosshenrich et al. (Implementation Guide); Chaban JMRI 2023 (10.1002/jmri.28994); Klein 2024
const MODALITY_BENCHMARKS = [
  {modality: "MRI 1.5T superconducting",   kwhYear: 116040, note: "Off-state >50% of total (Heye 2020/Chaban 2024). CEDARS EQUIPMENT_UNITS model (Woolen 2023)"},
  {modality: "MRI 3T (state-of-the-art)",  kwhYear: 128760, note: "Range 80 000–170 000 kWh/yr (Vosshenrich 2025). CEDARS EQUIPMENT_UNITS model (Woolen 2023)"},
  {modality: "MRI 0.35T permanent magnet", kwhYear: 16100,  note: "Lowest-field option. Klein 2024; 51% PV self-sufficiency achievable"},
  {modality: "CT scanner",                 kwhYear: 37800,  note: "Idle up to 66% of total (Schoen et al.)"},
  {modality: "PET-CT",                     kwhYear: 68050,  note: "Range 56 700–75 600 kWh/yr; idle 1.5–2× CT. CEDARS EQUIPMENT_UNITS model (Hernandez 2026)"},
  {modality: "Ultrasound",                 kwhYear: 2500,   note: "Lowest-energy modality; consider as alternative to CT/MRI"},
  {modality: "PC workstations (×10)",      kwhYear: 27500,  note: "Walters: auto-off saves 17 MWh/yr per 88 units = 3.4 tCO₂e"},
];
// Single normalisation factor for the benchmark CO₂ column (global-average grid) — reuses the same
// global-average constant as the rest of CEDARS so the value can never drift. CO₂ is derived, not
// stored, so it stays internally consistent.
const BENCHMARK_CI = CARBON_INTENSITY['Global average']; // 0.473 kgCO₂e/kWh

// ── AI model library ─────────────────────────────────────────────────────────
// GPU power, inference latency, and training energy from LLM-Energy PDF and Doo 2024.
// Clinical benefit estimates from sources: scan time reduction (Radiol 2023 10.1148/radiol.230441),
// low-value imaging reduction McKee 2024 (10.1148/radiol.240219), ESR PP 2025.
// Embodied GPU CO₂ from ESR PP 2025 / Clinical-AI PDF.
// Task-family model library. Each entry is an editable, literature-anchored starting point
// spanning the real space of radiology AI. Energy drivers (params, dim, resolution, inferSec,
// gpuKw, trainMwh) are physically grounded; performance fields (accuracyPct, accuracyMetric,
// scanTimeReductPct, lowValueReductPct) are the model's REPORTED values from the cited
// reference — CEDARS never predicts accuracy, it only records what the user enters.
// LLM / agentic entries carry unit:'tokens' — their inference energy is token-driven
// (callsPerTask × tokensPerCall × whPer1kTokens), NOT GPU-seconds. See sources.md.
const AI_MODEL_LIBRARY = [
  {key:'cad',        label:'Classification / triage',          Icon:Target,   reference:'CheXNet (DenseNet-121)',          refCite:'Rajpurkar 2017, arXiv:1711.05225',
   architecture:'CNN / ResNet',                dim:'2D', resolution:224,  slices:1,   paramsM:8,    inferSec:0.4, gpuKw:0.07, trainMwh:0.05, embCo2Kg:40,  accuracyPct:84, accuracyMetric:'AUC',         scanTimeReductPct:0,  lowValueReductPct:12},
  {key:'detect',     label:'Lesion / nodule detection',        Icon:Scan,     reference:'RetinaNet-style detector',        refCite:'Lin 2017 (focal loss); task-specific',
   architecture:'CNN / ResNet',                dim:'2D', resolution:512,  slices:1,   paramsM:35,   inferSec:0.8, gpuKw:0.15, trainMwh:0.2,  embCo2Kg:60,  accuracyPct:90, accuracyMetric:'Sensitivity', scanTimeReductPct:0,  lowValueReductPct:8},
  {key:'seg2d',      label:'Organ segmentation (2D)',          Icon:Brain,    reference:'U-Net',                           refCite:'Ronneberger 2015, MICCAI',
   architecture:'U-Net (segmentation)',        dim:'2D', resolution:256,  slices:1,   paramsM:30,   inferSec:0.6, gpuKw:0.12, trainMwh:0.15, embCo2Kg:60,  accuracyPct:91, accuracyMetric:'Dice',        scanTimeReductPct:0,  lowValueReductPct:0},
  {key:'seg3d',      label:'Volumetric segmentation (3D / nnU-Net)', Icon:Cpu, reference:'nnU-Net',                       refCite:'Isensee 2021, Nat Methods',
   architecture:'U-Net (segmentation)',        dim:'3D', resolution:128,  slices:128, paramsM:30,   inferSec:8,   gpuKw:0.25, trainMwh:2,    embCo2Kg:100, accuracyPct:88, accuracyMetric:'Dice',        scanTimeReductPct:0,  lowValueReductPct:0},
  {key:'recon',      label:'Reconstruction / denoising',       Icon:Activity, reference:'DL recon (low-dose CT / fast MRI)', refCite:'Radiology 2023, 10.1148/radiol.230441',
   architecture:'CNN / ResNet',                dim:'2D', resolution:256,  slices:1,   paramsM:10,   inferSec:1.2, gpuKw:0.2,  trainMwh:0.5,  embCo2Kg:80,  accuracyPct:95, accuracyMetric:'SSIM',        scanTimeReductPct:50, lowValueReductPct:0},
  {key:'synth',      label:'Image synthesis (diffusion)',      Icon:Zap,      reference:'Diffusion model (e.g. MRI→CT)',   refCite:'Kazerouni 2023, Med Image Anal',
   architecture:'Diffusion / Generative AI',   dim:'2D', resolution:256,  slices:1,   paramsM:120,  inferSec:6,   gpuKw:0.3,  trainMwh:8,    embCo2Kg:150, accuracyPct:90, accuracyMetric:'SSIM',        scanTimeReductPct:0,  lowValueReductPct:0},
  {key:'report',     label:'Report generation (LLM / VLM)',    Icon:FileText, reference:'Radiology report-generation LLM', refCite:'Doo 2024, Radiology 10.1148/radiol.240320',
   architecture:'LLM / Agent (transformer)',   dim:'2D', resolution:512,  slices:1,   paramsM:7000, inferSec:12,  gpuKw:0.35, trainMwh:50,   embCo2Kg:200, accuracyPct:70, accuracyMetric:'RadGraph F1', scanTimeReductPct:0,  lowValueReductPct:5,
   unit:'tokens', whPer1kTokens:0.4, callsPerTask:1,  tokensPerCall:2500},
  {key:'agentic',    label:'Agentic workflow (LLM orchestration)', Icon:Bot, reference:'Multi-step LLM agent (planning · retrieval · tool use · self-critique)', refCite:'illustrative token-based estimate; see sources.md',
   architecture:'LLM / Agent (transformer)',   dim:'2D', resolution:512,  slices:1,   paramsM:70000, inferSec:12, gpuKw:0.4,  trainMwh:0,    embCo2Kg:200, accuracyPct:0,  accuracyMetric:'—',           scanTimeReductPct:0,  lowValueReductPct:5,
   unit:'tokens', whPer1kTokens:0.4, callsPerTask:10, tokensPerCall:4000},
  {key:'foundation', label:'Foundation / prompt model (MedSAM)', Icon:Globe,  reference:'MedSAM (Segment Anything, medical)', refCite:'Ma 2024, Nat Commun',
   architecture:'Vision Transformer (ViT)',    dim:'2D', resolution:1024, slices:1,   paramsM:90,   inferSec:3,   gpuKw:0.3,  trainMwh:5,    embCo2Kg:150, accuracyPct:89, accuracyMetric:'Dice',        scanTimeReductPct:0,  lowValueReductPct:0},
  {key:'custom',     label:'Custom / blank',                   Icon:Cpu,      reference:'User-defined',                    refCite:'—',
   architecture:'CNN / ResNet',                dim:'2D', resolution:256,  slices:1,   paramsM:25,   inferSec:1,   gpuKw:0.15, trainMwh:0.5,  embCo2Kg:60,  accuracyPct:90, accuracyMetric:'AUC',         scanTimeReductPct:0,  lowValueReductPct:0},
];
const AI_MODEL_BY_KEY = Object.fromEntries(AI_MODEL_LIBRARY.map(m => [m.key, m]));
// Derived size label from parameter count (informational only — not an energy driver).
function sizeLabel(paramsM) {
  const p = parseFloat(paramsM) || 0;
  if (p < 100)  return 'Small (< 100M params)';
  if (p < 1000) return 'Medium (100M–1B params)';
  return 'Large (> 1B params)';
}
// Automatic Mixed Precision (AMP) reduces inference energy ~40% (float32→float16)
// Source: LLM-Energy PDF; Clinical-AI PDF
const PRECISION_FACTOR = {
  "float32 (standard)":   1.0,
  "float16 / AMP":        0.6,
};

// ── Resource & scope constants ────────────────────────────────────────────────



const NET_KWH_PER_GB   = 0.001; // kWh/GB fixed-line data-centre average (Aslan et al. 2018)
const STAFF_DAYS_PER_MO = 22;  // standard working days per month
const AVG_STUDY_GB     = 0.3;  // weighted avg DICOM study: MRI ~1 GB, CT ~0.5 GB, Radiography ~0.05 GB


const META = {
  profiles:       ["Hospital radiology", "Outpatient imaging center", "Research imaging lab", "Teleradiology / informatics-heavy workflow"],
  intendedUses:   ["Estimate annual footprint", "Compare modalities", "Track monthly sustainability KPIs", "Evaluate AI tool impact", "Estimate savings from an intervention"],
  regions:        Object.keys(CARBON_INTENSITY),
  metricTypes:    ["Energy", "Carbon", "Water", "AI net impact"],
  timePeriods:    Object.keys(TIME_MULT),
  interventions:  Object.keys(INTERVENTIONS),
  cloudProviders: Object.keys(CLOUD),
  scannerStates:  ["Active", "Idle", "Standby", "Off"],
  aiModels:       AI_MODEL_LIBRARY.map(m => m.label),
  precisions:     Object.keys(PRECISION_FACTOR),
  architectures:  Object.keys(AI_ARCHITECTURES),
  gpuModels:      Object.keys(GPU_PRESETS),
  taskTypes:      ["Classification", "Segmentation", "Detection", "Reconstruction", "Image synthesis", "Report generation", "Agentic workflow", "Triage", "Other"],
};





// `model` is the effective spec built from the library entry + the user's edits:
// {gpuKw, inferSec, trainMwh, embCo2Kg, paramsM, dim, resolution, slices,
//  accuracy (0–1), accuracyMetric, scanTimeReductPct, lowValueReductPct}.
function computeAI(cloudProvider, region, model, precision, architecture, customCi, equipment, overrides = {}, equipOverrides = {}) {
  // Training and inference can occur in different facilities. Legacy records leave the split
  // fields blank and therefore inherit the historical shared provider/region/PUE/renewable context.
  const resolveContext = (provider, computeRegion, pueOverride, renewableOverride) => {
    const p = provider || cloudProvider || 'Local compute';
    const base = CLOUD[p] ?? CLOUD['Local compute'];
    const regions = CLOUD_REGIONS[p];
    const regionCi = (regions && computeRegion) ? regions.regions[computeRegion] : undefined;
    const pueValue = parseFloat(pueOverride);
    const renewable = Math.min(100, Math.max(0, parseFloat(renewableOverride) || 0));
    const rawCi = regionCi != null ? regionCi : base.ci;
    return {provider:p, region:computeRegion || '', pue:pueValue > 0 ? pueValue : (regions?.pue ?? base.pue), rawCi, ci:rnd(rawCi * (1 - renewable / 100), 4), renewablePct:renewable};
  };
  const trainCf = resolveContext(overrides.trainingProvider || cloudProvider, overrides.trainingRegion || overrides.cloudRegion, overrides.trainingPue || overrides.customPue, overrides.trainingRenewablePct || overrides.renewablePct);
  const inferCf = resolveContext(overrides.inferenceProvider || cloudProvider, overrides.inferenceRegion || overrides.cloudRegion, overrides.inferencePue || overrides.customPue, overrides.inferenceRenewablePct || overrides.renewablePct);
  const ci    = getCI(region, customCi);
  const arch  = AI_ARCHITECTURES[architecture] ?? AI_ARCHITECTURES["CNN / ResNet"];
  const ampF  = PRECISION_FACTOR[precision]    ?? 1.0;
  // Token-based inference for LLM / agentic models — energy is driven by tokens processed,
  // not GPU-seconds. tokens/study = calls per task × tokens per call. Wh/1k-token intensity
  // is a model-tier default (see sources.md). kWh = tokens/1000 × Wh_per_1k ÷ 1000 × PUE.
  const isToken       = model.unit === 'tokens';
  const callsPerTask  = Math.max(1, model.callsPerTask  || 1);
  const tokensPerCall = Math.max(0, model.tokensPerCall || 0);
  const tokensPerStudy = isToken ? rnd(callsPerTask * tokensPerCall, 0) : 0;
  const tokenKwhPerStudy = tokensPerStudy / 1000 * (model.whPer1kTokens || 0) / 1000; // pre-PUE kWh/study
  const DEPLOY_MO    = Math.max(1,  parseInt(overrides.deployMonths) || 36);
  const TEST_STUDIES = Math.max(1,  parseInt(overrides.testStudies)  || 500);
  const trainKwhCustom = overrides.trainKwh && parseFloat(overrides.trainKwh) > 0
    ? parseFloat(overrides.trainKwh)
    : null;
  const trainMwhBase = !trainKwhCustom
    ? model.trainMwh
    : null;
  // Derive scan volume and per-scan energy from the user's equipment fleet (respecting any
  // measured-data equipment overrides, so AI energy-per-scan stays consistent with the
  // Department dashboard rather than silently reverting to literature defaults).
  const profileDash  = computeDashboard(region, 'Monthly', equipment, customCi, {}, {}, equipOverrides);
  const STUDIES      = profileDash.clinicalBasis?.imagingScans ?? profileDash.scopes.imagingScans;
  const SCANNER_ACTIVE_KWH = profileDash.clinicalBasis?.scannerActiveKwh || 0;

  // ── Phase 1: Training  // ── Phase 1: Training ────────────────────────────────────────────────────
  // trainKwhCustom: GPU-derived energy (tdpKw × n × hours × PUE) — arch factor already baked in.
  // Default: literature estimate scaled by architecture and model size (arch.trainFactor).
  // Default training estimate scales with model size × input elements vs the library reference,
  // consistent with inference (Green AI). Unedited library configs have ratio 1 → unchanged.
  const trainSizeRatio = model.trainSizeRatio || 1;
  // Rounded to 2 decimals, not 0 — a small GPU-hours-measured job (e.g. 1.66 kWh, this session's
  // reported bug) was rounding to the nearest WHOLE kWh here, silently discarding ~20% of the
  // value and disagreeing with every other display of the same number (which all use 2 decimals).
  const trainKwhTotal = trainKwhCustom !== null
    ? rnd(trainKwhCustom, 2)
    : rnd(trainMwhBase * 1000 * arch.trainFactor * trainSizeRatio, 2);
  // Size-normalised reference — the SAME formula as the default estimate above, computed
  // unconditionally (unlike trainMwhBase, which is nulled out once a measured value is given).
  // Lets a measured training run be compared against "what's typical for a model this size and
  // architecture" rather than an absolute kWh/kgCO2e scale, which would otherwise penalise large
  // or capable models just for being large (see sources.md, CEDARS Score & leaf rating methodology).
  const trainKwhReference    = rnd(model.trainMwh * 1000 * arch.trainFactor * trainSizeRatio, 2);
  const trainVsReferenceRatio = trainKwhReference > 0 ? rnd(trainKwhTotal / trainKwhReference, 2) : null;
  const trainKgCo2e    = rnd(trainKwhTotal * trainCf.ci, 1);
  // "Estimated GPU compute time": when the user has told us the actual Hours × #GPUs directly
  // (the measured path), echo that back exactly — no PUE factor, since PUE scales facility
  // energy overhead, not wall-clock GPU runtime. Only fall back to back-solving hours from
  // energy ÷ power (which DOES need a GPU-power assumption, preferring the selected training
  // GPU's TDP over the template's own inference-anchored gpuKw) when Hours wasn't given at all.
  const trainGpuKw     = parseFloat(overrides.trainGpuKw) > 0 ? parseFloat(overrides.trainGpuKw) : model.gpuKw;
  const trainGpuHours  = overrides.trainGpuHoursMeasured != null
    ? overrides.trainGpuHoursMeasured
    : rnd(trainKwhTotal / trainGpuKw, 0); // estimated GPU compute time
  const trainKwhMonth  = rnd(trainKwhTotal / DEPLOY_MO, 2);   // amortised over deployment

  // A measured inference kWh/study fully overrides BOTH the testing total and the per-study
  // deployment figure below — the single source of truth for "what does one inference actually
  // cost," bypassing model.inferSec × gpuKw × PUE entirely (that formula assumes 100% GPU
  // utilisation for the full inferSec duration, which overstates energy whenever inferSec is a
  // wall-clock/end-to-end latency figure rather than pure GPU-active compute time — see sources.md).
  const inferKwhCustom = overrides.inferKwh && parseFloat(overrides.inferKwh) > 0
    ? parseFloat(overrides.inferKwh)
    : null;

  // ── Phase 2: Testing / Validation ────────────────────────────────────────
  // One-time inference run over hold-out test set.
  // Proxy: DLP/CTDIvol dose metrics correlate with net scan energy R²=0.87–0.92 (Schoen et al.)
  const testKwhTotal   = isToken
    ? rnd(tokenKwhPerStudy * TEST_STUDIES * inferCf.pue * ampF, 4)
    : inferKwhCustom !== null
      ? rnd(inferKwhCustom * TEST_STUDIES, 4)
      : rnd(model.gpuKw * arch.inferFactor * (model.inferSec / 3600) * TEST_STUDIES * inferCf.pue * ampF, 4);
  const testKgCo2e     = rnd(testKwhTotal * inferCf.ci, 4);

  // ── Phase 3: Inference & Deployment ─────────────────────────────────────
  // Inference energy per study; scales with every request — dominant lifetime cost.
  // MRI cooling adds +45% energy overhead during active acquisition (Heye/Vosshenrich)
  const inferKwhPerStudy = isToken
    ? rnd(tokenKwhPerStudy * inferCf.pue * ampF, 6)
    : inferKwhCustom !== null
      ? inferKwhCustom
      : rnd(model.gpuKw * arch.inferFactor * (model.inferSec / 3600) * inferCf.pue * ampF, 6);
  const inferKwhMonthly  = rnd(inferKwhPerStudy * STUDIES, 4);
  const inferKwhLifetime = rnd(inferKwhMonthly * DEPLOY_MO, 1);
  const ampSavingPct     = rnd((1 - ampF) * 100, 0);

  // ── Monthly totals (inference + amortised training) ─────────────────────
  const totalMonthlyKwh  = rnd(inferKwhMonthly + trainKwhMonth, 3);
  const embGpuKgCo2e     = rnd(model.embCo2Kg / DEPLOY_MO, 2);
  const grossKgCo2e      = rnd(inferKwhMonthly * inferCf.ci + trainKwhMonth * trainCf.ci + embGpuKgCo2e, 3);

  // ── Clinical co-benefits ─────────────────────────────────────────────────
  const clinicalSavings = computeClinicalScannerSavings({imagingScans:STUDIES,scannerActiveKwh:SCANNER_ACTIVE_KWH,avoidedFrac:model.lowValueReductPct/100,scanTimeFrac:model.scanTimeReductPct/100});
  const scansAvoided=clinicalSavings.scansAvoided;
  const avoidedEnergySaved=clinicalSavings.avoidedEnergyKwh;
  const scanTimeEnergySaved=clinicalSavings.scanTimeEnergyKwh;
  const scanEnergySaved=clinicalSavings.savedKwh;
  const savingsKgCo2e=rnd(scanEnergySaved*ci,2);
  const netKgCo2e=rnd(grossKgCo2e-savingsKgCo2e,3);

  // ── Infrastructure & efficiency ──────────────────────────────────────────  // ── Infrastructure & efficiency ──────────────────────────────────────────
  const waterLitres     = rnd(totalMonthlyKwh * WATER_PER_KWH, 1);
  // Reported performance per monthly inference kWh. The metric/unit/direction are carried
  // explicitly so this ratio is only compared like-for-like; percent-based legacy records retain
  // the same numerator they had before this schema change.
  const efficiencyRatio = inferKwhMonthly > 0 ? rnd((model.performanceValue || 0) / inferKwhMonthly, 3) : 0;
  // Rebound risk: faster reads may induce more scan orders, negating savings (§4 counter-metric)
  const reboundRisk     = model.scanTimeReductPct > 60 ? "High" : model.scanTimeReductPct > 30 ? "Moderate" : "Low";

  return {
    architecture, modelSize: sizeLabel(model.paramsM), precision, archDesc: arch.desc,
    paramsM: model.paramsM, dim: model.dim, resolution: model.resolution, slices: model.slices,
    inferSec: model.inferSec, trainMwhBase: model.trainMwh, embCo2KgTotal: model.embCo2Kg,
    training:  {kwhTotal: trainKwhTotal, kgCo2e: trainKgCo2e, gpuHours: trainGpuHours, kwhAmortised: trainKwhMonth,
      kwhReference: trainKwhReference, vsReferenceRatio: trainVsReferenceRatio},
    testing:   {kwhTotal: testKwhTotal,  kgCo2e: testKgCo2e,  studies: TEST_STUDIES},
    inference: {kwhPerStudy: inferKwhPerStudy, kwhMonthly: inferKwhMonthly, kwhLifetime: inferKwhLifetime, studies: STUDIES},
    inferKwhMeasured: inferKwhCustom !== null,
    trainMeasured: trainKwhCustom !== null,
    monthly:   {kwh: totalMonthlyKwh, co2: rnd(inferKwhMonthly * inferCf.ci + trainKwhMonth * trainCf.ci, 3)},
    ampSavingPct, grossKgCo2e, embGpuKgCo2e, savingsKgCo2e, netKgCo2e,
    pue: inferCf.pue, cloudCi: inferCf.ci, trainPue: trainCf.pue, inferPue: inferCf.pue, trainingCi: trainCf.ci, inferenceCi: inferCf.ci, trainingRawCi: trainCf.rawCi, inferenceRawCi: inferCf.rawCi, trainingContext: trainCf, inferenceContext: inferCf, waterLitres, efficiencyRatio,
    accuracy: model.accuracy, accuracyMetric: model.accuracyMetric,
    performanceValue: model.performanceValue, performanceUnit: model.performanceUnit, performanceDirection: model.performanceDirection,
    scanTimeReductPct: model.scanTimeReductPct, lowValueReductPct: model.lowValueReductPct,
    scansAvoided, avoidedEnergySaved, scanTimeEnergySaved, scanEnergySaved, reboundRisk,
    unit: isToken ? 'tokens' : 'gpu', tokensPerStudy, callsPerTask, tokensPerCall, whPer1kTokens: model.whPer1kTokens || 0, deployMonths:DEPLOY_MO,
  };
}

// Build a full AI result from a config object (the live `scen` or a saved benchmark
// candidate) under a given department context. Shared by the AI dashboard and the
// benchmark so both use identical math. Returns the computeAI object plus the derived
// inference time and a lifetime-CO₂ roll-up convenient for comparison.
// Reference training scale that the library `trainMwh` estimates implicitly assume — used to
// (optionally) rescale the DEFAULT training energy when the user supplies a dataset size + epochs.
const TRAIN_REF_IMAGES = 50000;   // ~typical medical-imaging training set
const TRAIN_REF_EPOCHS = 100;     // ~typical epoch count
function aiResultFor(cfg, region, customCi, equipment, equipOverrides = {}) {
  const gpuPreset = GPU_PRESETS[cfg.trainGpu];
  // "Custom (enter TDP below)" has tdpKw:0 in GPU_PRESETS (it's a placeholder key, not a real
  // card) — the actual wattage comes from cfg.trainCustomTdpW instead. Without this, picking
  // Custom silently computed 0 kWh of training energy no matter what Hours/#GPUs were entered,
  // and the whole training total silently fell back to the model-library literature default —
  // exactly the "hardware preset overriding my entered wattage" bug this fixes.
  const trainGpuTdpKw = cfg.trainGpu === 'Custom (enter TDP below)'
    ? (parseFloat(cfg.trainCustomTdpW) || 300) / 1000
    : gpuPreset?.tdpKw;
  const trainH    = parseFloat(cfg.trainHours) || 0;
  const trainN    = Math.max(1, parseInt(cfg.trainNumGpus) || 1);
  const trainingProvider = cfg.trainingProvider || cfg.cloudProvider;
  const trainingRegion = cfg.trainingRegion || cfg.cloudRegion;
  const trainingPueValue = parseFloat(cfg.trainingPue || cfg.customPue);
  const trainingPueDefault = CLOUD_REGIONS[trainingProvider]?.pue ?? CLOUD[trainingProvider]?.pue ?? 1.5;
  const pue = trainingPueValue > 0 ? trainingPueValue : trainingPueDefault;
  const trainKwhMeasured = parseFloat(cfg.trainKwhMeasured) || 0;
  const trainKwh  = trainKwhMeasured > 0 ? rnd(trainKwhMeasured, 3)
    : (trainGpuTdpKw != null && trainH > 0 ? rnd(trainGpuTdpKw * trainN * trainH * pue, 3) : 0);
  // Actual GPU-hours the user told us directly (Hours × #GPUs, no PUE) — the "Estimated GPU
  // compute" readout should echo this exactly rather than re-deriving it from PUE-inclusive energy.
  const trainGpuHoursMeasured = trainGpuTdpKw != null && trainH > 0 ? rnd(trainH * trainN, 2) : null;
  const lib = AI_MODEL_BY_KEY[cfg.modelKey] ?? AI_MODEL_LIBRARY[0];
  const paramsM    = parseFloat(cfg.paramsM)    || lib.paramsM;
  const dim        = cfg.dim || lib.dim;
  const resolution = parseFloat(cfg.resolution) || lib.resolution;
  // Slices/passes per study — independent of architecture dim. A 2D-input model applied
  // slice-by-slice over a volume (e.g. per-slice CT/MRI segmentation) still processes many
  // elements per study, same as a true 3D model; only the library default (1 for 2D refs) differs.
  const slices     = parseFloat(cfg.slices) || lib.slices || 1;
  const baseSlices = lib.slices || 1;
  const basePixels = lib.resolution * lib.resolution * baseSlices;
  const pixels     = resolution * resolution * slices;
  // Size ratio vs the library reference: model size × number of processed elements (pixels for 2D,
  // voxels for 3D). Scales BOTH inference and the default training estimate, consistently
  // (Green AI: FLOPs ∝ params × input elements). Unedited library configs have ratio 1.
  const sizeRatio  = (paramsM / lib.paramsM) * (pixels / basePixels);
  const inferSecDerived = rnd(lib.inferSec * sizeRatio, 3);
  // Optional: scale the DEFAULT training estimate by dataset size × epochs vs the reference the
  // library trainMwh assumes. Both blank → ratio 1 (no change). Inference is unaffected.
  const dsImages = parseFloat(cfg.datasetSize) || 0;
  const dsEpochs = parseFloat(cfg.epochs) || 0;
  const dataEpochRatio = (dsImages > 0 && dsEpochs > 0)
    ? (dsImages * dsEpochs) / (TRAIN_REF_IMAGES * TRAIN_REF_EPOCHS)
    : 1;
  const inferSecManual  = parseFloat(cfg.inferSec) > 0 ? parseFloat(cfg.inferSec) : null;
  const inferSecAuto    = inferSecManual === null;
  // Token-based (LLM / agentic) fields — only meaningful when the library entry uses tokens.
  const unit          = lib.unit || 'gpu';
  const whPer1kTokens = parseFloat(cfg.whPer1kTokens) > 0 ? parseFloat(cfg.whPer1kTokens) : lib.whPer1kTokens;
  const callsPerTask  = Math.max(1, parseInt(cfg.callsPerTask)  || lib.callsPerTask  || 1);
  const tokensPerCall = Math.max(0, parseFloat(cfg.tokensPerCall) || lib.tokensPerCall || 0);
  const model = {
    gpuKw: lib.gpuKw, trainMwh: lib.trainMwh, embCo2Kg: lib.embCo2Kg, trainSizeRatio: sizeRatio * dataEpochRatio,
    paramsM, dim, resolution, slices,
    unit, whPer1kTokens, callsPerTask, tokensPerCall,
    inferSec:   inferSecManual ?? inferSecDerived,
    accuracy:   Math.min(1, Math.max(0, (parseFloat(cfg.accuracyPct) || 0) / 100)),
    accuracyMetric: cfg.accuracyMetric || lib.accuracyMetric,
    performanceValue: parseFloat(cfg.accuracyPct) || 0,
    performanceUnit: cfg.performanceUnit || 'percent',
    performanceDirection: cfg.performanceDirection === 'lower' ? 'lower' : 'higher',
    scanTimeReductPct: Math.max(0, parseFloat(cfg.scanTimeReductPct) || 0),
    lowValueReductPct: Math.max(0, parseFloat(cfg.lowValueReductPct) || 0),
  };
  const result = computeAI(cfg.cloudProvider, region, model, cfg.precision, cfg.architecture, customCi, equipment,
    {trainKwh, testStudies: cfg.testStudies, deployMonths: cfg.deployMonths, cloudRegion: cfg.cloudRegion, trainGpuKw: trainGpuTdpKw, trainGpuHoursMeasured, customPue: cfg.customPue, inferKwh: cfg.inferKwh,
      renewablePct: cfg.renewablePct, trainingProvider: cfg.trainingProvider, trainingRegion: cfg.trainingRegion, trainingPue: cfg.trainingPue, trainingRenewablePct: cfg.trainingRenewablePct,
      inferenceProvider: cfg.inferenceProvider, inferenceRegion: cfg.inferenceRegion, inferencePue: cfg.inferencePue, inferenceRenewablePct: cfg.inferenceRenewablePct}, equipOverrides);
  const lifetimeCo2 = rnd(result.training.kgCo2e + result.inference.kwhLifetime * result.inferenceCi + result.embCo2KgTotal, 1);
  return {...result, inferSecDerived, inferSecAuto, lifetimeCo2};
}

// The AI-model config fields snapshotted into a benchmark candidate (department context —
// region, equipment, customCi — is held constant and applied at compute time).
const AI_CFG_FIELDS = ['modelId','modelKey','architecture','precision','paramsM','dim','resolution','slices','inferSec','inferKwh',
  'whPer1kTokens','callsPerTask','tokensPerCall',
  'accuracyPct','accuracyMetric','performanceUnit','performanceDirection','performanceValidationContext','performanceSource','scanTimeReductPct','lowValueReductPct',
  'cloudProvider','cloudRegion','trainGpu','trainNumGpus','trainHours','trainCustomTdpW','testStudies','deployMonths','customPue','renewablePct',
  'trainingProvider','trainingRegion','trainingPue','trainingRenewablePct','inferenceProvider','inferenceRegion','inferencePue','inferenceRenewablePct','trainingBoundary'];
function pickAiCfg(s) {
  return AI_CFG_FIELDS.reduce((o, k) => (o[k] = s[k], o), {});
}
function benchCfgFromLib(key) {
  const m = AI_MODEL_BY_KEY[key] ?? AI_MODEL_LIBRARY[0];
  return {
    id: `ref-${key}`, label: m.label, modelKey: key, architecture: m.architecture, precision: 'float32 (standard)',
    paramsM: String(m.paramsM), dim: m.dim, resolution: String(m.resolution), slices: String(m.slices), inferSec: '',
    whPer1kTokens: m.whPer1kTokens!=null?String(m.whPer1kTokens):'', callsPerTask: m.callsPerTask!=null?String(m.callsPerTask):'1', tokensPerCall: m.tokensPerCall!=null?String(m.tokensPerCall):'',
    accuracyPct: String(m.accuracyPct), accuracyMetric: m.accuracyMetric, performanceUnit:'percent', performanceDirection:'higher', performanceValidationContext:'', performanceSource:'',
    scanTimeReductPct: String(m.scanTimeReductPct), lowValueReductPct: String(m.lowValueReductPct),
    cloudProvider: 'Local compute', cloudRegion: 'On-premise (Switzerland)', trainingProvider:'', trainingRegion:'', trainingPue:'', trainingRenewablePct:'', inferenceProvider:'', inferenceRegion:'', inferencePue:'', inferenceRenewablePct:'', trainingBoundary:'upstream',
    trainGpu: '', trainNumGpus: '1', trainHours: '', testStudies: '500', deployMonths: '36',
  };
}
function isVisibleAiModelRecord(record) { return !(record?.id==='model-primary' && record?.name==='Untitled model' && !record?.config?.aiRoute); }
function modelDisplayName(record) {
  if (record?.name && record.name !== 'Untitled model') return record.name;
  const key = record?.config?.modelKey || record?.specification?.modelKey;
  if (key && key !== 'custom' && AI_MODEL_BY_KEY[key]?.label) return AI_MODEL_BY_KEY[key].label;
  if (record?.taskType && record.taskType !== 'Other') return record.taskType;
  return 'New AI model';
}
function referenceCandidateSpec(models) {
  const keys=(models||[]).map(m=>m?.modelKey).filter(k=>k&&k!=='custom'&&AI_MODEL_BY_KEY[k]).slice(0,6);
  return keys.length>=2 ? `v1:${keys.join(',')}` : '';
}
function benchFromReferenceCandidateSpec(spec) {
  if(!String(spec||'').startsWith('v1:')) return [];
  const keys=String(spec).slice(3).split(',').filter(k=>k&&k!=='custom'&&AI_MODEL_BY_KEY[k]).slice(0,6);
  return keys.length>=2 ? keys.map((key,i)=>({...benchCfgFromLib(key),id:`link-ref-${i}`,label:`Candidate ${String.fromCharCode(65+i)} — ${AI_MODEL_BY_KEY[key].label}`,validationBasis:'Not specified',intendedUse:'',vendor:'',regulatoryStatus:'Not specified',integrationPath:'Not specified'})) : [];
}
function benchFromComparisonPreset(preset) {
  const value=String(preset||''); if(!value.endsWith('-v1')) return [];
  const key=value.slice(0,-3), ex=AI_EXAMPLES.find(e=>e.key===key&&Array.isArray(e.bench));
  return ex ? ex.bench.map((b,i)=>({...benchCfgFromLib(b.modelKey),...b,id:`preset-${key}-${i}`})) : [];
}

function computeCloudCarbon(t) {
  const provData  = CLOUD_REGIONS[t.provider] ?? CLOUD_REGIONS['Local compute'];
  const regionCi  = provData.regions[t.region] ?? 0.3;
  const pue       = provData.pue;
  const renewable = Math.min(100, Math.max(0, parseFloat(t.renewablePct) || 0));
  const ci        = rnd(regionCi * (1 - renewable / 100), 4);

  const computeResults = t.computeLines.map(line => {
    // Locked AI lines carry an already-PUE-inclusive energy from the AI lifecycle model.
    // Back out the PUE so the rest of the pipeline (pueKwh, regional optimisation) stays uniform.
    if (line.fixedKwh != null) {
      const pueKwh = rnd(parseFloat(line.fixedKwh) || 0, 2);
      const rawKwh = rnd(pue > 0 ? pueKwh / pue : pueKwh, 2);
      const co2    = rnd(pueKwh * ci, 2);
      return {...line, watt: 0, count: '—', hoursPerMonth: '—', rawKwh, pueKwh, co2, category: 'gpu'};
    }
    const preset = CLOUD_INSTANCES[line.instance];
    const watt   = line.instance === 'Custom (enter watts)'
      ? (parseFloat(line.customWatt) || 0)
      : (preset?.watt ?? 0);
    const count  = Math.max(0, parseFloat(line.count) || 0);
    const hours  = Math.max(0, Math.min(744, parseFloat(line.hoursPerMonth) || 0));
    const rawKwh = rnd(watt / 1000 * count * hours, 2);
    const pueKwh = rnd(rawKwh * pue, 2);
    const co2    = rnd(pueKwh * ci, 2);
    return {...line, watt, rawKwh, pueKwh, co2, category: preset?.category ?? 'cpu'};
  });

  const storageResults = t.storageLines.map(line => {
    const whPerTbHr = STORAGE_WH_PER_TB_HR[line.type] ?? 0.65;
    const tb        = Math.max(0, parseFloat(line.tb) || 0);
    const rawKwh    = rnd(whPerTbHr / 1000 * tb * 720, 3);
    const pueKwh    = rnd(rawKwh * pue, 3);
    const co2       = rnd(pueKwh * ci, 3);
    return {...line, rawKwh, pueKwh, co2};
  });

  const netGb  = Math.max(0, parseFloat(t.networkingGb) || 0);
  const netKwh = rnd(netGb * NETWORK_KWH_PER_GB, 3);
  const netCo2 = rnd(netKwh * ci, 3);

  const rawComputeKwh  = rnd(computeResults.reduce((s, r) => s + r.rawKwh, 0), 2);
  const rawStorageKwh  = rnd(storageResults.reduce((s, r) => s + r.rawKwh, 0), 3);
  const totalComputeKwh = rnd(computeResults.reduce((s, r) => s + r.pueKwh, 0), 2);
  const totalStorageKwh = rnd(storageResults.reduce((s, r) => s + r.pueKwh, 0), 3);
  const totalKwh  = rnd(totalComputeKwh + totalStorageKwh + netKwh, 2);
  const totalCo2  = rnd(
    computeResults.reduce((s, r) => s + r.co2, 0) +
    storageResults.reduce((s, r) => s + r.co2, 0) + netCo2, 2);

  // Best region within same provider
  const provRegions = Object.entries(provData.regions);
  const bestSame = provRegions.reduce(
    (b, [name, rci]) => rci < b.ci ? {name, ci: rci} : b,
    {name: t.region, ci: regionCi}
  );
  const bestSameCi  = rnd(bestSame.ci * (1 - renewable / 100), 4);
  const bestSameCo2 = rnd((rawComputeKwh + rawStorageKwh) * pue * bestSameCi + netKwh * bestSameCi, 2);
  const bestSameSaving = totalCo2 > 0 ? rnd((1 - bestSameCo2 / Math.max(totalCo2, 1e-6)) * 100, 1) : 0;

  // Cross-provider comparison — find each provider's greenest region
  const crossProvider = Object.entries(CLOUD_REGIONS).map(([provName, provInfo]) => {
    const entries = Object.entries(provInfo.regions);
    const best    = entries.reduce((b, [n, rci]) => rci < b.ci ? {name: n, ci: rci} : b, {name: entries[0][0], ci: entries[0][1]});
    const effCi   = rnd(best.ci * (1 - renewable / 100), 4);
    const co2Est  = rnd((rawComputeKwh + rawStorageKwh) * provInfo.pue * effCi + netKwh * effCi, 2);
    const saving  = totalCo2 > 0 ? rnd((1 - co2Est / Math.max(totalCo2, 1e-6)) * 100, 1) : 0;
    return {provider: provName, label: provInfo.label, bestRegion: best.name, ci: best.ci, pue: provInfo.pue, co2Est, saving, isCurrent: provName === t.provider};
  }).sort((a, b) => a.co2Est - b.co2Est);

  return {
    computeResults, storageResults,
    netKwh, netCo2, netGb,
    totalComputeKwh, totalStorageKwh, totalKwh, totalCo2,
    rawComputeKwh, rawStorageKwh,
    ci, regionCi, pue, renewable,
    bestSame: {...bestSame, ci: bestSameCi, co2: bestSameCo2, saving: bestSameSaving},
    crossProvider,
    isBestRegion: t.region === bestSame.name,
  };
}

// ── UI components ─────────────────────────────────────────────────────────────
function Logo({onClick}) {
  return (
    <div className="brand" onClick={onClick} style={onClick ? {cursor:'pointer'} : undefined}>
      <img src="./logo-only.png" alt="CEDARS logo" style={{width:68, height:68, objectFit:'contain'}}/>
      <div><strong>CEDARS</strong><span>Carbon, Energy Diagnostics and Reporting for Sustainability</span></div>
    </div>
  );
}

function Card({title, value, sub, icon, style, tip}) {
  return (
    <section className="card" style={style} title={tip || undefined}>
      <div className="cardHead">{icon}<span>{title}</span>{tip && <span style={{marginLeft:'auto',color:'#90a4ae',fontSize:13,cursor:'help'}} title={tip}>ⓘ</span>}</div>
      <b>{value}</b>
      <p>{sub}</p>
    </section>
  );
}

// CEDARS Rating badge — `leaves` filled (coloured) out of 5, the rest greyed.
function LeafRating({leaves, size = 22, color = '#2E7D32'}) {
  return (
    <span style={{display:'inline-flex', gap:3, alignItems:'center'}} aria-label={`${leaves} of 5 leaves`}>
      {[1,2,3,4,5].map(i => (
        <Leaf key={i} size={size} style={{color: i <= leaves ? color : '#cfd8dc'}} fill={i <= leaves ? color : 'none'}/>
      ))}
    </span>
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

function inputTargetName(target) {
  return ({dashboard:'Radiology Department', ai:'AI Model & Informatics', scenario:'Improve', ecolabel:'Score & EcoLabel', report:'Report (& Share)'})[target] || 'your assessment';
}
function AssessmentContextStrip({settings, onEdit, ai = false}) {
  return <div className="assessmentContextStrip"><Globe size={14}/><span className="assessmentContextKicker">ASSESSMENT CONTEXT</span><strong>{settings.region}</strong><span>· {settings.timePeriod}</span><span>· {currencySym(settings.region)}{getPrice(settings.region, settings.electricityPrice)}/kWh</span>{ai&&<span className="assessmentContextCarry">local / hospital assumptions · AI compute location is set separately</span>}<button type="button" className="contextEditLink" onClick={onEdit}>Edit shared context →</button></div>;
}

function SystemEffectsCallout({kind='department', onReview=null, anchorId=''}) {
  const isAi = kind === 'ai';
  return (
    <div id={anchorId || undefined} className="systemEffectsCallout" style={{scrollMarginTop:120}}>
      <span className="systemEffectsIcon">↺</span>
      <div className="systemEffectsBody">
        <span>SYSTEM EFFECTS &amp; REBOUND</span>
        <strong>Efficiency can change total activity</strong>
        <p>{isAi
          ? 'A lower AI footprint per study does not always mean lower total emissions. Faster or cheaper inference can increase model use, follow-up, or downstream imaging.'
          : 'A lower footprint per study does not always mean lower total emissions. Efficiency can change imaging volume, throughput, follow-up, or other downstream care.'} CEDARS does not apply a universal Jevons penalty; workload changes are modeled only when they are represented in the assessment.</p>
        <div className="systemEffectsEvidence"><ExternalLink href={refUrl(REFS['nghiem-doo-sustainable-ai-2026'])}>Doo · Sustainable AI 2026</ExternalLink><ExternalLink href={refUrl(REFS['wright-efficiency-not-enough-2023'])}>Wright · Efficiency is Not Enough</ExternalLink></div>
      </div>
      {onReview&&<button type="button" className="download" onClick={onReview}>Consider potential system effects in "Improve" tab →</button>}
    </div>
  );
}

function downloadCSV(dash) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row = cells => cells.map(q).join(',');
  const blank = '';

  const lines = [
    row(['CEDARS Sustainability Report']),
    row(['Profile', dash.region, dash.timePeriod]),
    row(['Carbon intensity (kgCO2e/kWh)', dash.ci]),
    blank,

    row(['ENERGY TOTALS']),
    row(['Metric', 'Value', 'Unit']),
    row(['Total electricity',   dash.totals.kwh,         'kWh']),
    row(['  of which equipment', rnd(dash.totals.kwh - dash.storage.kwh, 2), 'kWh']),
    row(['  of which data storage / archive', dash.storage.kwh, 'kWh']),
    row(['Active scanning',     dash.totals.activeKwh,   'kWh']),
    row(['Idle + standby',      dash.totals.idleKwh,     'kWh']),
    row(['Avoidable idle',      dash.totals.idleWasteKwh,'kWh']),
    row(['Energy per imaging scan', dash.totals.energyPerScan, 'kWh/scan']),
    blank,

    row(['CARBON — GHG PROTOCOL SCOPES']),
    row(['Scope', 'kgCO2e']),
    row(['Scope 1 — Direct',           dash.scopes.scope1Assessed ? dash.scopes.scope1Kg : 'Not assessed']),
    row(['Scope 2 — Electricity',      dash.scopes.scope2Kg]),
    row(['Scope 3 — Embodied carbon',  dash.scopes.scope3EmbKg]),
    row(['Scope 3 — Patient travel',   dash.scopes.scope3TravelKg]),
    row(['Scope 3 — Contrast supply chain', dash.scopes.scope3ContrastKg]),
    row(['Scope 3 — Total',            dash.scopes.scope3Kg]),
    blank,

    row(['RESOURCES']),
    row(['Metric', 'Value', 'Unit']),
    row(['Water footprint',   dash.resources.waterLitres, 'L']),
    row(['Paper consumption', dash.resources.paperKg,     'kg']),
    row(['Hazardous waste',   dash.resources.hazardousKg, 'kg']),
    blank,

    row(['REAL-WORLD EQUIVALENCIES (Scope 2)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Car km equivalent',     dash.equivalencies.car_km,          'km']),
    row(['Phone charges',         dash.equivalencies.phone_charges,   'charges']),
    row(['Tree-years to offset',  dash.equivalencies.trees_year,      'tree-years']),
    row(['Short-haul flights',    dash.equivalencies.flights_short,   'flights']),
    row(['Household electricity', dash.equivalencies.household_years, 'years']),
    blank,

    row(['EQUIPMENT BREAKDOWN']),
    row(['Equipment', 'Modality', 'kWh', 'kgCO2e', 'Scans', 'kWh/scan', 'Avoidable idle kWh', 'Confidence']),
    ...dash.byEquipment.map(r =>
      row([r.equipment, r.modality, r.kwh, r.kgco2e, r.scans, r.energyPerScan ?? 'N/A', r.idleWasteKwh, r.confidence])
    ),
    // Data storage/archive is part of the total electricity but is not a device — list it so the
    // breakdown reconciles with Total electricity above.
    row([`Data storage / archive (${dash.storage.storedTB} TB over ${dash.storage.retentionYears} yr, ${dash.storage.cloud ? `cloud ${dash.storage.provider||''} ${dash.storage.region||''}`.trim() : 'on-prem'})`,
      'Storage', dash.storage.kwh, dash.storage.co2, '', 'N/A', '', `estimated; CI ${dash.storage.ci} kgCO2e/kWh`]),
  ];

  const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cedars_${dash.region}_${dash.timePeriod}.csv`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAICSV(ai, scen, region) {
  const q    = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row  = cells => cells.map(q).join(',');
  const blank = '';

  const lines = [
    row(['CEDARS AI Sustainability Report']),
    row(['Department context', region]),
    row(['Training provider', ai.trainingContext?.provider || scen.trainingProvider || scen.cloudProvider, 'Training region', ai.trainingContext?.region || scen.trainingRegion || scen.cloudRegion]),
    row(['Training CI (kgCO2e/kWh)', ai.trainingCi, 'Training PUE', ai.trainPue]),
    row(['Inference provider', ai.inferenceContext?.provider || scen.inferenceProvider || scen.cloudProvider, 'Inference region', ai.inferenceContext?.region || scen.inferenceRegion || scen.cloudRegion]),
    row(['Inference CI (kgCO2e/kWh)', ai.inferenceCi, 'Inference PUE', ai.inferPue]),
    row(['Model template', AI_MODEL_BY_KEY[scen.modelKey]?.label ?? scen.modelKey, 'Reference', AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? '']),
    row(['Architecture', scen.architecture, 'Model size', ai.modelSize]),
    row(['Parameters (M)', ai.paramsM, 'Dimensionality', ai.dim]),
    row([ai.dim==='3D'?'In-plane resolution (px)':'Input resolution (px)', ai.resolution, ai.dim==='3D'?'Through-plane slices':'Slices / passes per study', ai.slices]),
    ...(ai.slices > 1 ? [row(['Per-study elements (px/voxels)', Math.round((parseFloat(ai.resolution)||0)**2 * (parseFloat(ai.slices)||0))])] : []),
    row(['Precision / AMP', scen.precision]),
    blank,

    row(['TRAINING (one-time)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Training energy',              ai.training.kwhTotal.toFixed(3), 'kWh']),
    row(['Training CO2e',                ai.training.kgCo2e,      'kgCO2e']),
    row([ai.trainMeasured ? 'GPU compute (measured)' : 'Estimated GPU compute', ai.training.gpuHours, 'h']),
    row(['Amortised training / month',   ai.training.kwhAmortised,`kWh/mo (${ai.deployMonths}-month deployment)`]),
    blank,

    row(['TESTING / VALIDATION (one-time)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Test set energy',              ai.testing.kwhTotal,     'kWh']),
    row(['Test set CO2e',                ai.testing.kgCo2e,       'kgCO2e']),
    row(['Test set studies',             ai.testing.studies,      'studies']),
    blank,

    row(['INFERENCE & DEPLOYMENT (monthly)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Studies per month',            ai.inference.studies,        'studies/mo']),
    row(['Energy per study',             ai.inference.kwhPerStudy,    'kWh/study']),
    row(['Monthly inference energy',     ai.inference.kwhMonthly,     'kWh/mo']),
    row(['Lifetime inference energy',    ai.inference.kwhLifetime,    `kWh (${ai.deployMonths} months)`]),
    row(['AMP energy saving',            ai.ampSavingPct,             '%']),
    blank,

    row(['CARBON FOOTPRINT (monthly)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Gross CO2e',                   ai.grossKgCo2e,              'kgCO2e/mo']),
    row(['Embodied GPU carbon',          ai.embGpuKgCo2e,             'kgCO2e/mo (amortised)']),
    row(['Clinical savings',             ai.savingsKgCo2e,            'kgCO2e/mo']),
    row(['Net CO2e impact',              ai.netKgCo2e,                'kgCO2e/mo']),
    blank,

    row(['CLINICAL CO-BENEFITS (monthly)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Scan time reduction',          ai.scanTimeReductPct,        '%']),
    row(['Scanner energy saved',         ai.scanEnergySaved,          'kWh/mo']),
    row(['Low-value scans avoided',      ai.scansAvoided,             'scans/mo']),
    row(['Rebound effect risk',          ai.reboundRisk,              '']),
    blank,

    row(['EFFICIENCY & RESOURCES']),
    row(['Metric', 'Value', 'Unit']),
    row(['Reported performance',         `${ai.performanceValue} ${ai.performanceUnit} · ${ai.accuracyMetric}`,'user-entered']),
    row(['Monthly water footprint',      ai.waterLitres,              'L']),
  ];

  const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cedars_ai_${region}_${scen.cloudProvider}.csv`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCloudCSV(result, tracker) {
  const q    = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row  = cells => cells.map(q).join(',');
  const blank = '';

  const lines = [
    row(['CEDARS Cloud Carbon Report']),
    row(['Provider', tracker.provider, 'Region', tracker.region]),
    row(['Grid CI (kgCO2e/kWh)', result.regionCi, 'Effective CI', result.ci]),
    row(['PUE', result.pue, 'Renewables (%)', result.renewable]),
    blank,

    row(['MONTHLY TOTALS']),
    row(['Metric', 'Value', 'Unit']),
    row(['Total energy (with PUE)',    result.totalKwh,        'kWh/mo']),
    row(['Total CO2e',                 result.totalCo2,        'kgCO2e/mo']),
    row(['Compute energy',             result.totalComputeKwh, 'kWh/mo']),
    row(['Storage energy',             result.totalStorageKwh, 'kWh/mo']),
    row(['Network energy',             result.netKwh,          'kWh/mo']),
    row(['Network data transfer',      result.netGb,           'GB/mo']),
    row(['Network CO2e',               result.netCo2,          'kgCO2e/mo']),
    blank,

    row(['COMPUTE WORKLOADS']),
    row(['Label', 'Instance type', 'Count', 'Hours/month', 'TDP (W)', 'Raw kWh', 'kWh (with PUE)', 'CO2e (kg)']),
    ...result.computeResults.map(r =>
      row([r.label ?? '', r.instance, r.count, r.hoursPerMonth, r.watt, r.rawKwh, r.pueKwh, r.co2])
    ),
    blank,

    row(['STORAGE WORKLOADS']),
    row(['Label', 'Storage type', 'TB', 'Raw kWh', 'kWh (with PUE)', 'CO2e (kg)']),
    ...result.storageResults.map(r =>
      row([r.label ?? '', r.type, r.tb, r.rawKwh, r.pueKwh, r.co2])
    ),
    blank,

    row(['REGION OPTIMISATION']),
    row(['Best region (same provider)', result.bestSame.name, 'Saving (%)', result.bestSame.saving]),
    row(['Best region CO2e', result.bestSame.co2, 'kgCO2e/mo', '']),
    blank,

    row(['CROSS-PROVIDER COMPARISON']),
    row(['Provider', 'Best region', 'Grid CI', 'PUE', 'Est. CO2e (kgCO2e/mo)', 'Saving vs current (%)']),
    ...result.crossProvider.map(r =>
      row([r.provider, r.bestRegion, r.ci, r.pue, r.co2Est, r.saving])
    ),
  ];

  const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cedars_cloud_${tracker.provider}_${tracker.region}.csv`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── CEDARS Score & Rating ─────────────────────────────────────────────────────
// Standardised environmental disclosure, after Energy Star / EU Energy Label A–G
// (Regulation EU 2021/341): a continuous 0–100 Score paired with a categorical
// 1–5 leaf Rating. Higher Score = lower footprint. Rating bands per Table 3.
// Rating bands = equal quintiles of the 0–100 Score (80/60/40/20). The Score is already a
// log-scale transform of footprint intensity, so the non-linearity lives there; the bands add
// no second, unjustified skew. Provisional, open to consensus revision.
// CEDARS_RATINGS, cedarsRating, cedarsScore, and the Score anchors (CEDARS_AI/DEPT/AIUSE_LO/HI)
// live in ./calc.js (imported above) and are covered by reference tests in calc.test.js.

function generateDeptText(d) {
  if (!d.annualStudies) return '';
  return (
    `Environmental footprint. ${d.deptName}${d.hospitalName ? ` (${d.hospitalName})` : ''} consumed an estimated ${d.annualKwh.toLocaleString()} kWh of electricity in the reporting period, generating approximately ${d.totalAnnualCo2.toLocaleString()} kgCO₂e (effective carbon intensity: ${d.effectiveCi} kgCO₂e/kWh; renewable energy: ${d.renewablePct}%; grid region: ${d.region}). ` +
    (d.clinicalToolCount > 0 ? ` This figure reflects ${d.clinicalToolCount} deployed clinical AI tool${d.clinicalToolCount > 1 ? 's' : ''}, whose net compute and clinical savings are included in the department energy above.` : '') +
    ` Across ${d.annualStudies.toLocaleString()} imaging studies, the carbon intensity per study — a measure of how efficiently energy is converted into delivered care — was ${d.co2PerStudy} kgCO₂e/study (${d.kwhPerStudy} kWh/study${d.utilPct != null ? `; ${d.utilPct}% fleet utilisation` : ''}), corresponding to a CEDARS Score of ${d.score}/100 (CEDARS Rating: ${d.leaves}/5 leaves — ${d.ratingLabel}).` +
    (d.interventionCount > 0 ? ` The department reports ${d.interventionCount} sustainability practice${d.interventionCount > 1 ? 's' : ''} as currently implemented.` : '') +
    ` Sustainability metrics were estimated using CEDARS (${d.date}), benchmarked against published radiology carbon-intensity data (e.g. McKee BJ et al., Radiology 2024, DOI: 10.1148/radiol.240219); full methodology and sources: https://github.com/takinci/cedars/blob/main/sources.md.`
  );
}
function generateAiMethodsText(d) {
  if (!d) return '';
  const training = d.trainDisclosed
    ? `${d.projectName} used ${d.gpuHardware}${d.totalGpuHours>0?` for ${d.totalGpuHours} GPU-hours`:''} across ${d.numRuns} training run${d.numRuns===1?'':'s'}, consuming ${d.totalEnergyKwh} kWh and producing an estimated ${d.trainCo2} kgCO₂e (${d.trainingProvider}, ${d.trainingRegion || 'provider average'}, ${d.trainingEffectiveCi} kgCO₂e/kWh).`
    : `Training energy for ${d.projectName} was not disclosed by the developer or vendor.`;
  const inference = d.perInferCo2g>0
    ? ` Inference was estimated at ${d.perInferCo2g} gCO₂e per study (${d.inferenceProvider}, ${d.inferenceRegion || 'provider average'}, ${d.inferenceEffectiveCi} kgCO₂e/kWh; PUE ${d.pue}).`
    : '';
  const amortised = d.hasInference
    ? ` Across ${d.lifetimeInferences.toLocaleString()} studies over ${d.deployMonths} months, the amortised training-plus-inference footprint was ${d.effectivePerStudyG} gCO₂e per study.`
    : '';
  const water = d.waterProv==='not-disclosed'
    ? ' Water use was not assessed.'
    : d.waterLitres>0 ? ` Operational water use was estimated at ${d.waterLitres.toLocaleString()} L for training${d.waterProv==='screening'?' using a screening factor':''}.` : '';
  const score = d.graded
    ? d.gradeBasis === 'amortised'
      ? ` The resulting CEDARS modeled operational-intensity score was ${d.score}/100 (${d.leaves}/5 leaves; ${d.ratingLabel}), based on amortised training plus inference.`
      : ` The provisional CEDARS Inference Score was ${d.score}/100 (${d.leaves}/5 leaves; ${d.ratingLabel}) and reflects inference only; ${d.trainDisclosed ? 'deployment workload was not available to amortise the one-time training footprint into the per-study score' : 'training was not disclosed and is not included in the per-study score'}.`
    : '';
  return `Environmental impact. ${training}${inference}${amortised}${water}${score} Sustainability metrics were assessed using CEDARS (${d.date}); detailed assumptions and provenance should be reported with the study where relevant.`;
}

// Shared label-card row height: both PNG label cards (Department EcoLabel, AI Research EcoLabel)
// share the same fixed width but have very different row counts (7-9 vs 10-13), so a fixed
// ROW_H previously gave them noticeably different aspect ratios (~1.34 vs ~0.97). Instead, both
// aim for the same TARGET_H by shrinking/growing row height within a readable range — short
// cards get roomier rows, long cards get tighter ones, and both land close to the same overall
// card shape. LABEL_CHROME_H is the fixed (non-row) vertical space: header + score/rating band +
// margins + footer, identical in both card layouts.
const LABEL_TARGET_H = 460, LABEL_MIN_ROW_H = 20, LABEL_MAX_ROW_H = 32, LABEL_CHROME_H = 72 + 84 + 4 + 6 + 28 + 4;
function labelRowH(numRows) {
  const ideal = (LABEL_TARGET_H - LABEL_CHROME_H) / Math.max(1, numRows);
  return Math.min(LABEL_MAX_ROW_H, Math.max(LABEL_MIN_ROW_H, ideal));
}

// Lucide "Leaf" icon path data (v0.511.0, 24x24 viewBox) — drawn directly in canvas so the PNG
// label exports use the exact same leaf glyph as the <LeafRating> component in the live UI,
// rather than a plain bullet/dot standing in for CEDARS's actual rating symbol.
const LEAF_PATH_BLOB = "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z";
const LEAF_PATH_STEM = "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12";
function drawLeaf(ctx, x, y, size, filled, color) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  const blob = new Path2D(LEAF_PATH_BLOB);
  if (filled) { ctx.fillStyle = color; ctx.fill(blob); }
  ctx.stroke(blob);
  ctx.stroke(new Path2D(LEAF_PATH_STEM));
  ctx.restore();
}

// Single shared renderer for both PNG label cards. Both cards previously duplicated this whole
// layout with small, easy-to-drift inconsistencies (score font 40px vs 38px, leaf-row spacing
// 16px vs 15px, row-value column 200 vs 210, footer text "CEDARS Score & Rating..." vs "CEDARS
// ..."). Routing both through one function makes that kind of drift structurally impossible —
// the two cards can now only differ in the data passed in (title, rows, colours), never in layout.
function drawLabelCard({title, name, contextLine, scoreDisplay, leaves, ratingColor, ratingBg, ratingLabel, subtext, rows, footerText}) {
  const W = 510;
  const ROW_H = labelRowH(rows.length), HEADER_H = 72, BAND_H = 84, FOOTER_H = 28;
  const H = HEADER_H + BAND_H + 4 + rows.length * ROW_H + 6 + FOOTER_H + 4;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.fill();
  ctx.strokeStyle = ratingColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, W-2, H-2, 13); ctx.stroke();
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath(); ctx.roundRect(1, 1, W-2, HEADER_H, [13,13,0,0]); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(title, 16, 26);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#A5D6A7';
  ctx.fillText(name, 16, 48);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#81C784';
  ctx.fillText(contextLine, 16, 66);
  ctx.fillStyle = ratingBg;
  ctx.fillRect(2, HEADER_H, W-4, BAND_H);
  // CEDARS Score (big number) + Rating (5 leaves — matches the UI's LeafRating component)
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px sans-serif'; ctx.fillStyle = ratingColor;
  ctx.fillText(scoreDisplay, 46, HEADER_H + 48);
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('CEDARS SCORE', 46, HEADER_H + 64);
  ctx.textAlign = 'left';
  for (let i = 0; i < 5; i++) drawLeaf(ctx, 100 + i*18, HEADER_H + 15, 16, i < leaves, i < leaves ? ratingColor : '#cfd8dc');
  ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = ratingColor;
  ctx.fillText(ratingLabel, 100, HEADER_H + 53);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#263238';
  ctx.fillText(subtext, 100, HEADER_H + 70);
  const rowTextY = ROW_H / 2 + 4; // baseline offset within a row — matches the old fixed +17 exactly at ROW_H=26
  rows.forEach(([k, v], i) => {
    const y = HEADER_H + BAND_H + 4 + i * ROW_H;
    ctx.fillStyle = i%2===0 ? '#f1f8f1' : '#ffffff';
    ctx.fillRect(2, y, W-4, ROW_H);
    ctx.fillStyle = '#607d66'; ctx.font = '11px sans-serif';
    ctx.fillText(k, 14, y+rowTextY);
    ctx.fillStyle = '#263238'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(String(v), 210, y+rowTextY);
  });
  const footerY = HEADER_H + BAND_H + 4 + rows.length * ROW_H + 6;
  ctx.fillStyle = '#e8f5e9';
  ctx.beginPath(); ctx.roundRect(2, footerY, W-4, FOOTER_H, [0,0,11,11]); ctx.fill();
  ctx.fillStyle = '#2E7D32'; ctx.font = '10px sans-serif';
  ctx.fillText(footerText, 14, footerY+18);
  return canvas;
}

function downloadCanvasPNG(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  });
}

function downloadDeptPNG(d) {
  const rows = [
    ['Annual electricity',   `${d.annualKwh.toLocaleString()} kWh`],
    ['Annual CO₂e',    `${d.totalAnnualCo2.toLocaleString()} kgCO₂e`],
    ...(d.clinicalToolCount > 0 ? [['Clinical AI', `${d.clinicalToolCount} deployed (in energy)`]] : []),
    ['Studies / year',       d.annualStudies.toLocaleString()],
    ['Energy per study',     `${d.kwhPerStudy} kWh`],
    ...(d.utilPct != null ? [['Fleet utilisation', `${d.utilPct}% of configured fleet`]] : []),
    ['Carbon intensity',     `${d.effectiveCi} kgCO₂e/kWh (${d.renewablePct}% renewable)`],
    ['Grid region',          d.region],
    ...(d.interventionCount > 0 ? [['Current practices', `${d.interventionCount} documented as implemented`]] : []),
  ];
  const canvas = drawLabelCard({
    title: 'CEDARS Department EcoLabel',
    name: d.deptName,
    contextLine: `${d.hospitalName ? d.hospitalName + ' \xb7 ' : ''}${d.region} \xb7 ${d.date}`,
    scoreDisplay: String(d.score),
    leaves: d.leaves, ratingColor: d.ratingColor, ratingBg: d.ratingBg, ratingLabel: d.ratingLabel,
    subtext: `${d.co2PerStudy} kgCO₂e per imaging study`,
    rows,
    footerText: `CEDARS Score & Rating \xb7 ${d.date} \xb7 CC BY 4.0`,
  });
  downloadCanvasPNG(canvas, `cedars_dept_label_${(d.deptName||'department').replace(/\W+/g,'_')}.png`);
}

function generateEcoMarkdown(d) {
  const rows = [
    ['Project / model',          d.projectName],
    ['Task type',                d.taskType],
    ['Architecture',             d.architecture],
    ['Parameters',               d.paramsMillion],
    ['Training dataset',         d.datasetSize],
    ['GPU hardware',             d.gpuHardware],
    ['Training runs',            `${d.numRuns} experiment${d.numRuns > 1 ? 's' : ''}`],
    ['Total GPU-hours',          `${d.totalGpuHours} h`],
    ['Energy per run',           d.trainDisclosed ? `${d.energyPerRunKwh} kWh (${PROVENANCE[d.trainProv]?.label.toLowerCase()}${d.trainTool ? ', ' + d.trainTool : ''})` : 'not disclosed by vendor'],
    ['Total training energy',    d.trainDisclosed ? `${d.totalEnergyKwh} kWh over ${d.numRuns} run${d.numRuns===1?'':'s'}` : 'not disclosed by vendor'],
    ['Training CO₂e (one-time)', `${d.trainCo2} kgCO₂e`],
    ['Training compute',         `${d.trainingProvider} · ${d.trainingRegion || 'provider average'} · ${d.trainingEffectiveCi} kgCO₂e/kWh`],
    ['Inference compute',        `${d.inferenceProvider} · ${d.inferenceRegion || 'provider average'} · ${d.inferenceEffectiveCi} kgCO₂e/kWh · PUE ${d.pue}`],
    ['Water footprint (cooling)', `${d.waterLitres.toLocaleString()} L`],
    ...(d.tokenMode && d.tokensPerStudy > 0 ? [['Inference tokens / study', `${d.tokensPerStudy.toLocaleString()} tokens · ${d.inferKwhPerStudy} kWh`]] : []),
    ...(d.perInferCo2g > 0 ? [['Inference CO₂e / study (marginal)', `${d.perInferCo2g} gCO₂e`]] : []),
    ...(d.hasInference ? [
      ['Deployment',                  `${d.inferStudies.toLocaleString()} studies/mo · ${d.deployMonths} mo (${d.lifetimeInferences.toLocaleString()} studies)`],
      ['Effective CO₂e / study',      `${d.effectivePerStudyG} gCO₂e (training amortised + inference)`],
      ...(d.breakEvenStudies != null ? [['Break-even (training = inference)', `~${d.breakEvenStudies.toLocaleString()} studies`]] : []),
    ] : []),
    ['**CEDARS Score**',         d.graded ? (d.gradeBasis === 'amortised' ? `**${d.score} / 100** (modeled operational intensity · training + inference)` : `**${d.score}* / 100** (provisional inference-only score)`) : '— (add inference data to grade)'],
    ['**CEDARS Rating**',        d.graded ? `**${d.leaves} / 5 leaves — ${d.ratingLabel}**${d.gradeBasis === 'inference' ? ' · inference only' : ''}` : '—'],
    ['Estimated with',           `CEDARS · ${d.date}`],
  ];
  return [
    '| Metric | Value |',
    '|:---|:---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
    ...(d.gradeBasis === 'inference' ? ['> * Provisional inference-only score. Training is not included per study. It is not directly comparable with a training + inference score; enter deployment workload when training is disclosed to include an amortised training share.', ''] : []),
    '> AI research EcoLabel generated with [CEDARS](https://cedarsleaf.com).',
    '> Reporting framework: Doo FX et al. *J Am Coll Radiol* 2024 · DOI 10.1016/j.jacr.2023.11.019; Doo FX et al. *Radiology* 2024 · DOI 10.1148/radiol.232030. Full sources: cedarsleaf.com → sources.md.',
  ].join('\n');
}

function downloadEcoPNG(d) {
  const rows = [
    ['Task type',                d.taskType],
    ['Architecture',             d.architecture],
    ['Parameters',               d.paramsMillion],
    ['Training dataset',         d.datasetSize],
    ['GPU hardware',             d.gpuHardware],
    ['Training runs',            `${d.numRuns} exp · ${d.totalGpuHours} GPU-h total`],
    ['Energy / run',             d.trainDisclosed ? `${d.energyPerRunKwh} kWh (${PROVENANCE[d.trainProv]?.short.toLowerCase()})` : 'not disclosed'],
    ['Total training energy',    d.trainDisclosed ? `${d.totalEnergyKwh} kWh` : 'not disclosed'],
    [`Training CO₂e`,       `${d.trainCo2} kgCO₂e`],
    ['Training compute',         `${d.trainingProvider} · ${d.trainingRegion || 'avg'} · ${d.trainingEffectiveCi} kgCO₂e/kWh`],
    ['Inference compute',        `${d.inferenceProvider} · ${d.inferenceRegion || 'avg'} · ${d.inferenceEffectiveCi} kgCO₂e/kWh`],
    ['Water footprint (cooling)', `${d.waterLitres.toLocaleString()} L`],
    ...(d.perInferCo2g > 0 ? [['Inference / study', `${d.perInferCo2g} gCO₂e`]] : []),
    ...(d.hasInference ? [
      ['Deployment',        `${d.inferStudies.toLocaleString()} studies/mo · ${d.deployMonths} mo`],
      ['Effective / study', `${d.effectivePerStudyG} gCO₂e (amortised)`],
    ] : []),
  ];
  const canvas = drawLabelCard({
    title: 'CEDARS AI Research EcoLabel',
    name: d.projectName,
    contextLine: `AI model footprint disclosure \xb7 ${d.date}`,
    scoreDisplay: d.graded ? `${d.score}${d.gradeBasis === 'inference' ? '*' : ''}` : '—',
    leaves: d.leaves, ratingColor: d.ratingColor, ratingBg: d.ratingBg,
    ratingLabel: d.gradeBasis === 'inference' ? `${d.ratingLabel} · inference only` : d.ratingLabel,
    subtext:
      d.gradeBasis === 'amortised' ? `${d.effectivePerStudyG} gCO₂e/study · training + inference`
        : d.gradeBasis === 'inference' ? `${d.perInferCo2g} gCO₂e/study · provisional inference only`
        : d.hasData ? 'Add inference to grade' : 'Enter training data above',
    rows,
    footerText: d.gradeBasis === 'inference'
      ? `* Provisional inference-only score \xb7 training excluded per study \xb7 ${d.date}`
      : `CEDARS modeled operational-intensity score \xb7 ${d.date} \xb7 CC BY 4.0`,
  });
  downloadCanvasPNG(canvas, `cedars_ecolabel_${(d.projectName || 'untitled').replace(/\W+/g, '_')}.png`);
}

const CHART_COLORS = ['#2E7D32','#26A69A','#66BB6A','#4DB6AC','#A5D6A7','#80CBC4'];

// Smart unit formatters — switch unit at sensible thresholds
const fmtCo2 = kg  => kg  >= 1000 ? `${rnd(kg/1000, 2)} tCO₂e`  : `${Math.round(kg).toLocaleString()} kgCO₂e`;
const fmtKwh = kwh => kwh >= 1000 ? `${rnd(kwh/1000, 1)} MWh`   : `${Math.round(kwh).toLocaleString()} kWh`;
const fmtMoney = (amount, sym) => `${sym}${Math.round(amount).toLocaleString()}`;
const fmtL   = l   => l   >= 1000 ? `${rnd(l/1000, 1)} kL`      : `${Math.round(l).toLocaleString()} L`;
// Large-number formatter for equivalency cards — readable at a glance
const fmtBig = n => {
  if (n === 0)    return '0';
  if (n >= 1e9)   return (n / 1e9).toFixed(1) + ' B';
  if (n >= 1e6)   return (n / 1e6).toFixed(1) + ' M';
  if (n >= 1000)  return Math.round(n).toLocaleString();
  if (n >= 10)    return Math.round(n).toString();
  if (n >= 1)     return n.toFixed(1);
  return n < 0.001 ? '< 0.001' : n.toFixed(3);
};

// getCI / getPrice / currencySym are imported from ./calc.js (single source of truth).

const SEO_BASE = 'https://cedarsleaf.com/';
const SEO_PAGES = {
  landing: {
    title: 'CEDARS | Radiology Sustainability, AI, Cost & Care',
    description: 'CEDARS is a free, open-source platform for radiology departments and AI teams to quantify environmental impact, connect sustainability with cost and clinical care, model interventions, and report results transparently.',
    canonical: SEO_BASE,
  },
  input: {
    title: 'Assessment Context & Input Pathway | CEDARS',
    description: 'Set shared local grid, reporting-period and electricity-cost assumptions, then continue to a Radiology Department or AI Model & Informatics assessment in CEDARS.',
    canonical: SEO_BASE + '?page=input',
  },
  dashboard: {
    title: 'Radiology Department Sustainability Calculator | CEDARS',
    description: 'Measure radiology department energy, carbon, water, cost, resource use, clinical AI effects, and operational efficiency with transparent, editable assumptions.',
    canonical: SEO_BASE + '?page=dashboard',
  },
  ai: {
    title: 'Medical AI Procurement, Deployment & Environmental Footprint | CEDARS',
    description: 'Compare medical AI candidates for procurement or deployment, or assess one model in detail, including carbon per study, training, inference, compute, validation and clinical context.',
    canonical: SEO_BASE + '?page=ai',
  },
  ecolabel: {
    title: 'CEDARS Department EcoLabel | Radiology Sustainability Reporting',
    description: 'Generate a standardized CEDARS Department EcoLabel and disclosure checklist from radiology sustainability, efficiency, resource, cost, and current-practice data.',
    canonical: SEO_BASE + '?page=ecolabel',
  },
  ecolabelAi: {
    title: 'CEDARS AI Research EcoLabel | AI Environmental Reporting',
    description: 'Create a standardized environmental disclosure for a medical AI model covering training, validation, inference, deployment, compute, and performance context.',
    canonical: SEO_BASE + '?page=ecolabel&label=ai',
  },
  scenario: {
    title: 'Improve Radiology Sustainability | CEDARS',
    description: 'Model prospective radiology sustainability interventions and compare projected energy, carbon, financial, operational, and EcoLabel effects before implementation.',
    canonical: SEO_BASE + '?page=scenario',
  },
  report: {
    title: 'Report & Share CEDARS Assessments | Radiology Sustainability Reporting',
    description: 'Complete a reproducible CEDARS disclosure, document current sustainability practices, export reporting outputs, and optionally share or contribute an assessment.',
    canonical: SEO_BASE + '?page=report',
  },
  reportAi: {
    title: 'Report AI Environmental Footprint | CEDARS AI Research EcoLabel',
    description: 'Complete, export, and optionally share a reproducible CEDARS AI environmental disclosure covering training, inference, compute, deployment, performance, and water context.',
    canonical: SEO_BASE + '?page=report&label=ai',
  },
  about: {
    title: 'About CEDARS | Radiology Sustainability Collaborative',
    description: 'Meet the international CEDARS collaborative advancing transparent, reproducible sustainability assessment and reporting across radiology and medical AI.',
    canonical: SEO_BASE + '?page=about',
  },
};

// URL hash state persistence lives in ./urlstate.js (encodeConfig / decodeConfig): it serialises
// the full configuration — department settings + equipment + storage + cost, the AI scenario, and
// the selected interventions — so a shared link reproduces the whole setup. SETTINGS_DEFAULTS and
// SCEN_DEFAULTS are the single source of truth for the initial `settings` / `scen` state below.

function WorkflowRail({page, onInput, onDepartment, onAi, onScore, onImprove, onReport}) {
  const stage = page === 'input' || page === 'dashboard' || page === 'ai' ? 1 : page === 'ecolabel' ? 2 : page === 'scenario' ? 3 : page === 'report' ? 4 : 0;
  const selectedInput = page === 'dashboard' ? 'dashboard' : page === 'ai' ? 'ai' : '';
  return (
    <div className="workflowRailWrap" aria-label="CEDARS workflow navigation">
      <div className="workflowRail">
        {/* Step 1 carries the pathway choice as two small chips (same style as the Home page's quick-start chips). */}
        <div className={`workflowRailStep ${stage===1?'active':''}`}>
          <button type="button" className="workflowRailLabel workflowRailLabelButton" onClick={onInput}><span>1</span><strong>INPUT</strong></button>
          <div className="pathwayChips" role="group" aria-label="Pathway">
            <button type="button" className={selectedInput==='dashboard'?'on':''} aria-pressed={selectedInput==='dashboard'} onClick={onDepartment}>Radiology Department</button>
            <button type="button" className={selectedInput==='ai'?'on':''} aria-pressed={selectedInput==='ai'} onClick={onAi}>AI Model &amp; Informatics</button>
          </div>
        </div>
        <button type="button" className={`workflowRailStep action ${stage===2?'active':''}`} onClick={onScore}>
          <div className="workflowRailLabel"><span>2</span><strong>SCORE &amp; ECOLABEL</strong></div>
          <small>Score + label</small>
        </button>
        <button type="button" className={`workflowRailStep action ${stage===3?'active':''}`} onClick={onImprove}>
          <div className="workflowRailLabel"><span>3</span><strong>IMPROVE</strong></div>
          <small>Model changes</small>
        </button>
        <button type="button" className={`workflowRailStep action ${stage===4?'active':''}`} onClick={onReport}>
          <div className="workflowRailLabel"><span>4</span><strong>REPORT (&amp; SHARE)</strong></div>
          <small>Disclosure + outputs</small>
        </button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') return 'landing';
    const requested = new URLSearchParams(window.location.search).get('page');
    return ['landing','input','dashboard','ai','ecolabel','scenario','report','about'].includes(requested) ? requested : 'landing';
  });
  const [guidedDemo, setGuidedDemo] = useState(null);
  const [guidedDemoSaved, setGuidedDemoSaved] = useState(null);
  const [guidedDemoReturnView, setGuidedDemoReturnView] = useState(null);
  // Assessment Context is the shared first step when a visitor starts from Home. Keep the
  // intended pathway in session state so the page can offer a clear Continue / Return action
  // without changing reproducible direct links such as ?page=ai or ?page=dashboard.
  const [inputTarget, setInputTarget] = useState('');
  const [inputReturnMode, setInputReturnMode] = useState(false);
  // When AI Model & Informatics is opened from Department Clinical AI, keep that origin visible
  // so the user knows why they are here and has a clear path back after entering model details.
  const [aiEntryOrigin, setAiEntryOrigin] = useState('');
  const [aiEntryOriginModelId, setAiEntryOriginModelId] = useState('');
  const [aiExampleLoaded, setAiExampleLoaded] = useState('');
  const [clearClinicalAiConfirmOpen, setClearClinicalAiConfirmOpen] = useState(false);
  // When Score finds a missing prerequisite, remember the exact source field so the return
  // action can open, scroll to, and visibly highlight it instead of dropping the user at a page top.
  const [scoreAttention, setScoreAttention] = useState('');

  // Keep top-level views directly linkable without introducing a router. The calculator state stays
  // in the URL fragment; `?page=about` (etc.) only identifies the visible view.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (page === 'landing') url.searchParams.delete('page'); else url.searchParams.set('page', page);
    history.replaceState(null, '', url.pathname + (url.search || '') + (url.hash || ''));
  }, [page]);

  // Decode a shared link once: the full configuration (settings + equipment + scenario +
  // interventions) is restored into the relevant state objects below.
  const initCfg = useMemo(() => (typeof window !== 'undefined' ? decodeConfig(window.location.hash) : {}), []);
  const rejectedSharedFields = initCfg.rejectedFields || [];
  const { equipment: initEquip, equipmentOverrides: initEquipOverrides, ...initSettings } = initCfg.settings || {};

  // Shared settings — drive all calculations; initialised from the URL hash if present.
  // (storageReformats: 'all' | 'axial' — axial avoids non-essential CT/PET reformats.)
  const [settings, setSettings] = useState(() => ({
    ...SETTINGS_DEFAULTS,
    equipment: {...DEFAULT_EQUIPMENT, ...(initEquip || {})},
    equipmentOverrides: initEquipOverrides || {},
    ...initSettings,
  }));
  // Provenance is intentionally separate from calculator values: it records where a local override
  // came from without changing the calculation. It is kept in local/portable saves and research
  // contributions, but not in the compact shareable URL.
  const [provenance, setProvenance] = useState({equipment:{}});
  const setEquip = (key, val) => set('equipment', {...settings.equipment, [key]: val});
  // Local override for one field of one device type (active_kw/idle_kw/standby_kw/off_kw/scans).
  // Blank clears back to the literature default; provenance records whether an entered value was
  // measured locally, estimated locally, or assumed/other.
  const setEquipOverride = (key, field, val) => {
    set('equipmentOverrides', {
      ...settings.equipmentOverrides,
      [key]: {...(settings.equipmentOverrides[key] || {}), [field]: val},
    });
    if (val === '') {
      setProvenance(p => ({...p, equipment:{...(p.equipment || {}), [key]:{...(p.equipment?.[key] || {}), [field]:''}}}));
    }
  };
  const setEquipProvenance = (key, field, source) => setProvenance(p => ({
    ...p,
    equipment: {...(p.equipment || {}), [key]: {...(p.equipment?.[key] || {}), [field]: source}},
  }));
  // AI scenario (model spec + cloud + scanner state). SCEN_DEFAULTS is the single source of truth
  // (shared with urlstate.js); restored from a shared link when present.
  const [scen, setScen] = useState(() => ({...SCEN_DEFAULTS, ...(initCfg.scen || {})}));
  // Canonical model registry. `scen` is the currently open/editable model; the registry preserves
  // other models referenced by Department deployments so those deployments link rather than copy.
  const initialAiRecord = modelRecordFromScen({...SCEN_DEFAULTS, ...(initCfg.scen || {})});
  const [aiModels, setAiModels] = useState(() => ({[initialAiRecord.id]: initialAiRecord}));
  const [deptModelChoice, setDeptModelChoice] = useState('');

  useEffect(() => {
    const record = modelRecordFromScen(scen);
    setAiModels(models => ({...models, [record.id]: record}));
  }, [scen]);
  const visibleAiModels = useMemo(() => Object.values(aiModels).filter(isVisibleAiModelRecord), [aiModels]);

  const set  = (key, val) => setSettings(s => ({...s, [key]: val}));
  const setS = (key, val) => setScen(s => ({...s, [key]: val}));
  // Logo / brand → Home & start over: clear the department inputs and label back to blank,
  // return to a clean cedarsleaf.com (hash strips at defaults), and scroll to the top.
  const resetToHome = () => {
    setSettings({...SETTINGS_DEFAULTS, equipment: {...DEFAULT_EQUIPMENT}, equipmentOverrides: {}});
    setDeptLabel({
      deptName: '', hospitalName: '', region: '',
      annualKwh: '', annualStudies: '', renewablePct: '0',
      activeInterventions: [], aiTools: [],
    });
    // Also wipe the AI Footprint page (model config, canonical registry, research label, cloud workloads).
    const defaultAiRecord = modelRecordFromScen(SCEN_DEFAULTS);
    setScen({...SCEN_DEFAULTS});
    setAiModels({[defaultAiRecord.id]: defaultAiRecord});
    setDeptModelChoice('');
    setProvenance({equipment:{}});
    setScenarioInterventions([]);
    setDeptSetupOpen(true);
    setEcoLabelMode('department');
    setCloudTracker({
      renewablePct: '0', computeLines: [],
      storageLines: [{id: 1, label: 'PACS archive', type: 'HDD (object storage — S3 / Blob)', tb: '10'}],
      networkingGb: '500',
    });
    setPage('landing');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };
  // Load a library entry as an editable starting point — seeds every model field.
  const setModel = key => {
    const m = AI_MODEL_BY_KEY[key] ?? AI_MODEL_LIBRARY[0];
    setScen(s => ({
      ...s, modelKey: key, taskType: LIB_TASK[key] || 'Other', architecture: m.architecture,
      paramsM: String(m.paramsM), dim: m.dim, resolution: String(m.resolution), slices: String(m.slices), inferSec: '', inferKwh: '',
      whPer1kTokens: m.whPer1kTokens!=null?String(m.whPer1kTokens):'', callsPerTask: m.callsPerTask!=null?String(m.callsPerTask):'1', tokensPerCall: m.tokensPerCall!=null?String(m.tokensPerCall):'',
      accuracyPct: String(m.accuracyPct), accuracyMetric: m.accuracyMetric,
      scanTimeReductPct: String(m.scanTimeReductPct), lowValueReductPct: String(m.lowValueReductPct),
    }));
  };
  // Provider + region are shared between the AI lifecycle math and the Infrastructure tab.
  // Changing provider resets region to that provider's first (cleanest-listed) region.
  const setCloudProvider = prov => setScen(s => ({
    ...s, cloudProvider: prov,
    cloudRegion: Object.keys(CLOUD_REGIONS[prov]?.regions ?? {})[0] ?? '',
  }));
  const goToAssessmentContext = (returnTo = '', returnMode = false) => {
    setInputTarget(returnTo); setInputReturnMode(returnMode);
    setPage('input');
    window.setTimeout(() => document.getElementById('assessment-context-title')?.scrollIntoView({behavior:'smooth', block:'start'}), 60);
  };
  // Cross-page workflow links should land on the relevant section, not merely the top of the page.
  // The calculator state remains in memory while switching pages; this only changes the visible view.
  const goToWorkflowSection = (targetPage, sectionId) => {
    if (targetPage === 'ecolabel' || targetPage === 'report') setEcoLabelMode('department');
    setPage(targetPage);
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({behavior:'smooth', block:'start'}), 60);
  };
  // Score/EcoLabel product cards are real navigation controls. If that product is incomplete,
  // land on the actionable readiness explanation rather than scrolling past it to an empty score.
  const selectEcoScore = mode => {
    setEcoLabelMode(mode);
    window.setTimeout(() => {
      const readiness = mode === 'ai' ? aiScoreReadiness : departmentScoreReadiness;
      const target = readiness.ready ? (mode === 'ai' ? 'ai-score-panel' : 'department-score-panel') : `score-readiness-${mode}`;
      document.getElementById(target)?.scrollIntoView({behavior:'smooth', block:'start'});
    }, 60);
  };
  const [aiOpen, setAiOpen] = useState({model:true});
  // Procurement comparison workload: source and numeric value are both persisted, so a shared
  // link reproduces not only 5,100 studies/mo but whether it was a published preset, the current
  // Radiology Department volume, or a user-entered value.
  const compareCtx = scen.compareVolumeSource || 'small';
  const applyCompareCtx = source => {
    const deptVolume = departmentStudiesPerMonth;
    const preset = VOLUME_ESTIMATES.find(v => v.key === source);
    const nextVolume = source === 'department' && deptVolume > 0 ? deptVolume
      : preset ? preset.studiesPerMonth : null;
    setScen(s => ({
      ...s,
      compareVolumeSource: source,
      ...(nextVolume != null ? {inferStudiesMonth: String(nextVolume)} : {}),
    }));
  };
  // Worked examples replace the AI model record (never the Department). Built-in comparison
  // examples carry a versioned preset key so their standard candidate list can reopen by URL.
  const loadAiExample = key => {
    const ex = AI_EXAMPLES.find(e => e.key === key); if (!ex) return;
    const region = ex.scen.cloudRegion || Object.keys(CLOUD_REGIONS[ex.scen.cloudProvider]?.regions ?? {})[0] || '';
    setAiExampleLoaded(key);
    setScen({...SCEN_DEFAULTS, ...ex.scen, modelId:`example-${key}`, projectName:ex.scen.projectName || ex.title, cloudRegion: region, comparePreset:ex.bench?`${key}-v1`:'', compareCandidateKeys:ex.bench?referenceCandidateSpec(ex.bench):''});
    if (ex.bench) {
      setBenchModels(ex.bench.map((b, i) => ({...benchCfgFromLib(b.modelKey), ...b, id: `ex-${key}-${i}`})));
      setAiOpen(o => ({...o, benchmark: true}));
    }
    window.setTimeout(() => window.scrollTo({top: 0, behavior: 'smooth'}), 0);
  };
  const toggleAi = id => setAiOpen(o => ({...o, [id]: !o[id]}));
  const [trainExpanded, setTrainExpanded] = useState(false);
  const [modelExpanded, setModelExpanded] = useState(false);
  const [advEquipExpanded, setAdvEquipExpanded] = useState(false);
  const [deptSetupOpen, setDeptSetupOpen] = useState(true);
  const [scenarioInterventions, setScenarioInterventions] = useState(() => initCfg.activeInterventions || []);
  const [ecoLabelMode, setEcoLabelMode] = useState(() => {
    if (typeof window === 'undefined') return 'department';
    return new URLSearchParams(window.location.search).get('label') === 'ai' ? 'ai' : 'department';
  });
  const [improveAiStage, setImproveAiStage] = useState(() => scen.aiRoute==='compare'||scen.ownMode==='spec' ? 'procure' : 'develop');
  const [improveAiLifecycleStep, setImproveAiLifecycleStep] = useState(() => scen.aiRoute==='compare'||scen.ownMode==='spec' ? 'compare' : 'build');
  const [improveDeptStage, setImproveDeptStage] = useState('order');

  // Keep the selected EcoLabel product directly linkable, and update page-level metadata for
  // traditional and AI-powered search engines after client-side navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if ((page === 'ecolabel' || page === 'report') && ecoLabelMode === 'ai') url.searchParams.set('label', 'ai');
    else url.searchParams.delete('label');
    history.replaceState(null, '', url.pathname + (url.search || '') + (url.hash || ''));

    const seoKey = page === 'ecolabel' && ecoLabelMode === 'ai' ? 'ecolabelAi' : page === 'report' && ecoLabelMode === 'ai' ? 'reportAi' : page;
    const seo = SEO_PAGES[seoKey] || SEO_PAGES.landing;
    document.title = seo.title;
    const setMeta = (selector, attr, value) => {
      const el = document.head.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    setMeta('meta[name=\"description\"]', 'content', seo.description);
    setMeta('meta[property=\"og:title\"]', 'content', seo.title);
    setMeta('meta[property=\"og:description\"]', 'content', seo.description);
    setMeta('meta[property=\"og:url\"]', 'content', seo.canonical);
    setMeta('meta[name=\"twitter:title\"]', 'content', seo.title);
    setMeta('meta[name=\"twitter:description\"]', 'content', seo.description);
    const canonical = document.head.querySelector('link[rel=\"canonical\"]');
    if (canonical) canonical.setAttribute('href', seo.canonical);
  }, [page, ecoLabelMode]);

  // Scenario tab mode + AI procurement shortlist. Procure / Deploy starts with two editable,
  // like-for-like candidate slots rather than asking the user to build one model and overwrite it.
  const makeDefaultBenchModels = (modelKey = scen.modelKey || 'cad') => [
    {...benchCfgFromLib(modelKey), id:'candidate-a', label:'Candidate A', scanTimeReductPct:'0', lowValueReductPct:'0', validationBasis:'Not specified', intendedUse:'', vendor:'', regulatoryStatus:'Not specified', integrationPath:'Not specified'},
    {...benchCfgFromLib(modelKey), id:'candidate-b', label:'Candidate B', scanTimeReductPct:'0', lowValueReductPct:'0', validationBasis:'Not specified', intendedUse:'', vendor:'', regulatoryStatus:'Not specified', integrationPath:'Not specified'},
  ];
  const [benchModels, setBenchModels] = useState(() => {
    const preset=benchFromComparisonPreset(scen.comparePreset), linked=benchFromReferenceCandidateSpec(scen.compareCandidateKeys);
    return preset.length?preset:linked.length?linked:(scen.aiRoute==='compare'?makeDefaultBenchModels(scen.modelKey):[]);
  });
  useEffect(()=>{ if(scen.aiRoute!=='compare')return; const next=referenceCandidateSpec(benchModels); if(next!==scen.compareCandidateKeys)setScen(s=>({...s,compareCandidateKeys:next})); },[benchModels,scen.aiRoute,scen.compareCandidateKeys]);
  const ensureBenchModels = () => setBenchModels(list => list.length ? list : makeDefaultBenchModels());
  const startComparisonFromCurrent = () => {
    const first={...pickAiCfg(scen),id:'candidate-a',label:scen.projectName||AI_MODEL_BY_KEY[scen.modelKey]?.label||'Current model',validationBasis:'Not specified',intendedUse:'',vendor:'',regulatoryStatus:'Not specified',integrationPath:'Not specified'};
    const second={...benchCfgFromLib(scen.modelKey||'cad'),id:'candidate-b',label:'Candidate B',validationBasis:'Not specified',intendedUse:'',vendor:'',regulatoryStatus:'Not specified',integrationPath:'Not specified'};
    setBenchModels([first,second]); setScen(s=>({...s,aiRoute:'compare',ownMode:'spec',comparePreset:'',compareCandidateKeys:referenceCandidateSpec([first,second])})); setAiOpen(o=>({...o,benchmark:true}));
  };
  const addBenchModel = () => { setS('comparePreset',''); setBenchModels(list => {
    if (list.length >= 6) return list;
    const source = list[0]?.modelKey || scen.modelKey || 'cad';
    const letter = String.fromCharCode(65 + list.length);
    return [...list, {...benchCfgFromLib(source), id:Date.now(), label:`Candidate ${letter}`, scanTimeReductPct:'0', lowValueReductPct:'0', validationBasis:'Not specified', intendedUse:'', vendor:'', regulatoryStatus:'Not specified', integrationPath:'Not specified'}];
  }); };
  const removeBenchModel = id => { setS('comparePreset',''); setBenchModels(list => list.length <= 2 ? list : list.filter(m => m.id !== id)); };
  const updateBenchModel = (id, field, value) => { setS('comparePreset',''); setBenchModels(list => list.map(m => m.id === id ? {...m, [field]:value} : m)); };
  const updateBenchTemplate = (id, modelKey) => { setS('comparePreset',''); setBenchModels(list => list.map(m => {
    if (m.id !== id) return m;
    return {...benchCfgFromLib(modelKey), id:m.id, label:m.label, scanTimeReductPct:m.scanTimeReductPct || '0', lowValueReductPct:m.lowValueReductPct || '0', validationBasis:m.validationBasis || 'Not specified', intendedUse:m.intendedUse || '', vendor:m.vendor || '', regulatoryStatus:m.regulatoryStatus || 'Not specified', integrationPath:m.integrationPath || 'Not specified'};
  })); };
  const updateBenchLabel = (id, label) => updateBenchModel(id, 'label', label);
  const useBenchModel = id => {
    const chosen = benchModels.find(m => m.id === id);
    if (!chosen) return;
    setScen(s => ({
      ...s, ...pickAiCfg(chosen),
      // Comparison context is shared; choosing a candidate must not silently replace it with the
      // template's default provider/region.
      cloudProvider:s.cloudProvider, cloudRegion:s.cloudRegion, customPue:'', renewablePct:'0',
      trainingProvider:'', trainingRegion:'', trainingPue:'', trainingRenewablePct:'',
      inferenceProvider:'', inferenceRegion:'', inferencePue:'', inferenceRenewablePct:'',
      inferStudiesMonth:s.inferStudiesMonth, deployMonths:s.deployMonths,
      // Do not leak single-model values from whatever record happened to be open before Compare.
      datasetSize:'', epochs:'', numRuns:'1', trainKwhMeasured:'', trainTool:'', wueOnsite:'', wueOffsite:'', waterMode:'screening',
      modelId:`model-${String(chosen.id).replace(/[^a-z0-9-]/gi,'-').toLowerCase()}`, projectName:chosen.label || s.projectName,
      taskType:LIB_TASK[chosen.modelKey] || s.taskType, trainDisclosed:'yes',
      performanceValidationContext:[s.compareEndpoint,s.compareCohort].filter(Boolean).join(' · ') || chosen.performanceValidationContext || chosen.validationBasis || s.performanceValidationContext,
      aiRoute:'own', ownMode:'spec', comparePreset:'', compareCandidateKeys:'',
    }));
    setAiOpen(o => ({...o, benchmark:false, model:true}));
    window.setTimeout(() => window.scrollTo({top:0, behavior:'smooth'}), 0);
  };
  const [dashOpen, setDashOpen] = useState({clinicalai:true});
  const toggleDash = id => setDashOpen(o => ({...o, [id]: !o[id]}));
  const openDash   = id => { setDashOpen(o => ({...o, [id]: true})); setTimeout(()=>document.getElementById('dash-'+id)?.scrollIntoView({behavior:'smooth',block:'start'}), 50); };
  const [equivScope, setEquivScope] = useState('scope2');
  const [showAiWorkloadExplore, setShowAiWorkloadExplore] = useState(false);
  const [aiWorkloadPreview, setAiWorkloadPreview] = useState('');
  const [ecoCopied, setEcoCopied] = useState(false);
  const [aiParagraphCopied, setAiParagraphCopied] = useState(false);
  // The label is a view of the model record: read via `ecoLabel` (derived below, after `ai`),
  // written through `setEco`, which maps the label's field names onto the record.
  const setEco = (key, val) => {
    const skey = LABEL_TO_SCEN[key];
    if (!skey) return;
    setScen(sc => ({...sc, [skey]: typeof val === 'boolean' ? (val ? sc[skey] : '') : val}));
  };
  const [deptCopied, setDeptCopied] = useState(false);
  const [deptLabel, setDeptLabel] = useState(() => ({
    deptName: '', hospitalName: '', region: '',
    annualKwh: '', annualStudies: '', renewablePct: '0',
    activeInterventions: initCfg.currentPractices || [], aiTools: [],
  }));
  const setDept = (key, val) => setDeptLabel(d => ({...d, [key]: val}));
  const toggleIntervention = name => setDeptLabel(d => ({
    ...d,
    activeInterventions: d.activeInterventions.includes(name)
      ? d.activeInterventions.filter(x => x !== name)
      : [...d.activeInterventions, name],
  }));
  const toggleScenarioIntervention = name => setScenarioInterventions(list =>
    list.includes(name) ? list.filter(x => x !== name) : [...list, name]
  );
  // Department Clinical AI stores deployment/use configuration only. Canonical technical model
  // fields live in aiModels and are resolved dynamically by modelId. There is intentionally no
  // fixed limit: zero deployments is valid, and departments can add as many local uses as needed.
  const addDeptAiTool    = tool      => setDeptLabel(d => ({...d, aiTools: [...d.aiTools, tool]}));
  const removeDeptAiTool = id        => setDeptLabel(d => ({...d, aiTools: d.aiTools.filter(t => t.id !== id)}));
  const updateDeptAiTool = (id,f,v)  => setDeptLabel(d => ({...d, aiTools: d.aiTools.map(t => t.id === id ? {...t, [f]: v} : t)}));
  const updateDeptModelUses = (modelId,f,v) => setDeptLabel(d => ({...d, aiTools:d.aiTools.map(t => t.modelId === modelId ? {...t,[f]:v} : t)}));
  const libraryRecordFor = key => {
    const m = AI_MODEL_BY_KEY[key];
    if (!m) return null;
    const id = `library-${key}`;
    const cfg = {...SCEN_DEFAULTS, ...benchCfgFromLib(key), modelId:id, projectName:m.label, aiRoute:'own', ownMode:'spec'};
    return modelRecordFromScen(cfg);
  };
  const registerLibraryModel = key => {
    const record = libraryRecordFor(key);
    if (!record) return;
    setAiModels(models => models[record.id] ? models : ({...models, [record.id]:record}));
    setDeptModelChoice(record.id);
  };
  const addDeptDeployment = modelId => {
    const record = aiModels[modelId];
    if (!record) return;
    const cfg = modelScenFromRecord(record, SCEN_DEFAULTS);
    addDeptAiTool({
      id:Date.now(), modelId, label:'', studiesShare:'100', deployMonths:String(cfg.deployMonths || '36'), trainingBoundary:'upstream', trainingAllocationPct:'100',
      embodiedBoundary:'upstream', embodiedAllocationPct:'100', effectBasis:'none',
      lowValueReductPct:'0', scanTimeReductPct:'0', contrastReductPct:'0',
    });
  };
  const loadClinicalAiExample = () => {
    const triage = libraryRecordFor('cad');
    const recon = libraryRecordFor('recon');
    if (!triage || !recon) return;
    setAiModels(models => ({...models, [triage.id]:triage, [recon.id]:recon}));
    setDeptModelChoice(triage.id);
    setDeptLabel(d => ({...d, aiTools:[
      {id:'example-triage', modelId:triage.id, label:'ED triage', studiesShare:'100', deployMonths:'36', trainingBoundary:'upstream', trainingAllocationPct:'100', embodiedBoundary:'upstream', embodiedAllocationPct:'100', effectBasis:'scenario', lowValueReductPct:'0', scanTimeReductPct:'0', contrastReductPct:'0'},
      {id:'example-recon', modelId:recon.id, label:'MRI reconstruction', studiesShare:'35', deployMonths:'36', trainingBoundary:'upstream', trainingAllocationPct:'100', embodiedBoundary:'upstream', embodiedAllocationPct:'100', effectBasis:'scenario', lowValueReductPct:'0', scanTimeReductPct:'20', contrastReductPct:'0'},
    ]}));
  };
  const clearClinicalAi = () => {
    setDeptLabel(d => ({...d, aiTools:[]}));
    setDeptModelChoice('');
    setAiExampleLoaded('');
    setClearClinicalAiConfirmOpen(false);
  };
  const requestClearClinicalAi = () => {
    if ((deptLabel.aiTools || []).length > 0) setClearClinicalAiConfirmOpen(true);
    else clearClinicalAi();
  };
  const loadAiModelRecord = modelId => {
    const record = aiModels[modelId];
    if (!record) return;
    setScen({...modelScenFromRecord(record, SCEN_DEFAULTS), aiRoute:'own', ownMode:'spec'});
    setDeptModelChoice(modelId);
    setPage('ai');
    window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0);
  };

  const createBlankAiRecord = (selectForDepartment = false) => {
    const id = `model-${Date.now()}`;
    setAiExampleLoaded('');
    setScen({...SCEN_DEFAULTS, modelId:id, modelKey:'custom', projectName:'', taskType:'', paramsM:'', accuracyPct:'', accuracyMetric:'', trainGpu:'', trainHours:'', trainKwhMeasured:'', inferKwh:'', inferStudiesMonth:'', aiRoute:'', ownMode:'measured'});
    if (selectForDepartment) setDeptModelChoice(id); setBenchModels([]); setAiOpen(o=>({...o,benchmark:false,model:true})); return id;
  };
  const openAiModelWorkspaceFromDepartment = (modelId = '', createNew = false) => {
    setAiEntryOrigin('department'); setAiEntryOriginModelId(modelId || deptModelChoice || '');
    if (createNew) { createBlankAiRecord(true); setPage('ai'); window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); }
    else if (modelId && aiModels[modelId]) loadAiModelRecord(modelId);
    else { setS('aiRoute',''); setPage('ai'); window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); }
  };
  const returnToClinicalAi = () => {
    if (aiEntryOriginModelId && aiModels[aiEntryOriginModelId]) setDeptModelChoice(aiEntryOriginModelId);
    setAiEntryOrigin(''); setAiEntryOriginModelId(''); setAiExampleLoaded(''); setPage('dashboard'); setDeptSetupOpen(false); setDashOpen(o=>({...o,clinicalai:true}));
    window.setTimeout(()=>document.getElementById('department-clinical-ai-input')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  };
  const openAiModelsFromImprove = () => { setAiEntryOrigin('improve'); setPage('ai'); window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); };
  const returnToAiImprove = () => { setAiEntryOrigin(''); setPage('scenario'); setEcoLabelMode('ai'); window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); };
  const startBlankAiRecord = () => { createBlankAiRecord(); };
  const useLoadedExampleAsStartingPoint = () => {
    const oldId = scen.modelId, id = `model-${Date.now()}`;
    setAiExampleLoaded(''); setScen(s=>({...s,modelId:id,projectName:s.projectName || AI_EXAMPLES.find(e=>e.key===aiExampleLoaded)?.title || 'AI model'})); if (aiEntryOrigin==='department') setDeptModelChoice(id);
    if (oldId?.startsWith('example-')) setAiModels(models=>{const next={...models};if(!(deptLabel.aiTools||[]).some(t=>t.modelId===oldId))delete next[oldId];return next;});
  };

  // Provider + region now live in `scen` (shared with AI lifecycle).  // Provider + region now live in `scen` (shared with AI lifecycle). This holds only the
  // extra Infrastructure-tab workloads layered on top of the auto-seeded AI training/inference.
  const [cloudTracker, setCloudTracker] = useState({
    renewablePct: '0',
    computeLines: [],
    storageLines: [
      {id: 1, label: 'PACS archive', type: 'HDD (object storage — S3 / Blob)', tb: '10'},
    ],
    networkingGb: '500',
  });
  const setCloud    = (key, val) => setCloudTracker(t => ({...t, [key]: val}));
  const addComputeLine = () => setCloudTracker(t => ({...t, computeLines: [...t.computeLines, {id: Date.now(), label: '', instance: 'CPU: Medium (8–16 vCPU, 32–64 GB)', count: '1', hoursPerMonth: '720', customWatt: ''}]}));
  const removeComputeLine = id => setCloudTracker(t => ({...t, computeLines: t.computeLines.filter(l => l.id !== id)}));
  const updateComputeLine = (id, field, val) => setCloudTracker(t => ({...t, computeLines: t.computeLines.map(l => l.id === id ? {...l, [field]: val} : l)}));
  const addStorageLine = () => setCloudTracker(t => ({...t, storageLines: [...t.storageLines, {id: Date.now(), label: '', type: 'HDD (object storage — S3 / Blob)', tb: '1'}]}));
  const removeStorageLine = id => setCloudTracker(t => ({...t, storageLines: t.storageLines.filter(l => l.id !== id)}));
  const updateStorageLine = (id, field, val) => setCloudTracker(t => ({...t, storageLines: t.storageLines.map(l => l.id === id ? {...l, [field]: val} : l)}));

  const [localSavedAt, setLocalSavedAt] = useState(() => {
    const saved = loadLocalAssessment();
    return saved.ok ? saved.value.savedAt : null;
  });
  const [saveShareStatus, setSaveShareStatus] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);

  const currentAssessmentSnapshot = () => buildAssessmentSnapshot({
    settings, scen, deptLabel, ecoLabel, ecoLabelTouched: false, cloudTracker, provenance, scenarioInterventions,
    aiModels, activeAiModelId: scen.modelId, aiDeployments: deptLabel.aiTools,
    aiComparison: {candidates: benchModels},
    // Store the exact disclosure outputs currently shown in Report (& Share) so research
    // contributions do not require reconstructing derived values from raw inputs later.
    disclosure: {
      department: {
        departmentName: deptLabelData.deptName,
        hospitalName: deptLabelData.hospitalName,
        region: deptLabelData.region,
        usingLiveDepartmentValues: deptLabelData.isLive,
        annualKwh: deptLabelData.annualKwh,
        annualStudies: deptLabelData.annualStudies,
        renewablePct: deptLabelData.renewablePct,
        gridCiKgCo2ePerKwh: deptLabelData.ci,
        effectiveGridCiKgCo2ePerKwh: deptLabelData.effectiveCi,
        annualCo2Kg: deptLabelData.totalAnnualCo2,
        kwhPerStudy: deptLabelData.kwhPerStudy,
        co2KgPerStudy: deptLabelData.co2PerStudy,
        fleetUtilizationPct: deptLabelData.utilPct,
        clinicalAiToolCount: deptLabelData.clinicalToolCount,
        currentPracticeCount: deptLabelData.interventionCount,
        currentPractices: [...deptLabel.activeInterventions],
        score: deptLabelData.score,
        ratingLeaves: deptLabelData.leaves,
        ratingLabel: deptLabelData.ratingLabel,
        reportingMonth: deptLabelData.date,
      },
      ai: {
        projectName: ecoLabelData.projectName,
        taskType: ecoLabelData.taskType,
        architecture: ecoLabelData.architecture,
        parameters: ecoLabelData.paramsMillion,
        datasetSize: ecoLabelData.datasetSize,
        gpuHardware: ecoLabelData.gpuHardware,
        trainingRuns: ecoLabelData.numRuns,
        totalGpuHours: ecoLabelData.totalGpuHours,
        energyPerRunKwh: ecoLabelData.energyPerRunKwh,
        totalTrainingEnergyKwh: ecoLabelData.totalEnergyKwh,
        trainingCo2Kg: ecoLabelData.trainCo2,
        energyMeasured: ecoLabelData.energyMeasured,
        trainingProvider: ecoLabelData.trainingProvider,
        trainingRegion: ecoLabelData.trainingRegion,
        trainingPue: ai.trainPue,
        trainingGridCiKgCo2ePerKwh: ai.trainingCi,
        inferenceProvider: ecoLabelData.inferenceProvider,
        inferenceRegion: ecoLabelData.inferenceRegion,
        inferencePue: ai.inferPue,
        inferenceGridCiKgCo2ePerKwh: ai.inferenceCi,
        waterLitres: ecoLabelData.waterLitres,
        inferenceStudiesPerMonth: ecoLabelData.inferStudies,
        inferenceEnergyKwhPerStudy: ecoLabelData.inferKwhPerStudy,
        inferenceMonthlyKwh: ecoLabelData.inferMonthlyKwh,
        inferenceMonthlyCo2Kg: ecoLabelData.inferCo2Month,
        deploymentMonths: ecoLabelData.deployMonths,
        lifetimeInferences: ecoLabelData.lifetimeInferences,
        inferenceCo2GPerStudy: ecoLabelData.perInferCo2g,
        amortizedTrainingCo2GPerStudy: ecoLabelData.trainPerStudyG,
        effectiveCo2GPerStudy: ecoLabelData.effectivePerStudyG,
        gradeBasis: ecoLabelData.gradeBasis,
        score: ecoLabelData.score,
        ratingLeaves: ecoLabelData.leaves,
        ratingLabel: ecoLabelData.ratingLabel,
        reportingMonth: ecoLabelData.date,
      },
    },
  });

  const restoreAssessmentSnapshot = snapshot => {
    const a = snapshot.assessment || {};
    const aiState = migrateLegacyAiState(a);
    const incomingSettings = a.settings || {};
    const {equipment = {}, equipmentOverrides = {}, ...otherSettings} = incomingSettings;
    setSettings({
      ...SETTINGS_DEFAULTS,
      ...otherSettings,
      equipment: {...DEFAULT_EQUIPMENT, ...equipment},
      equipmentOverrides,
    });
    const restoredScen = migrateLegacyLabel({...SCEN_DEFAULTS, ...(a.scen || {})}, a.ecoLabel, !!a.ecoLabelTouched);
    setScen(restoredScen);
    setAiModels(aiState.aiModels || {[restoredScen.modelId]:modelRecordFromScen(restoredScen)});
    const restoredCandidates = Array.isArray(a.aiComparison?.candidates) ? a.aiComparison.candidates : [];
    setBenchModels(restoredCandidates.length ? restoredCandidates : (restoredScen.aiRoute === 'compare' ? makeDefaultBenchModels(restoredScen.modelKey) : []));
    setDeptModelChoice(aiState.aiDeployments?.[0]?.modelId || '');
    const restoredTools = Array.isArray(aiState.aiDeployments) ? aiState.aiDeployments.map(toolFromDeployment) : (a.deptLabel?.aiTools || []);
    setDeptLabel({
      deptName:'', hospitalName:'', region:'', annualKwh:'', annualStudies:'', renewablePct:'0', activeInterventions:[], aiTools:[],
      ...(a.deptLabel || {}), aiTools: restoredTools,
    });
    setCloudTracker(t => ({...t, ...(a.cloudTracker || {})}));
    setProvenance(a.provenance || {equipment:{}});
    setScenarioInterventions(a.scenarioInterventions || a.deptLabel?.activeInterventions || []);
    setDeptSetupOpen(false);
    setPage('landing');
  };

  const applyLeaderDemoFleet = () => {
    const preset = DEPARTMENT_PRESETS.find(p => p.key === 'regional');
    if (!preset) return;
    setSettings(s => ({
      ...s,
      equipment: Object.fromEntries(Object.keys(DEFAULT_EQUIPMENT).map(k => [k, preset.equipment[k] || 0])),
    }));
  };

  const prepareGuidedDemoStep = (kind, stepIndex) => {
    if (kind === 'leader') {
      if (stepIndex === 0) {
        setPage('landing');
      } else if (stepIndex === 1) {
        setInputTarget('dashboard');
        setInputReturnMode(false);
        setPage('input');
      } else if (stepIndex === 2) {
        setPage('dashboard');
        setDeptSetupOpen(true);
      } else if (stepIndex === 3) {
        applyLeaderDemoFleet();
        setPage('dashboard');
        setDeptSetupOpen(false);
      } else if (stepIndex === 4) {
        applyLeaderDemoFleet();
        setPage('dashboard');
        setDeptSetupOpen(false);
        setDashOpen(o => ({...o, clinicalai:true}));
      } else if (stepIndex === 5) {
        applyLeaderDemoFleet();
        loadClinicalAiExample();
        setEcoLabelMode('department');
        setPage('ecolabel');
      } else if (stepIndex === 6) {
        applyLeaderDemoFleet();
        loadClinicalAiExample();
        setEcoLabelMode('department');
        setPage('scenario');
      } else if (stepIndex === 7) {
        applyLeaderDemoFleet();
        loadClinicalAiExample();
        setEcoLabelMode('department');
        setPage('report');
      }
      return;
    }

    if (kind === 'developer') {
      if (stepIndex === 0) {
        setPage('landing');
      } else if (stepIndex === 1) {
        setAiExampleLoaded('');
        setScen({...SCEN_DEFAULTS, ownMode:'measure'});
        setPage('ai');
      } else if (stepIndex === 2 || stepIndex === 3) {
        setAiExampleLoaded('');
        setScen(s => ({...s, aiRoute:'own', ownMode:'measure'}));
        setPage('ai');
      } else if (stepIndex === 4 || stepIndex === 5) {
        setPage('ai');
        loadAiExample('cxr-measured');
      } else if (stepIndex === 6) {
        loadAiExample('cxr-measured');
        setEcoLabelMode('ai');
        setPage('ecolabel');
      } else if (stepIndex === 7) {
        loadAiExample('cxr-measured');
        setEcoLabelMode('ai');
        setPage('report');
      }
    }
  };

  const startGuidedDemo = kind => {
    setGuidedDemoSaved(currentAssessmentSnapshot());
    setGuidedDemoReturnView({
      page, ecoLabelMode, deptSetupOpen, dashOpen, inputTarget, inputReturnMode,
      aiEntryOrigin, aiEntryOriginModelId, aiExampleLoaded,
    });
    resetToHome();
    setGuidedDemo({kind, step:0});
    prepareGuidedDemoStep(kind, 0);
  };

  const moveGuidedDemo = step => {
    if (!guidedDemo) return;
    setGuidedDemo({...guidedDemo, step});
    prepareGuidedDemoStep(guidedDemo.kind, step);
  };

  const restartGuidedDemo = () => {
    if (!guidedDemo) return;
    resetToHome();
    setGuidedDemo({...guidedDemo, step:0});
    prepareGuidedDemoStep(guidedDemo.kind, 0);
  };

  const exitGuidedDemo = () => {
    const snapshot = guidedDemoSaved;
    const view = guidedDemoReturnView;
    setGuidedDemo(null);
    setGuidedDemoSaved(null);
    setGuidedDemoReturnView(null);
    if (!snapshot) return;
    restoreAssessmentSnapshot(snapshot);
    if (view) {
      setEcoLabelMode(view.ecoLabelMode);
      setDeptSetupOpen(view.deptSetupOpen);
      setDashOpen(view.dashOpen);
      setInputTarget(view.inputTarget);
      setInputReturnMode(view.inputReturnMode);
      setAiEntryOrigin(view.aiEntryOrigin);
      setAiEntryOriginModelId(view.aiEntryOriginModelId);
      setAiExampleLoaded(view.aiExampleLoaded);
      setPage(view.page);
    }
  };

  const keepGuidedDemoExample = () => {
    setGuidedDemo(null);
    setGuidedDemoSaved(null);
    setGuidedDemoReturnView(null);
  };

  const saveOnThisDevice = () => {
    const snapshot = currentAssessmentSnapshot();
    const result = saveAssessmentLocally(snapshot);
    if (result.ok) {
      setLocalSavedAt(snapshot.savedAt);
      setSaveShareStatus({type:'success', text:'Saved in this browser only. For a durable backup, also download a CEDARS file.'});
    } else setSaveShareStatus({type:'error', text:result.error});
  };

  const restoreLocalSave = () => {
    const result = loadLocalAssessment();
    if (!result.ok) return setSaveShareStatus({type:'error', text:result.error});
    restoreAssessmentSnapshot(result.value);
    setSaveShareStatus({type:'success', text:'Restored the CEDARS assessment saved in this browser.'});
  };

  const deleteLocalSave = () => {
    clearLocalAssessment();
    setLocalSavedAt(null);
    setSaveShareStatus({type:'success', text:'Deleted the locally saved browser copy. The current assessment remains open.'});
  };

  const downloadCedarsFile = () => {
    const snapshot = currentAssessmentSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = assessmentFilename(snapshot.savedAt); a.click();
    URL.revokeObjectURL(url);
    setSaveShareStatus({type:'success', text:'Downloaded a portable CEDARS file. Keep it somewhere you control and open it later to continue.'});
  };

  const openCedarsFile = async file => {
    try {
      const result = parseAssessmentText(await file.text());
      if (!result.ok) return setSaveShareStatus({type:'error', text:result.error});
      restoreAssessmentSnapshot(result.value);
      setSaveShareStatus({type:'success', text:`Opened ${file.name}. The file was read locally and was not uploaded.`});
    } catch {
      setSaveShareStatus({type:'error', text:'CEDARS could not open that file.'});
    }
  };

  const copyShareableLink = async () => {
    try {
      const linkScen=scen.aiRoute==='compare'?{...scen,compareCandidateKeys:referenceCandidateSpec(benchModels)}:scen;
      const qs=encodeConfig({settings,scen:linkScen,activeInterventions:scenarioInterventions,currentPractices:deptLabel.activeInterventions});
      const url=new URL(window.location.href); url.hash=qs||'';
      await navigator.clipboard.writeText(url.toString());
      setShareLinkCopied(true);
      setTimeout(()=>setShareLinkCopied(false), 1800);
    } catch {
      setSaveShareStatus({type:'error', text:'Could not copy the link automatically. You can copy the full address from the browser address bar.'});
    }
  };

  const handlePrint = () => { window.print(); };

  // Persist the full configuration to the URL hash so links reproduce the whole setup — department
  // settings + equipment + storage + cost, the AI scenario, and the selected interventions. The
  // hash is stripped whenever everything is back at defaults, keeping cedarsleaf.com clean.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = encodeConfig({ settings, scen, activeInterventions: scenarioInterventions, currentPractices: deptLabel.activeInterventions });
    history.replaceState(null, '', qs ? '#' + qs : window.location.pathname + window.location.search);
  }, [settings, scen, scenarioInterventions, deptLabel.activeInterventions]);

  // Convert Chart.js canvases to static PNG images before printing so they
  // appear in PDF output (canvas elements are often blank in print renderers).
  useEffect(() => {
    const beforePrint = () => {
      document.querySelectorAll('canvas').forEach((canvas, i) => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.style.cssText = 'width:100%;display:block';
        img.dataset.chartProxy = i;
        canvas.insertAdjacentElement('afterend', img);
        canvas.style.display = 'none';
      });
    };
    const afterPrint = () => {
      document.querySelectorAll('img[data-chart-proxy]').forEach(img => img.remove());
      document.querySelectorAll('canvas').forEach(canvas => { canvas.style.display = ''; });
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // Recalculate whenever settings change
  // Deployed clinical AI tools → aggregate adjustment applied to the department dashboard.
  // (Per-study inference rate + amortised training; combined avoided-scan / shorter-protocol /
  // contrast-reduction fractions, stacked multiplicatively.)
  const clinicalAdj = useMemo(() => {
    const tools = deptLabel.aiTools || [];
    let inferKwhPerStudy = 0, aiLocalInferKwhPerStudy = 0, aiCloudInferKwhPerStudy = 0, aiCloudInferCo2PerStudy = 0, avoidKeep = 1, scanKeep = 1, contrastKeep = 1;
    const trainingByModel = new Map();
    const embodiedByModel = new Map();
    tools.forEach(t => {
      const shareRaw = parseFloat(t.studiesShare);
      const share = Number.isFinite(shareRaw) ? Math.min(1, Math.max(0, shareRaw / 100)) : 1;
      const modelRef = t.modelId || `legacy-${String(t.id)}`;
      const record = aiModels[modelRef];
      const cfg = record && !record.legacyDeploymentOnly ? modelScenFromRecord(record, SCEN_DEFAULTS) : null;
      const modelResult = cfg ? aiResultFor(cfg, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides) : null;
      // New deployments inherit technical values from the canonical record. Legacy saves without
      // a complete record retain their copied values as a compatibility fallback.
      const modelInferKwh = modelResult?.inference?.kwhPerStudy ?? (parseFloat(t.inferKwhPerStudy) || 0);
      const modelTrainKwh = modelResult?.training?.kwhTotal ?? (parseFloat(t.trainKwhTotal) || 0);
      const modelEmbodiedKg = modelResult?.embCo2KgTotal ?? (parseFloat(t.embCo2Kg) || 0);
      inferKwhPerStudy += modelInferKwh * share;
      const inferProvider = modelResult?.inferenceContext?.provider || cfg?.inferenceProvider || cfg?.cloudProvider || 'Local compute';
      const inferCi = modelResult?.inferenceCi ?? getCI(settings.region, settings.customCi);
      if (inferProvider === 'Local compute') aiLocalInferKwhPerStudy += modelInferKwh * share;
      else { aiCloudInferKwhPerStudy += modelInferKwh * share; aiCloudInferCo2PerStudy += modelInferKwh * inferCi * share; }
      const months = Math.max(1, parseInt(t.deployMonths) || 36);
      if (t.trainingBoundary === 'allocated-local') {
        const allocationRaw = parseFloat(t.trainingAllocationPct);
        const allocation = Number.isFinite(allocationRaw) ? Math.min(1, Math.max(0, allocationRaw / 100)) : 1;
        const monthly = modelTrainKwh * allocation / months;
        const trainProvider = modelResult?.trainingContext?.provider || cfg?.trainingProvider || cfg?.cloudProvider || 'Local compute';
        const trainCi = modelResult?.trainingCi ?? getCI(settings.region, settings.customCi);
        const prior = trainingByModel.get(modelRef);
        const candidate = {kwh:monthly, co2:monthly*trainCi, local:trainProvider==='Local compute'};
        if (!prior || candidate.kwh > prior.kwh) trainingByModel.set(modelRef, candidate);
      }
      if (t.embodiedBoundary === 'allocated-local') {
        const embAllocationRaw = parseFloat(t.embodiedAllocationPct);
        const embAllocation = Number.isFinite(embAllocationRaw) ? Math.min(1, Math.max(0, embAllocationRaw / 100)) : 1;
        const embodiedMonthly = modelEmbodiedKg * embAllocation / months;
        embodiedByModel.set(modelRef, Math.max(embodiedByModel.get(modelRef) || 0, embodiedMonthly));
      }
      const boundedPct = value => { const n = parseFloat(value); return Number.isFinite(n) ? Math.min(1, Math.max(0, n / 100)) : 0; };
      const currentEffectEligible = t.effectBasis === 'observed-local' || t.effectBasis === 'validated-local';
      if (currentEffectEligible) {
        avoidKeep    *= (1 - boundedPct(t.lowValueReductPct) * share);
        scanKeep     *= (1 - boundedPct(t.scanTimeReductPct) * share);
        contrastKeep *= (1 - boundedPct(t.contrastReductPct) * share);
      }
    });
    const trainingRows=[...trainingByModel.values()];
    const trainKwhMonthly=trainingRows.reduce((s,v)=>s+v.kwh,0);
    const aiLocalTrainKwhMonthly=trainingRows.filter(v=>v.local).reduce((s,v)=>s+v.kwh,0);
    const aiCloudTrainKwhMonthly=trainingRows.filter(v=>!v.local).reduce((s,v)=>s+v.kwh,0);
    const aiCloudTrainCo2Monthly=trainingRows.filter(v=>!v.local).reduce((s,v)=>s+v.co2,0);
    const aiEmbodiedKgMonthly = [...embodiedByModel.values()].reduce((s,v)=>s+v,0);
    return {inferKwhPerStudy, trainKwhMonthly, aiLocalInferKwhPerStudy, aiCloudInferKwhPerStudy, aiCloudInferCo2PerStudy, aiLocalTrainKwhMonthly, aiCloudTrainKwhMonthly, aiCloudTrainCo2Monthly, aiEmbodiedKgMonthly, avoidedFrac: 1 - avoidKeep, scanTimeFrac: 1 - scanKeep, contrastFrac: 1 - contrastKeep, count: tools.length};
  }, [deptLabel.aiTools, aiModels, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides]);
  // Training and embodied allocations are deduplicated by model ID. Math.max makes the result
  // deterministic if two deployment adapters for the same model carry inconsistent legacy
  // amortisation values; the record should still be reconciled before publication. Clinical-effect
  // fractions remain an expected-population approximation when deployed tools overlap on studies.
  const storageCfg = {retentionYears: settings.storageRetentionYears, cloud: settings.storageCloud, reformats: settings.storageReformats, intensityCustom: settings.storageIntensityCustom, provider:settings.storageProvider, region:settings.storageRegion, cloudCi:settings.storageCloudCi, scope1AnnualKg:settings.scope1AnnualKg};
  const dash     = useMemo(() => computeDashboard(settings.region, settings.timePeriod, settings.equipment, settings.customCi, clinicalAdj, storageCfg, settings.equipmentOverrides), [settings.region, settings.timePeriod, settings.equipment, settings.customCi, clinicalAdj, settings.storageRetentionYears, settings.storageCloud, settings.storageReformats, settings.storageIntensityCustom, settings.storageProvider, settings.storageRegion, settings.storageCloudCi, settings.scope1AnnualKg, settings.equipmentOverrides]);
  // Deployment workload uses the department's pre-AI imaging volume and is always normalized to studies/month.
  const departmentStudiesPerMonth = Math.round((((dash.clinicalBasis?.imagingScans ?? dash.scopes.imagingScans) || 0)) / (TIME_MULT[settings.timePeriod] ?? 1));
  const scenario = useMemo(() => computeInterventions(scenarioInterventions, settings.region, settings.timePeriod, settings.equipment, settings.customCi, scen.cloudProvider, scen.scannerState, storageCfg, settings.equipmentOverrides, clinicalAdj, deptLabel.renewablePct), [scenarioInterventions, settings.region, settings.timePeriod, settings.equipment, settings.customCi, scen.cloudProvider, scen.scannerState, settings.storageRetentionYears, settings.storageCloud, settings.storageReformats, settings.storageIntensityCustom, settings.storageProvider, settings.storageRegion, settings.storageCloudCi, settings.scope1AnnualKg, settings.equipmentOverrides, clinicalAdj, deptLabel.renewablePct]);
  const ai       = useMemo(() => aiResultFor(scen, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides),
    [scen, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides]);

  // One record → one label (ailabel.js).
  const ecoLabel = useMemo(() => labelFromScen(scen, ai, LIB_TASK[scen.modelKey] || ''), [scen, ai]);

  // Benchmark: every candidate computed under the SAME department context, so only the
  // model varies. Pareto-efficient = no other candidate is both more accurate and lower-carbon.
  const benchResults = useMemo(() => {
    const rows = benchModels.map(cfg => {
      const sharedCfg = {
        ...cfg,
        cloudProvider: scen.cloudProvider,
        cloudRegion: scen.cloudRegion,
        customPue:'', renewablePct:'0',
        trainingProvider:'', trainingRegion:'', trainingPue:'', trainingRenewablePct:'',
        inferenceProvider:'', inferenceRegion:'', inferencePue:'', inferenceRenewablePct:'',
        inferStudiesMonth: scen.inferStudiesMonth,
        deployMonths: scen.deployMonths,
      };
      const r = aiResultFor(sharedCfg, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides);
      const lifetimeStudies = Math.max(0, (r.inference.studies || 0) * (parseFloat(scen.deployMonths) || 0));
      const inferenceCo2G = rnd((r.inference.kwhPerStudy || 0) * r.cloudCi * 1000, 3);
      const trainPerStudyG = lifetimeStudies > 0 ? rnd((r.training.kgCo2e || 0) * 1000 / lifetimeStudies, 3) : 0;
      const carbonPerStudyG = rnd(inferenceCo2G + (scen.compareBasis === 'inference' ? 0 : trainPerStudyG), 3);
      return {
        id: cfg.id, label: cfg.label, sizeLabel: r.modelSize, paramsM: r.paramsM,
        performanceValue: parseFloat(cfg.accuracyPct) || 0, performanceMetric: cfg.accuracyMetric || r.accuracyMetric,
        performanceUnit: cfg.performanceUnit || 'percent', performanceDirection: cfg.performanceDirection === 'lower' ? 'lower' : 'higher',
        performanceValidationContext: cfg.performanceValidationContext || cfg.validationBasis || '',
        trainCo2: r.training.kgCo2e, kwhPerStudy: r.inference.kwhPerStudy,
        carbonPerStudyG, inferenceCo2G, trainPerStudyG,
        netCo2: r.netKgCo2e, lifetimeCo2: r.lifetimeCo2, efficiency: r.efficiencyRatio,
      };
    });
    const metrics = [...new Set(rows.map(r => `${r.performanceMetric}|${r.performanceUnit}|${r.performanceDirection}|${r.performanceValidationContext}`))];
    const comparisonDefinitionComplete = [scen.compareClinicalTask, scen.compareEndpoint, scen.compareCohort].every(v => String(v || '').trim().length > 0);
    const comparablePerformance = comparisonDefinitionComplete && metrics.length <= 1;
    rows.forEach(a => {
      a.pareto = comparablePerformance && !rows.some(b => {
        if (b.id === a.id || b.carbonPerStudyG > a.carbonPerStudyG) return false;
        const perfAtLeast = a.performanceDirection === 'lower' ? b.performanceValue <= a.performanceValue : b.performanceValue >= a.performanceValue;
        const perfStrict = a.performanceDirection === 'lower' ? b.performanceValue < a.performanceValue : b.performanceValue > a.performanceValue;
        return perfAtLeast && (perfStrict || b.carbonPerStudyG < a.carbonPerStudyG);
      });
    });
    const minBy = key => rows.length ? Math.min(...rows.map(r => r[key])) : 0;
    const maxBy = key => rows.length ? Math.max(...rows.map(r => r[key])) : 0;
    const bestPerformance = !comparablePerformance || !rows.length ? null : rows[0].performanceDirection === 'lower' ? minBy('performanceValue') : maxBy('performanceValue');
    return {rows, metrics, comparisonDefinitionComplete, comparablePerformance, best: {trainCo2: minBy('trainCo2'), carbonPerStudyG: minBy('carbonPerStudyG'), netCo2: minBy('netCo2'), lifetimeCo2: minBy('lifetimeCo2'),
      performanceValue: bestPerformance, efficiency: rows[0]?.performanceDirection === 'lower' ? minBy('efficiency') : maxBy('efficiency')}};
  }, [benchModels, scen.cloudProvider, scen.cloudRegion, scen.inferStudiesMonth, scen.deployMonths, scen.compareBasis, scen.compareClinicalTask, scen.compareEndpoint, scen.compareCohort, settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides]);

  // Worked agentic example: a single-pass vision model vs a single-pass LLM vs a multi-call
  // agent, all on the SAME department volume — surfaces the token multiplier concretely.
  const agenticExample = useMemo(() => {
    const ctx = k => aiResultFor(benchCfgFromLib(k), settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides);
    const cad = ctx('cad'), report = ctx('report'), agent = ctx('agentic');
    const whStudy = r => rnd((r.inference.kwhPerStudy || 0) * 1000, 2);
    const cadWh = whStudy(cad) || 0.001;
    const mk = (label, r, note) => ({label, note, tokens: r.tokensPerStudy || 0,
      whStudy: whStudy(r), kwhMo: r.inference.kwhMonthly, fold: Math.max(1, rnd(whStudy(r) / cadWh, 0))});
    return {
      studies: report.inference.studies,
      rows: [
        mk('Classification / triage', cad,    '1 vision forward-pass'),
        mk('Report generation (LLM)', report, '1 LLM call'),
        mk('Agentic workflow',        agent,  `${agent.callsPerTask} LLM calls / study`),
      ],
    };
  }, [settings.region, settings.customCi, settings.equipment, settings.equipmentOverrides]);

  // ── Scope 3 extensions (Doo et al. JACR 2024) ──────────────────────────────
  const derivedStaffCount = useMemo(() =>
    Object.entries(settings.equipment).reduce((sum, [key, n]) =>
      sum + (STAFF_PER_DEVICE[key] ?? 0) * Math.max(0, n || 0), 0),
  [settings.equipment]);

  const staffCommuteCo2 = useMemo(() => {
    const mult = TIME_MULT[settings.timePeriod] ?? 1;
    const km = Math.max(0, parseFloat(settings.staffCommuteKm) || 0);
    return rnd(derivedStaffCount * km * 2 * STAFF_DAYS_PER_MO * mult * CAR_CO2_KG_KM, 1);
  }, [derivedStaffCount, settings.staffCommuteKm, settings.timePeriod]);

  const networkTransferCo2 = useMemo(() => {
    const ci = getCI(settings.region, settings.customCi);
    return rnd(dash.scopes.imagingScans * AVG_STUDY_GB * NET_KWH_PER_GB * ci, 2);
  }, [dash.scopes.imagingScans, settings.region, settings.customCi]);

  const sciPerStudy = useMemo(() => {
    if (!dash.scopes.imagingScans || !dash.totals.energyPerScan) return null;
    const ci = getCI(settings.region, settings.customCi);
    const opCo2  = rnd(dash.totals.energyPerScan * ci, 4);
    const embCo2 = rnd(dash.scopes.scope3EmbKg / dash.scopes.imagingScans, 4);
    return rnd(opCo2 + embCo2, 4);
  }, [dash, settings.region, settings.customCi]);

  // Efficiency — how much of the fleet's energy is converted into delivered care.
  // Fixed fleet energy (idle/standby/cooling dominates) amortised over ACTUAL annual
  // studies: underused fleets → high per-study footprint; busy fleets → low, even at
  // high absolute CO₂. Utilisation = actual studies ÷ fleet's typical throughput.
  const efficiency = useMemo(() => {
    const mult = TIME_MULT[settings.timePeriod] ?? 1;
    const capacityYr = Object.entries(settings.equipment).reduce((s,[key,n])=>{const u=EQUIPMENT_UNITS[key];if(!u||!IMAGING_MODALITIES.has(u.modality))return s;const scansPerMo=settings.equipmentOverrides?.[key]?.scans??u.scans;return s+Math.max(0,n||0)*scansPerMo*12;},0);
    const entered=parseFloat(settings.actualStudiesYear)>0?parseFloat(settings.actualStudiesYear):null;
    const studiesYr=entered??capacityYr;
    const annualKwh=rnd(dash.totals.kwh/mult*12,2), annualActiveKwh=rnd(Math.max(0,dash.totals.activeKwh-(dash.clinicalMeta?.aiTrainingKwh||0))/mult*12,2);
    const adjusted=computeUtilizationAdjustedEnergy({annualKwh,annualActiveKwh,capacityYr,studiesYr});
    const util=adjusted.util;
    const band=util>=0.85?{label:'High utilisation',color:'#2E7D32',bg:'#e8f5e9'}:util>=0.40?{label:'Typical utilisation',color:'#F57F17',bg:'#fff8e1'}:{label:'Under-used fleet',color:'#c62828',bg:'#ffebee'};
    return{capacityYr:Math.round(capacityYr),studiesYr:Math.round(studiesYr),isEstimate:!entered,utilPct:rnd(util*100,0),util,energyPerStudy:adjusted.energyPerStudy,co2PerStudy:rnd(adjusted.energyPerStudy*dash.ci,3),designedCo2PerStudy:rnd(dash.totals.energyPerScan*dash.ci,3),nonProductivePct:adjusted.nonProductivePct,modeledAnnualKwh:adjusted.modeledAnnualKwh,band};
  }, [settings.equipment,settings.equipmentOverrides,settings.actualStudiesYear,settings.timePeriod,dash.totals.kwh,dash.totals.activeKwh,dash.totals.energyPerScan,dash.ci]);

  const equivData = useMemo(() => {
    const co2 = equivScope === 'scope2'
      ? dash.scopes.scope2Kg
      : dash.scopes.scope1Kg + dash.scopes.scope2Kg + dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2;
    const kwh = dash.totals.kwh;
    const price = getPrice(settings.region, settings.electricityPrice);
    return {
      co2, kwh,
      // Money — kWh-based (electricity cost only)
      cost: kwh * price, pricePerKwh: price, sym: currencySym(settings.region),
      // Transport — CO₂-based
      car_km:        Math.round(co2 / 0.17),        // avg petrol car DEFRA 2023
      car_years:     rnd(co2 / 2100, 2),            // avg EU car 2.1 tCO₂e/yr (EEA 2023)
      flights_short: rnd(co2 / 255, 1),             // economy short-haul seat (ICAO 2023)
      flights_long:  rnd(co2 / 1200, 1),            // economy transatlantic seat (ICAO 2023)
      // Home & energy — kWh-based
      homes:         rnd(kwh / 3500, 2),            // avg EU household electricity 3 500 kWh/yr
      phone_charges: Math.round(kwh / 0.012),       // smartphone 12 Wh per charge
      led_years:     Math.round(kwh / 50),          // 60 W→10 W LED saves 50 kWh/yr
      tea_cups:      Math.round(kwh / 0.025),       // 250 ml kettle boil ~0.025 kWh
      laptop_days:   Math.round(kwh / 0.24),        // 30 W × 8 h/day
      stream_hours:  Math.round(kwh / 0.1),         // TV streaming ~100 W device
      // Nature — CO₂-based
      trees_year:    Math.round(co2 / 21),          // 1 tree ~21 kgCO₂/yr absorbed
      forest_ha:     rnd(co2 / 5500, 3),            // temperate forest ~5.5 tCO₂/ha/yr (FAO)
      // Fossil fuels — CO₂-based
      barrels_oil:   rnd(co2 / 430, 1),             // crude oil combustion EPA (0.43 tCO₂/barrel)
      tonnes_coal:   rnd(co2 / 2350, 2),            // bituminous coal ~2 350 kgCO₂/tonne (IPCC)
    };
  }, [dash, equivScope, staffCommuteCo2, networkTransferCo2, settings.region, settings.electricityPrice]);
  const resultPeriodPhrase = settings.timePeriod === 'Annual' ? 'For one year' : settings.timePeriod === 'Quarterly' ? 'For this quarter' : 'For this month';
  const resultPeriodNoun = settings.timePeriod === 'Annual' ? 'year' : settings.timePeriod === 'Quarterly' ? 'quarter' : 'month';

  const ecoLabelData = useMemo(() => {
    const gpuLabel = scen.trainGpu === 'Custom (enter TDP below)'
      ? `Custom GPU (${scen.trainCustomTdpW || 300} W TDP)`
      : (scen.trainGpu || 'GPU not specified');
    const inferenceProvider = ai.inferenceContext?.provider || scen.inferenceProvider || scen.cloudProvider;
    const inferenceRegion = ai.inferenceContext?.region || scen.inferenceRegion || scen.cloudRegion;
    return computeAiLabel(scen, ai, {
      gpuLabel,
      libTaskType: LIB_TASK[scen.modelKey] || '',
      ciSource: inferenceRegion || `${inferenceProvider} average`,
      waterPerKwhDefault: WATER_PER_KWH,
      score: g => { const score = cedarsScore(g, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI); return {score, rating: cedarsRating(score)}; },
    });
  }, [scen, ai]);
  const aiWorkloadScenario = useMemo(() => {
    const studies = Math.max(0, parseFloat(aiWorkloadPreview) || 0);
    const months = Math.max(1, parseInt(scen.deployMonths) || 36);
    const inferenceG = Number(ecoLabelData.perInferCo2g) || 0;
    const trainingKg = Number(ecoLabelData.trainCo2) || 0;
    const lifetimeStudies = studies * months;
    const trainingShareG = lifetimeStudies > 0 ? rnd(trainingKg * 1000 / lifetimeStudies, 3) : null;
    const intensityG = studies > 0 ? rnd(inferenceG + (trainingShareG || 0), 3) : null;
    const inferenceMonthKg = rnd(studies * inferenceG / 1000, 3);
    const deploymentKg = studies > 0 ? rnd(trainingKg + inferenceMonthKg * months, 2) : trainingKg;
    return {studies, months, inferenceG, trainingKg, trainingShareG, intensityG, inferenceMonthKg, deploymentKg};
  }, [aiWorkloadPreview, scen.deployMonths, ecoLabelData.perInferCo2g, ecoLabelData.trainCo2]);


  const deptLabelData = useMemo(() => {
    // Live-by-default: derive from the Radiology Department state; the EcoLabel form
    // fields are optional OVERRIDES (headline numbers + region) when non-empty.
    const mult = TIME_MULT[settings.timePeriod] ?? 1;
    const region = deptLabel.region || settings.region;
    const hasGridFactor = region !== 'Editable custom' || String(settings.customCi ?? '').trim() !== '';
    const ci = getCI(region, settings.customCi);
    const renewablePct = Math.min(100, Math.max(0, parseFloat(deptLabel.renewablePct) || 0));
    const effectiveCi = rnd(ci * (1 - renewablePct / 100), 4);
    const liveAnnualKwh     = rnd(efficiency.modeledAnnualKwh || (dash.totals.kwh / mult * 12), 0);
    const liveAnnualStudies = efficiency.studiesYr;
    const annualKwh     = parseFloat(deptLabel.annualKwh)     > 0 ? parseFloat(deptLabel.annualKwh)     : liveAnnualKwh;
    const annualStudies = parseFloat(deptLabel.annualStudies) > 0 ? parseFloat(deptLabel.annualStudies) : liveAnnualStudies;
    const isLive = !(parseFloat(deptLabel.annualKwh) > 0) && !(parseFloat(deptLabel.annualStudies) > 0);
    const localPoolKwh = Math.max(0, dash.carbonPools?.localKwh || dash.totals.kwh);
    const cloudStorageKwh = Math.max(0, dash.carbonPools?.cloudStorageKwh || 0);
    const cloudAiKwh = Math.max(0, dash.carbonPools?.cloudAiKwh || 0), cloudAiCo2 = Math.max(0, dash.carbonPools?.cloudAiCo2 || 0);
    const weightedOperationalCi = (localPoolKwh + cloudStorageKwh + cloudAiKwh) > 0 ? (localPoolKwh * effectiveCi + cloudStorageKwh * (dash.storage.ci || ci) + cloudAiCo2) / (localPoolKwh + cloudStorageKwh + cloudAiKwh) : effectiveCi;
    const facilityCo2 = rnd(annualKwh * weightedOperationalCi, 1);
    const kwhPerStudy = annualStudies > 0 ? rnd(annualKwh / annualStudies, 2) : 0;
    // Efficiency of converting energy into delivered care: per-study CO₂ already drives
    // the Score; utilisation (studies vs the configured fleet's typical throughput) is
    // the explanatory diagnostic for the "large fleet, low volume" case.
    const fleetCapacityYr = efficiency.capacityYr;
    const utilPct = (fleetCapacityYr > 0 && annualStudies > 0) ? rnd(annualStudies / fleetCapacityYr * 100, 0) : null;
    // A per-study Department score needs both a denominator (studies) and a real energy baseline.
    // Requiring annual kWh also prevents a manually entered study volume with zero equipment from
    // appearing as a perfect zero-carbon score. Custom-grid mode additionally needs an entered factor.
    const hasData = annualStudies > 0 && annualKwh > 0 && hasGridFactor;
    // Clinical AI now flow through the live department energy (dash), so their net
    // effect (compute − clinical savings) is already in facilityCo2 — no separate fold here
    // (that would double-count).
    const totalAnnualCo2 = facilityCo2;
    const co2PerStudy = annualStudies > 0 ? rnd(totalAnnualCo2 / annualStudies, 3) : 0;
    const score = hasData ? cedarsScore(co2PerStudy, CEDARS_DEPT_LO, CEDARS_DEPT_HI) : null;
    const rating = hasData ? cedarsRating(score) : null;
    // Prospective saving potential comes only from the Interventions scenario. Current
    // sustainability practices documented on the EcoLabel are a separate reporting field and
    // do not automatically subtract savings from the modeled baseline (avoids double-counting).
    const monthlyKwhSaving = scenario.monthlyKwhSaved;
    const annualKwhSaving = rnd(monthlyKwhSaving * 12, 0);
    const scenarioReduction = Math.max(-1, Math.min(1, (scenario.savings.pctCo2 || 0) / 100));
    const potentialFacilityCo2 = Math.max(0, facilityCo2 * (1 - scenarioReduction));
    const co2Saving = rnd(facilityCo2 - potentialFacilityCo2, 1);
    const potentialCo2PerStudy = annualStudies > 0
      ? rnd(Math.max(0, potentialFacilityCo2) / annualStudies, 3) : 0;
    const potentialScore = hasData ? cedarsScore(potentialCo2PerStudy, CEDARS_DEPT_LO, CEDARS_DEPT_HI) : null;
    const potentialRating = potentialScore != null ? cedarsRating(potentialScore) : rating;
    return {
      deptName: deptLabel.deptName || 'Unnamed Department',
      hospitalName: deptLabel.hospitalName || '',
      region, isLive, hasGridFactor,
      ci, effectiveCi, renewablePct,
      annualKwh, annualStudies, totalAnnualCo2, co2PerStudy, kwhPerStudy,
      fleetCapacityYr, utilPct,
      hasData, score,
      leaves: rating?.leaves ?? 0, ratingLabel: rating?.label ?? 'Enter data above',
      ratingColor: rating?.color ?? '#90a4ae', ratingBg: rating?.bg ?? '#f5f5f5', ratingDesc: rating?.desc ?? '',
      monthlyKwhSaving, annualKwhSaving, co2Saving,
      potentialCo2PerStudy, potentialScore, potentialLeaves: potentialRating?.leaves ?? 0, potentialRatingLabel: potentialRating?.label ?? '',
      interventionCount: deptLabel.activeInterventions.length,
      modeledInterventionCount: scenario.count,
      facilityCo2, clinicalToolCount: clinicalAdj.count,
      date: new Date().toISOString().slice(0, 7),
    };
  }, [deptLabel, settings.customCi, settings.region, settings.timePeriod, dash.totals.kwh, efficiency.capacityYr, efficiency.studiesYr, clinicalAdj.count, scenario.monthlyKwhSaved, scenario.savings.co2Fraction]);

  const departmentScoreReadiness = useMemo(() => getDepartmentScoreReadiness({
    annualKwh: deptLabelData.annualKwh,
    annualStudies: deptLabelData.annualStudies,
    gridReady: deptLabelData.hasGridFactor,
    clinicalAiCount: deptLabelData.clinicalToolCount,
  }), [deptLabelData.annualKwh, deptLabelData.annualStudies, deptLabelData.hasGridFactor, deptLabelData.clinicalToolCount]);
  const aiScoreReadiness = useMemo(() => getAiScoreReadiness({
    hasData: ecoLabelData.hasData,
    hasPathway: !!scen.aiRoute,
  }), [ecoLabelData.hasData, scen.aiRoute]);

  const scoreIssueAction = (mode, key) => {
    if (mode === 'ai') return key === 'pathway' ? 'Choose AI pathway →' : 'Open AI energy inputs →';
    if (key === 'context') return 'Complete grid context →';
    if (key === 'volume') return 'Add imaging workload →';
    return 'Add Department equipment →';
  };
  const focusMissingScoreInput = (mode, key) => {
    setScoreAttention(key);
    if (mode === 'ai') {
      setEcoLabelMode('ai');
      setPage('ai');
      if (key === 'energy') setAiOpen(o => ({...o, model:true, training:true, inference:true}));
      window.setTimeout(() => {
        if (key === 'pathway') window.scrollTo({top:0, behavior:'smooth'});
        else document.getElementById('ai-training')?.scrollIntoView({behavior:'smooth', block:'start'});
      }, 100);
      return;
    }
    setEcoLabelMode('department');
    setDeptSetupOpen(true);
    if (key === 'volume') setDashOpen(o => ({...o, efficiency:true}));
    setPage('dashboard');
    const target = key === 'context' ? 'department-context-input' : key === 'volume' ? 'dash-efficiency' : 'department-equipment';
    window.setTimeout(() => document.getElementById(target)?.scrollIntoView({behavior:'smooth', block:'center'}), 120);
  };
  const goToScore = mode => {
    setScoreAttention('');
    setEcoLabelMode(mode);
    setPage('ecolabel');
    window.setTimeout(() => {
      const readiness = mode === 'ai' ? aiScoreReadiness : departmentScoreReadiness;
      const target = readiness.ready ? (mode === 'ai' ? 'ai-score-panel' : 'department-score-panel') : `score-readiness-${mode}`;
      document.getElementById(target)?.scrollIntoView({behavior:'smooth', block:'start'});
    }, 80);
  };

  // Auto-seed the AI model's training (amortised) + inference as locked compute lines,
  // then layer the user's own Infrastructure-tab workloads on top. Provider/region come
  // from `scen` so the Infrastructure tab and the AI lifecycle math stay in sync.
  const cloudInput = useMemo(() => {
    const aiLines = [];
    if (ai.training?.kwhAmortised > 0)
      aiLines.push({id: '__ai_train', label: 'AI training (amortised)', fixedKwh: ai.training.kwhAmortised, locked: true});
    if (ai.inference?.kwhMonthly > 0)
      aiLines.push({id: '__ai_infer', label: 'AI inference', fixedKwh: ai.inference.kwhMonthly, locked: true});
    return {
      ...cloudTracker,
      provider: scen.cloudProvider,
      region: scen.cloudRegion,
      computeLines: [...aiLines, ...cloudTracker.computeLines],
    };
  }, [cloudTracker, scen.cloudProvider, scen.cloudRegion, ai.training, ai.inference]);
  const cloudResult = useMemo(() => computeCloudCarbon(cloudInput), [cloudInput]);

  const chartEnergy = {
    labels: dash.byEquipment.map(x => x.equipment),
    datasets: [{
      label:`kWh${dash.totals.label}`,
      data: dash.byEquipment.map(x => x.kwh),
      backgroundColor: dash.byEquipment.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderColor: dash.byEquipment.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 1,
    }],
  };
  const energyBarOptions = {
    indexAxis: 'y',
    responsive: true,
    aspectRatio: 1,
    plugins: {legend: {display: false}},
    scales: {
      x: {ticks: {callback: v => `${v}`}},
      y: {grid: {display: false}},
    },
  };
  const chartCo2 = {
    labels: dash.byEquipment.map(x => x.equipment),
    datasets: [{label:'kgCO₂e', data: dash.byEquipment.map(x => x.kgco2e), backgroundColor: CHART_COLORS}],
  };
  const chartScenario = {
    labels: ['Baseline', 'After interventions'],
    datasets: [
      {label:`Energy kWh${dash.totals.label}`, data:[scenario.baseline.kwh, scenario.projected.kwh], backgroundColor:['#A5D6A7','#2E7D32']},
      {label:'Carbon kgCO₂e', data:[scenario.baseline.co2, scenario.projected.co2], backgroundColor:['#80CBC4','#26A69A']},
    ],
  };
  // Scope 1/2/3 stacked horizontal bar — shown as % of total so all scopes are visible
  const scopeTotal = dash.scopes.scope1Kg + dash.scopes.scope2Kg + dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2;
  const scopePct   = v => scopeTotal > 0 ? rnd(v / scopeTotal * 100, 1) : 0;
  const scopeVals  = [dash.scopes.scope1Kg, dash.scopes.scope2Kg, dash.scopes.scope3EmbKg, dash.scopes.scope3TravelKg, dash.scopes.scope3ContrastKg, dash.scopes.scope3CloudAiKg, dash.scopes.scope3CloudStorageKg, staffCommuteCo2, networkTransferCo2];
  const chartScopes = {
    labels: ['% of total emissions' + dash.totals.label],
    datasets: [
      {label:`Scope 1 — Direct (${scopePct(dash.scopes.scope1Kg)}%)`,              data:[scopePct(dash.scopes.scope1Kg)],       backgroundColor:'#81C784'},
      {label:`Scope 2 — Electricity (${scopePct(dash.scopes.scope2Kg)}%)`,          data:[scopePct(dash.scopes.scope2Kg)],       backgroundColor:'#2E7D32'},
      {label:`Scope 3 — Embodied (${scopePct(dash.scopes.scope3EmbKg)}%)`,          data:[scopePct(dash.scopes.scope3EmbKg)],    backgroundColor:'#4DB6AC'},
      {label:`Scope 3 — Patient travel (${scopePct(dash.scopes.scope3TravelKg)}%)`, data:[scopePct(dash.scopes.scope3TravelKg)], backgroundColor:'#A5D6A7'},
      {label:`Scope 3 — Contrast supply chain (${scopePct(dash.scopes.scope3ContrastKg)}%)`, data:[scopePct(dash.scopes.scope3ContrastKg)], backgroundColor:'#66BB6A'},
      {label:`Scope 3 — Cloud AI (${scopePct(dash.scopes.scope3CloudAiKg)}%)`, data:[scopePct(dash.scopes.scope3CloudAiKg)], backgroundColor:'#29B6F6'},
      {label:`Scope 3 — Cloud archive (${scopePct(dash.scopes.scope3CloudStorageKg)}%)`, data:[scopePct(dash.scopes.scope3CloudStorageKg)], backgroundColor:'#26A69A'},
      {label:`Scope 3 — Staff commute (${scopePct(staffCommuteCo2)}%)`,             data:[scopePct(staffCommuteCo2)],            backgroundColor:'#FFB74D'},
      {label:`Scope 3 — Data transfer (${scopePct(networkTransferCo2)}%)`,          data:[scopePct(networkTransferCo2)],         backgroundColor:'#90A4AE'},
    ],
  };
  const scopeBarOpts = {
    indexAxis:'y',
    plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label: ctx => ` ${ctx.dataset.label}: ${fmtCo2(scopeVals[ctx.datasetIndex])}`}}},
    scales:{x:{stacked:true, max:100, ticks:{callback: v => v+'%'}}, y:{stacked:true}},
    responsive:true,
  };

  // Disclosure completeness for the AI record (the full checklist, with descriptions, lives on
  // Report (& Share); this is the compact meter shown beside the form).
  const aiChecklist = [
    ['Model name', !!String(scen.projectName || '').trim(), 'model'],
    ['Training hardware (GPU / accelerator and count)', !!scen.trainGpu || ecoLabelData.trainProv === 'not-disclosed', 'training'],
    ['Training energy and how it was measured / estimated', ecoLabelData.trainProv === 'measured' ? !!ecoLabelData.trainTool : ecoLabelData.trainProv !== 'literature', 'training'],
    ['Inference compute location / grid source', !!(scen.inferenceRegion || scen.cloudRegion), 'inference'],
    ['PUE / compute-region assumptions', parseFloat(scen.inferencePue || scen.customPue) > 0 || !!(scen.inferenceRegion || scen.cloudRegion), 'inference'],
    ['Deployment workload (to combine training + inference)', ecoLabelData.gradeBasis === 'amortised' || ecoLabelData.trainProv === 'not-disclosed', 'inference'],
    ['Water inputs or mark water not assessed', ecoLabelData.waterProv !== 'screening', 'carbon'],
    ['CEDARS Score and Rating', ecoLabelData.graded, 'score'],
  ];
  const aiChecklistDone = aiChecklist.filter(([, ok]) => ok).length;
  const openAiChecklistItem = section => {
    if (section === 'score') { setEcoLabelMode('ai'); setPage('ecolabel'); return; }
    const key = section || 'model';
    setPage('ai');
    setAiOpen(o => ({...o, [key]:true}));
    window.setTimeout(()=>document.getElementById(`ai-${key}`)?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  };
  const AI_PAGE_REFS = [...AI_ENTRY_REFS, 'mongan-claim-2020', 'li-thirsty-2023'];
  const AI_IMPROVE_REFS = ['doo-jacr-2024','doo-radiology-llm-2024','doo-jacr-cloud-2024','jia-eurradiol-2026','jegham-llm-2025','fernandez-llm-energy-2025','oviedo-inference-2025','kpodzro-haip-2026','strubell-nlp-2019','schwartz-green-ai-2020','henderson-reporting-2020','patterson-4ms-2022','hanafy-war-efficiencies-2023','wright-efficiency-not-enough-2023','dietrich-training-policy-2026','nghiem-doo-sustainable-ai-2026','owid-ci','codecarbon'];
  const DEPT_STORAGE_REFS = ['jia-eurradiol-2026', 'doo-jacr-cloud-2024'];
  const DEPT_WATER_REFS = ['heye-radiology-2020', 'li-thirsty-2023'];
  const DEPT_SUPPORT_REFS = ['heye-radiology-2020', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026', 'li-thirsty-2023'];

  const renderAiRecordForm = () => (
    <>
          {/* ── Form ── */}
          <div className="inputSummary" data-demo-target="ai-model-record" style={{marginBottom:24}}>
            <h2 style={{marginTop:0, marginBottom:16, color:'#1b5e20'}}>Model &amp; task</h2>
            <div className="grid grid3">
              <label>
                Project / model name
                <input type="text" value={ecoLabel.projectName} onChange={e=>setEco('projectName',e.target.value)} placeholder="e.g. CXR-Net lung nodule detector"/>
              </label>
              <Sel label="Task type" value={ecoLabel.taskType} options={META.taskTypes} onChange={v=>setEco('taskType',v)}/>
              <Sel label="Architecture" value={ecoLabel.architecture} options={META.architectures} onChange={v=>setEco('architecture',v)}/>
              <label>
                Parameters (millions)
                <input type="number" min="0" value={ecoLabel.paramsMillion} onChange={e=>setEco('paramsMillion',e.target.value)} placeholder="e.g. 19"/>
              </label>
              <label>
                Training dataset (studies / images)
                <input type="number" min="0" value={ecoLabel.datasetSize} onChange={e=>setEco('datasetSize',e.target.value)} placeholder="e.g. 45000"/>
              </label>
            </div>
          </div>

          <div className="inputSummary" style={{marginBottom:24}}>
            <h2 style={{marginTop:0, marginBottom:16, color:'#1b5e20'}}>Training compute</h2>
            <div className="grid grid3">
              <Sel label="GPU model" value={ecoLabel.gpuModel} options={META.gpuModels} onChange={v=>setEco('gpuModel',v)}/>
              {ecoLabel.gpuModel === 'Custom (enter TDP below)' && (
                <label>
                  GPU TDP (Watts)
                  <input type="number" min="1" value={ecoLabel.customTdpW} onChange={e=>setEco('customTdpW',e.target.value)} placeholder="e.g. 350"/>
                </label>
              )}
              <label>
                Number of GPUs
                <input type="number" min="1" value={ecoLabel.gpuCount} onChange={e=>setEco('gpuCount',e.target.value)} placeholder="e.g. 4"/>
              </label>
              <label>
                Training hours per run
                <input type="number" min="0" step="0.1" value={ecoLabel.trainingHoursPerRun} onChange={e=>setEco('trainingHoursPerRun',e.target.value)} placeholder="e.g. 18"/>
              </label>
              <label>
                Number of training runs / experiments
                <input type="number" min="1" value={ecoLabel.numRuns} onChange={e=>setEco('numRuns',e.target.value)} placeholder="e.g. 12"/>
              </label>
            </div>
            <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'#2E7D32'}}>Training energy:</span>
                <button type="button" onClick={()=>setEco('trainDisclosed','yes')} className={ecoLabel.trainDisclosed!=='no'?'on':''} style={{padding:'5px 12px',fontSize:12}}>Known</button>
                <button type="button" onClick={()=>setEco('trainDisclosed','no')} className={ecoLabel.trainDisclosed==='no'?'on':''} style={{padding:'5px 12px',fontSize:12}}>Not disclosed by vendor</button>
                <span className="note" style={{fontSize:11,margin:0}}>
                  {ecoLabel.trainDisclosed==='no'
                    ? 'The label will grade inference only and state that training was not disclosed.'
                    : <>Currently <strong>{PROVENANCE[ecoLabelData.trainProv]?.label}</strong>{ecoLabelData.trainProv==='literature' ? ' — the library default for this task family, scaled to your model size' : ecoLabelData.trainProv==='estimated' ? ' — GPU TDP × count × hours × PUE' : ''}.</>}
                </span>
              </div>
              {ecoLabel.trainDisclosed!=='no' && (
                <div className="grid grid3">
                  <label>
                    Measured energy per run (kWh) <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional — overrides the estimate</span>
                    <input type="number" min="0" step="0.01" value={ecoLabel.energyKwhPerRun} onChange={e=>setEco('energyKwhPerRun',e.target.value)} placeholder="e.g. 24.0"/>
                  </label>
                  <label>
                    Measured with
                    <select value={ecoLabel.trainTool} onChange={e=>setEco('trainTool',e.target.value)}>
                      <option value="">—</option>
                      {['CodeCarbon','Zeus','Carbontracker','EcoLogits','Green Algorithms','nvidia-smi','Power meter','Cloud provider dashboard','Other'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="inputSummary" style={{marginBottom:24}}>
            <h2 style={{marginTop:0, marginBottom:16, color:'#1b5e20'}}>Deployment context</h2>
            <div className="grid grid3">
              <Sel label="Compute provider" value={ecoLabel.cloudProvider} options={META.cloudProviders} onChange={setCloudProvider}/>
              <label>
                Deployment region <span style={{fontWeight:400, fontSize:11, color:'#607d66'}}>— sets grid CI</span>
                <select value={ecoLabel.cloudRegion} onChange={e=>setEco('cloudRegion',e.target.value)}>
                  {Object.entries(CLOUD_REGIONS[ecoLabel.cloudProvider]?.regions ?? {}).map(([name, rci]) => (
                    <option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>
                  ))}
                </select>
                <span style={{fontWeight:400,fontSize:10,color:'#90a4ae',marginTop:3,lineHeight:1.3}}>The compute region sets the grid carbon intensity for training and inference; it is independent of the Radiology Department's region (the department's own location).</span>
              </label>
              <label>
                Custom PUE <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>optional — overrides {ecoLabel.cloudProvider} default ({CLOUD_REGIONS[ecoLabel.cloudProvider]?.pue ?? CLOUD[ecoLabel.cloudProvider]?.pue ?? 1.5})</span>
                <input type="number" min="1" step="0.05" value={ecoLabel.customPue} onChange={e=>setEco('customPue',e.target.value)} placeholder={`${CLOUD_REGIONS[ecoLabel.cloudProvider]?.pue ?? CLOUD[ecoLabel.cloudProvider]?.pue ?? 1.5} default`}/>
                <span style={{fontWeight:400,fontSize:10,color:'#90a4ae',marginTop:3,lineHeight:1.3}}>Set to <strong>1.0</strong> to reproduce a single lab GPU measurement (e.g. CodeCarbon) with no data-centre overhead.</span>
              </label>
              <label>
                Renewable energy (%)
                <input type="number" min="0" max="100" value={ecoLabel.renewablePct} onChange={e=>setEco('renewablePct',e.target.value)} placeholder="0–100"/>
              </label>
            </div>
            <p className="note" style={{marginTop:8}}>Renewable energy % reduces the effective carbon intensity. Set to 100 for green tariff or matched renewable certificates (RECs).</p>
            <details style={{marginTop:12,borderTop:'1px solid #e0eee2',paddingTop:10}}>
              <summary style={{cursor:'pointer',fontWeight:700,color:'#2E7D32'}}>Set training and inference compute separately</summary>
              <p className="note" style={{fontSize:11}}>Leave these blank to inherit the shared deployment context above. Use them when training occurred elsewhere from inference (for example, vendor pretraining in one region and local/cloud deployment in another).</p>
              {['training','inference'].map(kind => {
                const providerKey = `${kind}Provider`, regionKey = `${kind}Region`, pueKey = `${kind}Pue`, renewableKey = `${kind}RenewablePct`;
                const provider = scen[providerKey] || scen.cloudProvider;
                return <div key={kind} style={{marginTop:10}}>
                  <strong style={{fontSize:12,color:'#1b5e20',textTransform:'capitalize'}}>{kind} context</strong>
                  <div className="grid grid3" style={{marginTop:6}}>
                    <label>Provider<select value={scen[providerKey]} onChange={e=>setS(providerKey,e.target.value)}><option value="">Inherit {scen.cloudProvider}</option>{META.cloudProviders.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                    <label>Region<select value={scen[regionKey]} onChange={e=>setS(regionKey,e.target.value)}><option value="">Inherit {scen.cloudRegion || 'provider average'}</option>{Object.keys(CLOUD_REGIONS[provider]?.regions || {}).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                    <label>Custom PUE<input type="number" min="1" step="0.05" value={scen[pueKey]} onChange={e=>setS(pueKey,e.target.value)} placeholder="inherit"/></label>
                    <label>Renewable energy (%)<input type="number" min="0" max="100" value={scen[renewableKey]} onChange={e=>setS(renewableKey,e.target.value)} placeholder={`inherit ${scen.renewablePct || 0}%`}/></label>
                  </div>
                </div>;
              })}
            </details>
            <h3 style={{margin:'16px 0 8px', fontSize:14, color:'#1b5e20'}}>Water <span style={{fontWeight:400, fontSize:12, color:'#607d66'}}>optional · screening estimate unless you enter values<Ref id="li-thirsty-2023" order={AI_PAGE_REFS}/></span></h3>
            <div className="grid grid3">
              <label>
                Cooling water at the compute site (L/kWh) <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>provider's water-use effectiveness, if published</span>
                <input type="number" min="0" step="0.01" value={ecoLabel.wueOnsite} onChange={e=>setEco('wueOnsite',e.target.value)} placeholder="e.g. 0.45"/>
              </label>
              <label>
                Water from electricity generation (L/kWh) <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>off-site; depends on the grid</span>
                <input type="number" min="0" step="0.01" value={ecoLabel.wueOffsite} onChange={e=>setEco('wueOffsite',e.target.value)} placeholder="by grid"/>
              </label>
              <label>
                If unknown
                <select value={ecoLabel.waterMode} onChange={e=>setEco('waterMode',e.target.value)}>
                  <option value="screening">Use the {WATER_PER_KWH} L/kWh screening factor (Estimated)</option>
                  <option value="notassessed">Report water as not assessed</option>
                </select>
              </label>
            </div>
            <p className="note" style={{marginTop:8}}>Either choice is stated on the label. The screening factor is a data-centre proxy; site cooling and electricity-generation water differ by location.</p>
          </div>

          <div className="inputSummary" style={{marginBottom:32}}>
            <h2 style={{marginTop:0, marginBottom:6, color:'#1b5e20'}}>Inference / deployment <span style={{fontWeight:400,fontSize:14,color:'#607d66'}}>(drives the in-use grade)</span></h2>
            <p className="note" style={{marginBottom:12}}>Training is a one-time cost; inference is paid on every study. Enter your deployment to grade the <strong>amortised</strong> footprint per study (training spread over the studies served + inference). Leave blank to keep a training-only disclosure.</p>
            {/* Inference energy unit — flat kWh (vision) vs token-driven (LLM / agentic) */}
            <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#607d66',fontWeight:600,alignSelf:'center'}}>Inference energy:</span>
              <button onClick={()=>setEco('inferMode','kwh')} className={ecoLabel.inferMode!=='tokens'?'on':''} style={{padding:'5px 12px',fontSize:12,borderRadius:12}}>Vision — kWh / study</button>
              <button onClick={()=>setEco('inferMode','tokens')} className={ecoLabel.inferMode==='tokens'?'on':''} style={{padding:'5px 12px',fontSize:12,borderRadius:12}}>LLM / agentic — token-based</button>
            </div>
            <div className="grid grid3">
              <label>
                Monthly study volume <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>your own count, or a published estimate: small US practice {VOLUME_ESTIMATES[0].studiesPerMonth.toLocaleString()} · large {VOLUME_ESTIMATES[1].studiesPerMonth.toLocaleString()}<Ref id="doo-jacr-cloud-2024" order={AI_PAGE_REFS}/></span>
                <input type="number" min="0" value={ecoLabel.inferStudiesMonth} onChange={e=>setEco('inferStudiesMonth',e.target.value)} placeholder={`e.g. ${VOLUME_ESTIMATES[0].studiesPerMonth}`}/>
              </label>
              {ecoLabel.inferMode==='tokens' ? (
                <>
                  <label>
                    Energy (Wh / 1k tokens)
                    <input type="number" min="0" step="0.05" value={ecoLabel.whPer1kTokens} onChange={e=>setEco('whPer1kTokens',e.target.value)} placeholder="0.4"/>
                  </label>
                  <label>
                    Model calls / study
                    <input type="number" min="1" step="1" value={ecoLabel.callsPerTask} onChange={e=>setEco('callsPerTask',e.target.value)} placeholder="1 (single-pass) · 10 (agent)"/>
                  </label>
                  <label>
                    Tokens / call
                    <input type="number" min="0" step="100" value={ecoLabel.tokensPerCall} onChange={e=>setEco('tokensPerCall',e.target.value)} placeholder="e.g. 2500"/>
                  </label>
                </>
              ) : (
                <label>
                  Inference energy per study (kWh)
                  <input type="number" min="0" step="0.0001" value={ecoLabel.inferKwhPerStudy} onChange={e=>setEco('inferKwhPerStudy',e.target.value)} placeholder="e.g. 0.004"/>
                </label>
              )}
              <label>
                Deployment lifetime (months)
                <input type="number" min="1" value={ecoLabel.deployMonths} onChange={e=>setEco('deployMonths',e.target.value)} placeholder="e.g. 36"/>
              </label>
            </div>
            {ecoLabel.inferMode==='tokens' && (
              <p className="note" style={{fontSize:11,marginTop:8,marginBottom:0}}>
                {ecoLabelData.tokensPerStudy>0
                  ? <>{ecoLabelData.tokensPerStudy.toLocaleString()} tokens/study → <strong>{ecoLabelData.inferKwhPerStudy} kWh/study</strong> ({ecoLabelData.perInferCo2g} gCO₂e). Set calls/study &gt; 1 for agentic workflows. Same token unit as the model library — see sources.md.</>
                  : <>Enter tokens/call to derive kWh/study. tokens/study = calls × tokens/call; single-pass LLM = 1 call.</>}
              </p>
            )}
          </div>

    </>
  );

  return (
    <>
      <header className="siteHeader">
        <Logo onClick={resetToHome}/>
        <div className="headerUtilities">
          <nav className="utilityNav" aria-label="Site navigation">
            <button className={page==='landing'?'on':''} onClick={()=>setPage('landing')}>Home</button>
            <button className={page==='about'?'on':''} onClick={()=>setPage('about')}>About</button>
          </nav>
          <SaveUtility
            localSavedAt={localSavedAt}
            onSaveLocal={saveOnThisDevice}
            onDownload={downloadCedarsFile}
            onOpenFile={openCedarsFile}
            onCopyLink={copyShareableLink}
            linkCopied={shareLinkCopied}
            onContribute={()=>setContributeOpen(true)}
            contributionConfigured={!!CONTRIBUTION_ENDPOINT && !!TURNSTILE_SITEKEY}
          />
          {/* Ambient EcoLabel follows the active product, including Score, Improve, and Report. */}
          {(() => { const aiProduct=page==='ai'||(['ecolabel','scenario','report'].includes(page)&&ecoLabelMode==='ai'); const b=aiProduct?ecoLabelData:deptLabelData; const bHas=aiProduct?b.graded:b.hasData; return (
          <button onClick={()=>goToScore(aiProduct?'ai':'department')} title={aiProduct ? 'Current AI model score — open Score & EcoLabel' : 'Current Department EcoLabel score — open Score & EcoLabel'}
            style={{display:'inline-flex',alignItems:'center',gap:7,background:b.ratingBg,border:`1.5px solid ${b.ratingColor}`,borderRadius:16,padding:'5px 12px 5px 10px',cursor:'pointer',boxShadow:'none',flexShrink:0}}>
            <Leaf size={17}  fill={b.ratingColor}/>
            <span style={{fontSize:18,fontWeight:900,color:b.ratingColor,lineHeight:1}}>{bHas ? b.score : '—'}</span>
            <span style={{display:'flex',flexDirection:'column',lineHeight:1.1,textAlign:'left'}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.05em',color:b.ratingColor}}>{aiProduct ? 'AI MODEL' : 'ECOLABEL'}</span>
              <span style={{fontSize:10,color:'#37474f'}}>{b.leaves}/5 leaves</span>
            </span>
          </button>
          ); })()}
        </div>
      </header>

      {rejectedSharedFields.length>0&&<div style={{maxWidth:1200,margin:'8px auto',padding:'9px 12px',background:'#fff3e0',border:'1px solid #ffcc80',borderRadius:10,color:'#8d4b00',fontSize:12}}><strong>Some settings in this shared link were invalid and were ignored.</strong> Review the assessment before using its results. Ignored fields: {rejectedSharedFields.join(', ')}.</div>}
      {!['landing','about'].includes(page) && (
        <WorkflowRail
          page={page}
          onInput={()=>goToAssessmentContext(page==='ai'?'ai':page==='dashboard'?'dashboard':ecoLabelMode==='ai'?'ai':'dashboard',true)}
          onDepartment={()=>setPage('dashboard')}
          onAi={()=>setPage('ai')}
          onScore={()=>goToScore(page==='ai'?'ai':page==='dashboard'?'department':ecoLabelMode)}
          onImprove={()=>{if(page==='ai'){setEcoLabelMode('ai');setImproveAiStage(scen.aiRoute==='compare'||scen.ownMode==='spec'?'procure':'develop');}else if(page==='dashboard')setEcoLabelMode('department');setPage('scenario');}}
          onReport={()=>setPage('report')}
        />
      )}

      {/* ── Home / Live Calculator ── */}
      {page==='landing' && (
        <main>
          <p className="eyebrow">Radiology + AI + Planetary Health</p>
          <h1 style={{fontSize:44,lineHeight:1.05,margin:'0 0 10px'}}>Turn radiology sustainability data into decisions.</h1>
          <p className="note" style={{marginTop:0,marginBottom:24,fontSize:15,maxWidth:900,lineHeight:1.6}}>
            CEDARS helps radiology departments and AI teams quantify environmental impact, understand financial and clinical context, model practical interventions, and report results in a standardized, transparent format.
          </p>

          {/* Primary CEDARS workflow — Home keeps the four-card overview; the compact
              workflow rail is reserved for working pages. */}
          <section aria-labelledby="cedars-workflow-title" style={{marginBottom:22}}>
            <div style={{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap',marginBottom:10}}>
              <h2 id="cedars-workflow-title" style={{margin:0,color:'#1b5e20',fontSize:22}}>How CEDARS works</h2>
            </div>
            <p className="note" style={{margin:'0 0 14px',fontSize:13,maxWidth:920,lineHeight:1.55}}>
              Start with a <strong>radiology department</strong> or an <strong>AI model &amp; informatics</strong> assessment. AI teams can develop/train a model or procure/deploy one; both use the same CEDARS framework for <strong>transparent, comparable reporting</strong>.
            </p>

            <div className="homeWorkflowGrid">
              <div className="workflowCard workflowCardStart">
                <div className="workflowCardKicker">
                  <span className="workflowNumber">1</span>
                  <span>INPUT</span>
                  <span className="startHereBadge">START HERE</span>
                </div>
                <div className="workflowCardPrompt">What would you like to assess?</div>
                <div className="startChoiceGrid">
                  <button type="button" data-demo-target="home-department" className="startChoice department" onClick={()=>goToAssessmentContext('dashboard')}>
                    <Activity size={18}/><span><strong>Radiology Department</strong><small>Operations, equipment, resources &amp; clinical AI</small></span><span aria-hidden="true">→</span>
                  </button>
                  <button type="button" data-demo-target="home-ai" className="startChoice ai" onClick={()=>goToAssessmentContext('ai')}>
                    <Cpu size={18}/><span><strong>AI Model &amp; Informatics</strong><small>Training, inference, compute &amp; deployment</small></span><span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              <div className="workflowCard">
                <div className="workflowCardKicker"><span className="workflowNumber">2</span><span>SCORE &amp; ECOLABEL</span></div>
                <div className="workflowCardBody">See the current CEDARS score, rating, and EcoLabel for the assessment you entered.</div>
                <button className="download workflowCardAction" onClick={()=>goToScore('department')}>View score &amp; EcoLabel →</button>
              </div>

              <div className="workflowCard">
                <div className="workflowCardKicker"><span className="workflowNumber">3</span><span>IMPROVE</span></div>
                <div className="workflowCardBody">Model potential interventions and compare projected environmental, operational, financial, and clinical effects.</div>
                <button className="download workflowCardAction" onClick={()=>setPage('scenario')}>Model improvements →</button>
              </div>

              <div className="workflowCard">
                <div className="workflowCardKicker"><span className="workflowNumber">4</span><span>REPORT (&amp; SHARE)</span></div>
                <div className="workflowCardBody">Complete the disclosure, generate outputs, save your work, or optionally share or contribute the assessment.</div>
                <button className="download workflowCardAction" onClick={()=>setPage('report')}>Report (&amp; share) →</button>
              </div>
            </div>
          </section>

          <GuidedDemoLauncher onStart={startGuidedDemo}/>



        </main>
      )}


      {/* ── Input pathway chooser ── */}
      {page==='input' && (
        <main className="inputGatewayPage">
          {/* Shared assessment context — set once before choosing either input pathway.
              AI compute/deployment keeps its own region. */}
          <section className="assessmentContext" data-demo-target="assessment-context" aria-labelledby="assessment-context-title">
            <div className="assessmentContextIntro">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Globe size={18} style={{color:'#2E7D32',flexShrink:0}}/>
                <h2 id="assessment-context-title" style={{margin:0,fontSize:18,color:'#1b5e20'}}>Assessment context</h2>
              </div>
              <p className="note" style={{margin:'5px 0 0',fontSize:12,lineHeight:1.5}}>
                Sets the shared <strong>local grid, reporting period, and electricity-cost assumptions</strong> used across CEDARS. AI compute/deployment location remains separate on the AI Model &amp; Informatics page.
              </p>
            </div>
            <div className="assessmentContextGrid">
              <Sel label="Country / grid region" value={settings.region} options={META.regions} onChange={v=>set('region',v)}/>
              <Sel label="Reporting period" value={settings.timePeriod} options={META.timePeriods} onChange={v=>set('timePeriod',v)}/>
              <label>
                Electricity price <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional override</span>
                <div style={{position:'relative'}}>
                  <input type="number" min="0" step="0.01" value={settings.electricityPrice} onChange={e=>set('electricityPrice',e.target.value)}
                    placeholder={String(ELECTRICITY_PRICE[settings.region]?.price ?? 0.20)} style={{width:'100%',boxSizing:'border-box'}}/>
                </div>
                <span style={{fontWeight:500,fontSize:10,color:'#78909c'}}>
                  {settings.electricityPrice ? 'User-entered tariff' : `Regional default: ${currencySym(settings.region)}${ELECTRICITY_PRICE[settings.region]?.price ?? 0.20}/kWh`}
                </span>
              </label>
              {settings.region === 'Editable custom' && (
                <label>
                  Custom grid intensity (kgCO₂e/kWh)
                  <input type="number" min="0" max="2" step="0.001" value={settings.customCi} onChange={e=>set('customCi',e.target.value)}/>
                  <span style={{fontWeight:500,fontSize:10,color:'#78909c'}}>Use a local utility or verified grid factor.</span>
                </label>
              )}
            </div>
            <div className="assessmentContextNote">
              <strong>Used for:</strong> department footprint, local clinical-benefit calculations, costs, and the Department EcoLabel.
              <span> <strong>AI compute region:</strong> selected separately within AI Model &amp; Informatics.</span>
            </div>
          </section>
          <div className="inputGatewayMessage">
            <span>STEP 1 · INPUT</span>
            <h1>{inputTarget ? (inputReturnMode ? `Edit shared context, then return to ${inputTargetName(inputTarget)}.` : `Continue to ${inputTargetName(inputTarget)}.`) : 'Choose a pathway to continue.'}</h1>
            <p>Review the shared context above first. These assumptions carry into either pathway; AI compute/deployment location is still set separately on the AI page.</p>
            {inputTarget ? (
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginTop:14}}>
                <button type="button" onClick={()=>setPage(inputTarget)}>
                  {inputReturnMode ? 'Return to' : 'Continue to'} {inputTargetName(inputTarget)} →
                </button>
                <button type="button" className="inlineTextButton" onClick={()=>{setInputTarget('');setInputReturnMode(false);}}>Choose a different pathway</button>
              </div>
            ) : (
              <div className="startChoiceGrid" style={{marginTop:14,maxWidth:760}}>
                <button type="button" className="startChoice department" onClick={()=>setPage('dashboard')}>
                  <Activity size={18}/><span><strong>Radiology Department</strong><small>Operations, equipment, resources &amp; clinical AI</small></span><span aria-hidden="true">→</span>
                </button>
                <button type="button" className="startChoice ai" onClick={()=>setPage('ai')}>
                  <Cpu size={18}/><span><strong>AI Model &amp; Informatics</strong><small>Develop/train a model or procure/deploy clinical AI</small></span><span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        </main>
      )}


      {/* ── Dashboard ── */}
      {page==='dashboard' && (
        <main>
          <div style={{marginBottom:8}}><h1 style={{margin:0}}>Radiology Department</h1><AssessmentContextStrip settings={settings} onEdit={()=>goToAssessmentContext('dashboard',true)}/></div>
          <div className="departmentSetup">
            <button type="button" className="departmentSetupSummary" onClick={()=>setDeptSetupOpen(v=>!v)} aria-expanded={deptSetupOpen}>
              <Activity size={18} style={{color:'#2E7D32',flexShrink:0}}/>
              <span style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
                <strong>Department setup</strong>
                <span className="departmentSetupMeta">{Object.values(settings.equipment).reduce((sum,n)=>sum+(Number(n)||0),0)} devices · {settings.region} · {settings.timePeriod}</span>
                <span className={`departmentSetupScoreState ${departmentScoreReadiness.ready?'ready':'needs'}`}>{departmentScoreReadiness.ready?'Ready for Score':`Score needs ${departmentScoreReadiness.issues.length} input${departmentScoreReadiness.issues.length===1?'':'s'}`}</span>
              </span>
              <span style={{fontSize:12,color:'#607d66',fontWeight:700}}>{deptSetupOpen ? 'Hide setup ▴' : 'Edit setup ▾'}</span>
            </button>
            {deptSetupOpen && (
              <div className="departmentSetupBody">
                <section id="department-context-input" className={`departmentContextBlock ${scoreAttention==='context'?'scoreInputAttention':''}`} aria-labelledby="department-context-title">
                  <div className="departmentContextHeader">
                    <div>
                      <span>FIRST STEP</span>
                      <h2 id="department-context-title">Shared assessment context</h2>
                    </div>
                    <small>Used throughout this department assessment</small>
                  </div>
                  <div className="assessmentContextGrid">
                    <Sel label="Country / grid region" value={settings.region} options={META.regions} onChange={v=>set('region',v)}/>
                    <Sel label="Reporting period" value={settings.timePeriod} options={META.timePeriods} onChange={v=>set('timePeriod',v)}/>
                    <label>
                      Electricity price <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional override</span>
                      <input type="number" min="0" step="0.01" value={settings.electricityPrice} onChange={e=>set('electricityPrice',e.target.value)}
                        placeholder={String(ELECTRICITY_PRICE[settings.region]?.price ?? 0.20)}/>
                      <span style={{fontWeight:500,fontSize:10,color:'#78909c'}}>
                        {settings.electricityPrice ? 'User-entered tariff' : `Regional default: ${currencySym(settings.region)}${ELECTRICITY_PRICE[settings.region]?.price ?? 0.20}/kWh`}
                      </span>
                    </label>
                    {settings.region === 'Editable custom' && (
                      <label>
                        Custom grid intensity (kgCO₂e/kWh)
                        <input type="number" min="0" max="2" step="0.001" value={settings.customCi} onChange={e=>set('customCi',e.target.value)}/>
                        <span style={{fontWeight:500,fontSize:10,color:'#78909c'}}>Use a local utility or verified grid factor.</span>
                      </label>
                    )}
                  </div>
                </section>
                <p className="note" style={{fontSize:12,margin:'14px 0 12px'}}>Configure your shared assessment context, equipment, and clinical AI here. These inputs drive the department footprint, Score & EcoLabel, and the scenarios modeled in Improve.</p>
            {/* Equipment card grid */}
            <div id="department-equipment" className={scoreAttention==='equipment'?'scoreInputAttention':''} style={{marginBottom:16,scrollMarginTop:90}}>
              <div style={{fontWeight:700,color:'#2E7D32',fontSize:13,marginBottom:8,letterSpacing:'0.03em',textTransform:'uppercase'}}>Equipment</div>
              {departmentScoreReadiness.issues.some(i=>i.key==='equipment')&&<div className="scoreRequiredInputHint"><AlertTriangle size={15}/><div><strong>Department score needs a fleet / energy baseline.</strong><span>Choose an illustrative quick-start fleet below or enter your own device counts. Clinical AI examples are additive; they do not replace the underlying Department equipment and energy inputs.</span></div></div>}

              {/* Quick-start templates are illustrative defaults, not measured local data. */}
              <div className="quickStartNotice">
                <AlertTriangle size={17}/>
                <div>
                  <strong>Quick start or enter your own fleet</strong>
                  <p>These templates are illustrative starting points, not measured local data. Choose one and then verify or edit every device count below — or skip them and enter your own counts directly.</p>
                  <div className="quickStartChoices">
                    {DEPARTMENT_PRESETS.map(p=>(
                      <button key={p.key} title={p.desc} data-demo-target={p.key==='regional'?'leader-regional-preset':undefined}
                        onClick={()=>set('equipment', Object.fromEntries(Object.keys(DEFAULT_EQUIPMENT).map(k=>[k, p.equipment[k]||0])))}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MRI section */}
              {[{cards:MRI_CARDS,label:'MRI scanners'},{cards:OTHER_CARDS,label:'Other equipment'}].map(({cards,label})=>(
                <div key={label} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#90a4ae',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                    <span style={{flex:1,height:1,background:'#e0e0e0',display:'inline-block'}}/>
                    {label}
                    <span style={{flex:1,height:1,background:'#e0e0e0',display:'inline-block'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8}}>
                    {cards.map(({key, label:cardLabel, sublabel, Icon, tooltip}) => {
                      const count = settings.equipment[key] ?? 0;
                      const active = count > 0;
                      return (
                        <div key={key} title={tooltip ?? undefined} style={{
                          background: active ? '#e8f5e9' : '#f9f9f9',
                          border: `2px solid ${active ? '#a5d6a7' : '#e0e0e0'}`,
                          borderRadius: 14,
                          padding: '10px 8px 8px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'border-color 0.15s, background 0.15s',
                          position: 'relative',
                        }}>
                          {tooltip && (
                            <span style={{position:'absolute',top:5,right:7,fontSize:10,color:'#90a4ae',fontWeight:700,cursor:'help'}}>ⓘ</span>
                          )}
                          <Icon size={18} style={{color: active ? '#2E7D32' : '#bdbdbd'}}/>
                          <div style={{fontSize:10,fontWeight:700,color: active ? '#1b5e20' : '#9e9e9e',textAlign:'center',lineHeight:1.2}}>{cardLabel}</div>
                          {sublabel && (
                            <div style={{fontSize:9,color: active ? '#4CAF50' : '#bdbdbd',textAlign:'center',lineHeight:1.2}}>{sublabel}</div>
                          )}
                          <input
                            type="number" min="0" max="999" step="1"
                            value={count || ''}
                            placeholder="0"
                            onChange={e => setEquip(key, Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))))}
                            aria-label={`Number of ${cardLabel}`}
                            style={{
                              width:'100%', padding:'3px 2px', marginTop:2,
                              border:`1px solid ${active ? '#a5d6a7' : '#e0e0e0'}`,
                              borderRadius:8, fontSize:13, background:'white',
                              color: active ? '#1b5e20' : '#9e9e9e',
                              fontWeight:700, textAlign:'center', boxSizing:'border-box',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Collapsible advanced equipment parameters — override literature defaults with
                measured data (scanner logs, utility bills, a published benchmark). Only shown
                per device type the user has actually added; blank field = literature default. */}
            <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #eef7ee',marginBottom:16}}>
              <button onClick={()=>setAdvEquipExpanded(v=>!v)} style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:6,width:'100%'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#607d66'}}>Advanced equipment parameters</span>
                <span style={{fontSize:10,color:'#90a4ae'}}>{Object.keys(settings.equipmentOverrides).length
                  ? `${Object.keys(settings.equipmentOverrides).length} device type${Object.keys(settings.equipmentOverrides).length===1?'':'s'} overridden`
                  : 'optional — override with measured data'}</span>
                <span style={{fontSize:11,color:'#90a4ae',marginLeft:'auto'}}>{advEquipExpanded ? '▴ collapse' : '▾ expand'}</span>
              </button>
              {advEquipExpanded && (
                <div style={{marginTop:8}}>
                  {Object.entries(settings.equipment).filter(([,n])=>n>0).length === 0 ? (
                    <p className="note" style={{fontSize:11,margin:0}}>Add equipment above first — overrides apply per device type you've added.</p>
                  ) : (
                    <>
                    <p className="note" style={{fontSize:11,marginTop:0,marginBottom:8}}>Blank = <strong>Literature default</strong> (shown as placeholder). If you override a value, identify its source as <strong>Measured locally</strong>, <strong>Estimated locally</strong>, or <strong>Assumed / other</strong>. Provenance is stored with local/portable saves and research contributions without changing the calculation itself.</p>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead>
                          <tr style={{textAlign:'left',color:'#607d66'}}>
                            <th style={{padding:'4px 6px'}}>Device</th>
                            <th style={{padding:'4px 6px'}}>Active kW</th>
                            <th style={{padding:'4px 6px'}}>Idle kW</th>
                            <th style={{padding:'4px 6px'}}>Standby kW</th>
                            <th style={{padding:'4px 6px'}}>Off kW</th>
                            <th style={{padding:'4px 6px'}}>Scans/mo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(settings.equipment).filter(([,n])=>n>0).map(([key,n]) => {
                            const u = EQUIPMENT_UNITS[key];
                            if (!u) return null;
                            const ov = settings.equipmentOverrides[key] || {};
                            const cell = field => {
                              const hasOverride = ov[field] != null && ov[field] !== '';
                              const source = provenance.equipment?.[key]?.[field] || '';
                              return (
                                <td key={field} style={{padding:'3px 6px',verticalAlign:'top'}}>
                                  <input type="number" min="0" step="0.01" value={ov[field] ?? ''} placeholder={String(u[field])}
                                    onChange={e=>setEquipOverride(key, field, e.target.value)}
                                    aria-label={`${field} override for ${u.name}`}
                                    style={{width:86,padding:'4px 6px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                                  {hasOverride ? (
                                    <select aria-label={`Source of ${field} override for ${u.name}`} value={source} onChange={e=>setEquipProvenance(key, field, e.target.value)}
                                      style={{display:'block',width:100,marginTop:4,padding:'3px 4px',border:'1px solid #dfe8df',borderRadius:7,fontSize:9,background:'white',color:'#607d66'}}>
                                      <option value="">Source…</option>
                                      <option value="measured-locally">Measured locally</option>
                                      <option value="estimated-locally">Estimated locally</option>
                                      <option value="assumed-other">Assumed / other</option>
                                    </select>
                                  ) : <div style={{fontSize:8,color:'#90a4ae',marginTop:4}}>Literature default</div>}
                                </td>
                              );
                            };
                            return (
                              <tr key={key}>
                                <td style={{padding:'3px 6px',fontWeight:700,color:'#1b5e20',whiteSpace:'nowrap'}}>{n}× {u.name}</td>
                                {['active_kw','idle_kw','standby_kw','off_kw','scans'].map(cell)}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="clinicalAiSetupPrompt">
              <Brain size={18}/>
              <div>
                <strong>Clinical AI is a department input</strong>
                <p>Add deployed AI tools to include their compute and clinical effects — avoided scans, shorter protocols, and contrast changes — in the department footprint and EcoLabel.</p>
              </div>
              <button type="button" onClick={()=>{
                setDashOpen(o=>({...o,clinicalai:true}));
                setDeptSetupOpen(false);
                requestAnimationFrame(()=>document.getElementById('department-clinical-ai-input')?.scrollIntoView({behavior:'smooth',block:'start'}));
              }}>{(deptLabel.aiTools||[]).length ? `Edit ${(deptLabel.aiTools||[]).length} deployed tool${(deptLabel.aiTools||[]).length===1?'':'s'} →` : 'Add clinical AI tools →'}</button>
            </div>
            <p className="note" style={{fontSize:10,margin:'8px 0 0'}}>To model an AI system's own training/inference footprint rather than its department-level clinical effect, use <button onClick={()=>setPage('ai')} className="inlineTextButton">AI Model &amp; Informatics →</button>.</p>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
              <button onClick={()=>{setDeptSetupOpen(false);requestAnimationFrame(()=>document.getElementById('department-overview')?.scrollIntoView({behavior:'smooth',block:'start'}));}} style={{padding:'8px 13px',fontSize:12}}>Done — view department overview ↓</button>
            </div>

              </div>
            )}
          </div>

          {/* ── Sticky tab nav ── */}
          <div id="department-overview" className="stickyControls workflowAnchor">
            <div className="aiSummary">
              <span>Total energy <b>{fmtKwh(dash.totals.kwh)}{dash.totals.label}</b></span>
              <span>Scope 2 CO₂ <b>{fmtCo2(dash.scopes.scope2Kg)}</b></span>
              <span>Avoidable idle <b>{fmtKwh(dash.totals.idleWasteKwh)}</b></span>
            </div>
          </div>

          {/* ── Primary input: deployed Clinical AI ── */}
          <div id="department-clinical-ai-input" className="primaryInputPanel workflowAnchor">
            <button type="button" className="primaryInputSummary" onClick={()=>toggleDash('clinicalai')} aria-expanded={!!dashOpen['clinicalai']}>
              <Brain size={19}/>
              <span className="primaryInputSummaryText">
                <strong>Clinical AI — department input</strong>
                <small>{(deptLabel.aiTools||[]).length} deployed · Optional, but changes the department footprint and EcoLabel when used</small>
              </span>
              <span>{dashOpen['clinicalai'] ? 'Hide input ▴' : 'Add / edit input ▾'}</span>
            </button>
            {dashOpen['clinicalai'] && (
          <section id="dash-clinicalai" className="aiSection clinicalAiPrimaryBody">
            <h2 style={{marginBottom:4,display:'flex',alignItems:'center',gap:8}}><Brain style={{color:'#2E7D32'}}/> Clinical AI</h2>
            <p className="note" style={{marginBottom:12}}>Add the AI models used by this department, then describe each local use. A model's technical details — energy, hardware, performance, and compute location — live in one shared model entry; this section records where and how your department uses it.</p>

            <div className="quickStartNotice" style={{marginBottom:14}}><AlertTriangle size={17}/><div><strong>Quick start or enter your own Clinical AI</strong><p>The example is illustrative, not measured local data. Verify every study share and clinical-effect assumption before using the result.</p><div className="quickStartChoices"><button type="button" onClick={requestClearClinicalAi}>{(deptLabel.aiTools||[]).length>0?'Clear Clinical AI setup':'Start with no Clinical AI'}</button><button type="button" data-demo-target="leader-clinical-ai-example" onClick={loadClinicalAiExample}>Load example Clinical AI</button></div></div></div>

            {clearClinicalAiConfirmOpen && (
              <div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setClearClinicalAiConfirmOpen(false);}} style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(20,35,25,.42)',display:'grid',placeItems:'center',padding:18}}>
                <div role="dialog" aria-modal="true" aria-labelledby="clear-clinical-ai-title" style={{width:'min(540px,100%)',background:'white',borderRadius:18,padding:20,boxShadow:'0 24px 80px rgba(0,0,0,.22)',border:'1px solid #dce9dc'}}>
                  <h3 id="clear-clinical-ai-title" style={{margin:'0 0 8px',color:'#1b5e20'}}>Clear Clinical AI setup?</h3>
                  <p className="note" style={{fontSize:13,lineHeight:1.6,margin:'0 0 16px'}}>This removes the Clinical AI uses configured for this Radiology Department and removes their effects from the Department footprint. Model details already entered in <strong>AI Model &amp; Informatics</strong> will remain available.</p>
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
                    <button type="button" className="download" onClick={()=>setClearClinicalAiConfirmOpen(false)}>Cancel</button>
                    <button type="button" onClick={clearClinicalAi}>Clear Clinical AI uses</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{border:'1px solid #dfe3d6',borderRadius:12,padding:'12px 14px',background:'#fff',marginBottom:10}}>
              <strong style={{fontSize:13,color:'#1b5e20'}}>1 · Choose a model</strong>
              <p className="note" style={{fontSize:11,margin:'5px 0 8px'}}>Use one menu to select a model already in this assessment, add a pre-filled reference model, or enter a model that is not listed. Choosing a reference model adds it to this assessment immediately. <strong>AI Model &amp; Informatics</strong> is where its shared technical details are edited.</p>
              <select id="clinical-ai-model-picker" value={deptModelChoice?`model:${deptModelChoice}`:''} onChange={e=>{const v=e.target.value;if(!v)return;if(v.startsWith('model:'))setDeptModelChoice(v.slice(6));else if(v.startsWith('library:'))registerLibraryModel(v.slice(8));else if(v==='__new__')openAiModelWorkspaceFromDepartment('',true);}} style={{width:'100%',padding:'9px 10px',border:'1px solid #c8e6c9',borderRadius:10,background:'white',fontSize:12,fontWeight:700,color:'#2E7D32'}}>
                <option value="">Choose or add a model…</option>
                <optgroup label="Models in this assessment">{visibleAiModels.filter(m=>!String(m.id).startsWith('example-')).map(m=><option key={m.id} value={`model:${m.id}`}>{m.name||m.id}</option>)}</optgroup>
                <optgroup label="Reference library">{AI_MODEL_LIBRARY.filter(m=>m.key!=='custom').map(m=><option key={m.key} value={`library:${m.key}`}>Add reference: {m.label}</option>)}</optgroup>
                <optgroup label="Other"><option value="__new__">Enter a model not listed…</option></optgroup>
              </select>
              {deptModelChoice&&<div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:8,padding:'8px 10px',background:'#f7fbf8',borderRadius:9}}><span style={{fontSize:11,flex:1}}>Selected model: <strong>{aiModels[deptModelChoice]?.name||deptModelChoice}</strong></span><button type="button" className="download" onClick={()=>openAiModelWorkspaceFromDepartment(deptModelChoice)} style={{padding:'5px 9px',fontSize:11}}>Edit selected model →</button></div>}
            </div>

            <div style={{display:deptModelChoice?'block':'none',border:'1px solid #c8e6c9',borderRadius:12,padding:'12px 14px',background:'#fafffa',marginBottom:12}}>
              <strong style={{fontSize:13,color:'#1b5e20'}}>2 · Set how the model is used in your department</strong>
              <p className="note" style={{fontSize:11,margin:'5px 0 8px'}}>Describe how the selected model is used in this department. Add a local use to enter study share, deployment period, and any locally supported clinical effects.</p>
              {deptModelChoice?<div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:10}}><span style={{fontSize:12}}>For <strong>{aiModels[deptModelChoice]?.name||deptModelChoice}</strong></span><button type="button" onClick={()=>addDeptDeployment(deptModelChoice)}><Plus size={13}/> Add a local use</button></div>:<div className="note" style={{fontSize:11,marginBottom:10}}>Choose a model above before adding a local use.</div>}
              <div className="note" style={{fontSize:10,marginBottom:(deptLabel.aiTools||[]).length?10:0}}>{(deptLabel.aiTools||[]).length===0?'0 local AI uses configured — this is valid if the department currently uses no Clinical AI.':`${(deptLabel.aiTools||[]).length} local AI use${(deptLabel.aiTools||[]).length===1?'':'s'} configured.`}</div>

              {Object.entries((deptLabel.aiTools||[]).reduce((groups,t)=>{(groups[t.modelId]||=[]).push(t);return groups;},{})).map(([modelId,uses])=>{const record=aiModels[modelId];const modelName=record?.name||modelId||'Legacy AI model';const modelCfg=record&&!record.legacyDeploymentOnly?modelScenFromRecord(record,SCEN_DEFAULTS):null;const modelResult=modelCfg?aiResultFor(modelCfg,settings.region,settings.customCi,settings.equipment,settings.equipmentOverrides):null;const accountingUse=uses.find(u=>u.trainingBoundary==='allocated-local')||uses[0];const allocationRaw=parseFloat(accountingUse?.trainingAllocationPct);const allocationPct=Number.isFinite(allocationRaw)?Math.min(100,Math.max(0,allocationRaw)):100;const allocationMonths=Math.max(1,parseInt(accountingUse?.deployMonths)||36);const trainingTotalKwh=(modelResult?.training?.kwhTotal??parseFloat(accountingUse?.trainKwhTotal)??0)||0;const trainingMonthlyKwh=rnd(trainingTotalKwh*allocationPct/100/allocationMonths,2);const embodiedUse=uses.find(u=>u.embodiedBoundary==='allocated-local')||uses[0];const embAllocationRaw=parseFloat(embodiedUse?.embodiedAllocationPct);const embAllocationPct=Number.isFinite(embAllocationRaw)?Math.min(100,Math.max(0,embAllocationRaw)):100;const embodiedTotalKg=(modelResult?.embCo2KgTotal??parseFloat(embodiedUse?.embCo2Kg)??0)||0;const embodiedMonths=Math.max(1,parseInt(embodiedUse?.deployMonths)||36);const embodiedMonthlyKg=rnd(embodiedTotalKg*embAllocationPct/100/embodiedMonths,2);return <div key={modelId} style={{borderTop:'1px solid #dfe3d6',paddingTop:10,marginTop:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}><div style={{flex:1,minWidth:220}}><strong style={{color:'#1b5e20'}}>{modelName}</strong><div className="note" style={{fontSize:10,marginTop:2}}>Shared energy, hardware, performance, and compute-location details feed every local use nested below.</div></div>{record&&<button type="button" className="download" onClick={()=>openAiModelWorkspaceFromDepartment(modelId)} style={{padding:'5px 8px',fontSize:11}}>Edit model details</button>}<button type="button" className="download" onClick={()=>{setDeptModelChoice(modelId);addDeptDeployment(modelId);}} style={{padding:'5px 8px',fontSize:11}}>+ Add another local use</button></div>
                <div style={{display:'grid',gridTemplateColumns:'minmax(220px,auto) minmax(160px,220px) 1fr',gap:8,alignItems:'start',background:'#f4faf4',borderRadius:10,padding:'8px 10px',marginBottom:8}}><label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Where should this model's training be counted?<select value={accountingUse?.trainingBoundary||'upstream'} onChange={e=>updateDeptModelUses(modelId,'trainingBoundary',e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,background:'white'}}><option value="upstream">Upstream / outside this department</option><option value="allocated-local">Allocate a share to this department</option></select></label>{accountingUse?.trainingBoundary==='allocated-local'&&<label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Department share of training (%)<input type="number" min="0" max="100" step="1" value={accountingUse?.trainingAllocationPct??'100'} onChange={e=>updateDeptModelUses(modelId,'trainingAllocationPct',e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:4,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,background:'white'}}/></label>}<div className="note" style={{fontSize:10,margin:0,paddingTop:3}}>{accountingUse?.trainingBoundary==='allocated-local'?(trainingTotalKwh>0?<>CEDARS allocates <strong>{allocationPct}%</strong> of this model's training to the department, approximately <strong>{trainingMonthlyKwh} kWh/month</strong> over {allocationMonths} months. It is counted once for this model, not once per local use.</>:<>This model has no training-energy value yet. Enter one in AI Model &amp; Informatics before this allocation can affect the Department footprint.</>):<>No training electricity is added to this Department footprint. Training remains in the model's upstream lifecycle disclosure; inference is still counted for each local use.</>}</div></div>
                <div style={{display:'grid',gridTemplateColumns:'minmax(220px,auto) minmax(160px,220px) 1fr',gap:8,alignItems:'start',background:'#f8faf8',borderRadius:10,padding:'8px 10px',marginBottom:8}}><label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Where should AI hardware manufacturing be counted?<select value={embodiedUse?.embodiedBoundary||'upstream'} onChange={e=>updateDeptModelUses(modelId,'embodiedBoundary',e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,background:'white'}}><option value="upstream">Upstream / vendor or cloud service</option><option value="allocated-local">Allocate a share to this department</option></select></label>{embodiedUse?.embodiedBoundary==='allocated-local'&&<label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Department share of hardware (%)<input type="number" min="0" max="100" step="1" value={embodiedUse?.embodiedAllocationPct??'100'} onChange={e=>updateDeptModelUses(modelId,'embodiedAllocationPct',e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:4,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,background:'white'}}/></label>}<div className="note" style={{fontSize:10,margin:0,paddingTop:3}}>{embodiedUse?.embodiedBoundary==='allocated-local'?(embodiedTotalKg>0?<>CEDARS allocates <strong>{embAllocationPct}%</strong> of this model's manufacturing footprint here, approximately <strong>{embodiedMonthlyKg} kgCO₂e/month</strong> over {embodiedMonths} months. It is counted once per model.</>:<>No model-hardware embodied value is available yet, so this allocation currently adds nothing.</>):<>Manufacturing remains upstream and is not added to the Department Scope 3 footprint.</>}</div></div>
                {uses.map(t=><div key={t.id} style={{border:'1px solid #c8e6c9',borderRadius:10,padding:'10px 12px',margin:'0 0 8px 18px',background:'#fff',boxShadow:'inset 3px 0 0 #c8e6c9'}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}><strong style={{fontSize:11,color:'#607d66'}}>LOCAL USE</strong><input value={t.label??''} placeholder="e.g. ED PE triage" onChange={e=>updateDeptAiTool(t.id,'label',e.target.value)} style={{flex:1,minWidth:180,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:12,fontWeight:600}}/><button onClick={()=>removeDeptAiTool(t.id)} title="Remove local use" style={{background:'none',color:'#aaa',padding:4,borderRadius:8,boxShadow:'none',lineHeight:1}}><Trash2 size={15}/></button></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>{[['Share of studies (%)','studiesShare','1','100'],['Deployment period (months)','deployMonths','1','36'],['Local low-value scans avoided (%)','lowValueReductPct','1','0'],['Local scan-time reduction (%)','scanTimeReductPct','1','0'],['Local contrast reduction (%)','contrastReductPct','1','0']].map(([lab,key,step,ph])=><label key={key} style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>{lab}<input type="number" min="0" max={key==='deployMonths'?undefined:'100'} step={step} value={t[key]??''} placeholder={ph} onChange={e=>updateDeptAiTool(t.id,key,e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:12,background:'white'}}/></label>)}</div><label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11,marginTop:7}}>Basis for the local clinical-effect values<select value={t.effectBasis||'none'} onChange={e=>updateDeptAiTool(t.id,'effectBasis',e.target.value)}><option value="none">No clinical effect claimed</option><option value="observed-local">Observed locally</option><option value="validated-local">Locally validated estimate</option><option value="published">Published external evidence</option><option value="scenario">Assumed scenario</option></select></label><div className="note" style={{fontSize:10,marginTop:6}}>{['observed-local','validated-local'].includes(t.effectBasis)?<>These local-effect values are included in the <strong>current</strong> Department footprint.</>:<>These values are <strong>not</strong> credited to the current Department score. If you want to test them prospectively, model the corresponding change on Improve; CEDARS does not automatically transfer these percentages. This prevents an unvalidated benefit from making today's footprint look better.</>}</div></div>)}</div>;})}
            </div>

            {(deptLabel.aiTools||[]).length>0&&<div style={{background:'#f1f8f1',border:'1px solid #c8e6c9',borderRadius:12,padding:'10px 14px',marginBottom:10}}><strong style={{fontSize:12,color:'#1b5e20'}}>Estimated effect of the configured Clinical AI</strong><div style={{display:'flex',gap:14,flexWrap:'wrap',marginTop:5,fontSize:12}}><span>AI electricity <strong>+{fmtKwh(dash.clinicalMeta.aiKwh)}{dash.totals.label}</strong></span><span>Modeled active-scanner energy avoided <strong>−{fmtKwh(dash.clinicalMeta.scannerSavedKwh)}{dash.totals.label}</strong></span>{dash.clinicalMeta.aiEmbodiedKg>0&&<span>AI hardware Scope 3 <strong>+{fmtCo2(dash.clinicalMeta.aiEmbodiedKg)}{dash.totals.label}</strong></span>}</div><div className="note" style={{fontSize:10,marginTop:4}}>Updates automatically. Avoided studies are applied first; scan-time savings are then applied only to the remaining studies, so the same scanner energy is not credited twice.</div></div>}
            {(deptLabel.aiTools||[]).length===0&&<p className="note" style={{fontSize:12}}>No Clinical AI is currently listed. That is a valid department state.</p>}

            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',border:'1.5px solid #c8e6c9',borderRadius:12,padding:'11px 14px',marginTop:12,background:'#fff'}}>
              <div style={{flex:'1 1 300px'}}><strong style={{fontSize:12,color:'#1b5e20'}}>Continue when you're ready</strong><div className="note" style={{fontSize:10,marginTop:3}}>{(deptLabel.aiTools||[]).length>0?<>{new Set((deptLabel.aiTools||[]).map(t=>t.modelId)).size} model{new Set((deptLabel.aiTools||[]).map(t=>t.modelId)).size===1?'':'s'} · {(deptLabel.aiTools||[]).length} local use{(deptLabel.aiTools||[]).length===1?'':'s'} configured. You can return here and add more later.</>:<>Clinical AI is optional. If this department currently uses none, continue with zero local AI uses.</>}</div></div>
              {(deptLabel.aiTools||[]).length>0&&<button type="button" className="download" onClick={()=>document.getElementById('clinical-ai-model-picker')?.scrollIntoView({behavior:'smooth',block:'center'})}>+ Add another model or use</button>}
              <button type="button" onClick={()=>goToScore('department')}>Continue to Score &amp; EcoLabel →</button>
            </div>
          </section>
            )}
          </div>

          {/* ── Overview (always visible) ── */}
          <section className="aiSection" style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:4}}>Overview</h2>
            <p className="note" style={{marginBottom:16}}>Your department at a glance. Every area is listed below — click any row to open its detail; it stays tucked away until you want it.</p>

            {/* Hero tiles */}
            <div className="cards" style={{marginBottom:18}}>
              <Card icon={<Gauge/>}        title={`Total electricity ${dash.totals.label}`} value={fmtKwh(dash.totals.kwh)}       sub="Scanners, PACS, workstations, storage, and deployed Clinical AI where entered."/>
              <Card icon={<Leaf/>}         title="Carbon (Scope 2)"                          value={fmtCo2(dash.scopes.scope2Kg)}  sub={`Grid ${dash.ci} kgCO₂e/kWh · ${settings.region}.`}/>
              <Card icon={<Droplets/>}     title={`Electricity cost ${dash.totals.label}`}   value={fmtMoney(equivData.cost, equivData.sym)}      sub={`At ${equivData.sym}${equivData.pricePerKwh}/kWh. Editable under “What it means”.`}/>
              <Card icon={<TrendingDown/>} title={`Avoidable idle ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleWasteKwh)}             sub="Recoverable by standby / power-off — see Interventions."/>
            </div>

            {dash.scopes.scope2Kg>0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',margin:'-6px 0 14px',fontSize:11,color:'#607d66'}}>
                <span><strong style={{color:'#455a64'}}>Carbon in context:</strong> about {fmtBig(dash.scopes.scope2Kg/CAR_CO2_KG_KM)} km driven by a typical car for this {resultPeriodNoun}.</span>
                <button type="button" className="inlineTextButton" onClick={()=>{setEcoLabelMode('department');setPage('ecolabel');window.setTimeout(()=>document.getElementById('score-everyday-title')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}}>See everyday equivalents →</button>
              </div>
            )}

            {/* Next steps */}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>openDash('energy')} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none'}}>Open energy detail →</button>
              <button onClick={()=>openDash('carbon')} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none'}}>Open carbon detail →</button>
              <button onClick={()=>setPage('scenario')}><TrendingDown size={15}/> Reduce it — Interventions →</button>
            </div>
          </section>

          {/* ── Accordion: detail sections (click to open) ── */}
          <div className="detailToolbar" style={{border:'1px solid #dfe3d6',borderRadius:12,padding:'10px 12px'}}>
            <div>
              <h3 className="detailToolbarTitle">Supporting details <span>optional</span></h3>
              <div className="detailToolbarHint">Background, assumptions, methods, and source notes for the department estimate.</div>
            </div>
            <button className="download detailToolbarAction" onClick={()=>{const all=DASH_SECTIONS.every(id=>dashOpen[id]); setDashOpen(all?{}:Object.fromEntries(DASH_SECTIONS.map(id=>[id,true])));}} style={{padding:'7px 11px'}}>
              {DASH_SECTIONS.every(id=>dashOpen[id]) ? 'Collapse all sections ↑' : 'Expand all sections ↓'}
            </button>
          </div>
          <div style={{margin:'8px 0 14px',padding:'8px 10px',background:'#fafafa',borderRadius:10,border:'1px solid #eeeeee'}}>
            <div className="note" style={{fontSize:10,marginBottom:4}}>Key references used across the expanded sections include measured radiology energy/cooling data, radiology cloud and storage analyses, and AI/data-centre water evidence.<Ref id="heye-radiology-2020" order={DEPT_SUPPORT_REFS}/><Ref id="doo-jacr-cloud-2024" order={DEPT_SUPPORT_REFS}/><Ref id="jia-eurradiol-2026" order={DEPT_SUPPORT_REFS}/><Ref id="li-thirsty-2023" order={DEPT_SUPPORT_REFS}/></div>
            <ReferenceList ids={DEPT_SUPPORT_REFS}/>
          </div>
          {/* Everyday-equivalents interpretation moved to Score & EcoLabel, where results are interpreted. */}

          {/* ── Efficiency — energy into healthcare ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('efficiency')} aria-expanded={!!dashOpen['efficiency']}>
            <span className="accCaret">{dashOpen['efficiency']?'▾':'▸'}</span>
            <span className="accTitle">Efficiency — energy into healthcare</span>
            <span className="accVal">{deptLabelData.co2PerStudy} kgCO₂e/study</span>
          </button>
          {dashOpen['efficiency'] && (
          <section id="dash-efficiency" className={`aiSection ${scoreAttention==='volume'?'scoreInputAttention':''}`} style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:4}}>Efficiency — energy into healthcare</h2>
            <p className="note" style={{marginBottom:16}}>
              How efficiently your fleet's energy is converted into delivered patient care (imaging studies). Fixed energy — idle, standby, MRI cooling — is there whether you scan few patients or many, so an under-used fleet carries a high footprint <em>per study</em>. This reflects care <strong>delivered</strong>, not health outcomes.
            </p>

            <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',background:'#f1f8f1',borderRadius:12,padding:'10px 16px',marginBottom:16}}>
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:700,color:'#2E7D32'}}>
                Actual imaging studies / year
                <input type="number" min="0" value={settings.actualStudiesYear} onChange={e=>set('actualStudiesYear',e.target.value)} placeholder={`fleet est: ${efficiency.capacityYr.toLocaleString()}`} style={{width:150,padding:'6px 10px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:13,background:'white'}}/>
              </label>
              <span style={{fontSize:12,color:'#607d66'}}>
                {efficiency.isEstimate
                  ? `Blank — assuming fleet runs at typical throughput (~${efficiency.capacityYr.toLocaleString()}/yr). Enter your real annual volume to reveal utilisation.`
                  : `Fleet typical capacity: ~${efficiency.capacityYr.toLocaleString()}/yr.`}
              </span>
            </div>

            <div className="cards">
              <section className="card" style={{borderTop:`3px solid ${efficiency.band.color}`}}>
                <div className="cardHead"><Gauge/><span>Fleet utilisation</span></div>
                <b style={{color:efficiency.band.color}}>{efficiency.utilPct}%</b>
                <p>{efficiency.band.label} · {efficiency.studiesYr.toLocaleString()} of ~{efficiency.capacityYr.toLocaleString()} typical studies/yr.</p>
              </section>
              <Card icon={<Leaf/>} title="CO₂ per study (care delivered)" value={`${efficiency.co2PerStudy} kgCO₂e`}
                sub={efficiency.util > 0 && efficiency.util < 0.99
                  ? `${rnd(1/efficiency.util,1)}× the fleet's efficient baseline (${efficiency.designedCo2PerStudy} kgCO₂e) — fixed energy amortised over fewer studies.`
                  : `At or above typical throughput — efficient conversion. Lower = more care per kg CO₂.`}/>
              <Card icon={<Zap/>} title="Energy per study" value={`${efficiency.energyPerStudy} kWh`} sub="Fleet energy ÷ actual studies. Rises as utilisation falls."/>
              <Card icon={<Activity/>} title="Non-productive energy" value={`${efficiency.nonProductivePct}%`} sub="Share of fleet energy not converted into active scanning — idle, standby, off, and unused capacity. Rises as utilisation falls. Levers: power-down, scheduling, consolidation."/>
            </div>
            <p className="note" style={{marginTop:12}}>
              A large fleet doing little imaging shows high CO₂/study (poor conversion of energy into care); a small, busy fleet shows low CO₂/study even at higher <em>total</em> emissions. Utilisation explains the per-study figure; non-productive energy points to the fix.
            </p>
          </section>

          )}

          {/* ── 1. Energy consumption ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('energy')} aria-expanded={!!dashOpen['energy']}>
            <span className="accCaret">{dashOpen['energy']?'▾':'▸'}</span>
            <span className="accTitle">Energy consumption</span>
            <span className="accVal">{fmtKwh(dash.totals.kwh)}</span>
          </button>
          {dashOpen['energy'] && (
          <section id="dash-energy" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>1. Energy consumption</h2>
            <div className="cards">
              <Card icon={<Gauge/>}        title={`Total electricity ${dash.totals.label}`}  value={fmtKwh(dash.totals.kwh)}  sub={`Scanners, PACS, workstations${dash.storage.kwh>0?', data storage':''}${dash.clinicalMeta.active?', and deployed Clinical AI':''}.`} style={{gridColumn:'span 4'}}/>
              <Card icon={<Activity/>}     title={`Active scanning ${dash.totals.label}`}    value={fmtKwh(dash.totals.activeKwh)}            sub={`${dash.totals.activePct}% of total — energy during actual scan acquisition.`}/>
              <Card icon={<TrendingDown/>} title={`Idle + standby ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleKwh)}              sub={`${dash.totals.idlePct}% of total — between scans and overnight. Primary optimisation target.`}/>
              <Card icon={<TrendingDown/>} title={`Avoidable idle ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleWasteKwh)}         sub="Recoverable by standby / power-off policies."/>
              {dash.storage.kwh > 0 && <Card icon={<Database/>} title={`Data storage / archive ${dash.totals.label}`} value={fmtKwh(dash.storage.kwh)} sub={`${dash.storage.storedTB} TB held over ${dash.storage.retentionYears} yr (${dash.storage.cloud?'cloud':'on-prem'}) at ${dash.storage.intensity} kWh/TB/yr. Part of the total above — configure in Infrastructure.`}/>}
              <Card icon={<Activity/>}     title="Energy per imaging scan"                   value={`${dash.totals.energyPerScan} kWh`}       sub="Total ÷ all scans. Use for modality benchmarking and protocol optimisation."/>
              {sciPerStudy !== null && <Card icon={<Target/>} title="SCI — carbon per imaging study" value={`${sciPerStudy} kgCO₂e`} sub={`Software Carbon Intensity (Green Software Foundation): operational CO₂ (${dash.totals.energyPerScan} kWh × ${dash.ci} CI) + embodied carbon per study. Lower is better. (Doo et al. JACR 2024)`} style={{gridColumn:'span 4'}}/>}
            </div>
          </section>

          )}

          {/* ── 2. Carbon emissions ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('carbon')} aria-expanded={!!dashOpen['carbon']}>
            <span className="accCaret">{dashOpen['carbon']?'▾':'▸'}</span>
            <span className="accTitle">Carbon emissions — GHG scopes</span>
            <span className="accVal">{fmtCo2(dash.scopes.scope2Kg)} Scope 2</span>
          </button>
          {dashOpen['carbon'] && (
          <section id="dash-carbon" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>2. Carbon emissions — GHG Protocol scopes</h2>
            <p className="note" style={{marginBottom:12}}>Scope 1 is reported only when you enter measured/estimated direct emissions; CEDARS no longer derives it as a percentage of electricity. Scope 2 is purchased local electricity. Scope 3 includes embodied carbon, patient travel, contrast, cloud archive carbon, staff commute, and DICOM transfer. All {dash.totals.label}. Framework: Doo et al. JACR 2024.</p>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,background:'#f1f8f1',borderRadius:12,padding:'8px 16px',flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#607d66'}}>
                Staff commute — <strong style={{color:'#263238'}}>{derivedStaffCount} FTE estimated</strong> from {Object.values(settings.equipment).reduce((s,n)=>s+(n||0),0)} devices (illustrative estimate — see sources.md)
              </span>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'#2E7D32',marginLeft:'auto'}}>
                Avg one-way commute
                <input type="number" min="0" step="1" value={settings.staffCommuteKm} onChange={e=>set('staffCommuteKm',e.target.value)}
                  style={{width:60,padding:'4px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:12,background:'white'}}/>
                km
              </label>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}><label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'#2E7D32'}}>Direct emissions / Scope 1 (kgCO₂e/year) <input type="number" min="0" step="1" value={settings.scope1AnnualKg} onChange={e=>set('scope1AnnualKg',e.target.value)} placeholder="leave blank if not assessed" style={{width:150,padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8}}/></label><span className="note" style={{fontSize:10}}>Optional. Enter fuel/generator/medical-gas emissions when known; blank is reported as not assessed.</span></div>
            <div className="cards">
              <Card icon={<Factory/>}    title="Scope 1 — Direct"          value={dash.scopes.scope1Assessed?fmtCo2(dash.scopes.scope1Kg):'Not assessed'}       sub={dash.scopes.scope1Assessed?'User-entered annual direct emissions, scaled to this reporting period.':'No automatic percentage proxy is applied.'}/>
              <Card icon={<Gauge/>}      title="Scope 2 — Electricity"     value={fmtCo2(dash.scopes.scope2Kg)}  sub={`Grid at ${dash.ci} kgCO₂e/kWh (${settings.region}). Local Clinical AI compute is included here; outsourced cloud AI is reported in Scope 3.`}/>
              <Card icon={<Cpu/>}        title="Scope 3 — Embodied carbon" value={fmtCo2(dash.scopes.scope3EmbKg)}    sub="Hardware manufacturing amortised over lifespan. Extend lifetime to reduce."/>
              <Card icon={<Car/>}        title="Scope 3 — Patient travel"  value={fmtCo2(dash.scopes.scope3TravelKg)} sub={`${dash.scopes.imagingScans.toLocaleString()} scans × ${PATIENT_KM_RT} km avg round trip.`}/>
              <Card icon={<Droplets/>}   title="Scope 3 — Contrast supply chain" value={fmtCo2(dash.scopes.scope3ContrastKg)} sub="Iodinated contrast: extraction, processing, packaging, and administration. (Nghiem 2026)"/>
              <Card icon={<Car/>}        title="Scope 3 — Staff commute"   value={fmtCo2(staffCommuteCo2)}            sub={`~${derivedStaffCount} staff (estimated from device fleet) × ${settings.staffCommuteKm} km one-way × ${STAFF_DAYS_PER_MO} days/mo. DEFRA 2023.`}/>
              <Card icon={<Wifi/>}       title="Scope 3 — Data transfer"   value={fmtCo2(networkTransferCo2)}         sub={`${dash.scopes.imagingScans.toLocaleString()} studies × ${AVG_STUDY_GB} GB avg × 0.001 kWh/GB. DICOM network energy (Aslan et al. 2018).`}/>
              {dash.scopes.scope3CloudStorageKg>0&&<Card icon={<Database/>} title="Scope 3 — Cloud archive electricity" value={fmtCo2(dash.scopes.scope3CloudStorageKg)} sub={`Cloud archive carbon uses ${dash.storage.ci} kgCO₂e/kWh rather than the hospital grid.`}/>}
            </div>
            <section style={{marginTop:16}}>
              <h2>Scope 1 / 2 / 3 breakdown</h2>
              <Suspense fallback={<div style={{height:80}}/>}><Bar data={chartScopes} options={scopeBarOpts}/></Suspense>
              <p className="note" style={{marginTop:8}}>Patient travel typically dominates Scope 3 in clean-grid regions — reducing unnecessary scans cuts more carbon than efficiency measures alone. Absolute values shown in cards above.</p>
            </section>
          </section>

          )}

          {/* ── Charts ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('charts')} aria-expanded={!!dashOpen['charts']}>
            <span className="accCaret">{dashOpen['charts']?'▾':'▸'}</span>
            <span className="accTitle">Charts — energy &amp; carbon by equipment</span>
            <span className="accVal">visual</span>
          </button>
          {dashOpen['charts'] && (
          <div id="dash-charts" className="aiSection charts" style={{marginTop:28}}>
            <section><h2>Energy by equipment</h2><Suspense fallback={<div style={{height:200}}/>}><Bar data={chartEnergy} options={energyBarOptions}/></Suspense></section>
            <section><h2>Carbon (Scope 2) by equipment</h2><Suspense fallback={<div style={{height:200}}/>}><Doughnut data={chartCo2}/></Suspense></section>
            {dash.storage.kwh > 0 && <p className="note" style={{gridColumn:'1/-1',marginTop:4}}>Device bars sum to equipment energy only; the total also includes {fmtKwh(dash.storage.kwh)} of data storage/archive (shown separately in Energy consumption and Infrastructure).</p>}
          </div>

          )}

          {/* ── 3. Infrastructure ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('infrastructure')} aria-expanded={!!dashOpen['infrastructure']}>
            <span className="accCaret">{dashOpen['infrastructure']?'▾':'▸'}</span>
            <span className="accTitle">Infrastructure &amp; hardware</span>
            <span className="accVal">Scope 3 {fmtCo2(dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2)}</span>
          </button>
          {dashOpen['infrastructure'] && (
          <section id="dash-infrastructure" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>3. Infrastructure and hardware</h2>
            <div className="cards">
              <Card icon={<Cpu/>}          title="Top idle waster"    value={dash.topOpportunities[0]?.equipment ?? '—'}          sub={`${fmtKwh(dash.topOpportunities[0]?.idleWasteKwh ?? 0)} avoidable idle${dash.totals.label}. Highest single-unit saving.`}/>
              <Card icon={<Activity/>}     title="Hardware lifespans" value="MRI 15 yr / CT 12 yr"                                sub="Radiography 10 yr, Ultrasound 7 yr. Extend to reduce Scope 3 embodied carbon."/>
              <Card icon={<TrendingDown/>} title="Carbon intensity"   value={`${dash.ci} kgCO₂e/kWh`}                            sub={`${settings.region} grid. Move to renewable tariff or lower-carbon region to cut Scope 2.`}/>
              <Card icon={<Gauge/>}        title="Scope 3 total"      value={fmtCo2(dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2)} sub="Embodied + patient travel + contrast supply chain + outsourced cloud AI/archive electricity + staff commute + DICOM data transfer."/>
            </div>

            {/* Data storage & archiving — fleet-driven long-term PACS/archive footprint */}
            <div className="inputSummary" style={{marginTop:16}}>
              <h3 style={{marginTop:0,marginBottom:6,color:'#1b5e20',fontSize:15}}>Data storage &amp; archiving</h3>
              <p className="note" style={{marginBottom:12,fontSize:12}}>
                Long-term PACS/archive footprint, derived from your fleet's study volumes × per-modality file sizes, held over the retention period and added to the department total above. Separate from the PACS/reading servers and from DICOM transfer. Editable estimates — storage levers and savings from Jia et al. <em>Eur Radiol</em> 2026<Ref id="jia-eurradiol-2026" order={DEPT_STORAGE_REFS}/> (axial-only storage −69%, cloud −40 to −80%, 8-year retention −38%, all three −89%); per-modality file sizes from Doo et al. <em>JACR</em> 2024<Ref id="doo-jacr-cloud-2024" order={DEPT_STORAGE_REFS}/>.
              </p>
              <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
                <label style={{flexDirection:'row',alignItems:'center',gap:8,fontSize:12,fontWeight:700,color:'#2E7D32'}}>
                  Retention (years)
                  <input type="number" min="0" step="1" value={settings.storageRetentionYears} onChange={e=>set('storageRetentionYears',e.target.value)} style={{width:70,padding:'6px 9px',border:'1px solid #c8e6c9',borderRadius:10,background:'white',fontWeight:400}}/>
                </label>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>set('storageCloud',false)} className={!settings.storageCloud?'on':''} style={{padding:'6px 12px',fontSize:12,borderRadius:12}}>On-premises</button>
                  <button onClick={()=>set('storageCloud',true)} className={settings.storageCloud?'on':''} style={{padding:'6px 12px',fontSize:12,borderRadius:12}}>Cloud archive</button>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>set('storageReformats','all')} className={settings.storageReformats!=='axial'?'on':''} style={{padding:'6px 12px',fontSize:12,borderRadius:12}}>Store all series</button>
                  <button onClick={()=>set('storageReformats','axial')} className={settings.storageReformats==='axial'?'on':''} style={{padding:'6px 12px',fontSize:12,borderRadius:12}}>Axial-only</button>
                </div>
                <label style={{flexDirection:'row',alignItems:'center',gap:8,fontSize:12,fontWeight:700,color:'#2E7D32'}}>
                  Custom intensity (kWh/TB/yr)
                  <input type="number" min="0" step="1" value={settings.storageIntensityCustom} onChange={e=>set('storageIntensityCustom',e.target.value)} placeholder={settings.storageCloud ? String(STORAGE_KWH_PER_TB_CLOUD) : String(STORAGE_KWH_PER_TB_ONPREM)} style={{width:80,padding:'6px 9px',border:'1px solid #c8e6c9',borderRadius:10,background:'white',fontWeight:400}}/>
                </label>
              </div>
              {settings.storageCloud&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8,margin:'-4px 0 12px',padding:'9px 10px',background:'#f7fbf8',border:'1px solid #dfe9df',borderRadius:10}}><label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Cloud archive provider<select value={settings.storageProvider||'AWS'} onChange={e=>{const p=e.target.value;set('storageProvider',p);set('storageRegion','');set('storageCloudCi','');}}>{META.cloudProviders.filter(p=>p!=='Local compute').map(p=><option key={p} value={p}>{p}</option>)}</select></label><label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Cloud archive region<select value={settings.storageRegion||''} onChange={e=>{const r=e.target.value;set('storageRegion',r);const ci=CLOUD_REGIONS[settings.storageProvider||'AWS']?.regions?.[r];set('storageCloudCi',ci==null?'':String(ci));}}><option value="">Provider average ({CLOUD[settings.storageProvider||'AWS']?.ci??0.20} kgCO₂e/kWh)</option>{Object.entries(CLOUD_REGIONS[settings.storageProvider||'AWS']?.regions||{}).map(([r,ci])=><option key={r} value={r}>{r} — {ci} kgCO₂e/kWh</option>)}</select></label><label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Archive grid CI (kgCO₂e/kWh)<input type="number" min="0" step="0.001" value={settings.storageCloudCi} onChange={e=>set('storageCloudCi',e.target.value)} placeholder={String(CLOUD[settings.storageProvider||'AWS']?.ci??0.20)}/></label></div>}
              {settings.storageIntensityCustom && parseFloat(settings.storageIntensityCustom) > 0 && (
                <p className="note" style={{marginTop:-8,marginBottom:12,fontSize:11}}>Custom intensity overrides the on-prem/cloud default above — enter your own server-density/PUE figure (e.g. matching a published site architecture). Clear to go back to the default.</p>
              )}
              <div className="cards">
                <Card icon={<HardDrive/>}    title="Data generated / year" value={`${dash.storage.annualDataTB} TB`} sub="Σ studies/yr × per-modality file size (Doo 2024)."/>
                <Card icon={<Database/>}     title="Archive held"          value={`${dash.storage.storedTB} TB`}   sub={`${dash.storage.retentionYears}-yr retention · ${dash.storage.cloud?`cloud${dash.storage.provider?` (${dash.storage.provider}${dash.storage.region?` · ${dash.storage.region}`:''})`:''}`:'on-premises'} · ${dash.storage.intensity} kWh/TB/yr · ${dash.storage.ci} kgCO₂e/kWh.`}/>
                <Card icon={<Zap/>}          title={`Storage energy ${dash.totals.label}`} value={fmtKwh(dash.storage.kwh)} sub={`Included in the department total. ${fmtCo2(dash.storage.co2)}.`}/>
                <Card icon={<Droplets/>}     title={`Storage cost ${dash.totals.label}`}   value={fmtMoney(dash.storage.kwh * getPrice(settings.region, settings.electricityPrice), currencySym(settings.region))} sub="Electricity cost at your tariff; cloud service fees billed separately."/>
              </div>
              <p className="note" style={{marginTop:8,fontSize:11}}>
                These toggles set your <strong>current</strong> storage practice. The same three strategies also appear as tickable actions on the <strong>Interventions</strong> and <strong>EcoLabel</strong> tabs, where their savings are modelled as a <em>change from</em> this current setup (so they never double-count). Levers: <strong>axial-only</strong> avoids non-essential CT/PET reformats (up to ~69% less CT storage, Jia 2026); <strong>cloud</strong> archives run ~40% lower energy; <strong>shorter retention</strong> shrinks the held archive. Excludes backups and embodied storage-hardware carbon (so this undercounts).
              </p>
              <ReferenceList ids={DEPT_STORAGE_REFS} compact/>
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
            <section style={{marginTop:20}}>
              <h2>Modality energy benchmarks</h2>
              <p className="note" style={{marginBottom:12}}>Annual reference values from Vosshenrich et al. Idle accounts for 50–66% of total energy (Schoen et al.: idle offers 14.9× more savings potential than active state). Energy is as reported by each source; CO₂ is normalised to the global-average grid ({BENCHMARK_CI} kgCO₂e/kWh) so rows are comparable — the source publications used varying local grids (~0.20–0.24).</p>
              <div className="row" style={{fontWeight:700,color:'#2E7D32'}}><span>Modality</span><span>kWh / year · kgCO₂e / year</span><span style={{fontSize:12}}>Note</span></div>
              {MODALITY_BENCHMARKS.map((m,i)=>(
                <div key={i} className="row">
                  <b>{m.modality}</b>
                  <span>{m.kwhYear.toLocaleString()} kWh · {Math.round(m.kwhYear * BENCHMARK_CI).toLocaleString()} kg CO₂e</span>
                  <small>{m.note}</small>
                </div>
              ))}
            </section>
          </section>

          )}

          {/* ── 4. Resource metrics ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('resources')} aria-expanded={!!dashOpen['resources']}>
            <span className="accCaret">{dashOpen['resources']?'▾':'▸'}</span>
            <span className="accTitle">Resource footprint — water, waste, contrast</span>
            <span className="accVal">{fmtL(dash.resources.waterLitres)} water</span>
          </button>
          {dashOpen['resources'] && (
          <section id="dash-resources" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>4. Resource footprint</h2>
            <p className="note" style={{marginBottom:12}}>Replace defaults with procurement records, waste manifests, and water bills for publication-quality figures.</p>
            <div className="cards">
              <Card icon={<Droplets/>} title={`Water footprint ${dash.totals.label}`}      value={fmtL(dash.resources.waterLitres)}  sub={`${WATER_PER_KWH} L/kWh screening factor — a data-centre proxy, not a measured imaging value. See "How is this estimated?" below.`}/>
              <Card icon={<FileText/>} title={`Paper consumption ${dash.totals.label}`}    value={`${dash.resources.paperKg} kg`}    sub={`~${PAPER_G_PER_ENC}g/encounter digital workflow. Full film-based: ~200g. (ESR Green Imaging)`}/>
              <Card icon={<Trash2/>}   title={`Hazardous waste ${dash.totals.label}`}      value={`${dash.resources.hazardousKg} kg`} sub="Contrast media disposal, sharps. Replace with waste manifest data."/>
              <Card icon={<Leaf/>}     title={`Total Scope 2 carbon ${dash.totals.label}`} value={fmtCo2(dash.scopes.scope2Kg)}      sub="All electricity-derived emissions. Primary target for renewable energy procurement."/>
            </div>
            <details className="methodologyDetails" style={{marginTop:10}}>
              <summary>How is the water footprint estimated? (area of active investigation)</summary>
              <div className="note" style={{marginTop:8}}>
                CEDARS multiplies the department's electricity by a {WATER_PER_KWH} L/kWh screening factor. That figure is a data-centre cooling proxy; no published study has measured water use per kWh for imaging equipment. The best evidence available is for cooling <em>energy</em>: in a one-year instrumented study of three CT and four MRI scanners, dedicated cooling systems accounted for 44.5% of the combined scanner-plus-cooling consumption<Ref id="heye-radiology-2020" order={DEPT_WATER_REFS}/>. Whether that cooling consumes water depends on the plant: closed-loop air-cooled chillers reject heat to air and use essentially no water on site; water-cooled chillers fed by a cooling tower lose water to evaporation; once-through city-water cooling consumes the most; and many hospitals run scanners from a shared chilled-water loop, where the water sits at the central plant. Off-site, every kWh also carries the water used to generate it, which varies by grid<Ref id="li-thirsty-2023" order={DEPT_WATER_REFS}/>. Treat this line as a placeholder, not a measurement. CEDARS will replace the screening factor with a cooling-type model as evidence becomes available, and welcomes measured data from departments (see About).
                <ReferenceList ids={DEPT_WATER_REFS} compact/>
              </div>
            </details>

            <h3 style={{marginTop:24,marginBottom:4,color:'#2E7D32',fontSize:15}}>Contrast media &amp; contamination</h3>
            <p className="note" style={{marginBottom:12}}>
              Iodinated contrast (CT/angio/fluoro) and gadolinium (MRI) are excreted by patients and pass through wastewater treatment largely unremoved — gadolinium is now measurable in rivers and drinking water. Estimated from your fleet's exam volumes × literature defaults (hover ⓘ). Reducing unnecessary contrast exams cuts both patient risk and environmental release.
            </p>
            <div className="cards">
              <Card icon={<Droplets/>} title={`Contrast-enhanced exams ${dash.totals.label}`} value={dash.resources.contrast.enhancedExams.toLocaleString()}
                sub={`${dash.resources.contrast.icmExams.toLocaleString()} iodinated · ${dash.resources.contrast.gbcaExams.toLocaleString()} gadolinium.`}
                tip={`Assumes ${Math.round(CONTRAST.fraction.CT*100)}% of CT, ${Math.round(CONTRAST.fraction.MRI*100)}% of MRI, ${Math.round(CONTRAST.fraction['Angio/IR']*100)}% of angio use contrast. Institution-dependent literature defaults.`}/>
              <Card icon={<AlertTriangle/>} title={`Gadolinium released ${dash.totals.label}`} value={dash.resources.contrast.gadKg >= 1 ? `${dash.resources.contrast.gadKg} kg` : `${dash.resources.contrast.gadGrams.toLocaleString()} g`}
                sub="Excreted to wastewater, ~unremoved by treatment. Persistent 'anthropogenic gadolinium' contamination."
                tip={`~${CONTRAST.gadGramsPerExam} g Gd/exam (0.1 mmol/kg × 70 kg). Gadolinium passes through wastewater treatment essentially unremoved → environmental release ≈ administered dose.`}/>
              <Card icon={<Droplets/>} title={`Iodine load ${dash.totals.label}`} value={`${dash.resources.contrast.iodineKg} kg`}
                sub="Iodinated contrast excreted to wastewater. Persistent; forms disinfection by-products."
                tip={`${CONTRAST.icmMlPerExam} mL/exam × ${CONTRAST.iodineMgPerMl} mgI/mL. Iodinated contrast is renally excreted largely unchanged within 24 h.`}/>
              <Card icon={<Trash2/>} title={`Contrast wasted ${dash.totals.label}`} value={`${dash.resources.contrast.wastedL} L`}
                sub={`~${dash.resources.contrast.hazKg} kg discarded contrast (pharma waste). Lever: weight-based dosing, multi-dose/bulk vials.`}
                tip={`Assumes ${Math.round(CONTRAST.wasteFraction*100)}% of drawn contrast discarded unused (overfill/leftover). Total volume used: ${dash.resources.contrast.volumeL.toLocaleString()} L ${dash.totals.label}.`}/>
              <Card icon={<Leaf/>} title={`Iodinated contrast carbon ${dash.totals.label}`} value={fmtCo2(dash.resources.contrast.co2eKg)}
                sub="Extraction, processing, packaging, and administration for the full procured vial — not just the injected dose. Also counted in Scope 3 above."
                tip={`${CONTRAST.icmMlPerExam} mL/exam × ${CONTRAST.icmCo2eGPerMl} gCO₂e/mL (Nghiem et al. 2026 supply-chain LCA). No sourced gadolinium (MRI) production-carbon figure was found, so this covers iodinated contrast only. Try the "Right-size contrast vials" or "Switch to multidose contrast injector system" interventions to reduce it.`}/>
            </div>
            <p className="note" style={{marginTop:8,fontSize:12}}>
              Estimates are mass-balance (release ≈ administered dose); contrast-use fractions vary widely by institution — replace with pharmacy/procurement data. Sources: gadolinium & iodinated contrast environmental persistence literature; ESR sustainability guidance.
            </p>
          </section>
          )}
        </main>
      )}

      {/* ── Equivalencies ── */}
      {/* ── AI ── */}
      {page==='ai' && (
        <main>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:8}}>
            <div><h1 style={{margin:0}}>AI Model &amp; Informatics</h1><AssessmentContextStrip settings={settings} ai onEdit={()=>goToAssessmentContext('ai',true)}/>{visibleAiModels.length>1&&<div className="contextLine" style={{marginTop:4}}><strong>Current AI model:</strong> <select value={visibleAiModels.some(m=>m.id===scen.modelId)?scen.modelId:''} onChange={e=>e.target.value&&loadAiModelRecord(e.target.value)}><option value="">Select model…</option>{visibleAiModels.map(m=><option key={m.id} value={m.id}>{modelDisplayName(m)}</option>)}</select></div>}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{aiEntryOrigin==='department'&&<button type="button" onClick={returnToClinicalAi} style={{padding:'8px 14px',fontSize:13,background:'#1b5e20',color:'#fff',fontWeight:800}}>← Clinical AI</button>}{aiEntryOrigin==='improve'&&<button type="button" onClick={returnToAiImprove} style={{padding:'8px 14px',fontSize:13,background:'#1b5e20',color:'#fff',fontWeight:800}}>← Return to AI Improve</button>}{scen.aiRoute&&<button type="button" className="download aiBackOptionsButton" onClick={()=>{setAiExampleLoaded('');setS('aiRoute','');}}>← Back to AI options</button>}</div>
          </div>

          {aiEntryOrigin === 'department' && !aiExampleLoaded && (
            <div className="quickStartNotice" style={{marginBottom:14,border:'2px solid #2E7D32',boxShadow:'0 4px 14px rgba(46,125,50,0.12)'}}><Brain size={17}/><div style={{width:'100%'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><strong>You opened this model from Radiology Department → Clinical AI</strong><button type="button" onClick={returnToClinicalAi} style={{background:'#1b5e20',color:'#fff',fontWeight:800,padding:'7px 12px'}}>← Return to Clinical AI</button></div><p style={{marginBottom:0}}>Changes to this shared model record are saved back to the Clinical AI setup automatically. Return there to add or edit local workflows, study share, and department accounting.</p></div></div>
          )}
          {aiExampleLoaded && (()=>{const ex=AI_EXAMPLES.find(e=>e.key===aiExampleLoaded);return <div className="quickStartNotice" style={{marginBottom:14}}><AlertTriangle size={17}/><div><strong>Example loaded{ex?.title?`: ${ex.title}`:''}</strong><p>You are viewing a completed example record, not your department's measured model. Explore the inputs and calculations, return to the AI start screen, or copy the example into a new model record before using it in your own assessment.</p><div className="quickStartChoices"><button type="button" onClick={()=>{setAiExampleLoaded('');setS('aiRoute','');}}>← Back to AI start</button><button type="button" onClick={useLoadedExampleAsStartingPoint}>Use as my starting point</button>{aiEntryOrigin==='department'&&<button type="button" onClick={returnToClinicalAi}>Return to Clinical AI without using example</button>}</div></div></div>;})()}

          {/* ── Entry step: development vs clinical selection/deployment ── */}
          {!scen.aiRoute ? (
            <AiEntryStep
              route={scen.aiRoute} ownMode={scen.ownMode}
              systemType={scen.aiSystemType || ''}
              onSystemType={v => setS('aiSystemType', v)}
              onRoute={r => {
                setS('aiRoute', r);
                if (r === 'compare') {
                  ensureBenchModels();
                  setAiOpen(o => ({...o, benchmark: true}));
                  if (compareCtx !== 'custom' || !(parseFloat(scen.inferStudiesMonth) > 0)) applyCompareCtx(compareCtx);
                }
              }}
              onOwnMode={m => setS('ownMode', m)}
              examples={AI_EXAMPLES} onExample={loadAiExample} onReset={startBlankAiRecord}
            />
          ) : (
            <AiRouteStrip route={scen.aiRoute} ownMode={scen.ownMode}
              onComparison={()=>{setAiOpen(o=>({...o,benchmark:true}));window.setTimeout(()=>document.getElementById('ai-benchmark')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}}
              onBackToComparison={benchModels.length ? ()=>{setS('aiRoute','compare');setAiOpen(o=>({...o,benchmark:true}));window.setTimeout(()=>document.getElementById('ai-benchmark')?.scrollIntoView({behavior:'smooth',block:'start'}),60);} : null}
              onStartComparison={startComparisonFromCurrent}/>
          )}

          {scen.aiRoute === 'compare' && (
            <div style={{marginTop:12,display:'grid',gap:10}}>
              <AiDeploymentContext ctxSource={compareCtx} dept={{region:settings.region, ci:getCI(settings.region, settings.customCi), studiesPerMonth:Math.round((dash.scopes.imagingScans || 0) / (TIME_MULT[settings.timePeriod] ?? 1))}} volume={scen.inferStudiesMonth} onCtxSource={applyCompareCtx} onVolume={v=>setScen(s=>({...s, compareVolumeSource:'custom', inferStudiesMonth:v}))}/>
              <div className="inputSummary" style={{margin:0}}>
                <h3 style={{margin:'0 0 8px',color:'#1b5e20',fontSize:15}}>Shared compute &amp; comparison context</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
                  <Sel label="Cloud / deployment" value={scen.cloudProvider} options={META.cloudProviders} onChange={setCloudProvider}/>
                  <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>
                    Compute region <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>shared across candidates</span>
                    <select value={scen.cloudRegion} onChange={e=>setS('cloudRegion',e.target.value)}>
                      {Object.entries(CLOUD_REGIONS[scen.cloudProvider]?.regions ?? {}).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}
                    </select>
                  </label>
                  <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>
                    Comparison basis
                    <select value={scen.compareBasis || 'lifecycle'} onChange={e=>setS('compareBasis',e.target.value)}>
                      <option value="lifecycle">Carbon/study incl. amortised training</option>
                      <option value="inference">Inference carbon/study only</option>
                    </select>
                  </label>
                  {scen.compareBasis !== 'inference' && <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>Expected deployment (months)<input type="number" min="1" value={scen.deployMonths} onChange={e=>setS('deployMonths',e.target.value)}/></label>}
                </div>
                <p className="note" style={{margin:'8px 0 0',fontSize:11}}>Workload, provider, compute region and amortisation basis are held constant so candidate differences reflect the model assumptions rather than a changed deployment scenario.</p>
              </div>
            </div>
          )}

          {scen.aiRoute === 'own' && scen.ownMode === 'measure' && (
            <MeasureChooser scen={scen} onUse={patch => setScen(sc => ({...sc, ...patch}))} onDone={() => setS('ownMode', 'measured')}/>
          )}

          {scen.aiRoute && (<>

          {scen.aiRoute === 'compare' && (
            <div className="inputSummary" style={{margin:'14px 0 10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                <div>
                  <h2 style={{margin:'0 0 4px', color:'#1b5e20'}}>Candidate models</h2>
                  <p className="note" style={{margin:0,maxWidth:900}}>
                    Compare at least two candidates side by side under the same workload and compute context. Keep the clinical task and performance metric like-for-like. Optional procurement fields reflect the HAIP AI Vendor Disclosure Framework: intended use, validation, regulatory status and integration context.<Ref id="kpodzro-haip-2026" order={AI_ENTRY_REFS}/>
                  </p>
                </div>
                <button type="button" onClick={addBenchModel} disabled={benchModels.length>=6}><Plus size={14}/> Add candidate</button>
              </div>
              <div id="ai-shared-comparison-definition" style={{marginTop:14,padding:'11px 12px',border:'1px solid #c8e6c9',borderRadius:12,background:'#f7fbf8',scrollMarginTop:100}}>
                <strong style={{fontSize:12,color:'#1b5e20'}}>Shared comparison definition</strong>
                <p className="note" style={{fontSize:10,margin:'4px 0 8px'}}>Enter this once. Performance ranking and Pareto labels stay off until all candidates address the same task, endpoint, and validation cohort/context.</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:8}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Clinical task / intended use<input value={scen.compareClinicalTask||''} onChange={e=>setS('compareClinicalTask',e.target.value)} placeholder="e.g. PE triage on CTPA"/></label>
                  <label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Clinical endpoint<input value={scen.compareEndpoint||''} onChange={e=>setS('compareEndpoint',e.target.value)} placeholder="e.g. case-level PE detection"/></label>
                  <label style={{fontSize:11,fontWeight:700,color:'#2E7D32'}}>Validation cohort / dataset context<input value={scen.compareCohort||''} onChange={e=>setS('compareCohort',e.target.value)} placeholder="e.g. same local retrospective cohort"/></label>
                </div>
                {!benchResults.comparisonDefinitionComplete&&<div className="note" style={{fontSize:10,marginTop:7,color:'#8d6e63'}}>Ranking is intentionally suppressed until all three shared fields are completed.</div>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:14,marginTop:14}}>
                {benchModels.map((candidate, index) => (
                  <section key={candidate.id} style={{background:'#fff',border:'1px solid #c8e6c9',borderRadius:14,padding:'14px 16px',boxShadow:'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:10}}>
                      <strong style={{color:'#1b5e20'}}>Candidate {String.fromCharCode(65 + index)}</strong>
                      {benchModels.length>2 && <button type="button" title="Remove candidate" onClick={()=>removeBenchModel(candidate.id)} style={{background:'none',color:'#90a4ae',padding:3,boxShadow:'none'}}><Trash2 size={15}/></button>}
                    </div>
                    <div style={{display:'grid',gap:9}}>
                      <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                        Product / model name
                        <input value={candidate.label} onChange={e=>updateBenchLabel(candidate.id,e.target.value)} placeholder={`Candidate ${String.fromCharCode(65 + index)}`}/>
                      </label>
                      <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                        Clinical task / starting template
                        <select value={candidate.modelKey} onChange={e=>updateBenchTemplate(candidate.id,e.target.value)}>
                          {AI_MODEL_LIBRARY.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
                        </select>
                      </label>
                      <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                        Intended use <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional</span>
                        <input value={candidate.intendedUse || ''} onChange={e=>updateBenchModel(candidate.id,'intendedUse',e.target.value)} placeholder="e.g. triage suspected PE on CTPA"/>
                      </label>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                        <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                          Reported performance value
                          <input type="number" step="0.001" value={candidate.accuracyPct} onChange={e=>updateBenchModel(candidate.id,'accuracyPct',e.target.value)}/>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                          Metric
                          <select value={candidate.accuracyMetric} onChange={e=>updateBenchModel(candidate.id,'accuracyMetric',e.target.value)}>
                            {['AUC','Accuracy','Sensitivity','Specificity','Dice','IoU','SSIM','PSNR','RadGraph F1','MAE','Other'].map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Unit<select value={candidate.performanceUnit || 'percent'} onChange={e=>updateBenchModel(candidate.id,'performanceUnit',e.target.value)}>{['percent','fraction','mm','seconds','ordinal','custom'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                        <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Better direction<select value={candidate.performanceDirection || 'higher'} onChange={e=>updateBenchModel(candidate.id,'performanceDirection',e.target.value)}><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></label>
                      </div>
                      <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                        Validation basis
                        <select value={candidate.validationBasis || 'Not specified'} onChange={e=>updateBenchModel(candidate.id,'validationBasis',e.target.value)}>
                          {['Not specified','Development / internal validation only','External validation','Locally validated'].map(v=><option key={v} value={v}>{v}</option>)}
                        </select>
                      </label>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:'#607d66',marginBottom:5}}>Reported clinical effect <span style={{fontWeight:400}}>optional; enter 0 unless supported</span></div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Scan-time reduction (%)<input type="number" min="0" max="100" value={candidate.scanTimeReductPct || '0'} onChange={e=>updateBenchModel(candidate.id,'scanTimeReductPct',e.target.value)}/></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Low-value imaging avoided (%)<input type="number" min="0" max="100" value={candidate.lowValueReductPct || '0'} onChange={e=>updateBenchModel(candidate.id,'lowValueReductPct',e.target.value)}/></label>
                        </div>
                      </div>
                      <details style={{borderTop:'1px solid #eef7ee',paddingTop:8}}>
                        <summary style={{cursor:'pointer',fontSize:12,fontWeight:700,color:'#607d66'}}>Procurement context — optional</summary>
                        <div style={{display:'grid',gap:8,marginTop:8}}>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Vendor / developer<input value={candidate.vendor || ''} onChange={e=>updateBenchModel(candidate.id,'vendor',e.target.value)} placeholder="optional"/></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Regulatory status<select value={candidate.regulatoryStatus || 'Not specified'} onChange={e=>updateBenchModel(candidate.id,'regulatoryStatus',e.target.value)}>{['Not specified','Cleared / approved for intended use','Not cleared / approved','Not regulated / vendor rationale provided','Unknown'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Integration path<select value={candidate.integrationPath || 'Not specified'} onChange={e=>updateBenchModel(candidate.id,'integrationPath',e.target.value)}>{['Not specified','Standalone','Partial integration','Full integration'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                        </div>
                      </details>
                      <details style={{borderTop:'1px solid #eef7ee',paddingTop:8}}>
                        <summary style={{cursor:'pointer',fontSize:12,fontWeight:700,color:'#607d66'}}>Technical &amp; environmental details — optional</summary>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Architecture<select value={candidate.architecture} onChange={e=>updateBenchModel(candidate.id,'architecture',e.target.value)}>{META.architectures.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Parameters (M)<input type="number" min="0" value={candidate.paramsM} onChange={e=>updateBenchModel(candidate.id,'paramsM',e.target.value)}/></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Precision<select value={candidate.precision} onChange={e=>updateBenchModel(candidate.id,'precision',e.target.value)}>{META.precisions.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                          <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:11}}>Measured inference (kWh/study)<input type="number" min="0" step="0.0001" value={candidate.inferKwh || ''} onChange={e=>updateBenchModel(candidate.id,'inferKwh',e.target.value)} placeholder="optional"/></label>
                        </div>
                      </details>
                    </div>
                  </section>
                ))}
              </div>
              <p className="note" style={{margin:'10px 0 0',fontSize:11}}>Architecture and parameter count are optional procurement details; use measured inference energy when available. CEDARS applies the shared workload, provider and compute region to every candidate so the environmental comparison remains like-for-like.</p>
            </div>
          )}

          {/* The detailed single-model editor is reused by Development and one-model clinical assessment. */}
          {scen.aiRoute === 'own' && (<>
          {/* ── Sticky controls: selectors + summary bar + tabs ── */}
          <div className="stickyControls" style={{padding:'12px 16px'}}>
            {/* Primary model and deployment controls — keep common concepts visible; technical knobs live below. */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>
              <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>AI model name <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>— how this model will appear in Improve and Report</span><input value={scen.projectName||''} onChange={e=>setS('projectName',e.target.value)} placeholder="e.g. Local CXR triage model"/><small className="aiModelNameHelp">Saved in device/CEDARS-file backups. Free-text names are intentionally omitted from shareable URL links.</small></label>
              <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>Model / task type <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>— starting point; detailed task metadata remains editable below</span><select value={scen.modelKey} onChange={e=>setModel(e.target.value)}>{AI_MODEL_LIBRARY.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
              <div style={{display:'flex',flexDirection:'column',gap:5,fontWeight:700,color:'#2E7D32'}}><span>Where inference runs <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>— separate from the assessment context above</span></span><label className="aiInlineSelectLabel"><small>Environment / provider</small><select value={scen.cloudProvider} onChange={e=>setCloudProvider(e.target.value)}>{META.cloudProviders.map(v=><option key={v} value={v}>{v}</option>)}</select></label><label className="aiInlineSelectLabel"><small>Compute region</small><select value={scen.cloudRegion} onChange={e=>setS('cloudRegion',e.target.value)}>{Object.entries(CLOUD_REGIONS[scen.cloudProvider]?.regions ?? {}).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label><span className={`aiContextMatch ${String(scen.cloudRegion||'').includes(settings.region)?'same':'different'}`}>{String(scen.cloudRegion||'').includes(settings.region)?'Same as local assessment context':'Different from local assessment context'}</span></div>
              <div style={{border:'1px solid #e0eee2',borderRadius:10,padding:'8px 10px',background:'#f7fbf8'}}>
                <div style={{fontWeight:700,color:'#2E7D32',fontSize:12}}>How are the energy numbers known?</div>
                <div style={{fontSize:11,color:'#455a64',marginTop:5}}>Inference: <strong>{ai.inferKwhMeasured?'measured':'estimated from model / hardware inputs'}</strong></div>
                <div style={{fontSize:11,color:'#455a64',marginTop:2}}>Training: <strong>{ai.trainMeasured?'measured':'estimated / model default'}</strong></div>
                <div className="note" style={{fontSize:10,marginTop:5}}>Open the technical settings below to replace estimates with measured energy, hardware, precision, PUE, or token/call inputs.</div>
              </div>
            </div>
            <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
              {AI_MODEL_BY_KEY[scen.modelKey]?.reference ? <>Reference: <strong>{AI_MODEL_BY_KEY[scen.modelKey].reference}</strong> · {AI_MODEL_BY_KEY[scen.modelKey].refCite} · </> : null}
              {scen.architecture} · {sizeLabel(scen.paramsM)} · {scen.dim}
            </p>

            {/* Collapsible advanced model parameters */}
            <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #eef7ee'}}>
              <button onClick={()=>setModelExpanded(v=>!v)} style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:6,width:'100%'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#607d66'}}>Technical model &amp; compute settings</span>
                <span style={{fontSize:10,color:'#90a4ae'}}>{ai.unit==='tokens'
                  ? `${ai.callsPerTask} call${ai.callsPerTask===1?'':'s'} × ${ai.tokensPerCall.toLocaleString()} tok · ${ai.tokensPerStudy.toLocaleString()} tok/study · ${rnd(ai.inference.kwhPerStudy*1000,2)} Wh`
                  : `${scen.paramsM}M params · ${scen.slices>1?`${scen.resolution}×${scen.resolution}×${scen.slices} px`:`${scen.resolution}px`} · ${ai.inferKwhMeasured ? `${rnd(ai.inference.kwhPerStudy*1000,3)} Wh/study (measured)` : `${ai.inferSec}s/study${ai.inferSecAuto?' (auto)':' (manual)'}`}`}</span>
                <span style={{fontSize:11,color:'#90a4ae',marginLeft:'auto'}}>{modelExpanded ? '▴ collapse' : '▾ expand'}</span>
              </button>
              {modelExpanded && (
                <div style={{marginTop:8}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:6,marginBottom:6}}>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Architecture
                      <select value={scen.architecture} onChange={e=>setS('architecture',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}>
                        {META.architectures.map(a=><option key={a} value={a}>{a}</option>)}
                      </select>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Precision / AMP
                      <select value={scen.precision} onChange={e=>setS('precision',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}>{META.precisions.map(p=><option key={p} value={p}>{p}</option>)}</select>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Parameters (M)
                      <input type="number" min="0" step="1" value={scen.paramsM} onChange={e=>setS('paramsM',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Custom PUE <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional</span>
                      <input type="number" min="1" step="0.05" value={scen.customPue} onChange={e=>setS('customPue',e.target.value)} placeholder={`${CLOUD[scen.cloudProvider]?.pue ?? 1.5} default`} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    {ai.unit!=='tokens' && (
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Dimensionality
                      <select value={scen.dim} onChange={e=>setS('dim',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}>
                        <option value="2D">2D (image / slice)</option>
                        <option value="3D">3D (volume)</option>
                      </select>
                    </label>
                    )}
                  </div>
                  {parseFloat(scen.customPue) > 0 && (
                    <p className="note" style={{fontSize:10,marginTop:0,marginBottom:6}}>Overrides the {scen.cloudProvider} default PUE ({CLOUD[scen.cloudProvider]?.pue ?? 1.5}) everywhere on this page (training, testing, and inference energy). Useful when reproducing a paper that measured a single lab GPU directly (CodeCarbon, <code>nvidia-smi</code>) rather than a colocated data-centre rack — set to <strong>1.0</strong> to remove data-centre power-distribution/cooling overhead that likely wasn't present in that setup.</p>
                  )}
                  {ai.unit==='tokens' ? (
                  <>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:6}}>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Energy (Wh / 1k tokens)
                      <input type="number" min="0" step="0.05" value={scen.whPer1kTokens} onChange={e=>setS('whPer1kTokens',e.target.value)} placeholder="0.4" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Model calls / task
                      <input type="number" min="1" step="1" value={scen.callsPerTask} onChange={e=>setS('callsPerTask',e.target.value)} placeholder="1" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Tokens / call
                      <input type="number" min="0" step="100" value={scen.tokensPerCall} onChange={e=>setS('tokensPerCall',e.target.value)} placeholder="2500" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                  </div>
                  <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
                    LLM / agentic energy is <strong>token-driven</strong>: {ai.callsPerTask} call{ai.callsPerTask===1?'':'s'} × {ai.tokensPerCall.toLocaleString()} tokens = <strong>{ai.tokensPerStudy.toLocaleString()} tokens/study</strong> → ≈ <strong>{rnd(ai.inference.kwhPerStudy*1000,2)} Wh/study</strong>. Set <strong>calls/task &gt; 1</strong> for multi-step agents (planning · retrieval · tool use · self-critique · retries). Wh/1k-token intensity is a model-tier estimate — see sources.md.
                  </p>
                  </>
                  ) : (
                  <>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:6}}>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      {scen.dim==='3D' ? 'In-plane resolution (px/side)' : 'Input resolution (px)'}
                      <input type="number" min="1" value={scen.resolution} onChange={e=>setS('resolution',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      {scen.dim==='3D' ? 'Through-plane slices' : 'Slices / passes per study'}
                      <input type="number" min="1" value={scen.slices} onChange={e=>setS('slices',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Inference time (s/study)
                      <input type="number" min="0" step="0.1" value={scen.inferSec} onChange={e=>setS('inferSec',e.target.value)} placeholder={`auto: ${ai.inferSecDerived}`} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Inference energy (kWh/study) <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>measured, optional</span>
                      <input type="number" min="0" step="0.0001" value={scen.inferKwh} onChange={e=>setS('inferKwh',e.target.value)} placeholder="e.g. 0.001427" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                  </div>
                  {scen.slices > 1 && !(parseFloat(scen.inferKwh) > 0) && (() => {
                    const r = parseFloat(scen.resolution)||0, s = parseFloat(scen.slices)||0, v = r*r*s;
                    return <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>{scen.dim==='3D' ? 'Volume' : 'Per-study elements'} <strong>{r} × {r} × {s}</strong> ≈ <strong>{v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v).toLocaleString()} {scen.dim==='3D'?'voxels':'pixels'}</strong>. Energy scales with element count (Green AI 2020; Selvan et al. 2022). {scen.dim!=='3D' && 'A 2D model applied slice-by-slice over a volume still processes this many elements per study — set slices to your per-study slice count, not just 1.'}</p>;
                  })()}
                  {parseFloat(scen.inferKwh) > 0 ? (
                    <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
                      <strong>Inference energy (kWh/study)</strong> is set — this now drives both <strong>Testing/Validation</strong> and <strong>per-study deployment</strong> energy directly, bypassing the time × GPU-power × PUE formula entirely (so <strong>Inference time</strong> above no longer affects energy — it stays only as an informational readout). Use this whenever a paper reports energy/study directly, or when its reported inference *time* is end-to-end wall-clock latency (I/O, pre/post-processing) rather than pure GPU-active compute time — feeding wall-clock time into the formula above would overstate energy.
                    </p>
                  ) : (
                    <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
                      Inference time auto-scales with <strong>params × resolution²{scen.dim==='3D'?' × slices':' × slices/passes'}</strong> relative to {AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? 'the reference'} (≈ {ai.inferSecDerived}s/study{ai.inferSecAuto?', in use':''}). This assumes 100% GPU utilisation for the full duration — if a paper's reported per-case time includes I/O/pre/post-processing (common for volumetric pipelines), it will overstate energy; enter the paper's own <strong>kWh/study</strong> above instead of deriving it from time.
                    </p>
                  )}
                  </>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible training assumptions */}
            {(()=>{
              const gp = GPU_PRESETS[scen.trainGpu];
              const isCustomGpu = scen.trainGpu === 'Custom (enter TDP below)';
              const gpTdpKw = isCustomGpu ? (parseFloat(scen.trainCustomTdpW) || 300) / 1000 : gp?.tdpKw;
              const h  = parseFloat(scen.trainHours) || 0;
              const n  = Math.max(1, parseInt(scen.trainNumGpus) || 1);
              const pue = parseFloat(scen.customPue) > 0 ? parseFloat(scen.customPue) : (CLOUD[scen.cloudProvider]?.pue ?? 1.5);
              const estKwh = gpTdpKw != null && h > 0 ? rnd(gpTdpKw * n * h * pue, 2) : null;
              return (
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #eef7ee'}}>
                  <button onClick={()=>setTrainExpanded(v=>!v)} style={{
                    background:'none',border:'none',padding:0,cursor:'pointer',
                    display:'flex',alignItems:'center',gap:6,width:'100%',
                  }}>
                    <span style={{fontSize:11,fontWeight:700,color:'#607d66'}}>Training assumptions</span>
                    {estKwh !== null
                      ? <span style={{fontSize:10,background:'#e8f5e9',color:'#2E7D32',padding:'1px 8px',borderRadius:8,fontWeight:700}}>{estKwh} kWh</span>
                      : <span style={{fontSize:10,color:'#90a4ae'}}>model default · {ai.training.kwhTotal.toLocaleString()} kWh</span>
                    }
                    <span style={{fontSize:11,color:'#90a4ae',marginLeft:'auto'}}>{trainExpanded ? '▴ collapse' : '▾ expand'}</span>
                  </button>
                  {trainExpanded && (
                    <div style={{marginTop:8}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:6,marginBottom:6}}>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Training GPU
                          <select value={scen.trainGpu} onChange={e=>setS('trainGpu',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}>
                            <option value="">— model default —</option>
                            {META.gpuModels.map(g=><option key={g} value={g}>{g}</option>)}
                          </select>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          # GPUs
                          <input type="number" min="1" value={scen.trainNumGpus} onChange={e=>setS('trainNumGpus',e.target.value)} placeholder="1" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Hours
                          <input type="number" min="0" step="0.5" value={scen.trainHours} onChange={e=>setS('trainHours',e.target.value)} placeholder="e.g. 48" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                        {isCustomGpu && (
                          <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                            Custom GPU TDP (W)
                            <input type="number" min="1" value={scen.trainCustomTdpW} onChange={e=>setS('trainCustomTdpW',e.target.value)} placeholder="e.g. 350" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                          </label>
                        )}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:6,marginBottom:6}}>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>Training provider<select value={scen.trainingProvider||''} onChange={e=>setS('trainingProvider',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}><option value="">Same default as inference ({scen.cloudProvider})</option>{META.cloudProviders.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>Training region<select value={scen.trainingRegion||''} onChange={e=>setS('trainingRegion',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}><option value="">Same default as inference ({scen.cloudRegion||'provider average'})</option>{Object.keys(CLOUD_REGIONS[scen.trainingProvider||scen.cloudProvider]?.regions || {}).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                      </div>
                      {isCustomGpu && !scen.trainCustomTdpW && (
                        <p className="note" style={{fontSize:10,marginTop:0,marginBottom:6}}><strong>Custom</strong> GPU selected but no TDP entered — defaulting to 300 W until you fill it in.</p>
                      )}
                      {gp && !(h > 0) && (
                        <p className="note" style={{fontSize:10,marginTop:0,marginBottom:6}}>A GPU is selected but <strong>Hours</strong> is blank — the training <strong>energy</strong> total still uses the literature default (model default · {ai.training.kwhTotal.toLocaleString()} kWh) until both are filled in. The selected GPU's power draw is already used for the <strong>Estimated GPU compute</strong> readout below, though.</p>
                      )}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Training set (images) <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional</span>
                          <input type="number" min="0" value={scen.datasetSize} onChange={e=>setS('datasetSize',e.target.value)} placeholder={`ref ${TRAIN_REF_IMAGES.toLocaleString()}`} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Epochs <span style={{fontWeight:400,fontSize:10,color:'#90a4ae'}}>optional</span>
                          <input type="number" min="0" value={scen.epochs} onChange={e=>setS('epochs',e.target.value)} placeholder={`ref ${TRAIN_REF_EPOCHS}`} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Test set (studies)
                          <input type="number" min="1" value={scen.testStudies} onChange={e=>setS('testStudies',e.target.value)} placeholder="500" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                        <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                          Lifespan (months)
                          <input type="number" min="1" value={scen.deployMonths} onChange={e=>setS('deployMonths',e.target.value)} placeholder="36" style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                        </label>
                      </div>
                      <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>Measured path: GPU TDP × count × hours × PUE. Otherwise the model-default estimate scales with params × voxels — and, when you fill <strong>training set × epochs</strong>, by (images × epochs) ÷ ({TRAIN_REF_IMAGES.toLocaleString()} × {TRAIN_REF_EPOCHS}) too. Lifespan affects amortisation.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Summary pills + tabs */}
            <div className="aiSummary" style={{marginTop:8,paddingTop:8}}>
              <span>Net impact <b style={{color: ai.netKgCo2e < 0 ? '#2E7D32' : '#c62828'}}>{ai.netKgCo2e} kgCO₂e/mo</b></span>
              <span>Inference CI <b>{ai.cloudCi} kgCO₂e/kWh</b></span>
            </div>
          </div>

          {/* ── Accordion: lifecycle sections (click to open) ── */}
          <div className="detailToolbar">
            <div>
              <h3 className="detailToolbarTitle">Supporting details <span>optional</span></h3>
              <div className="detailToolbarHint">Lifecycle assumptions, calculations, and benchmarks stay available without competing with primary inputs.</div>
            </div>
            <button className="detailToolbarAction" onClick={()=>{const all=AI_SECTIONS.every(id=>aiOpen[id]); setAiOpen(all?{}:Object.fromEntries(AI_SECTIONS.map(id=>[id,true])));}}>
              {AI_SECTIONS.every(id=>aiOpen[id]) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          {/* ── Model details ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('model')} aria-expanded={!!aiOpen['model']}>
            <span className="accCaret">{aiOpen['model']?'▾':'▸'}</span>
            <span className="accTitle">Reported AI performance &amp; model details</span>
            <span className="accVal">{ai.modelSize}</span>
          </button>
          {aiOpen['model'] && (
          <section id="ai-model" className="aiSection" style={{background:'none',boxShadow:'none',padding:0}}>
            <div className="modelSummaryGrid">
              <div className="modelSummaryItem">
                <div className="modelSummaryLabel"><Brain size={14}/> Architecture</div>
                <div className="modelSummaryValue">{scen.architecture}</div>
                <div className="modelSummarySub">{ai.archDesc}</div>
              </div>
              <div className="modelSummaryItem">
                <div className="modelSummaryLabel"><Cpu size={14}/> Model size</div>
                <div className="modelSummaryValue">{ai.modelSize}</div>
                <div className="modelSummarySub">{ai.paramsM.toLocaleString()}M params · {ai.dim}</div>
              </div>
              <div className="modelSummaryItem">
                <div className="modelSummaryLabel"><Target size={14}/> Reported {ai.accuracyMetric}</div>
                <div className="modelSummaryValue">{ai.performanceValue} {ai.performanceUnit}</div>
                <div className="modelSummarySub">Reported value; edit below.</div>
              </div>
            </div>

            {/* Editable reported performance — decoupled from model size */}
            <div className="inputSummary" style={{marginTop:16}}>
              <h3 style={{marginTop:0,marginBottom:4,color:'#1b5e20',fontSize:15}}>Reported performance &amp; clinical benefit</h3>
              <p className="note" style={{marginBottom:12,fontSize:12}}>
                These are <strong>your reported numbers</strong>, not predictions — defaults come from {AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? 'the reference'} ({AI_MODEL_BY_KEY[scen.modelKey]?.refCite ?? '—'}). Replace with your own validation results.
              </p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Performance value
                  <input type="number" step="0.001" value={scen.accuracyPct} onChange={e=>setS('accuracyPct',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}/>
                </label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Metric
                  <select value={scen.accuracyMetric} onChange={e=>setS('accuracyMetric',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}>
                    {['AUC','Accuracy','Sensitivity','Specificity','Dice','IoU','SSIM','PSNR','RadGraph F1','MAE','Other'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>Unit<select value={scen.performanceUnit} onChange={e=>setS('performanceUnit',e.target.value)}>{['percent','fraction','mm','seconds','ordinal','custom'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>Better direction<select value={scen.performanceDirection} onChange={e=>setS('performanceDirection',e.target.value)}><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>Validation context<input value={scen.performanceValidationContext} onChange={e=>setS('performanceValidationContext',e.target.value)} placeholder="e.g. external validation"/></label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>Source / provenance<input value={scen.performanceSource} onChange={e=>setS('performanceSource',e.target.value)} placeholder="publication, local study, vendor"/></label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Scan-time reduction (%)
                  <input type="number" min="0" max="100" value={scen.scanTimeReductPct} onChange={e=>setS('scanTimeReductPct',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}/>
                </label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Low-value imaging avoided (%)
                  <input type="number" min="0" max="100" value={scen.lowValueReductPct} onChange={e=>setS('lowValueReductPct',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}/>
                </label>
              </div>
              <p className="note" style={{marginTop:8,fontSize:11}}>Scan-time reduction and low-value-imaging avoidance drive the clinical CO₂ savings on the Clinical and Carbon tabs. Set to 0 if not applicable to this task.</p>
            </div>
          </section>

          )}

          {/* ── Phase 1: Training ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('training')} aria-expanded={!!aiOpen['training']}>
            <span className="accCaret">{aiOpen['training']?'▾':'▸'}</span>
            <span className="accTitle">Phase 1 — Training</span>
            <span className="accVal">{ai.training.kgCo2e} kgCO₂e</span>
          </button>
          {aiOpen['training'] && (
          <section id="ai-training" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>Phase 1 — Training the model</h2>
            <p className="note" style={{marginBottom:12}}>One-time energy cost. Track with CodeCarbon, EcoLogits, or Carbontracker. (Implementation Guide §4 · Metric 1)</p>
            <div className="cards">
              <Card icon={<Zap/>}        title="Total training energy"    value={`${ai.training.kwhTotal.toLocaleString()} kWh`}  sub={`One-time. Scaled by architecture (${scen.architecture}) and model size. (LLM-Energy PDF)`}/>
              <Card icon={<Leaf/>}       title="Training CO₂e"            value={`${ai.training.kgCo2e} kgCO₂e`}                sub={`At ${ai.trainingCi} kgCO₂e/kWh (${ai.trainingContext?.provider || scen.trainingProvider || scen.cloudProvider}). Training and inference contexts may differ.`}/>
              <Card icon={<Gauge/>}      title={ai.trainMeasured ? "GPU compute (measured)" : "Estimated GPU compute"}    value={`${ai.trainMeasured ? '' : '~'}${ai.training.gpuHours.toLocaleString()} h`}  sub={ai.trainMeasured ? `Your entered Hours × #GPUs, exactly as typed below — not derived from energy, so PUE doesn't affect it.` : GPU_PRESETS[scen.trainGpu] ? `Estimated GPU hours at the selected ${scen.trainGpu} power draw. Actual depends on parallelism.` : "Estimated GPU hours at this template's power draw — pick a Training GPU below for a hardware-specific estimate."}/>
              <Card icon={<BarChart3/>}  title="Training efficiency"      value={ai.trainMeasured ? `${ai.training.vsReferenceRatio}× reference` : '— (needs measured training data)'}
                sub={ai.trainMeasured
                  ? `Your training: ${ai.training.kwhTotal.toLocaleString()} kWh vs. ${ai.training.kwhReference.toLocaleString()} kWh typical for a ${scen.architecture} model this size (est.). <1× = more efficient than typical; >1× = less. (GreenAI-2020)`
                  : `Enter measured Training GPU + Hours below to compare your actual training run against the literature-typical footprint for a ${scen.architecture} model this size.`}/>
              <Card icon={<Activity/>}   title="Amortised / month"        value={`${ai.training.kwhAmortised} kWh/mo`}           sub="Training cost spread over 36-month deployment lifespan for lifecycle comparison."/>
              <Card icon={<Droplets/>}   title="Training electricity cost" value={fmtMoney(ai.training.kwhTotal * getPrice(settings.region, settings.electricityPrice), currencySym(settings.region))} sub={`One-time, at ${currencySym(settings.region)}${getPrice(settings.region, settings.electricityPrice)}/kWh. Editable under Home → Assessment context.`}/>
            </div>
          </section>

          )}

          {/* ── Phase 2: Testing ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('testing')} aria-expanded={!!aiOpen['testing']}>
            <span className="accCaret">{aiOpen['testing']?'▾':'▸'}</span>
            <span className="accTitle">Phase 2 — Testing &amp; validation</span>
            <span className="accVal">{ai.testing.kgCo2e} kgCO₂e</span>
          </button>
          {aiOpen['testing'] && (
          <section id="ai-testing" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>Phase 2 — Testing and validation</h2>
            <p className="note" style={{marginBottom:12}}>One-time hold-out inference run. Proxy: DLP / CTDIvol correlate with net scan energy R²=0.87–0.92 (Schoen et al.), enabling energy inference from dose reports.</p>
            <div className="cards">
              <Card icon={<Zap/>}        title="Test set energy"          value={`${ai.testing.kwhTotal} kWh`}                   sub={ai.inferKwhMeasured ? `${ai.testing.studies} studies × your measured kWh/study.` : `${ai.testing.studies} studies. One-time cost; small fraction of training energy.`}/>
              <Card icon={<Leaf/>}       title="Test set CO₂e"            value={`${ai.testing.kgCo2e} kgCO₂e`}                 sub={`At ${ai.cloudCi} kgCO₂e/kWh. Include in model carbon disclosure.`}/>
              <Card icon={<Target/>}     title="Test set size"            value={`${ai.testing.studies} studies`}               sub="Default hold-out set. Larger sets improve accuracy estimates but increase energy cost."/>
              <Card icon={<BarChart3/>}  title="Precision mode"           value={scen.precision}                                 sub={`AMP (float16) saves ${ai.ampSavingPct}% inference energy with minimal accuracy loss. Apply to both test and inference.`}/>
            </div>
          </section>

          )}

          {/* ── Phase 3: Inference ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('inference')} aria-expanded={!!aiOpen['inference']}>
            <span className="accCaret">{aiOpen['inference']?'▾':'▸'}</span>
            <span className="accTitle">Phase 3 — Inference &amp; deployment</span>
            <span className="accVal">{ai.inference.kwhPerStudy} kWh/study</span>
          </button>
          {aiOpen['inference'] && (
          <section id="ai-inference" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>Phase 3 — Inference and deployment</h2>
            <p className="note" style={{marginBottom:12}}>Inference scales with every study — this dominates the AI lifecycle energy cost. MRI cooling adds +45% to scanner energy during active acquisition (Heye/Vosshenrich). (Implementation Guide §4 · Metric 2)</p>
            <div className="cards">
              <Card icon={<Activity/>}   title="Energy per study"         value={`${ai.inference.kwhPerStudy} kWh`}              sub={ai.inferKwhMeasured ? "Your measured kWh/study, entered directly — not derived from time × GPU power." : "Per-inference energy including PUE and AMP factor. Scales with every request."}/>
              <Card icon={<Zap/>}        title="Monthly inference energy" value={`${ai.inference.kwhMonthly} kWh`}               sub={`Across ${ai.inference.studies.toLocaleString()} studies/month at ${scen.cloudProvider}.`}/>
              <Card icon={<Gauge/>}      title="Lifetime inference total" value={`${ai.inference.kwhLifetime.toLocaleString()} kWh`} sub="36-month deployment. Inference typically exceeds training energy within 1–3 months."/>
              <Card icon={<Droplets/>}   title="Monthly water footprint"  value={`${ai.waterLitres} L`}                          sub={`${WATER_PER_KWH} L/kWh screening factor. Water intensity is location-dependent; see methodology.`}/>
              <Card icon={<Gauge/>}      title="Monthly electricity cost" value={fmtMoney(ai.monthly.kwh * getPrice(settings.region, settings.electricityPrice), currencySym(settings.region))} sub={`Inference + amortised training, at ${currencySym(settings.region)}${getPrice(settings.region, settings.electricityPrice)}/kWh.`}/>
            </div>
          </section>

          )}

          {/* ── Carbon ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('carbon')} aria-expanded={!!aiOpen['carbon']}>
            <span className="accCaret">{aiOpen['carbon']?'▾':'▸'}</span>
            <span className="accTitle">Carbon — operational &amp; net</span>
            <span className="accVal">net {ai.netKgCo2e} kgCO₂e/mo</span>
          </button>
          {aiOpen['carbon'] && (
          <section id="ai-carbon" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>Carbon emissions summary</h2>
            <p className="note" style={{marginBottom:12}}>Operational carbon uses cloud provider CI ({ai.cloudCi} kgCO₂e/kWh). Clinical savings use local grid ({settings.region}: {getCI(settings.region, settings.customCi)} kgCO₂e/kWh). Global avg: 0.473 · EU avg: 0.237 (Vosshenrich)</p>
            <div className="cards">
              <Card icon={<Leaf/>}        title="Gross CO₂e/month"          value={`${ai.grossKgCo2e} kgCO₂e`}                 sub="Inference + amortised training + embodied GPU (all monthly)."/>
              <Card icon={<Cpu/>}         title="Embodied GPU carbon"        value={`${ai.embGpuKgCo2e} kgCO₂e/mo`}            sub={`Total ${ai.embCo2KgTotal} kgCO₂e manufacturing, amortised ${ai.deployMonths} months. (ESR PP 2025)`}/>
              <Card icon={<TrendingDown/>} title="Clinical savings"          value={`−${ai.savingsKgCo2e} kgCO₂e/mo`}          sub="Scanner time reduction + avoided scans. Replace with measured before/after metering."/>
              <section className="card">
                <div className="cardHead"><BarChart3/><span>Net AI impact / month</span></div>
                <b style={{color: ai.netKgCo2e < 0 ? '#2E7D32' : '#c62828'}}>{ai.netKgCo2e} kgCO₂e</b>
                <p>{ai.netKgCo2e < 0 ? "Net positive — clinical savings outweigh full AI footprint." : "Net negative — AI costs currently exceed measured savings."}</p>
              </section>
            </div>
            {ai.grossKgCo2e>0 && <div style={{marginTop:14,padding:'9px 12px',background:'#f7fbf8',border:'1px solid #dce9dc',borderRadius:10,fontSize:11,color:'#607d66'}}><strong style={{color:'#455a64'}}>Carbon in context:</strong> the gross monthly AI footprint is about {fmtBig(ai.grossKgCo2e/CAR_CO2_KG_KM)} km driven by a typical car. Illustrative comparison only.</div>}
          </section>

          )}

          {/* ── Clinical ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('clinical')} aria-expanded={!!aiOpen['clinical']}>
            <span className="accCaret">{aiOpen['clinical']?'▾':'▸'}</span>
            <span className="accTitle">Clinical co-benefits</span>
            <span className="accVal">−{ai.savingsKgCo2e} kgCO₂e/mo</span>
          </button>
          {aiOpen['clinical'] && (
          <section id="ai-clinical" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>Clinical sustainability co-benefits</h2>
            <p className="note" style={{marginBottom:12}}>Unnecessary imaging estimated at 20–50% of all scans (Implementation Guide §1). AI decision support targets the Prevent tier of the Recycling Pyramid.</p>
            <div className="cards">
              <Card icon={<TrendingDown/>} title="Scan time reduction"        value={`${ai.scanTimeReductPct}%`}                sub={`Applied only to studies that still occur after any avoided studies; saves ${ai.scanTimeEnergySaved} kWh/month of active scanner energy.`}/>
              <Card icon={<Leaf/>}         title="Low-value imaging avoided"  value={`${ai.lowValueReductPct}%`}               sub={`~${ai.scansAvoided} scans/month avoided; approximately ${ai.avoidedEnergySaved} kWh/month of active scanner energy is avoided before scan-time savings are applied.`}/>
              <Card icon={<Zap/>}          title="Scanner energy saved/month" value={`${ai.scanEnergySaved} kWh`}              sub="Combined active-scanner saving after sequentially accounting for avoided acquisitions and shorter remaining protocols; fixed department loads are excluded."/>
              <Card icon={<AlertTriangle/>} title="Rebound effect risk"        value={ai.reboundRisk}                          sub="Faster reads may induce more scan orders, cancelling gains. Monitor scan volume after deployment. (Implementation Guide §4)"/>
            </div>
          </section>

          )}

          {/* ── Infrastructure (cloud carbon, merged) ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('infra')} aria-expanded={!!aiOpen['infra']}>
            <span className="accCaret">{aiOpen['infra']?'▾':'▸'}</span>
            <span className="accTitle">Infrastructure — cloud carbon</span>
            <span className="accVal">PUE {ai.pue}</span>
          </button>
          {aiOpen['infra'] && (
          <section id="ai-infra" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:8}}>
              <h2 style={{margin:0}}>Cloud infrastructure footprint</h2>
              <button className="download" onClick={()=>downloadCloudCSV(cloudResult, cloudInput)} style={{padding:'8px 14px',fontSize:13}}><Download/>Cloud CSV</button>
            </div>
            <p className="note" style={{marginBottom:16}}>
              Workload-by-workload cloud carbon — compute, storage, and data transfer — for the model configured above.
              Training (amortised) and inference are seeded automatically from the AI settings; add your own storage, network, and extra compute below.
              Inspired by <ExternalLink href={refUrl(REFS['cloud-carbon-footprint'])}>Cloud Carbon Footprint</ExternalLink>.
            </p>

            {/* Provider & region (shared with AI lifecycle) */}
            <div className="inputSummary" style={{marginBottom:20}}>
              <h2 style={{marginTop:0, marginBottom:14, color:'#1b5e20'}}>Provider &amp; region <span style={{fontWeight:400,fontSize:12,color:'#607d66'}}>— shared with the AI dashboard above</span></h2>
              <div className="grid grid3">
                <label>
                  Cloud provider
                  <select value={scen.cloudProvider} onChange={e=>setCloudProvider(e.target.value)}>
                    {Object.keys(CLOUD_REGIONS).map(p => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label>
                  Region <span style={{fontWeight:400, fontSize:12, color:'#607d66'}}>— sets grid carbon intensity</span>
                  <select value={scen.cloudRegion} onChange={e => setS('cloudRegion', e.target.value)}>
                    {Object.entries(CLOUD_REGIONS[scen.cloudProvider]?.regions ?? {}).map(([name, rci]) => (
                      <option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>
                    ))}
                  </select>
                </label>
                <label>
                  Renewable energy (%)
                  <input type="number" min="0" max="100" value={cloudTracker.renewablePct} onChange={e => setCloud('renewablePct', e.target.value)} placeholder="0–100"/>
                </label>
              </div>
              <p className="note" style={{marginTop:8}}>
                Effective CI: <strong>{cloudResult.ci} kgCO₂e/kWh</strong>
                {cloudResult.renewable > 0 && <> (after {cloudResult.renewable}% renewable adjustment)</>}.
                {' '}PUE: <strong>{cloudResult.pue}</strong> ({scen.cloudProvider} {scen.cloudProvider === 'Google Cloud' ? '— industry-leading efficiency' : 'global fleet average'}).
                {' '}Changing region here also updates the AI Carbon tab above.
              </p>
            </div>

            {/* Compute workloads */}
            <div className="inputSummary" style={{marginBottom:20}}>
              <h2 style={{marginTop:0, marginBottom:14, color:'#1b5e20', display:'flex', alignItems:'center', gap:8}}><Server style={{width:20,height:20}}/> Compute workloads</h2>
              <p className="note" style={{marginBottom:12}}>AI training &amp; inference (green) are derived from the model config above. Add other instances separately — hours/month max 744, GPU at 100% / CPU at 50% utilisation.</p>

              <div style={{overflowX:'auto'}}>
              <div style={{minWidth:680}}>
              <div style={{display:'grid', gridTemplateColumns:'1.4fr 2.4fr 0.5fr 0.7fr 0.7fr 0.7fr 32px', gap:8, padding:'0 0 6px', borderBottom:'1px solid #c8e6c9', fontSize:11, fontWeight:700, color:'#607d66'}}>
                <span>Workload label</span><span>Instance type</span><span>Count</span><span>h/month</span><span>kWh/mo</span><span>kgCO₂e/mo</span><span/>
              </div>

              {cloudResult.computeResults.map((res) => res.locked ? (
                <div key={res.id} style={{display:'grid', gridTemplateColumns:'1.4fr 2.4fr 0.5fr 0.7fr 0.7fr 0.7fr 32px', gap:8, padding:'8px 0', borderBottom:'1px solid #eef7ee', alignItems:'center', background:'#f3faf3'}}>
                  <span style={{fontWeight:700, color:'#1b5e20', fontSize:13, display:'flex', alignItems:'center', gap:6}}><Brain style={{width:14,height:14}}/>{res.label}</span>
                  <span style={{fontSize:12, color:'#607d66'}}>From AI model config above</span>
                  <span style={{textAlign:'center', color:'#90a4ae'}}>—</span>
                  <span style={{textAlign:'center', color:'#90a4ae'}}>—</span>
                  <span style={{fontWeight:700, color:'#263238', fontSize:13}}>{fmtKwh(res.pueKwh)}</span>
                  <span style={{fontWeight:700, color:'#c62828', fontSize:13}}>{fmtCo2(res.co2)}</span>
                  <span/>
                </div>
              ) : (
                <div key={res.id} style={{display:'grid', gridTemplateColumns:'1.4fr 2.4fr 0.5fr 0.7fr 0.7fr 0.7fr 32px', gap:8, padding:'8px 0', borderBottom:'1px solid #eef7ee', alignItems:'center'}}>
                  <input value={res.label} placeholder="e.g. preprocessing" onChange={e => updateComputeLine(res.id, 'label', e.target.value)} style={{padding:'6px 10px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:13}}/>
                  <div>
                    <select value={res.instance} onChange={e => updateComputeLine(res.id, 'instance', e.target.value)} style={{width:'100%', padding:'6px 8px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:12}}>
                      {Object.entries(CLOUD_INSTANCES).map(([name]) => <option key={name}>{name}</option>)}
                    </select>
                    {res.instance === 'Custom (enter watts)' && (
                      <input type="number" min="0" value={res.customWatt} placeholder="Watts" onChange={e => updateComputeLine(res.id, 'customWatt', e.target.value)} style={{marginTop:4, width:'100%', padding:'4px 8px', borderRadius:8, border:'1px solid #c8e6c9', fontSize:12}}/>
                    )}
                    <div style={{fontSize:10, color:'#607d66', marginTop:2}}>{CLOUD_INSTANCES[res.instance]?.desc}</div>
                  </div>
                  <input type="number" min="0" value={res.count} onChange={e => updateComputeLine(res.id, 'count', e.target.value)} style={{padding:'6px 8px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:13, textAlign:'center'}}/>
                  <input type="number" min="0" max="744" value={res.hoursPerMonth} onChange={e => updateComputeLine(res.id, 'hoursPerMonth', e.target.value)} style={{padding:'6px 8px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:13, textAlign:'center'}}/>
                  <span style={{fontWeight:700, color:'#263238', fontSize:13}}>{fmtKwh(res.pueKwh)}</span>
                  <span style={{fontWeight:700, color:'#c62828', fontSize:13}}>{fmtCo2(res.co2)}</span>
                  <button onClick={() => removeComputeLine(res.id)} title="Remove" style={{background:'none', color:'#aaa', padding:4, borderRadius:8, boxShadow:'none', lineHeight:1}}>
                    <Trash2 style={{width:15,height:15}}/>
                  </button>
                </div>
              ))}
              </div>
              </div>

              <button onClick={addComputeLine} style={{marginTop:12, background:'#e8f5e9', color:'#2E7D32', boxShadow:'none', border:'1px dashed #a5d6a7', padding:'8px 16px', fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                <Plus style={{width:15,height:15}}/> Add compute workload
              </button>
            </div>

            {/* Storage */}
            <div className="inputSummary" style={{marginBottom:20}}>
              <h2 style={{marginTop:0, marginBottom:14, color:'#1b5e20', display:'flex', alignItems:'center', gap:8}}><Database style={{width:20,height:20}}/> Storage</h2>
              <p className="note" style={{marginBottom:12}}>Enter provisioned TB. Energy is calculated for 720 h/month regardless of access pattern.</p>

              <div style={{overflowX:'auto'}}>
              <div style={{minWidth:560}}>
              <div style={{display:'grid', gridTemplateColumns:'1.4fr 2fr 0.8fr 0.8fr 0.8fr 32px', gap:8, padding:'0 0 6px', borderBottom:'1px solid #c8e6c9', fontSize:11, fontWeight:700, color:'#607d66'}}>
                <span>Label</span><span>Storage type</span><span>TB</span><span>kWh/mo</span><span>kgCO₂e/mo</span><span/>
              </div>

              {cloudResult.storageResults.map((res) => (
                <div key={res.id} style={{display:'grid', gridTemplateColumns:'1.4fr 2fr 0.8fr 0.8fr 0.8fr 32px', gap:8, padding:'8px 0', borderBottom:'1px solid #eef7ee', alignItems:'center'}}>
                  <input value={res.label} placeholder="e.g. PACS archive" onChange={e => updateStorageLine(res.id, 'label', e.target.value)} style={{padding:'6px 10px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:13}}/>
                  <select value={res.type} onChange={e => updateStorageLine(res.id, 'type', e.target.value)} style={{padding:'6px 8px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:12}}>
                    {Object.keys(STORAGE_WH_PER_TB_HR).map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input type="number" min="0" step="0.1" value={res.tb} onChange={e => updateStorageLine(res.id, 'tb', e.target.value)} style={{padding:'6px 8px', borderRadius:10, border:'1px solid #c8e6c9', fontSize:13, textAlign:'center'}}/>
                  <span style={{fontWeight:700, color:'#263238', fontSize:13}}>{fmtKwh(res.pueKwh)}</span>
                  <span style={{fontWeight:700, color:'#c62828', fontSize:13}}>{fmtCo2(res.co2)}</span>
                  <button onClick={() => removeStorageLine(res.id)} title="Remove" style={{background:'none', color:'#aaa', padding:4, borderRadius:8, boxShadow:'none', lineHeight:1}}>
                    <Trash2 style={{width:15,height:15}}/>
                  </button>
                </div>
              ))}
              </div>
              </div>

              <button onClick={addStorageLine} style={{marginTop:12, background:'#e8f5e9', color:'#2E7D32', boxShadow:'none', border:'1px dashed #a5d6a7', padding:'8px 16px', fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                <Plus style={{width:15,height:15}}/> Add storage
              </button>
            </div>

            {/* Networking */}
            <div className="inputSummary" style={{marginBottom:28}}>
              <h2 style={{marginTop:0, marginBottom:14, color:'#1b5e20', display:'flex', alignItems:'center', gap:8}}><Wifi style={{width:20,height:20}}/> Data transfer</h2>
              <div style={{display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-end'}}>
                <label style={{maxWidth:220}}>
                  Outbound data transfer (GB / month)
                  <input type="number" min="0" value={cloudTracker.networkingGb} onChange={e => setCloud('networkingGb', e.target.value)} placeholder="e.g. 500"/>
                </label>
                <div style={{paddingBottom:8}}>
                  <span style={{fontWeight:700, color:'#263238'}}>{fmtKwh(cloudResult.netKwh)}</span>
                  <span style={{color:'#607d66', fontSize:13}}> → </span>
                  <span style={{fontWeight:700, color:'#c62828'}}>{fmtCo2(cloudResult.netCo2)}</span>
                </div>
              </div>
              <p className="note" style={{marginTop:8}}>0.001 kWh/GB fixed-line data centre average (Aslan et al. 2018). Excludes last-mile and end-user device energy.</p>
            </div>

            {/* Totals */}
            <h2>Cloud monthly totals</h2>
            <div className="cards" style={{marginBottom:28}}>
              <section className="card" style={{gridColumn:'span 2'}}>
                <div className="cardHead"><Zap/><span>Total energy / month</span></div>
                <b>{fmtKwh(cloudResult.totalKwh)}</b>
                <p>Compute {fmtKwh(cloudResult.totalComputeKwh)} · Storage {fmtKwh(cloudResult.totalStorageKwh)} · Network {fmtKwh(cloudResult.netKwh)}</p>
              </section>
              <section className="card" style={{gridColumn:'span 2'}}>
                <div className="cardHead"><Leaf/><span>Total CO₂e / month</span></div>
                <b style={{color: cloudResult.totalCo2 > 0 ? '#c62828' : '#2E7D32'}}>{fmtCo2(cloudResult.totalCo2)}</b>
                <p>At {cloudResult.ci} kgCO₂e/kWh effective CI · PUE {cloudResult.pue}</p>
              </section>
              <Card icon={<Server/>} title="Compute" value={fmtKwh(cloudResult.totalComputeKwh)} sub={`${fmtCo2(cloudResult.computeResults.reduce((s,r)=>s+r.co2,0))} · ${cloudResult.computeResults.length} workload${cloudResult.computeResults.length!==1?'s':''}`}/>
              <Card icon={<HardDrive/>} title="Storage" value={fmtKwh(cloudResult.totalStorageKwh)} sub={`${fmtCo2(cloudResult.storageResults.reduce((s,r)=>s+r.co2,0))} · ${cloudResult.storageResults.reduce((s,r)=>s+(parseFloat(r.tb)||0),0).toFixed(1)} TB`}/>
              <Card icon={<Wifi/>} title="Data transfer" value={`${cloudResult.netGb.toLocaleString()} GB`} sub={`${fmtKwh(cloudResult.netKwh)} · ${fmtCo2(cloudResult.netCo2)}`}/>
              <Card icon={<TreePine/>} title="Trees to offset" value={Math.round(cloudResult.totalCo2 / 21).toLocaleString()} sub="Trees growing for 1 year to absorb this CO₂ at ~21 kgCO₂/yr each."/>
            </div>

            {/* Regional optimisation */}
            <section className="aiSection" style={{marginBottom:20}}>
              <h2 style={{marginBottom:8, display:'flex', alignItems:'center', gap:8}}><Globe style={{color:'#2E7D32'}}/> Regional optimisation</h2>
              <p className="note" style={{marginBottom:16}}>
                Same workload, different grid. Moving to a lower-carbon region costs nothing in compute but can cut operational CO₂ dramatically.
                {!cloudResult.isBestRegion && <> Best in {scen.cloudProvider}: <strong>{cloudResult.bestSame.name}</strong> → saves <strong style={{color:'#2E7D32'}}>{cloudResult.bestSame.saving}%</strong> ({fmtCo2(cloudResult.bestSame.co2)}/mo vs {fmtCo2(cloudResult.totalCo2)}/mo).</>}
                {cloudResult.isBestRegion && <> <strong>You are already in the lowest-carbon region for {scen.cloudProvider}.</strong></>}
              </p>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12}}>
                {cloudResult.crossProvider.map((row, i) => {
                  const isCurrentProv = row.isCurrent;
                  const isBest = i === 0;
                  return (
                    <div key={row.provider} style={{
                      background: isBest ? '#e8f5e9' : isCurrentProv ? '#f5f5f5' : 'white',
                      border: isBest ? '2px solid #2E7D32' : isCurrentProv ? '2px solid #90a4ae' : '1px solid #e0e0e0',
                      borderRadius:16, padding:'16px 20px',
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                        <span style={{fontWeight:700, color: isBest ? '#1b5e20' : '#263238', fontSize:14}}>
                          {isBest && '★ '}{row.label}
                          {isCurrentProv && <span className="badge" style={{marginLeft:8}}>current</span>}
                        </span>
                        <span style={{fontWeight:900, color: isBest ? '#1b5e20' : '#c62828', fontSize:18}}>{fmtCo2(row.co2Est)}</span>
                      </div>
                      <div style={{fontSize:12, color:'#607d66'}}>Best region: <strong>{row.bestRegion}</strong></div>
                      <div style={{fontSize:12, color:'#607d66'}}>Grid CI: {row.ci} kgCO₂e/kWh · PUE {row.pue}</div>
                      {cloudResult.totalCo2 > 0 && row.saving !== 0 && (
                        <div style={{marginTop:8, fontWeight:700, color: row.saving > 0 ? '#2E7D32' : '#c62828', fontSize:13}}>
                          {row.saving > 0 ? `−${row.saving}% vs current` : `+${Math.abs(row.saving)}% vs current`}
                        </div>
                      )}
                      {row.saving === 0 && isCurrentProv && (
                        <div style={{marginTop:8, fontSize:12, color:'#607d66'}}>— current setup</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="note" style={{borderTop:'1px solid #c8e6c9', paddingTop:16}}>
              Sources: Cloud Carbon Footprint methodology (cloudcarbonfootprint.org); Electricity Maps 2023 annual averages;
              AWS 2023 / Azure 2023 / GCP 2023 sustainability reports; Masanet et al. 2020 (Science); Aslan et al. 2018.
              Grid CI values are annual averages — use real-time data from Electricity Maps or provider carbon dashboards for hourly accuracy.
            </p>
          </section>

          )}

          </>)}

          {/* ── Candidate comparison (Procure / Deploy only) ── */}
          {scen.aiRoute === 'compare' && (<>
          <button type="button" className="accHead" onClick={()=>toggleAi('benchmark')} aria-expanded={!!aiOpen['benchmark']}>
            <span className="accCaret">{aiOpen['benchmark']?'▾':'▸'}</span>
            <span className="accTitle">Candidate comparison — performance vs carbon</span>
            <span className="accVal">Pareto</span>
          </button>
          {aiOpen['benchmark'] && (
          <section id="ai-benchmark" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:4}}>Candidate comparison — performance vs carbon</h2>
            <div className="comparisonProgress" aria-label="Candidate comparison workflow">
              <span className={benchResults.comparisonDefinitionComplete?'done':'active'}><b>1</b> Define clinical comparison</span>
              <span className={parseFloat(scen.inferStudiesMonth)>0?'done':benchResults.comparisonDefinitionComplete?'active':''}><b>2</b> Set workload &amp; compute</span>
              <span className={benchResults.rows.length>=2?'done':parseFloat(scen.inferStudiesMonth)>0?'active':''}><b>3</b> Compare candidates</span>
              <span className={benchResults.rows.length>=2?'active':''}><b>4</b> Carry one forward</span>
            </div>
            <p className="note" style={{marginBottom:8}}>
              Compare candidates under the same deployment assumptions: <strong>{parseFloat(scen.inferStudiesMonth)>0?`${Number(scen.inferStudiesMonth).toLocaleString()} studies/month`:'study volume not yet set'}</strong> · <strong>{scen.cloudProvider}</strong> · <strong>{scen.cloudRegion || 'provider-average grid'}</strong>. The local radiology context remains {settings.region}.
            </p>
            <p className="note" style={{marginBottom:16,fontSize:12}}>
              Performance values are <strong>user-reported</strong>, not predicted by CEDARS. Compare only candidates for the same clinical task using the same performance metric. Carbon/study is {scen.compareBasis==='inference'?'inference only for this comparison':'inference + an amortised share of training over the expected deployment'}. This comparison setting does not change whether a candidate's training was actually disclosed. The CEDARS AI Score keeps embodied hardware carbon as a separate disclosure rather than folding it into this operational per-study grade.
            </p>

            {!benchResults.comparisonDefinitionComplete && benchResults.rows.length>1 && (
              <div style={{background:'#fff8e1', border:'1px solid #ffe082', borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#5d4037'}}>
                <strong>Complete the shared clinical task, endpoint, and validation cohort/context above before interpreting relative performance.</strong> Carbon columns remain available, but CEDARS intentionally suppresses performance ranking and the Pareto plot until the comparison is like-for-like.
              </div>
            )}
            {benchResults.comparisonDefinitionComplete && !benchResults.comparablePerformance && benchResults.rows.length>1 && (
              <div style={{background:'#fff8e1', border:'1px solid #ffe082', borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#5d4037'}}>
                <strong>Performance metric/unit/direction or candidate validation basis differs ({benchResults.metrics.join(' · ')}).</strong> CEDARS will show carbon results, but it will not rank or plot unlike performance outcomes.
              </div>
            )}

            {/* Worked agentic example — the token multiplier */}
            <div style={{background:'#f1f8f1',border:'1.5px solid #c8e6c9',borderRadius:16,padding:'14px 18px',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#1b5e20',marginBottom:2}}><Bot size={16}/> Why agentic AI costs more — the token multiplier</div>
              <p className="note" style={{fontSize:12,marginTop:2,marginBottom:10}}>
                Same department ({settings.region}, {agenticExample.studies.toLocaleString()} studies/mo). A single-pass model runs once per study; an <strong>agent fans out into many LLM calls</strong> (planning · retrieval · tool use · self-critique · retries), so its energy is token-driven and multiplies.
              </p>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:520}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid #c8e6c9',color:'#607d66',textAlign:'left'}}>
                      <th style={{padding:'6px 10px'}}>Workflow</th>
                      <th style={{padding:'6px 10px'}}>Tokens/study</th>
                      <th style={{padding:'6px 10px'}}>Energy/study</th>
                      <th style={{padding:'6px 10px'}}>If run on all studies/mo</th>
                      <th style={{padding:'6px 10px'}}>vs 1-pass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenticExample.rows.map((r,i) => {
                      const isAgent = i === agenticExample.rows.length - 1;
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #eef7ee',background:isAgent?'#fffef2':'white'}}>
                          <td style={{padding:'6px 10px',fontWeight:isAgent?800:600,color:isAgent?'#1b5e20':'#263238'}}>{r.label}<span style={{display:'block',fontWeight:400,fontSize:11,color:'#90a4ae'}}>{r.note}</span></td>
                          <td style={{padding:'6px 10px',color:'#607d66'}}>{r.tokens ? r.tokens.toLocaleString() : '—'}</td>
                          <td style={{padding:'6px 10px',fontWeight:isAgent?800:600}}>{r.whStudy} Wh</td>
                          <td style={{padding:'6px 10px'}}>{fmtKwh(r.kwhMo)}</td>
                          <td style={{padding:'6px 10px',fontWeight:800,color:isAgent?'#c62828':'#607d66'}}>{r.fold}×</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="note" style={{fontSize:11,marginTop:8,marginBottom:0}}>
                Illustrative defaults (agent = {agenticExample.rows[2].note}, 4,000 tokens/call, 0.4 Wh/1k). Tune <strong>calls/task</strong> and <strong>tokens/call</strong> under <em>Advanced model parameters</em> after selecting the <strong>Agentic workflow</strong> template. Basis in sources.md.
              </p>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:16}}>
              <button onClick={()=>loadAiExample('maistro-agentic')} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none',border:'1px dashed #a5d6a7'}}>
                Load worked procurement example
              </button>
              <span style={{fontSize:12,color:'#607d66'}}>{benchModels.length} / 6 candidates{benchModels.length>=6?' (max)':''}</span>
            </div>

            {benchResults.rows.length === 0 ? (
              <p className="note">No candidates yet. Add at least two candidate models above, or load the worked same-task example.</p>
            ) : (<>
            <div style={{overflowX:'auto',marginBottom:24}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:760}}>
                <thead>
                  <tr style={{borderBottom:'2px solid #c8e6c9',color:'#607d66',textAlign:'left'}}>
                    <th style={{padding:'8px 10px'}}>Candidate</th>
                    <th style={{padding:'8px 10px'}}>Size</th>
                    <th style={{padding:'8px 10px'}}>Reported</th>
                    <th style={{padding:'8px 10px'}}>Training CO₂e</th>
                    <th style={{padding:'8px 10px'}}>kWh/study</th>
                    <th style={{padding:'8px 10px'}}>gCO₂e/study</th>
                    <th style={{padding:'8px 10px'}}>Net CO₂e/mo</th>
                    <th style={{padding:'8px 10px'}}>Lifetime CO₂e</th>
                    <th style={{padding:'8px 10px'}}/>
                  </tr>
                </thead>
                <tbody>
                  {benchResults.rows.map(r => {
                    const best = benchResults.best;
                    const hi = cond => cond ? {color:'#1b5e20',fontWeight:800} : {};
                    return (
                      <tr key={r.id} style={{borderBottom:'1px solid #eef7ee',background:r.pareto?'#f3faf3':'white'}}>
                        <td style={{padding:'7px 10px'}}>
                          {r.pareto && <span title="Pareto-efficient" style={{color:'#2E7D32',marginRight:4}}>★</span>}
                          <input value={r.label} onChange={e=>updateBenchLabel(r.id,e.target.value)} style={{width:150,padding:'4px 6px',border:'1px solid #e0e0e0',borderRadius:8,fontSize:12}}/>
                        </td>
                        <td style={{padding:'7px 10px',color:'#607d66'}}>{r.paramsM.toLocaleString()}M</td>
                        <td style={{padding:'7px 10px',...hi(r.performanceValue===best.performanceValue)}}>{r.performanceValue} {r.performanceUnit} <span style={{color:'#90a4ae',fontWeight:400,fontSize:11}}>{r.performanceMetric}</span></td>
                        <td style={{padding:'7px 10px',...hi(r.trainCo2===best.trainCo2)}}>{fmtCo2(r.trainCo2)}</td>
                        <td style={{padding:'7px 10px'}}>{r.kwhPerStudy}</td>
                        <td style={{padding:'7px 10px',...hi(r.carbonPerStudyG===best.carbonPerStudyG)}}>{r.carbonPerStudyG}</td>
                        <td style={{padding:'7px 10px',...hi(r.netCo2===best.netCo2)}}>{r.netCo2}</td>
                        <td style={{padding:'7px 10px',...hi(r.lifetimeCo2===best.lifetimeCo2)}}>{fmtCo2(r.lifetimeCo2)}</td>
                        <td style={{padding:'7px 10px',whiteSpace:'nowrap'}}>
                          <button type="button" onClick={()=>useBenchModel(r.id)} style={{padding:'5px 8px',fontSize:11,marginRight:4}}>Use this candidate →</button>
                          {benchModels.length>2 && <button onClick={()=>removeBenchModel(r.id)} title="Remove" style={{background:'none',color:'#aaa',padding:4,borderRadius:8,boxShadow:'none',lineHeight:1}}><Trash2 size={15}/></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="comparisonCarryForward">
              <span>NEXT STEP</span>
              <strong>Choose a candidate to assess</strong>
              <p>Select <strong>Use this candidate →</strong> in the table above. CEDARS will carry that candidate into the single-model assessment used for Score &amp; EcoLabel.</p>
            </div>

            <details className="comparisonOptionalDetail">
              <summary><span>Performance vs carbon</span><small>{benchResults.comparablePerformance?'Plot available':'Needs like-for-like performance inputs'}</small></summary>
              <div className="comparisonOptionalBody">
                <p className="note" style={{marginTop:0,marginBottom:12}}>{benchResults.comparablePerformance?<>For the shared like-for-like definition, {benchResults.rows[0]?.performanceDirection==='lower'?'lower-left':'upper-left'} is preferred. <strong style={{color:'#2E7D32'}}>★ green points</strong> are Pareto-efficient.</>:<>The plot is intentionally withheld until the shared task/endpoint/cohort is complete and all candidates use the same performance metric, unit, and direction.</>}</p>
                {benchResults.comparablePerformance ? <>
                {(()=>{
                  const data = {datasets:[{
                    label:'Candidates',
                    data: benchResults.rows.map(r=>({x:r.carbonPerStudyG, y:r.performanceValue, _label:r.label, _unit:r.performanceUnit})),
                    pointBackgroundColor: benchResults.rows.map(r=>r.pareto?'#2E7D32':'#b0bec5'),
                    pointBorderColor: benchResults.rows.map(r=>r.pareto?'#1b5e20':'#90a4ae'),
                    pointRadius: benchResults.rows.map(r=>r.pareto?8:6),
                    pointHoverRadius: 10,
                  }]};
                  const opts = {
                    responsive:true, maintainAspectRatio:false,
                    plugins:{legend:{display:false}, tooltip:{callbacks:{label: ctx => ` ${ctx.raw._label}: ${ctx.parsed.y} ${ctx.raw._unit} · ${ctx.parsed.x} gCO₂e/study`}}},
                    scales:{
                      x:{title:{display:true,text:'Carbon per study (gCO₂e)'}, beginAtZero:true},
                      y:{title:{display:true,text:`${benchResults.rows[0]?.performanceMetric || 'Reported performance'} (${benchResults.rows[0]?.performanceUnit || 'value'})`}},
                    },
                  };
                  return <div style={{height:320}}><Suspense fallback={<div style={{height:320}}/>}><Scatter data={data} options={opts}/></Suspense></div>;
                })()}
                </> : <div className="comparisonUnavailable"><strong>Performance-vs-carbon plot unavailable</strong><span>Candidates are not yet comparable on one shared clinical definition and performance measure.</span><button type="button" className="inlineTextButton" onClick={()=>document.getElementById('ai-shared-comparison-definition')?.scrollIntoView({behavior:'smooth',block:'center'})}>Review comparison definition ↑</button></div>}
              </div>
            </details>
            <details className="comparisonOptionalDetail comparisonEvidence">
              <summary><span>Evidence &amp; assumptions</span><small>Workload, serving &amp; agentic assumptions</small></summary>
              <div className="comparisonOptionalBody">
                <p className="note">Recent LLM inference studies reinforce why CEDARS keeps workload and serving assumptions visible: query energy changes materially with prompt length, test-time reasoning, batching, hardware, software stack and data-centre overhead. Published per-query values are useful benchmarks, not a universal radiology per-study conversion.<Ref id="jegham-llm-2025" order={AI_ENTRY_REFS}/><Ref id="fernandez-llm-energy-2025" order={AI_ENTRY_REFS}/><Ref id="oviedo-inference-2025" order={AI_ENTRY_REFS}/></p>
                <p className="note" style={{marginBottom:0}}>The worked agentic/token-multiplier example above is illustrative; update calls/task, tokens/call, hardware, and serving assumptions for the system being evaluated.</p>
              </div>
            </details>
            </>)}
          </section>

          )}

          </>)}

          {scen.aiRoute === 'own' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:18, alignItems:'start', marginTop:18}} className="aiRecordGrid">
              <div>
                <h2 style={{margin:'0 0 4px'}}>Your AI model</h2>
                <p className="note" style={{marginTop:0}}>These details feed the AI Research EcoLabel and reporting outputs; provenance follows each value across Score &amp; EcoLabel, Improve, and Report (&amp; Share).</p>
                {renderAiRecordForm()}
              </div>
              <div style={{position:'sticky', top:16, display:'flex', flexDirection:'column', gap:12}}>
                <div data-demo-target="ai-disclosure" style={{background:'#fff', border:'1px solid #c8e6c9', borderRadius:16, padding:'16px 18px', display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}><strong style={{fontSize:13}}>Disclosure completeness</strong><strong style={{fontSize:13, color:'#2E7D32'}}>{aiChecklistDone} of {aiChecklist.length}</strong></div>
                  <div style={{height:8, background:'#e0efe2', borderRadius:4, overflow:'hidden'}}><div style={{width:`${Math.round(aiChecklistDone/aiChecklist.length*100)}%`, height:8, background:'#2E7D32'}}/></div>
                  {aiChecklistDone < aiChecklist.length && (
                    <div className="note" style={{margin:0}}>Still open: <strong>{aiChecklist.filter(([,ok])=>!ok).map(([n])=>n).join(' · ')}</strong></div>
                  )}
                  <div className="note" style={{margin:0}}>The full checklist, with each item explained, is on <button type="button" className="inlineTextButton" onClick={()=>{setEcoLabelMode('ai');setPage('report');}}>Report (&amp; Share)</button>, where the exports are generated.</div>
                </div>
                <button onClick={()=>goToScore('ai')}>Continue to Score &amp; EcoLabel →</button>
              </div>
            </div>
          )}
          </>)}

          <ReferenceList ids={AI_PAGE_REFS}/>

        </main>
      )}

      {/* ── Improve / intervention modelling ── */}
      {page==='scenario' && (
        <main>
          <h1 style={{margin:'0 0 6px'}}>Improve</h1>
          <p className="note" style={{margin:'0 0 10px',fontSize:14}}>Choose the part of the assessment you want to improve. Department operations and AI can coexist in the same assessment; switching workspaces does not erase either.</p>
          <AssessmentContextStrip settings={settings} ai={ecoLabelMode==='ai'} onEdit={()=>goToAssessmentContext('scenario',true)}/>
          <div className="improveScopeSelector" role="tablist" aria-label="Improve workspace"><button type="button" className={ecoLabelMode==='department'?'active':''} onClick={()=>setEcoLabelMode('department')}><Activity size={19}/><span><strong>Department operations</strong><small>Equipment, utilization, storage, contrast, resources and workflows.</small></span></button><button type="button" className={ecoLabelMode==='ai'?'active':''} onClick={()=>{setEcoLabelMode('ai');setImproveAiStage(scen.aiRoute==='compare'||scen.ownMode==='spec'?'procure':'develop');}}><Brain size={19}/><span><strong>AI model &amp; informatics</strong><small>Develop/train or procure/deploy AI across its lifecycle.</small></span></button></div>

          {ecoLabelMode==='department' && (()=>{
            const price = getPrice(settings.region, settings.electricityPrice);
            const sym = currencySym(settings.region);
            const periodNoun = settings.timePeriod === 'Annual' ? 'year' : settings.timePeriod === 'Quarterly' ? 'quarter' : 'month';
            const individual = Object.entries(INTERVENTIONS).map(([name,data])=>{
              const result = computeInterventions([name], settings.region, settings.timePeriod, settings.equipment, settings.customCi, scen.cloudProvider, scen.scannerState, storageCfg, settings.equipmentOverrides, clinicalAdj, deptLabel.renewablePct);
              const totalCo2 = rnd((result.savings.co2||0) + (result.embodied?.savedCo2eKg||0) + (result.contrast?.savedCo2eKg||0), 1);
              return {name,data,result,totalCo2,meta:IMPROVE_INTERVENTION_META[name]||{description:data.note,category:'Other',status:data.guidanceOnly?'Planning guidance':'Scenario estimate',reason:'Uses the current CEDARS intervention assumptions.',links:[]}};
            });
            const individualByName = Object.fromEntries(individual.map(x=>[x.name,x]));
            const ranked = individual.filter(x=>x.totalCo2>0).sort((x,y)=>y.totalCo2-x.totalCo2).slice(0,3);
            const selectedRows = scenarioInterventions.map(name=>individualByName[name]).filter(Boolean);
            const totalCarbonSaving = rnd((scenario.savings.co2||0)+(scenario.embodied.savedCo2eKg||0)+(scenario.contrast.savedCo2eKg||0),1);
            const periodCostSaving = scenario.savings.kwh * price;
            const statusClass = status => status === 'Modeled' ? 'modeled' : status === 'Planning guidance' ? 'guidance' : 'estimate';
            const impactText = row => {
              if (row.meta.status==='Planning guidance') return 'Planning guidance — update the affected CEDARS inputs after implementation';
              const parts = [];
              if (row.result.savings.kwh>0) parts.push(`−${row.result.savings.kwh.toLocaleString()} kWh`);
              if (row.totalCo2>0) parts.push(`−${row.totalCo2.toLocaleString()} kgCO₂e`);
              return parts.length ? parts.join(' · ') : 'No change with the current assessment inputs';
            };

            return <>
              <div className="improveStateStrip" aria-label="Improve workflow status">
                <div><span>CURRENT ASSESSMENT</span><strong>Baseline</strong></div>
                <ArrowRight size={18}/>
                <div className="active"><span>YOUR SCENARIO</span><strong>{scenario.count} change{scenario.count===1?'':'s'} selected</strong></div>
                <ArrowRight size={18}/>
                <div><span>PROJECTED ASSESSMENT</span><strong>{scenario.count>0?'Calculated below':'Add a change to compare'}</strong></div>
              </div>

              <section className="inputSummary improveWorkspace" data-demo-target="department-improve-workspace" style={{marginBottom:20}}>
                <div className="improveWorkspaceHeading">
                  <div><span>BUILD A SCENARIO</span><h2>Build your improvement scenario</h2><p>Start with the largest modeled opportunities for this assessment, then follow the radiology workflow below to browse where other changes act.</p></div>
                  <div className="improveWorkspaceCount">{scenario.count} selected</div>
                </div>

                <div className="improveWorkspaceGrid">
                  <div className="improveChooser">
                    <section className="improveOpportunities">
                      <h3>Opportunities for this assessment</h3>
                      <p className="note">Ranked by modeled carbon reduction using the assessment you entered. Local feasibility and clinical appropriateness still need to be assessed.</p>
                      {ranked.length>0 ? <div className="improveOpportunityList">
                        {ranked.map((row,i)=>{
                          const active=scenarioInterventions.includes(row.name);
                          return <div key={row.name} className="improveOpportunityRow">
                            <div className="improveRank">{i+1}</div>
                            <div className="improveOpportunityText"><strong>{row.name}</strong><span>−{row.totalCo2.toLocaleString()} kgCO₂e · {row.meta.reason}</span></div>
                            <button type="button" className={active?'added':''} disabled={active} onClick={()=>toggleScenarioIntervention(row.name)}>{active?'Added ✓':'Add to scenario'}</button>
                          </div>;
                        })}
                      </div> : <div className="note" style={{padding:'10px 0'}}>No quantified opportunity is available from the current inputs yet. You can still browse the scenario options below.</div>}
                    </section>

                    <section className="improveAllChanges">
                      <div className="improveSectionHeading"><div><h3>Follow the radiology workflow</h3><p>Use the pathway to see where each opportunity acts. Your highest modeled opportunities remain ranked above; this map is for browsing by workflow stage.</p></div><button type="button" className="inlineTextButton" onClick={()=>setImproveDeptStage('order')}>Start at ordering →</button></div>
                      <div className="improveWorkflowMap" role="tablist" aria-label="Radiology sustainability workflow">
                        {IMPROVE_WORKFLOW_STAGES.slice(0,5).map((stage,i)=><React.Fragment key={stage.key}><button type="button" role="tab" aria-selected={improveDeptStage===stage.key} className={improveDeptStage===stage.key?'active':''} onClick={()=>setImproveDeptStage(stage.key)}><span>{stage.step}</span><strong>{stage.title}</strong><small>{stage.subtitle}</small></button>{i<4&&<ArrowRight size={18}/>}</React.Fragment>)}
                      </div>
                      <button type="button" className={`improveInfrastructureBand ${improveDeptStage==='infrastructure'?'active':''}`} onClick={()=>setImproveDeptStage('infrastructure')}><span>+</span><div><strong>Infrastructure &amp; lifecycle</strong><small>Power management · electricity supply · equipment lifetime · materials</small></div></button>
                      <SystemEffectsCallout kind="department" anchorId="department-system-effects"/>
                      <div className="improveStageHeader"><span>WORKFLOW STAGE</span><strong>{IMPROVE_WORKFLOW_STAGES.find(s=>s.key===improveDeptStage)?.title}</strong><small>{IMPROVE_WORKFLOW_STAGES.find(s=>s.key===improveDeptStage)?.subtitle}</small></div>
                      <div className="improveChangeGrid">
                        {individual.filter(row=>improveWorkflowStage(row.name)===improveDeptStage).map(row=>{
                          const active=scenarioInterventions.includes(row.name);
                          return <div key={row.name} className={`improveChangeCard ${active?'active':''}`}>
                            <label className="improveChangeSelect">
                              <input type="checkbox" checked={active} onChange={()=>toggleScenarioIntervention(row.name)}/>
                              <span><strong>{row.name}</strong><small>{row.meta.description}</small></span>
                            </label>
                            <div className="improveBadges"><span className={`improveStatus ${statusClass(row.meta.status)}`}>{row.meta.status}</span><span>{row.meta.category}</span></div>
                            <div className="improveStandalone"><span>{row.meta.status==='Planning guidance'?'How it affects CEDARS':'Standalone effect'}</span><strong>{impactText(row)}</strong></div>
                            <details className="improveEvidence">
                              <summary>Evidence &amp; assumptions</summary>
                              <div><p>{row.data.note}</p>{row.meta.links.length>0&&<p className="improveEvidenceLinks">{row.meta.links.map(([label,href],i)=><React.Fragment key={href}>{i>0&&' · '}<ExternalLink href={href}>{label}</ExternalLink></React.Fragment>)}</p>}</div>
                            </details>
                          </div>;
                        })}
                      </div>
                    </section>

                    {(scenario.usesScanner||scenario.usesCloud) && <section className="improveAssumptions">
                      <h3>Scenario-specific assumptions</h3>
                      <div className="grid">
                        {scenario.usesScanner&&<Sel label="Scanner state target" value={scen.scannerState} options={META.scannerStates} onChange={v=>setS('scannerState',v)}/>}
                        {scenario.usesCloud&&<Sel label="Cloud provider" value={scen.cloudProvider} options={META.cloudProviders} onChange={v=>setS('cloudProvider',v)}/>}
                      </div>
                      <p className="note">{scenario.usesScanner&&<>The scanner target controls the modeled depth of overnight/standby power reduction. </>}{scenario.usesCloud&&<>The compute-region scenario uses {scen.cloudProvider}'s modeled carbon intensity rather than the local department grid.</>}</p>
                    </section>}
                  </div>

                  <aside className="improveReceipt">
                    <div className="improveReceiptHeader"><span>YOUR SCENARIO</span><strong>{scenario.count} change{scenario.count===1?'':'s'} selected</strong></div>
                    {selectedRows.length>0 ? <div className="improveReceiptRows">
                      {selectedRows.map(row=><div key={row.name} className="improveReceiptRow">
                        <button type="button" aria-label={`Remove ${row.name}`} onClick={()=>toggleScenarioIntervention(row.name)}>×</button>
                        <div><strong>{row.name}</strong><span>{impactText(row)}</span></div>
                      </div>)}
                    </div> : <div className="improveReceiptEmpty">Select a change to build a scenario. The combined result will appear here.</div>}
                    <div className="improveReceiptTotal">
                      <span>COMBINED PROJECTED EFFECT</span>
                      <strong>{scenario.count>0?`−${scenario.savings.kwh.toLocaleString()} kWh`:'—'}</strong>
                      <strong>{scenario.count>0?`−${totalCarbonSaving.toLocaleString()} kgCO₂e`:'—'}</strong>
                      <strong className="money">{scenario.count>0?`≈ ${fmtMoney(periodCostSaving,sym)} electricity saved / ${periodNoun}`:'—'}</strong>
                      {scenario.count>0&&<div className="improveReceiptPills"><span>{scenario.savings.pctEnergy}% energy</span><span>{scenario.savings.pctCo2}% operational carbon</span></div>}
                    </div>
                    <p className="improveReceiptNote">Standalone rows help compare options. The <strong>combined scenario</strong> is the authoritative total because CEDARS accounts for overlapping energy pools rather than simply adding every row.</p>
                    <button type="button" disabled={scenario.count===0} onClick={()=>document.getElementById('improve-before-after')?.scrollIntoView({behavior:'smooth',block:'start'})}>Compare before &amp; after ↓</button>
                  </aside>
                </div>
              </section>

              <section id="improve-before-after" className="inputSummary improveResultSection" style={{marginBottom:18}}>
                <h2>Projected effect on your EcoLabel</h2>
                {(()=>{
                  const cur=deptLabelData;
                  const frac=scenario.baseline.co2>0?scenario.savings.co2/scenario.baseline.co2:0;
                  const projCo2Study=rnd(cur.co2PerStudy*(1-frac),3);
                  const projScore=cur.hasData?cedarsScore(projCo2Study,CEDARS_DEPT_LO,CEDARS_DEPT_HI):null;
                  const projRating=projScore!=null?cedarsRating(projScore):null;
                  const mkBox=(title,score,leaves,color,bg,label)=><div className="improveScoreBox" style={{background:bg,borderColor:color}}><span>{title}</span><div><strong style={{color}}>{score??'—'}</strong><div><LeafRating leaves={leaves} size={16} color={color}/><small style={{color}}>{label}</small></div></div></div>;
                  return <><div className="improveScoreCompare">{mkBox('Current',cur.hasData?cur.score:null,cur.leaves,cur.ratingColor,cur.ratingBg,cur.ratingLabel)}<ArrowRight size={24}/>{mkBox(scenario.count>0?`Projected · ${scenario.count} change${scenario.count===1?'':'s'}`:'Projected',projScore,projRating?.leaves??0,projRating?.color??'#90a4ae',projRating?.bg??'#f5f5f5',projRating?.label??'')}</div>
                    {projScore!=null&&(scenario.count===0?<p className="note">Add one or more changes above to project their combined impact.</p>:projScore===cur.score?<p className="note">The selected changes reduce the modeled footprint, but not enough to move the current operational CEDARS Score band. Modeled reduction: <strong>{scenario.savings.co2.toLocaleString()} kgCO₂e operational</strong>{scenario.embodied.savedCo2eKg>0?` plus ${scenario.embodied.savedCo2eKg.toLocaleString()} kgCO₂e embodied Scope 3`:''}{scenario.contrast.savedCo2eKg>0?` plus ${scenario.contrast.savedCo2eKg.toLocaleString()} kgCO₂e contrast Scope 3`:''}.</p>:<p className="note">The selected scenario shifts the CEDARS Score <strong>{projScore>cur.score?'+':''}{projScore-cur.score}</strong> points ({cur.co2PerStudy} → {projCo2Study} kgCO₂e/study).</p>)}
                  </>;
                })()}
              </section>

              <section className="inputSummary improveResultSection" style={{marginBottom:18}}>
                <div className="improveResultHeading"><div><h2>Energy, carbon &amp; cost — before vs after</h2><p>Combined results use the same intervention engine as the scenario builder above.</p></div><label>Electricity price ({sym}/kWh)<input type="number" min="0" step="0.01" value={settings.electricityPrice} onChange={e=>set('electricityPrice',e.target.value)} placeholder={String(ELECTRICITY_PRICE[settings.region]?.price??0.20)}/></label></div>
                <div className="scenarioGrid">
                  <section className="card"><div className="cardHead"><Gauge/><span>Baseline ({settings.timePeriod})</span></div><p><b>{scenario.baseline.kwh.toLocaleString()} kWh</b></p><p>{scenario.baseline.co2.toLocaleString()} kgCO₂e</p><p style={{color:'#607d66'}}>{fmtMoney(scenario.baseline.kwh*price,sym)}</p></section>
                  <section className="card savings"><div className="cardHead"><TrendingDown/><span>Projected savings</span></div><b>−{scenario.savings.kwh.toLocaleString()} kWh</b><p>−{scenario.savings.co2.toLocaleString()} kgCO₂e operational</p>{scenario.savings.co2>0&&<p className="note" style={{fontSize:10}}>≈ {fmtBig(scenario.savings.co2/CAR_CO2_KG_KM)} km of typical car-travel emissions for this {periodNoun}.</p>}<p style={{fontWeight:800,color:'#1b5e20'}}>−{fmtMoney(scenario.savings.kwh*price,sym)}{dash.totals.label}</p><p><span className="badge">{scenario.savings.pctEnergy}% energy reduction</span></p>{scenario.contrast.savedCo2eKg>0&&<p style={{fontSize:11,color:'#607d66'}}>+ {scenario.contrast.savedCo2eKg.toLocaleString()} kgCO₂e contrast Scope 3</p>}{scenario.embodied.savedCo2eKg>0&&<p style={{fontSize:11,color:'#607d66'}}>+ {scenario.embodied.savedCo2eKg.toLocaleString()} kgCO₂e embodied Scope 3</p>}</section>
                  <section className="card"><div className="cardHead"><Leaf/><span>After interventions</span></div><p><b>{scenario.projected.kwh.toLocaleString()} kWh</b></p><p>{scenario.projected.co2.toLocaleString()} kgCO₂e</p><p style={{color:'#607d66'}}>{fmtMoney(scenario.projected.kwh*price,sym)}</p></section>
                </div>
                <div className="charts improveChart"><section><h3>Before vs after</h3><Suspense fallback={<div style={{height:200}}/>}><Bar data={chartScenario}/></Suspense></section></div>
              </section>

              <div className="workflowNextStep">
                <div className="workflowNextCopy">
                  <span>NEXT STEP</span>
                  <strong>Ready to prepare your CEDARS materials?</strong>
                  <small>Your current assessment and tested scenario remain separate in the final reporting workflow.</small>
                </div>
                <div className="workflowNextActions">
                  <button className="workflowNextPrimary" onClick={()=>setPage('report')}>Continue to Report (&amp; Share) <ArrowRight size={17}/></button>
                  <button className="download" onClick={()=>setPage('ecolabel')}>Back to Score &amp; EcoLabel</button>
                </div>
              </div>
              <p className="note" style={{marginTop:12}}>Assessment context: {settings.region} — {settings.timePeriod} figures. Change these shared assumptions on Home or in Radiology Department setup.</p>
            </>;
          })()}
          {ecoLabelMode==='ai' && <section className="aiImproveWorkspace">
            <div className="aiImproveHeader"><div><span>AI MODEL &amp; INFORMATICS</span><h2>Improve AI · {improveAiStage==='develop'?'Develop / fine-tune':'Procure / deploy'}</h2><p>Use the lifecycle map to move from definition through monitoring. Development and procurement use different actions, but both point back to the same canonical AI model record.</p></div><div className="aiImproveModelPicker">{visibleAiModels.length>0?<><label>AI model<select value={visibleAiModels.some(m=>m.id===scen.modelId)?scen.modelId:visibleAiModels[0].id} onChange={e=>{const record=aiModels[e.target.value];if(record)setScen({...modelScenFromRecord(record,SCEN_DEFAULTS)});}}>{visibleAiModels.map(m=><option key={m.id} value={m.id}>{modelDisplayName(m)}</option>)}</select></label><small>Shows AI models already added to this CEDARS assessment.</small><button type="button" className="inlineTextButton" onClick={openAiModelsFromImprove}>Add or manage AI models →</button></>:<><strong>No AI models added yet</strong><small>Add a model before reviewing model-specific improvement opportunities.</small><button type="button" onClick={openAiModelsFromImprove}>Add an AI model →</button></>}</div></div>
            <div className="aiImproveStageLabel">LIFECYCLE STAGE</div><div className="aiImproveStageGrid"><button type="button" aria-selected={improveAiStage==='develop'} className={improveAiStage==='develop'?'active':''} onClick={()=>{setImproveAiStage('develop');setImproveAiLifecycleStep('build');}}><span>DEVELOP · FINE-TUNE</span><strong>Internally developed, fine-tuned, or retrained AI</strong><small>Training, experimentation, precision, model design, data and compute.</small>{improveAiStage==='develop'&&<b>SELECTED</b>}</button><button type="button" aria-selected={improveAiStage==='procure'} className={improveAiStage==='procure'?'active':''} onClick={()=>{setImproveAiStage('procure');setImproveAiLifecycleStep('compare');}}><span>PROCURE · DEPLOY</span><strong>Vendor / externally developed AI</strong><small>Candidate comparison, vendor questions, deployment assumptions and monitoring.</small>{improveAiStage==='procure'&&<b>SELECTED</b>}</button></div><div className="aiLifecycleMap">{AI_IMPROVE_LIFECYCLE[improveAiStage].map((stage,i)=><React.Fragment key={stage.key}><button type="button" className={improveAiLifecycleStep===stage.key?'active':''} aria-selected={improveAiLifecycleStep===stage.key} onClick={()=>setImproveAiLifecycleStep(stage.key)}><span>{stage.step}</span><strong>{stage.title}</strong><small>{stage.subtitle}</small></button>{i<4&&<ArrowRight size={17}/>}</React.Fragment>)}</div>
            {(()=>{const stage=AI_IMPROVE_LIFECYCLE[improveAiStage].find(s=>s.key===improveAiLifecycleStep) || AI_IMPROVE_LIFECYCLE[improveAiStage][0];const items=(improveAiStage==='develop'?AI_IMPROVE_DEVELOP:AI_IMPROVE_PROCURE).filter(item=>aiImproveLifecycleStage(item.title,improveAiStage)===stage.key);return <><div className="aiImproveStageIntro"><strong>{stage.step} · {stage.title}</strong><p>{improveAiStage==='develop'?(stage.key==='build'?'Measure development compute and use explicit stopping/checkpoint policies before specialized optimization.':stage.key==='define'?'Set the clinical objective and compute budget before expanding model size or experimentation.':stage.key==='validate'?'Confirm that efficient settings preserve the required clinical performance.':stage.key==='deploy'?'Translate model efficiency into the actual serving hardware, utilization, and compute region.':'Track retraining, storage/hardware overhead, and demand growth after deployment.'):(stage.key==='compare'?'Compare clinical fit first, then request the environmental information needed for a like-for-like decision.':stage.key==='define'?'Define intended use, acceptable performance, and local workflow requirements before optimizing for efficiency.':stage.key==='validate'?'Validate both clinical performance and the deployment assumptions used in the environmental comparison.':stage.key==='deploy'?'Ask which validated serving/hosting options can reduce compute without changing clinical behavior.':'Keep vendor updates, hosting changes, and demand growth from turning today’s assumptions into stale ones.')}</p></div><div className="aiImproveRecommendationList">{items.map((item,i)=><article className="aiImproveRecommendation" key={item.title}><div className="aiImproveRank">{i+1}</div><div className="aiImproveRecommendationBody"><div className="aiImproveRecommendationTitle"><strong>{item.title}</strong><span className={`aiImprovePriority ${item.priority.toLowerCase()}`}>{item.priority}</span><span className="aiImproveMode">{item.mode}</span></div><p>{item.body}</p>{item.inputs&&<div className="aiImproveInputs"><strong>{item.mode==='CEDARS input'?'Updates':'May change'}:</strong> {item.inputs}</div>}<div className="aiImproveMeta"><span>{item.applies}</span><div className="improveEvidenceChips"><span>Evidence</span>{item.refs.map(id=>{const r=REFS[id];const author=(r?.authors||id).split(',')[0].split(' ')[0];return <ExternalLink key={id} href={refUrl(r)} className="improveEvidenceChip">{author} · {r?.venue||'Source'} {r?.year||''}</ExternalLink>;})}</div></div></div></article>)}</div>{improveAiStage==='procure'&&stage.key==='compare'&&<div className="aiImproveVendorPrompt integrated"><div><span>VENDOR DISCLOSURE CHECKLIST</span><strong>What should I ask for?</strong></div><p>Ask for product/model version, intended use, validation basis, training hardware/energy when available, inference energy or throughput on the proposed hardware, hosting region/PUE, expected calls or token use for LLM/agentic systems, integration path, and how software/model updates change these assumptions.</p><div className="aiImproveVendorActions"><button type="button" onClick={()=>{setPage('ai');setS('aiRoute','compare');ensureBenchModels();setAiOpen(o=>({...o,benchmark:true}));}}>Open candidate comparison →</button><button type="button" className="download" onClick={openAiModelsFromImprove}>Review AI model records →</button></div></div>}</>;})()}
            <div className="aiImproveNote"><strong>How these recommendations affect your EcoLabel.</strong> A recommendation does <strong>not</strong> change the CEDARS Score just because it is selected or followed. After implementation, update the values it actually changes—for example training kWh, inference energy, workload, hardware, or compute region. CEDARS then recalculates the EcoLabel from the updated data.</div><SystemEffectsCallout kind="ai" anchorId="ai-system-effects"/>
            <div className="workflowNextStep"><div className="workflowNextCopy"><span>NEXT STEP</span><strong>Apply or document the AI changes</strong><small>Update the canonical AI record, then continue to Score &amp; EcoLabel or Report (&amp; Share).</small></div><div className="workflowNextActions"><button className="workflowNextPrimary" onClick={()=>setPage('ai')}>Open AI Model &amp; Informatics <ArrowRight size={17}/></button><button className="download" onClick={()=>setPage('report')}>Continue to Report (&amp; Share)</button></div></div>
            <ReferenceList ids={AI_IMPROVE_REFS}/>
          </section>}
        </main>
      )}

      {/* ── Eco-label ── */}
      {(page==='ecolabel' || page==='report') && (
        <main>
          <div style={{marginBottom:8}}><h1 style={{margin:'0 0 6px'}}>{page==='ecolabel' ? 'Score & EcoLabel' : 'Report (& Share)'}</h1>{page==='report'&&<p className="note" style={{margin:'0 0 6px',fontSize:13}}>Review your reporting details, prepare CEDARS materials, and preserve or share the assessment.</p>}<AssessmentContextStrip settings={settings} ai={ecoLabelMode==='ai'} onEdit={()=>goToAssessmentContext(page,true)}/></div>
          <div className="researchAssessmentNotice">
            <AlertTriangle size={16}/> <strong>Research assessment — not (yet) an external certification.</strong>
          </div>

          {page==='ecolabel' ? <>
            <div className="ecoChooserHeader prominent">
              <span>CHOOSE ONE</span>
              <h2>What are you scoring?</h2>
              <p>Select the assessment you want CEDARS to score and summarize. You can switch at any time.</p>
            </div>
            <div className="ecoProductChooser prominent" role="tablist" aria-label="CEDARS scoring product">
              <button type="button" className={`ecoProductChoice ${ecoLabelMode==='department'?'active':''}`} onClick={()=>selectEcoScore('department')} role="tab" aria-selected={ecoLabelMode==='department'}>
                <span className="ecoProductIcon"><Activity size={20}/></span>
                <span className="ecoProductText">
                  <span className="ecoProductTitle">Radiology Department</span>
                  <span className="ecoProductDesc">Score department operations, equipment, resources, efficiency, and current sustainability performance.</span>
                  <span className="ecoProductAction">View Department EcoLabel →</span>
                </span>
                {ecoLabelMode==='department' && <span className="ecoProductSelected">DEPARTMENT SELECTED</span>}
              </button>
              <button type="button" className={`ecoProductChoice ${ecoLabelMode==='ai'?'active':''}`} onClick={()=>selectEcoScore('ai')} role="tab" aria-selected={ecoLabelMode==='ai'}>
                <span className="ecoProductIcon"><Brain size={20}/></span>
                <span className="ecoProductText">
                  <span className="ecoProductTitle">AI Model &amp; Informatics</span>
                  <span className="ecoProductDesc">Score model training, inference, deployment, compute, and reported performance context.</span>
                  <span className="ecoProductAction">View AI Research EcoLabel →</span>
                </span>
                {ecoLabelMode==='ai' && <span className="ecoProductSelected">AI SELECTED</span>}
              </button>
            </div>
            {ecoLabelMode==='department' && !departmentScoreReadiness.ready && (
              <div id="score-readiness-department" className="scoreReadinessGate" role="status" aria-live="polite">
                <AlertTriangle size={20}/>
                <div className="scoreReadinessBody">
                  <span>DEPARTMENT SCORE · INPUT NEEDED</span>
                  <strong>{departmentScoreReadiness.issues.length===1?'One Department input is still needed.':`${departmentScoreReadiness.issues.length} Department inputs are still needed.`}</strong>
                  <p>CEDARS keeps the Department baseline separate from Clinical AI. {deptLabelData.clinicalToolCount>0?'Your Clinical AI setup is saved, but the base Department footprint still needs the item below.':'Complete the item below; you do not have to use a quick-start example if you prefer to enter your own data.'}</p>
                  <div className="scoreReadinessIssues">
                    {departmentScoreReadiness.issues.map(issue=><button type="button" key={issue.key} onClick={()=>focusMissingScoreInput('department',issue.key)}><span><strong>{issue.title}</strong><small>{issue.detail}</small></span><b>{scoreIssueAction('department',issue.key)}</b></button>)}
                  </div>
                </div>
              </div>
            )}
            {ecoLabelMode==='ai' && !aiScoreReadiness.ready && (
              <div id="score-readiness-ai" className="scoreReadinessGate" role="status" aria-live="polite">
                <AlertTriangle size={20}/>
                <div className="scoreReadinessBody">
                  <span>AI RESEARCH ECOLABEL · INPUT NEEDED</span>
                  <strong>{aiScoreReadiness.issues[0]?.title || 'Complete the AI model inputs.'}</strong>
                  <p>{aiScoreReadiness.issues[0]?.detail}</p>
                  <div className="scoreReadinessIssues">
                    {aiScoreReadiness.issues.map(issue=><button type="button" key={issue.key} onClick={()=>focusMissingScoreInput('ai',issue.key)}><span><strong>{issue.title}</strong><small>{issue.detail}</small></span><b>{scoreIssueAction('ai',issue.key)}</b></button>)}
                  </div>
                </div>
              </div>
            )}
          </> : <>
            <div className="reportProductTabsWrap">
              <div className="reportProductTabsHeading">
                <span>REPORT TYPE</span>
                <strong>Choose the CEDARS product you are preparing</strong>
              </div>
              <div className="reportProductTabs" role="tablist" aria-label="CEDARS reporting product">
                <button type="button" role="tab" aria-selected={ecoLabelMode==='department'} className={ecoLabelMode==='department'?'active':''} onClick={()=>setEcoLabelMode('department')}>
                  <Activity size={19}/>
                  <span><strong>Department EcoLabel</strong><small>Radiology Department assessment</small></span>
                  {ecoLabelMode==='department' && <b>Selected</b>}
                </button>
                <button type="button" role="tab" aria-selected={ecoLabelMode==='ai'} className={ecoLabelMode==='ai'?'active':''} onClick={()=>setEcoLabelMode('ai')}>
                  <Brain size={19}/>
                  <span><strong>AI Research EcoLabel</strong><small>AI model &amp; informatics assessment</small></span>
                  {ecoLabelMode==='ai' && <b>Selected</b>}
                </button>
              </div>
            </div>
            <div className="reportSteps" aria-label="Report and share workflow">
              <div><span>1</span><strong>Review &amp; finalize</strong><small>Check the information used in your CEDARS result</small></div>
              <div><span>2</span><strong>Prepare your CEDARS materials</strong><small>EcoLabel, reporting text, methods &amp; reproducibility</small></div>
              <div><span>3</span><strong>Preserve or share</strong><small>Save, transfer, link, or optionally contribute</small></div>
            </div>
          </>}
          <div style={{display:ecoLabelMode==='department'?'block':'none'}}>
            {page==='ecolabel' && <>
            <div id="department-score-panel" className="scoreResultPanel workflowAnchor" style={{background:deptLabelData.ratingBg,border:`2px solid ${deptLabelData.ratingColor}`}}>
              <div className="scoreResultHero">
              <div style={{textAlign:'center',flexShrink:0}}>
                <div style={{fontSize:50,fontWeight:900,color:deptLabelData.ratingColor,lineHeight:1}}>{deptLabelData.hasData?deptLabelData.score:'—'}</div>
                <div style={{fontSize:10,fontWeight:700,color:deptLabelData.ratingColor,letterSpacing:'0.04em'}}>CEDARS SCORE</div>
              </div>
              <div style={{flex:'1 1 260px'}}>
                <LeafRating leaves={deptLabelData.leaves} size={22} color={deptLabelData.ratingColor}/>
                <div style={{fontWeight:800,fontSize:16,color:deptLabelData.ratingColor,marginTop:4}}>{deptLabelData.ratingLabel}</div>
                <div style={{fontSize:12,color:'#455a64',marginTop:3}}>{deptLabelData.hasData?`${deptLabelData.co2PerStudy} kgCO₂e per imaging study · ${deptLabelData.annualKwh.toLocaleString()} kWh/year`:'Complete your Radiology Department setup to generate the label.'}</div>
              </div>
              </div>
              <div className="scoreDataGrid" aria-label="Department score inputs and outputs">
                <div><span>Annual electricity</span><strong>{deptLabelData.annualKwh>0 ? `${deptLabelData.annualKwh.toLocaleString()} kWh` : '—'}</strong></div>
                <div><span>Annual carbon</span><strong>{deptLabelData.totalAnnualCo2>0 ? `${deptLabelData.totalAnnualCo2.toLocaleString()} kgCO₂e` : '—'}</strong></div>
                <div><span>Studies / year</span><strong>{deptLabelData.annualStudies>0 ? deptLabelData.annualStudies.toLocaleString() : '—'}</strong></div>
                <div><span>Energy / study</span><strong>{deptLabelData.kwhPerStudy>0 ? `${deptLabelData.kwhPerStudy} kWh` : '—'}</strong></div>
                <div><span>Effective grid CI</span><strong>{deptLabelData.effectiveCi} kgCO₂e/kWh</strong></div>
                <div><span>Current practices</span><strong>{deptLabelData.interventionCount || 0} documented</strong></div>
              </div>
            </div>
            <SystemEffectsCallout kind="department" onReview={()=>{setEcoLabelMode('department');setPage('scenario');window.setTimeout(()=>document.getElementById('department-system-effects')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}}/>

            <section className="scoreEverydayPanel" aria-labelledby="score-everyday-title">
              <div className="scoreEverydayHeader">
                <div>
                  <span>INTERPRET THE RESULT</span>
                  <h2 id="score-everyday-title">What it means in everyday terms</h2>
                  <p>{resultPeriodPhrase}, this footprint is approximately equivalent to:</p>
                </div>
                <div>
                  <div className="scoreScopeToggle" aria-label="Emissions included in everyday equivalents">
                    <button className={equivScope==='scope2'?'on':''} onClick={()=>setEquivScope('scope2')}><strong>Electricity only</strong><small>Purchased electricity · Scope 2</small></button>
                    <button className={equivScope==='all'?'on':''} onClick={()=>setEquivScope('all')}><strong>Broader modeled footprint</strong><small>Direct + indirect sources included here · Scopes 1–3 where assessed</small></button>
                  </div>
                  <div className="scoreScopeExplain"><strong>Electricity only</strong> shows emissions from purchased electricity. <strong>Broader modeled footprint</strong> also includes the direct and upstream/downstream sources that have been assessed in CEDARS.</div>
                  {equivScope==='all'&&!dash.scopes.scope1Assessed&&<div className="note" style={{fontSize:10,marginTop:5,textAlign:'right'}}>Direct fuel/gas emissions are not included because Scope 1 has not been assessed.</div>}
                </div>
              </div>

              {equivData.co2>0 ? (
                <>
                  <div className="scoreEverydayGrid">
                    {[
                      {icon:<Car/>, n:fmtBig(equivData.car_km), unit:'km driven by a typical car'},
                      {icon:<Plane/>, n:fmtBig(equivData.flights_short), unit:'short-haul passenger flights'},
                      {icon:<TreePine/>, n:fmtBig(equivData.trees_year), unit:'mature trees’ annual CO₂ uptake'},
                      {icon:<Car/>, n:fmtBig(equivData.car_years), unit:'years of average car emissions'},
                    ].map((item,i)=>(
                      <div key={i} className="scoreEverydayItem">
                        <span className="scoreEverydayIcon">{item.icon}</span>
                        <strong>{item.n}</strong>
                        <small>{item.unit}</small>
                      </div>
                    ))}
                  </div>
                  <p className="note" style={{fontSize:10,margin:'8px 0 0'}}>Illustrative comparisons only. Tree uptake is a way to understand scale and does not represent a carbon offset.</p>
                </>
              ) : (
                <div style={{padding:'18px 16px',border:'1px dashed #c8d6c9',borderRadius:12,background:'#fafcfb',color:'#607d66',fontSize:12}}>
                  Everyday comparisons will appear here once your assessment has a calculated carbon footprint.
                </div>
              )}

              <div className="scoreEverydayFoot" style={{marginTop:12}}>
                {equivData.kwh>0 ? <span><strong>Estimated electricity cost:</strong> {fmtMoney(equivData.cost, equivData.sym)} for this {resultPeriodNoun} at {equivData.sym}{equivData.pricePerKwh}/kWh · {settings.region}. Department electricity use is about {fmtBig(equivData.homes)} average household electricity-years.</span> : <span>Estimated electricity cost will appear once electricity use is calculated.</span>}
                <button type="button" className="inlineTextButton" onClick={()=>setPage('input')}>Edit assessment context →</button>
                <span>Equivalencies are interpretive aids; detailed factors and methodology remain in the source documentation.</span>
              </div>
            </section>

            <div className="ecoIntroBlock">
              <p><strong>Create a standardized sustainability disclosure from your current Radiology Department data.</strong> The label summarizes environmental performance, efficiency, resource use, and documented sustainability practices in a comparable format.</p>
              <details className="methodologyDetails">
                <summary>Methodology &amp; scoring</summary>
                <div>
                  The CEDARS Score (0–100) and Rating (1–5 leaves) are based on kgCO₂e per imaging study — a measure of how efficiently the department converts energy into <em>delivered care</em>, so a busy department can score well even at a high absolute footprint while an under-used fleet does not. The scale is benchmarked against published radiology carbon-intensity data; see the <a href="https://github.com/takinci/cedars/blob/main/sources.md" target="_blank" rel="noreferrer">full source list</a>. Its visual reporting logic draws on consumer ecolabels such as Energy Star and the <a href="https://europa.eu/youreurope/citizens/consumers/shopping/energy-labels/index_en.htm" target="_blank" rel="noreferrer">EU Energy Label</a>.
                </div>
              </details>
            </div>

            <div className="workflowNextStep">
              <div className="workflowNextCopy">
                <span>NEXT STEP</span>
                <strong>Prepare and preserve your CEDARS results</strong>
                <small>Continue to Report (&amp; Share), or test potential changes first.</small>
              </div>
              <div className="workflowNextActions">
                <button className="workflowNextPrimary" onClick={()=>setPage('report')}>Continue to Report (&amp; Share) <ArrowRight size={17}/></button>
                <button className="download" onClick={()=>setPage('scenario')}>Improve first</button>
              </div>
            </div>
            </>}
            {page==='report' && <>
            <section className="reportStageCard">
              <div className="reportStageHeading">
                <div className="reportStageNumber">1</div>
                <div>
                  <span>REVIEW &amp; FINALIZE</span>
                  <h2>Review &amp; finalize your Department EcoLabel</h2>
                  <p>CEDARS has carried forward your Radiology Department values. Review the label details and reporting values below; replace modeled values only when you have better measured data.</p>
                </div>
                <button className="download reportEditButton" onClick={()=>{setPage('dashboard');setDeptSetupOpen(true);}}>Edit department inputs →</button>
              </div>
              {(()=>{
                const checks = [
                  ['annual imaging volume', deptLabelData.annualStudies>0],
                  ['annual electricity', deptLabelData.annualKwh>0],
                  ['grid region', !!deptLabelData.region],
                  ['annual carbon footprint', deptLabelData.totalAnnualCo2>0],
                  ['CEDARS Score & Rating', deptLabelData.hasData],
                ];
                const missing = checks.filter(([,ok])=>!ok).map(([name])=>name);
                return missing.length===0
                  ? <div className="reportReadyChip">✓ Ready to prepare</div>
                  : <div className="reportNeedsReview"><strong>{missing.length} item{missing.length===1?'':'s'} need review</strong><span>{missing.join(' · ')}</span></div>;
              })()}

            <div className="reportReviewSection">
              <div className="ecoStepHeading reportSubsectionHeading"><div><h3>Label details</h3><p>Optional display information for the EcoLabel. Leaving these fields blank does not change the CEDARS Score or reporting readiness.</p></div></div>
              <div className="grid reportLabelDetailsGrid">
                <label>Department name <span className="reportOptional">optional · shown on EcoLabel</span><input type="text" value={deptLabel.deptName} onChange={e=>setDept('deptName',e.target.value)} placeholder="e.g. Radiology — MRI Unit"/></label>
                <label>Hospital / institution <span className="reportOptional">optional · shown on EcoLabel</span><input type="text" value={deptLabel.hospitalName} onChange={e=>setDept('hospitalName',e.target.value)} placeholder="e.g. University Hospital Basel"/></label>
              </div>
            </div>

            <div className="reportReviewSection">
              <div className="ecoStepHeading reportSubsectionHeading"><div><h3>Reporting values</h3><p>Use the live Department values by default. Enter an override only when you have a better measured value for reporting.</p></div></div>
              <p className="note" style={{marginBottom:12}}>
                {deptLabelData.isLive
                  ? <>Currently <strong style={{color:'#2E7D32'}}>live</strong> from your Radiology Department state. Leave blank to keep it live; enter a value to override.</>
                  : <>Using your <strong>overridden</strong> figures. Clear a field to return it to the live value.</>}
              </p>
              <div className="grid reportValuesGrid">
                <label>Grid region<select value={deptLabel.region} onChange={e=>setDept('region',e.target.value)}><option value="">— use current ({settings.region}) —</option>{META.regions.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
                <label>Annual electricity (kWh)<input type="number" min="0" value={deptLabel.annualKwh} onChange={e=>setDept('annualKwh',e.target.value)} placeholder={`live: ${deptLabelData.annualKwh.toLocaleString()}`}/></label>
                <label>Total imaging studies / year<input type="number" min="0" value={deptLabel.annualStudies} onChange={e=>setDept('annualStudies',e.target.value)} placeholder={`live: ${deptLabelData.annualStudies.toLocaleString()}`}/></label>
                <label>Renewable energy (%)<input type="number" min="0" max="100" value={deptLabel.renewablePct} onChange={e=>setDept('renewablePct',e.target.value)} placeholder="0–100"/></label>
              </div>
              <p className="note" style={{marginTop:8}}>Live kWh comes from the Radiology Department energy model; live studies from the Efficiency tab (actual volume, else fleet estimate). Override with utility bills / RIS counts for publication-quality figures.</p>

              {/* Clinical AI now live on the Radiology Department tab */}
              <p className="note" style={{margin:'14px 0 0',padding:'10px 14px',background:'#f1f8f1',borderRadius:12}}>
                <Brain size={14} style={{verticalAlign:'-2px',marginRight:6}}/>
                {deptLabelData.clinicalToolCount > 0
                  ? <>{deptLabelData.clinicalToolCount} clinical AI tool{deptLabelData.clinicalToolCount>1?'s':''} deployed — configured on the <strong>Radiology Department</strong> tab, and already reflected in the energy and score above.</>
                  : <>Deploy clinical AI tools on the <strong>Radiology Department</strong> tab to see their effect on this label.</>}
              </p>
            </div>

            <div id="current-practices" className="reportReviewSection workflowAnchor">
              <div className="ecoStepHeading reportSubsectionHeading"><div><h2>Current practices</h2><p>Record what is already implemented today. These items describe the current state and do not create projected savings.</p></div></div>
              <div className="reportPracticeSummary">
                <div><strong>{deptLabel.activeInterventions.length} current practice{deptLabel.activeInterventions.length===1?'':'s'} documented</strong><span>Future changes belong in Improve, where CEDARS models the projected effect separately.</span></div>
                <button type="button" className="download" onClick={()=>setPage('scenario')}>Go to Improve →</button>
              </div>
              <details className="reportDisclosureDetails">
                <summary>Review / edit current practices</summary>
                <div className="reportDisclosureDetailsBody">
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                    {Object.entries(INTERVENTIONS).map(([name, data]) => {
                      const active = deptLabel.activeInterventions.includes(name);
                      return (
                        <label key={name} style={{flexDirection:'row',alignItems:'flex-start',gap:10,fontWeight:400,color:'#263238',cursor:'pointer',background:active?'#e8f5e9':'#fafafa',borderRadius:10,padding:'10px 12px',border:active?'1.5px solid #81C784':'1px solid #e0e0e0'}}>
                          <input type="checkbox" checked={active} onChange={()=>toggleIntervention(name)} style={{width:16,height:16,accentColor:'#2E7D32',marginTop:2,flexShrink:0}}/>
                          <div>
                            <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{name}</div>
                            <div style={{fontSize:12,color:'#607d66'}}>{data.note}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </details>
            </div>
            </section>

            <section className="reportStageCard reportMaterialsStage" data-demo-target="department-report-materials">
              <div className="reportStageHeading compact">
                <div className="reportStageNumber">2</div>
                <div>
                  <span>PREPARE YOUR CEDARS MATERIALS</span>
                  <h2>Your Department EcoLabel</h2>
                  <p>Download the EcoLabel or copy a concise reporting paragraph. More detailed reporting and reproducibility fields are available below when needed.</p>
                </div>
              </div>

            <div style={{display:'flex',gap:28,flexWrap:'wrap',alignItems:'flex-start',marginBottom:32}}>
              <div style={{background:'white',border:`2px solid ${deptLabelData.ratingColor}`,borderRadius:14,overflow:'hidden',minWidth:280,maxWidth:510,fontFamily:'Inter,sans-serif',boxShadow:'0 8px 30px #1b5e2020',flexShrink:0}}>
                <div style={{background:'#1b5e20',padding:'14px 18px'}}>
                  <div style={{color:'white',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',gap:8}}><Leaf style={{width:16,height:16}}/> CEDARS Department EcoLabel</div>
                  <div style={{color:'#A5D6A7',fontSize:13,marginTop:4}}>{deptLabelData.deptName}</div>
                  <div style={{color:'#81C784',fontSize:11,marginTop:2}}>{deptLabelData.hospitalName ? `${deptLabelData.hospitalName} · ` : ''}{deptLabelData.region} · {deptLabelData.date}</div>
                </div>
                <div style={{background:deptLabelData.ratingBg,padding:'16px 18px',display:'flex',alignItems:'center',gap:18}}>
                  <div style={{textAlign:'center',flexShrink:0}}>
                    <div style={{fontSize:48,fontWeight:900,color:deptLabelData.ratingColor,lineHeight:1}}>{deptLabelData.hasData ? deptLabelData.score : '—'}</div>
                    <div style={{fontSize:10,fontWeight:700,color:deptLabelData.ratingColor,letterSpacing:'0.04em'}}>CEDARS SCORE</div>
                  </div>
                  <div>
                    <LeafRating leaves={deptLabelData.leaves} size={22} color={deptLabelData.ratingColor}/>
                    <div style={{fontWeight:700,fontSize:15,color:deptLabelData.ratingColor,marginTop:4}}>{deptLabelData.ratingLabel}</div>
                    <div style={{fontSize:12,color:'#263238',marginTop:2}}>{deptLabelData.hasData ? `${deptLabelData.co2PerStudy} kgCO₂e per imaging study` : 'Enter data above to calculate'}</div>
                  </div>
                </div>
                {[
                  ['Annual electricity',   deptLabelData.annualKwh>0 ? `${deptLabelData.annualKwh.toLocaleString()} kWh` : '—'],
                  ['Annual CO₂e',         deptLabelData.totalAnnualCo2>0 ? `${deptLabelData.totalAnnualCo2.toLocaleString()} kgCO₂e` : '—'],
                  ...(deptLabelData.clinicalToolCount>0 ? [['Clinical AI', `${deptLabelData.clinicalToolCount} deployed (reflected in energy)`]] : []),
                  ['Studies / year',       deptLabelData.annualStudies>0 ? deptLabelData.annualStudies.toLocaleString() : '—'],
                  ['Energy per study',     deptLabelData.kwhPerStudy>0 ? `${deptLabelData.kwhPerStudy} kWh` : '—'],
                  ...(deptLabelData.utilPct != null ? [['Fleet utilisation', `${deptLabelData.utilPct}% of configured fleet`]] : []),
                  ['Effective grid CI',    `${deptLabelData.effectiveCi} kgCO₂e/kWh (${deptLabelData.renewablePct}% renewable)`],
                  ['Grid region',          deptLabelData.region],
                  ...(deptLabelData.interventionCount>0 ? [['Current practices', `${deptLabelData.interventionCount} documented as implemented`]] : []),
                ].map(([k,v],i)=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 18px',background:i%2===0?'#f1f8f1':'white',fontSize:13,gap:12}}>
                    <span style={{color:'#607d66',flexShrink:0}}>{k}</span>
                    <span style={{fontWeight:700,color:'#263238',textAlign:'right'}}>{v}</span>
                  </div>
                ))}
                <div style={{background:'#e8f5e9',padding:'8px 18px',fontSize:11,color:'#2E7D32'}}>
                  Estimated with CEDARS · {deptLabelData.date} · CC BY 4.0
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:12,paddingTop:8}}>
                <button className="download" onClick={()=>downloadDeptPNG(deptLabelData)} disabled={deptLabelData.annualStudies===0}>
                  <Download/> Download PNG badge
                </button>
                <button className="download" onClick={()=>{navigator.clipboard.writeText(generateDeptText(deptLabelData));setDeptCopied(true);setTimeout(()=>setDeptCopied(false),2000);}} disabled={deptLabelData.annualStudies===0} style={deptCopied?{background:'#26A69A'}:undefined}>
                  <FileText/> {deptCopied ? 'Copied!' : 'Copy reporting paragraph'}
                </button>
                <p className="note" style={{maxWidth:220,fontSize:12,margin:0}}>
                  PNG badge: use in sustainability reports, posters, presentations, or accreditation materials.<br/><br/>
                  Reporting paragraph: a concise starting point for a main report or sustainability-methods section; adapt it to your local reporting requirements.
                </p>
                <div style={{marginTop:8}}>
                  <p className="note" style={{fontSize:11,marginBottom:6,fontWeight:700}}>CEDARS Rating — Score band:</p>
                  {CEDARS_RATINGS.map(r=>(
                    <div key={r.leaves} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,marginBottom:3,fontWeight:deptLabelData.leaves===r.leaves?700:400,color:deptLabelData.leaves===r.leaves?'#263238':'#607d66'}}>
                      <LeafRating leaves={r.leaves} size={12} color={r.color}/>
                      <span>{r.label}</span>
                      <span style={{marginLeft:'auto',fontFamily:'monospace',fontSize:10}}>{({5:'80–100',4:'60–79',3:'40–59',2:'20–39',1:'< 20'})[r.leaves]}</span>
                    </div>
                  ))}
                  <p className="note" style={{fontSize:10,marginTop:6}}>Continuous Score (0–100) from the per-study footprint, paired with a 1–5 leaf Rating — after Energy Star / EU Energy Label (Reg. EU 2021/341).</p>
                </div>
              </div>
            </div>

            <details className="reportDisclosureDetails reportMaterialsDetail">
              <summary>Reporting details &amp; reproducibility</summary>
              <div className="reportDisclosureDetailsBody">
                <p className="note reportDetailIntro">Review the fields CEDARS uses to make the Department EcoLabel understandable and reproducible. This detail can support a Methods section, sustainability report, accreditation documentation, or technical appendix when appropriate.</p>
              {(()=>{
                const d = deptLabelData;
                const items = [
                  ['1', 'Imaging operation (studies / year)', d.hasData ? `${d.annualStudies.toLocaleString()} studies/yr` : '—', d.hasData, 'Department'],
                  ['2', 'Total energy (kWh / year)', d.annualKwh > 0 ? `${d.annualKwh.toLocaleString()} kWh` : '—', d.annualKwh > 0, 'Department'],
                  ['3', 'Grid carbon intensity, location, source', `${d.effectiveCi} kgCO₂e/kWh · ${d.region} · ${d.renewablePct}% renewable`, !!d.region, 'Grid'],
                  ['4', 'Annual carbon footprint (facility + AI)', d.totalAnnualCo2 > 0 ? `${d.totalAnnualCo2.toLocaleString()} kgCO₂e` : '—', d.totalAnnualCo2 > 0, 'Department'],
                  ['5', 'Clinical AI deployed', d.clinicalToolCount > 0 ? `${d.clinicalToolCount} (net effect in dept energy)` : 'none deployed', d.clinicalToolCount > 0, 'Clinical AI'],
                  ['6', 'Current sustainability practices', d.interventionCount > 0 ? `${d.interventionCount} documented as implemented` : 'none reported', d.interventionCount > 0, 'Current state'],
                  ['7', 'Efficiency — CO₂ per study delivered', d.hasData ? `${d.co2PerStudy} kgCO₂e/study${d.utilPct != null ? ` · ${d.utilPct}% fleet utilisation` : ''}` : '—', d.hasData, 'Efficiency'],
                  ['8', 'CEDARS Score + Rating', d.hasData ? `Score ${d.score} · ${d.leaves}/5 leaves (${d.ratingLabel})` : '—', d.hasData, 'Score / Rating'],
                ];
                return (
                  <div style={{border:'1px solid #c8e6c9', borderRadius:14, overflow:'hidden'}}>
                    {items.map(([n, item, val, ok, mod], i)=>(
                      <div key={n} style={{display:'grid', gridTemplateColumns:'28px 1.6fr 2fr 110px', gap:10, alignItems:'center', padding:'9px 14px', background:i%2===0?'#f1f8f1':'white', fontSize:13}}>
                        <span style={{color: ok ? '#2E7D32' : '#bdbdbd', fontWeight:900}}>{ok ? '✓' : '○'}</span>
                        <span style={{color:'#263238', fontWeight:600}}>{item}</span>
                        <span style={{color:'#607d66'}}>{val}</span>
                        <span style={{fontSize:11, color:'#90a4ae', textAlign:'right'}}>{mod}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              </div>
            </details>

            {deptLabelData.annualStudies>0 && (
              <details className="reportDisclosureDetails reportMaterialsDetail">
                <summary>Reporting paragraph</summary>
                <div className="reportDisclosureDetailsBody">
                  <p className="note reportDetailIntro">A concise starting point for a main sustainability report, Methods section, accreditation document, or institutional report. Review and adapt it for your local context.</p>
                  <button className="download" onClick={()=>{navigator.clipboard.writeText(generateDeptText(deptLabelData));setDeptCopied(true);setTimeout(()=>setDeptCopied(false),2000);}} style={deptCopied?{background:'#26A69A'}:undefined}><FileText/> {deptCopied?'Copied!':'Copy reporting paragraph'}</button>
                  <pre className="reportTextPreview">{generateDeptText(deptLabelData)}</pre>
                </div>
              </details>
            )}
            </section>

            </>}
          </div>

          <section id="ai-ecolabel" className="aiSection" style={{display:ecoLabelMode==='ai'?'block':'none',background:'none',boxShadow:'none',padding:0,marginTop:8}}>
            {page==='ecolabel' && <>
            <div id="ai-score-panel" className="scoreResultPanel workflowAnchor" style={{background:ecoLabelData.ratingBg,border:`2px solid ${ecoLabelData.ratingColor}`}}>
              <div className="scoreResultHero">
              <div style={{textAlign:'center',flexShrink:0}}>
                <div style={{fontSize:50,fontWeight:900,color:ecoLabelData.ratingColor,lineHeight:1}}>{ecoLabelData.graded?ecoLabelData.score:'—'}{ecoLabelData.gradeBasis==='inference'&&<sup className="aiScoreAsterisk">*</sup>}</div>
                <div style={{fontSize:10,fontWeight:700,color:ecoLabelData.ratingColor,letterSpacing:'0.04em'}}>{ecoLabelData.gradeBasis==='amortised'?'CEDARS SCORE · MODELED OPERATIONAL INTENSITY':ecoLabelData.gradeBasis==='inference'?'CEDARS INFERENCE SCORE':'CEDARS SCORE'}</div>{ecoLabelData.gradeBasis==='inference'&&<div className="aiScoreQualifier">PROVISIONAL · {ecoLabelData.trainDisclosed?'training is not yet included per study':'training not disclosed'}</div>}
              </div>
              <div style={{flex:'1 1 260px'}}>
                <div className={ecoLabelData.gradeBasis==='inference'?'aiProvisionalLeaves':''}><LeafRating leaves={ecoLabelData.leaves} size={22} color={ecoLabelData.ratingColor}/>{ecoLabelData.gradeBasis==='inference'&&<small>Inference-only rating</small>}</div>
                <div style={{fontWeight:800,fontSize:16,color:ecoLabelData.ratingColor,marginTop:4}}>{ecoLabelData.graded?ecoLabelData.ratingLabel.replace('footprint',ecoLabelData.gradeBasis==='amortised'?'modeled carbon intensity':'modeled inference intensity'):ecoLabelData.ratingLabel}</div>
                <div style={{fontSize:12,color:'#455a64',marginTop:3}}>{ecoLabelData.gradeBasis==='amortised'?`${ecoLabelData.effectivePerStudyG} gCO₂e/study · amortised training + inference`:ecoLabelData.gradeBasis==='inference'?`${ecoLabelData.perInferCo2g} gCO₂e/study · inference only`:'AI model disclosure; add inference data to calculate a score.'}</div>
              </div>
              </div>
              <div className="scoreDataGrid" aria-label="AI score inputs and outputs">
                <div><span>Training energy</span><strong>{ecoLabelData.totalEnergyKwh>0 ? `${ecoLabelData.totalEnergyKwh} kWh` : '—'}</strong></div>
                <div><span>Training carbon</span><strong>{ecoLabelData.trainCo2>0 ? `${ecoLabelData.trainCo2} kgCO₂e` : '—'}</strong></div>
                <div><span>Inference energy</span><strong>{ecoLabelData.inferKwhPerStudy>0 ? `${ecoLabelData.inferKwhPerStudy} kWh/study` : '—'}</strong></div>
                <div><span>Inference carbon</span><strong>{ecoLabelData.perInferCo2g>0 ? `${ecoLabelData.perInferCo2g} gCO₂e/study` : '—'}</strong></div>
                <div><span>Training compute</span><strong>{ecoLabelData.trainingProvider || '—'} · {ecoLabelData.trainingRegion || 'provider average'}</strong></div>
                <div><span>Inference compute</span><strong>{ecoLabelData.inferenceProvider || '—'} · {ecoLabelData.inferenceRegion || 'provider average'}</strong></div>
                <div className="scoreWaterCell"><span>Estimated water use {ecoLabelData.waterProv==='screening'&&<em>SCREENING</em>}</span><strong>{ecoLabelData.waterLitres>0 ? `Training: ${ecoLabelData.waterLitres.toLocaleString()} L` : '—'}</strong>{ecoLabelData.waterPerStudyMl>0&&<small>Inference: {ecoLabelData.waterPerStudyMl} mL/study</small>}{ecoLabelData.waterProv==='screening'&&<small>Default water-intensity factor; not a measured water footprint.</small>}</div>
              </div>
              {ecoLabelData.gradeBasis==='inference'&&<div className="aiInferenceScoreNotice">
                <div>
                  <span>INFERENCE-ONLY SCORE</span>
                  {ecoLabelData.trainDisclosed
                    ? <><strong>Training is {PROVENANCE[ecoLabelData.trainProv]?.label.toLowerCase() || 'reported'}: {ecoLabelData.totalEnergyKwh} kWh · {ecoLabelData.trainCo2} kgCO₂e</strong><p>CEDARS cannot combine this one-time training footprint with inference until an expected deployment workload is entered.</p></>
                    : <><strong>Training is not disclosed</strong><p>This provisional score reflects inference only because training cannot currently be included.</p></>}
                  <small>* Provisional inference-only score. Not directly comparable with a training + inference score.</small>
                </div>
                {ecoLabelData.trainDisclosed&&<button type="button" onClick={()=>{setAiWorkloadPreview(String(ecoLabelData.inferStudies||scen.inferStudiesMonth||''));setShowAiWorkloadExplore(true);window.setTimeout(()=>document.querySelector('.aiWorkloadExplorer')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}}>Add deployment workload →</button>}
              </div>}
              <div className="aiScoreBasisBar"><div><span>CURRENT SCORE BASIS</span><strong>{ecoLabelData.inferStudies>0?`${ecoLabelData.inferStudies.toLocaleString()} studies/month`:'Deployment workload not entered'} · {ecoLabelData.deployMonths}-month deployment</strong><small>{ecoLabelData.gradeBasis==='amortised'?'Training is spread across expected use, then inference is added per study.':!ecoLabelData.trainDisclosed?'Training is not disclosed, so the per-study score uses inference only.':'Deployment workload is not entered, so the per-study score uses inference only; add workload to include an amortised share of training.'}</small></div><button type="button" className={showAiWorkloadExplore?'inlineTextButton':'download'} onClick={()=>{setAiWorkloadPreview(String(ecoLabelData.inferStudies||scen.inferStudiesMonth||''));setShowAiWorkloadExplore(v=>!v);}}>{showAiWorkloadExplore?'Hide explorer ↑':ecoLabelData.hasInference?'Explore workload & total impact →':'Add / explore deployment workload →'}</button></div>
              {showAiWorkloadExplore&&<div className="aiWorkloadExplorer">
                <div className="aiWorkloadExplorerHead">
                  <div>
                    <span>EXPLORE WORKLOAD &amp; TOTAL IMPACT</span>
                    <h3>Intensity and total emissions answer different questions</h3>
                    <p>Try a deployment workload here without changing the saved assessment.</p>
                  </div>
                </div>
                <div className="aiWorkloadPreviewControl">
                  <label>
                    <span>Preview workload</span>
                    <div><input type="number" min="0" value={aiWorkloadPreview} placeholder="e.g. 5,100" onChange={e=>setAiWorkloadPreview(e.target.value)}/><strong>studies / month</strong></div>
                    <small>{ecoLabelData.inferStudies>0?`Current saved workload: ${ecoLabelData.inferStudies.toLocaleString()} studies/month`:'Current saved workload: not entered'}</small>
                  </label>
                </div>
                <div className="aiWorkloadMetrics"><div><span>Modeled carbon intensity</span><strong>{aiWorkloadScenario.intensityG!=null?`${aiWorkloadScenario.intensityG} gCO₂e/study`:'—'}</strong></div><div><span>Inference / month</span><strong>{aiWorkloadScenario.studies>0?`${aiWorkloadScenario.inferenceMonthKg} kgCO₂e`:'—'}</strong></div><div><span>Training share</span><strong>{aiWorkloadScenario.trainingShareG!=null?`${aiWorkloadScenario.trainingShareG} gCO₂e/study`:'—'}</strong></div><div><span>Training + inference over deployment</span><strong>{aiWorkloadScenario.studies>0?`${aiWorkloadScenario.deploymentKg} kgCO₂e`:'—'}</strong><small>Operational model only; embodied hardware remains a separate disclosure.</small></div></div>
                <p>Higher use can spread one-time training emissions across more studies, lowering <strong>carbon intensity per study</strong>, while increasing <strong>total inference emissions</strong>. Use this explorer to test scale before changing the saved assessment.</p>
                <div className="aiWorkloadActions"><button type="button" disabled={!aiWorkloadScenario.studies} onClick={()=>setS('inferStudiesMonth',String(aiWorkloadScenario.studies))}>Use this workload in AI assessment</button><button type="button" className="download" onClick={()=>{setPage('ai');setAiOpen(o=>({...o,inference:true}));window.setTimeout(()=>document.getElementById('ai-inference')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}}>Edit AI deployment details →</button>{(deptLabel.aiTools||[]).some(t=>t.modelId===scen.modelId)&&<button type="button" className="download" onClick={()=>{setPage('dashboard');setDashOpen(o=>({...o,clinicalai:true}));window.setTimeout(()=>document.getElementById('department-clinical-ai-input')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}}>Edit Department Clinical AI use →</button>}</div>
              </div>}
                            <SystemEffectsCallout kind="ai" onReview={()=>{setEcoLabelMode('ai');setPage('scenario');window.setTimeout(()=>document.getElementById('ai-system-effects')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}}/>
            </div>
            <div className="ecoIntroBlock">
              <p><strong>Create a standardized environmental disclosure for an AI model.</strong> The label summarizes training, validation, deployment, inference, and reported performance context for manuscripts, model cards, and technical reporting.</p>
              <details className="methodologyDetails">
                <summary>How AI grading works</summary>
                <div>
                  CEDARS currently scores <strong>modeled operational carbon intensity</strong> from AI training and inference; it is not a complete lifecycle assessment or an overall clinical-value / sustainability score. Training is a one-time cost and inference recurs with each use. When deployment workload is available, CEDARS can show training spread across expected use plus inference per study. Clinical value remains paramount, while water, embodied hardware, wider operational/workforce effects, and rebound/system effects remain separate disclosures or considerations.<Ref id="doo-policy-trustworthy-ai-2026" order={AI_IMPROVE_REFS}/> To see how a deployed model affects an imaging operation, attach it under <strong>Clinical AI</strong> on the Radiology Department tab. Fields align with the AI environmental reporting framework recommended in Doo FX et al. <em>Radiology</em> 2024 (DOI 10.1148/radiol.232030). For the most accurate figures, measure training energy with <ExternalLink href={refUrl(REFS['codecarbon'])}>CodeCarbon</ExternalLink>, <code>nvidia-smi</code>, or your cloud provider's carbon dashboard.
                </div>
              </details>
            </div>

            <div className="workflowNextStep">
              <div className="workflowNextCopy">
                <span>NEXT STEP</span>
                <strong>Prepare and preserve your CEDARS results</strong>
                <small>Continue to Report (&amp; Share), or test potential changes first.</small>
              </div>
              <div className="workflowNextActions">
                <button className="workflowNextPrimary" onClick={()=>setPage('report')}>Continue to Report (&amp; Share) <ArrowRight size={17}/></button>
                <button className="download" onClick={()=>setPage('scenario')}>Improve first</button>
              </div>
            </div>
            </>}
            {page==='report' && <>
            <section className="reportStageCard">
              <div className="reportStageHeading">
                <div className="reportStageNumber">1</div>
                <div>
                  <span>REVIEW &amp; FINALIZE</span>
                  <h2>AI model CEDARS summary</h2>
                  <p>Review the model record you built in AI Model &amp; Informatics. Report (&amp; Share) summarizes that record rather than creating a second copy.</p>
                </div>
              </div>

          <div className="reportAiSummary">
            <div className="reportAiSummaryHeader">
              <div><span>AI MODEL CEDARS SUMMARY</span><h3>{ecoLabelData.projectName || 'New AI model'}</h3><p>{ecoLabelData.taskType || 'Task not specified'}</p></div>
              {aiChecklistDone===aiChecklist.length
                ? <div className="reportReadyChip">✓ Ready to prepare</div>
                : <div className="reportNeedsReview compact"><strong>{aiChecklist.length-aiChecklistDone} item{aiChecklist.length-aiChecklistDone===1?'':'s'} need review</strong><span>See and edit them below</span></div>}
            </div>
            <div className="reportAiSummaryGrid">
              <div><span>Model</span><strong>{ecoLabelData.projectName || 'New AI model'}</strong><small>{ecoLabelData.taskType || 'Task not specified'}</small></div>
              <div><span>Training</span><strong>{ecoLabelData.trainDisclosed ? `${ecoLabelData.totalEnergyKwh} kWh` : 'Not disclosed'}</strong><small>{ecoLabelData.trainProv ? (PROVENANCE[ecoLabelData.trainProv]?.label || ecoLabelData.trainProv) : 'Provenance not set'}</small></div>
              <div><span>Inference</span><strong>{ecoLabelData.perInferCo2g>0 ? `${ecoLabelData.perInferCo2g} gCO₂e/study` : 'Not quantified'}</strong><small>{ecoLabelData.inferenceProvider || 'Provider not set'} · {ecoLabelData.inferenceRegion || 'region not set'}</small></div>
              <div><span>Deployment volume</span><strong>{ecoLabelData.hasInference ? `${ecoLabelData.inferStudies.toLocaleString()} studies/month` : 'Not entered'}</strong><small>{ecoLabelData.hasInference ? `${ecoLabelData.deployMonths} month deployment` : 'Optional for an inference-only score; needed to include training in the per-study estimate'}</small></div>
            </div>
            {aiChecklistDone < aiChecklist.length && <div className="reportReviewItems"><div className="reportReviewItemsHead"><strong>Complete these items</strong><small>Each item opens the source field rather than creating a second copy here.</small></div>{aiChecklist.filter(([,ok])=>!ok).map(([name,,section])=><button type="button" key={name} onClick={()=>openAiChecklistItem(section)}><span>{name}</span><strong>Edit →</strong></button>)}</div>}
            <div className="reportSummaryActions">
              {!ecoLabelData.hasInference && <button type="button" className="download" onClick={()=>openAiChecklistItem('inference')}>Set deployment workload →</button>}{(deptLabel.aiTools||[]).some(t=>t.modelId===scen.modelId)&&<button type="button" className="download" onClick={()=>{setPage('dashboard');setDashOpen(o=>({...o,clinicalai:true}));window.setTimeout(()=>document.getElementById('department-clinical-ai-input')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}}>Review Department Clinical AI use →</button>}
              <button type="button" onClick={()=>setPage('ai')}>Edit full model details →</button>
            </div>
          </div>
            </section>

          <section className="reportStageCard reportMaterialsStage" data-demo-target="ai-report-materials">
            <div className="reportStageHeading compact">
              <div className="reportStageNumber">2</div>
              <div>
                <span>PREPARE YOUR CEDARS MATERIALS</span>
                <h2>Your AI Research EcoLabel</h2>
                <p>Download the label or copy concise Methods / Environmental Impact text. Expand the structured options only when your venue or technical audience needs them.</p>
              </div>
            </div>
          <div style={{display:'flex', gap:28, flexWrap:'wrap', alignItems:'flex-start', marginBottom:32}}>
            {/* Visual card */}
            <div style={{background:'white', border:'2px solid #2E7D32', borderRadius:14, overflow:'hidden', minWidth:280, maxWidth:510, fontFamily:'Inter,sans-serif', boxShadow:'0 8px 30px #1b5e2020', flexShrink:0}}>
              <div style={{background:'#1b5e20', padding:'14px 18px'}}>
                <div style={{color:'white', fontWeight:700, fontSize:16, display:'flex', alignItems:'center', gap:8}}>
                  <Leaf style={{width:16,height:16}}/> CEDARS AI Research EcoLabel
                </div>
                <div style={{color:'#A5D6A7', fontSize:13, marginTop:4}}>{ecoLabelData.projectName}</div>
                <div style={{color:'#81C784', fontSize:11, marginTop:2}}>AI model footprint disclosure · {ecoLabelData.date}</div>
              </div>
              <div style={{background:ecoLabelData.ratingBg, padding:'16px 18px', display:'flex', alignItems:'center', gap:18}}>
                <div style={{textAlign:'center', flexShrink:0}}>
                  <div style={{fontSize:44, fontWeight:900, color:ecoLabelData.ratingColor, lineHeight:1}}>{ecoLabelData.graded ? ecoLabelData.score : '—'}{ecoLabelData.gradeBasis==='inference'&&<sup className="aiScoreAsterisk">*</sup>}</div>
                  <div style={{fontSize:10, fontWeight:700, color:ecoLabelData.ratingColor, letterSpacing:'0.04em'}}>{ecoLabelData.gradeBasis==='amortised'?'CEDARS SCORE · MODELED OPERATIONAL INTENSITY':ecoLabelData.gradeBasis==='inference'?'CEDARS INFERENCE SCORE':'CEDARS SCORE'}</div>
                  {ecoLabelData.gradeBasis==='inference'&&<div className="aiExportQualifier">PROVISIONAL · inference only</div>}
                </div>
                <div>
                  <div className={ecoLabelData.gradeBasis==='inference'?'aiProvisionalLeaves':''}><LeafRating leaves={ecoLabelData.leaves} size={20} color={ecoLabelData.ratingColor}/>{ecoLabelData.gradeBasis==='inference'&&<small>Inference-only rating</small>}</div>
                  <div style={{fontWeight:700, fontSize:14, color:ecoLabelData.ratingColor, marginTop:4}}>{ecoLabelData.graded?ecoLabelData.ratingLabel.replace('footprint',ecoLabelData.gradeBasis==='amortised'?'modeled carbon intensity':'modeled inference intensity'):ecoLabelData.ratingLabel}</div>
                  <div style={{fontSize:11, color:'#263238', marginTop:2}}>
                    {ecoLabelData.gradeBasis==='amortised' ? `${ecoLabelData.effectivePerStudyG} gCO₂e / study · training + inference`
                      : ecoLabelData.gradeBasis==='inference' ? `${ecoLabelData.perInferCo2g} gCO₂e / study · inference only*`
                      : ecoLabelData.hasData ? 'Add inference data to calculate a score' : 'Enter training or inference data above'}
                  </div>
                </div>
              </div>
              {/* Two-phase headline: one-time training vs marginal per-study inference */}
              <div style={{display:'flex', borderBottom:'1px solid #eef7ee'}}>
                <div style={{flex:1, padding:'12px 18px', borderRight:'1px solid #eef7ee'}}>
                  <div style={{fontSize:10, fontWeight:700, color:'#607d66', textTransform:'uppercase', letterSpacing:'0.04em'}}>Training · one-time</div>
                  <div style={{fontSize:20, fontWeight:800, color:'#263238', marginTop:2}}>{ecoLabelData.hasData ? `${ecoLabelData.trainCo2} kgCO₂e` : '—'}</div>
                  <div style={{fontSize:11, color:'#607d66'}}>{ecoLabelData.totalGpuHours} GPU-h{ecoLabelData.hasData && ecoLabelData.trainFlights>0 ? ` · ≈ ${ecoLabelData.trainFlights} short-haul flights` : ''}</div>
                </div>
                <div style={{flex:1, padding:'12px 18px'}}>
                  <div style={{fontSize:10, fontWeight:700, color:'#607d66', textTransform:'uppercase', letterSpacing:'0.04em'}}>Inference · per study</div>
                  <div style={{fontSize:20, fontWeight:800, color:'#263238', marginTop:2}}>{ecoLabelData.perInferCo2g>0 ? `${ecoLabelData.perInferCo2g} gCO₂e` : '—'}</div>
                  <div style={{fontSize:11, color:'#607d66'}}>{ecoLabelData.tokenMode && ecoLabelData.tokensPerStudy>0 ? `${ecoLabelData.tokensPerStudy.toLocaleString()} tokens/study` : 'marginal · recurring'}</div>
                </div>
              </div>
              {ecoLabelData.hasInference && (
                <div style={{padding:'10px 18px', background:'#f1f8f1', fontSize:12, color:'#37474f'}}>
                  Over {ecoLabelData.lifetimeInferences.toLocaleString()} studies ({ecoLabelData.deployMonths} mo): training adds {ecoLabelData.trainPerStudyG} g/study → <strong>{ecoLabelData.effectivePerStudyG} gCO₂e/study effective</strong>
                  {ecoLabelData.breakEvenStudies!=null && <> · training = lifetime inference at ~{ecoLabelData.breakEvenStudies.toLocaleString()} studies</>}
                </div>
              )}
              {[
                ['Task type',                ecoLabelData.taskType],
                ['Architecture',             ecoLabelData.architecture],
                ['Parameters',               ecoLabelData.paramsMillion],
                ['Training dataset',         ecoLabelData.datasetSize],
                ['GPU hardware',             ecoLabelData.gpuHardware],
                ['Training runs',            `${ecoLabelData.numRuns} experiment${ecoLabelData.numRuns > 1 ? 's' : ''}`],
                ['Total GPU-hours',          `${ecoLabelData.totalGpuHours} h`],
                ['Energy per run',           ecoLabelData.trainDisclosed ? `${ecoLabelData.energyPerRunKwh} kWh (${PROVENANCE[ecoLabelData.trainProv]?.label.toLowerCase()}${ecoLabelData.trainTool ? ', ' + ecoLabelData.trainTool : ''})` : 'not disclosed by vendor'],
                ['Total training energy',    ecoLabelData.trainDisclosed ? `${ecoLabelData.totalEnergyKwh} kWh over ${ecoLabelData.numRuns} run${ecoLabelData.numRuns===1?'':'s'}` : 'not disclosed by vendor'],
                ...(ecoLabelData.vsReferenceRatio != null ? [['Training efficiency', `${ecoLabelData.vsReferenceRatio}× reference (${ecoLabelData.kwhReference.toLocaleString()} kWh typical for this architecture/size)`]] : []),
                ['Training CO₂e',       `${ecoLabelData.trainCo2} kgCO₂e`],
                ['Training compute',         `${ecoLabelData.trainingProvider} · ${ecoLabelData.trainingRegion || 'provider average'} · ${ecoLabelData.trainingEffectiveCi} kgCO₂e/kWh`],
                ['Inference compute',        `${ecoLabelData.inferenceProvider} · ${ecoLabelData.inferenceRegion || 'provider average'} · ${ecoLabelData.inferenceEffectiveCi} kgCO₂e/kWh · PUE ${ecoLabelData.pue}`],
                ['Water footprint',          `${ecoLabelData.waterLitres.toLocaleString()} L`],
                ...(ecoLabelData.hasInference ? [['Monthly inference', `${ecoLabelData.inferStudies.toLocaleString()} studies · ${ecoLabelData.inferMonthlyKwh} kWh · ${ecoLabelData.inferCo2Month} kgCO₂e`]] : []),
              ].map(([k, v], i) => (
                <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'7px 18px', background: i%2===0 ? '#f1f8f1' : 'white', fontSize:13, gap:12}}>
                  <span style={{color:'#607d66', flexShrink:0}}>{k}</span>
                  <span style={{fontWeight:700, color:'#263238', textAlign:'right'}}>{v}</span>
                </div>
              ))}
              <div style={{background:'#e8f5e9', padding:'8px 18px', fontSize:11, color:'#2E7D32'}}>
                Estimated with CEDARS · {ecoLabelData.date} · CC BY 4.0
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex', flexDirection:'column', gap:12, paddingTop:8}}>
              <button className="download" onClick={()=>downloadEcoPNG(ecoLabelData)}>
                <Download/> Download PNG badge
              </button>
              <button
                className="download"
                onClick={()=>{
                  navigator.clipboard.writeText(generateAiMethodsText(ecoLabelData));
                  setAiParagraphCopied(true);
                  setTimeout(()=>setAiParagraphCopied(false), 2000);
                }}
                style={aiParagraphCopied ? {background:'#26A69A'} : undefined}
              >
                <FileText/> {aiParagraphCopied ? 'Copied!' : 'Copy methods / impact paragraph'}
              </button>
              <p className="note" style={{maxWidth:240, fontSize:12, margin:0}}>
                PNG badge: use in presentations, posters, reports, or model documentation.<br/><br/>
                Methods / impact paragraph: a concise starting point for the main Methods or Environmental Impact text when appropriate; adapt it to the venue.
              </p>
              <div style={{marginTop:8}}>
                <p className="note" style={{fontSize:11,marginBottom:6,fontWeight:700}}>CEDARS Rating — Score band:</p>
                {CEDARS_RATINGS.map(r=>(
                  <div key={r.leaves} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,marginBottom:3,fontWeight:ecoLabelData.leaves===r.leaves?700:400,color:ecoLabelData.leaves===r.leaves?'#263238':'#607d66'}}>
                    <LeafRating leaves={r.leaves} size={12} color={r.color}/>
                    <span>{r.label}</span>
                    <span style={{marginLeft:'auto',fontFamily:'monospace',fontSize:10}}>{({5:'80–100',4:'60–79',3:'40–59',2:'20–39',1:'< 20'})[r.leaves]}</span>
                  </div>
                ))}
                <p className="note" style={{fontSize:10,marginTop:6}}>Continuous Score (0–100) from the estimated footprint, paired with a 1–5 leaf Rating — after Energy Star / EU Energy Label (Reg. EU 2021/341).</p>
              </div>
            </div>
          </div>

          <section className="inputSummary reportMethodsOptions" style={{marginTop:4,marginBottom:22}}>
            <div className="reportMethodsHeading">
              <span>METHODS &amp; REPRODUCIBILITY OPTIONS</span>
              <h2>Methods &amp; reproducibility options</h2>
              <p>Choose the level of detail that fits your venue. For many manuscripts, the concise text above can sit directly in the main Methods or Environmental Impact section. Expand the structured fields when a journal, conference, model card, repository, or technical audience needs more detail.</p>
            </div>

            <details className="reportDisclosureDetails">
              <summary>AI Research EcoLabel checklist · {aiChecklistDone} of {aiChecklist.length} ready</summary>
              <div className="reportDisclosureDetailsBody">
                {(()=>{
                  const d = ecoLabelData;
                  const items = [
                    ['1', 'Compute hardware (type, count)', d.gpuHardware, d.gpuHardware !== '—', 'AI workload'],
                    ['2', 'Total energy (kWh) / GPU-hours', d.hasData ? `${d.totalEnergyKwh.toLocaleString()} kWh · ${d.totalGpuHours} GPU-h` : '—', d.hasData, 'AI workload'],
                    ['3', 'Training compute context', `${d.trainingProvider} · ${d.trainingRegion || 'provider average'} · ${d.trainingEffectiveCi} kgCO₂e/kWh`, !!d.trainingProvider, 'Training'],
                    ['4', 'Inference compute context', `${d.inferenceProvider} · ${d.inferenceRegion || 'provider average'} · ${d.inferenceEffectiveCi} kgCO₂e/kWh · PUE ${d.pue}`, !!d.inferenceProvider, 'Inference'],
                    ['5', 'Training vs inference split', `Training ${d.trainCo2} kgCO₂e · Inference ${d.hasInference ? `${d.inferCo2Month} kgCO₂e/mo` : 'not reported'}`, d.hasData, 'AI workload'],
                    ['6', 'Water footprint', d.waterLitres > 0 ? `${d.waterLitres.toLocaleString()} L` : 'not reported', d.waterLitres > 0, 'Water use'],
                    ['7', 'CEDARS Score + Rating', d.graded ? `Score ${d.score} · ${d.leaves}/5 leaves (${d.ratingLabel})` : 'add inference volume to grade', d.graded, 'Score / Rating'],
                  ];
                  return <div className="reportChecklist">
                    {items.map(([num,item,val,ok,mod],i)=><div key={num} className={i%2===0?'alt':''}>
                      <span className={ok?'ok':''}>{ok?'✓':'○'}</span><strong>{item}</strong><span>{val}</span><small>{mod}</small>
                    </div>)}
                  </div>;
                })()}
              </div>
            </details>

            <details className="reportDisclosureDetails">
              <summary>Structured methods table · Markdown export available</summary>
              <div className="reportDisclosureDetailsBody">
                <p className="note" style={{marginTop:0}}>This is an optional structured version of the same reporting fields. Use it for model cards, repositories, technical appendices, computational-science venues, or other settings where a field-by-field record is useful. It does not need to be a separate manuscript table.</p>
                <button className="download" onClick={()=>{navigator.clipboard.writeText(generateEcoMarkdown(ecoLabelData));setEcoCopied(true);setTimeout(()=>setEcoCopied(false),2000);}} style={ecoCopied?{background:'#26A69A'}:undefined}><FileText/> {ecoCopied?'Copied!':'Copy table as Markdown'}</button>
                <pre className="reportTextPreview">{generateEcoMarkdown(ecoLabelData)}</pre>
              </div>
            </details>

            <details className="reportDisclosureDetails">
              <summary>Methods-ready environmental impact text</summary>
              <div className="reportDisclosureDetailsBody">
                <p className="note" style={{marginTop:0}}>Use or adapt this concise text directly in the main Methods, Environmental Impact, model-card, or technical-report narrative when that fits the venue. CEDARS does not require a separate supplementary section.</p>
                <button className="download" onClick={()=>{navigator.clipboard.writeText(generateAiMethodsText(ecoLabelData));setAiParagraphCopied(true);setTimeout(()=>setAiParagraphCopied(false),2000);}} style={aiParagraphCopied?{background:'#26A69A'}:undefined}><FileText/> {aiParagraphCopied?'Copied!':'Copy methods / impact paragraph'}</button>
                <pre className="reportTextPreview">{generateAiMethodsText(ecoLabelData)}</pre>
              </div>
            </details>
          </section>
          </section>
            </>}
          </section>

          {page==='report' && <>
          <SaveSharePanel
            localSavedAt={localSavedAt}
            status={saveShareStatus}
            onSaveLocal={saveOnThisDevice}
            onRestoreLocal={restoreLocalSave}
            onClearLocal={deleteLocalSave}
            onDownload={downloadCedarsFile}
            onOpenFile={openCedarsFile}
            onCopyLink={copyShareableLink}
            linkCopied={shareLinkCopied}
            onContribute={()=>setContributeOpen(true)}
            contributionConfigured={!!CONTRIBUTION_ENDPOINT && !!TURNSTILE_SITEKEY}
          />
          {(()=>{
            const departmentReady = !!(deptLabelData.hasData && deptLabelData.annualStudies>0 && deptLabelData.annualKwh>0 && deptLabelData.region);
            const aiReady = !!(ecoLabelData.hasData && ecoLabelData.graded);
            const reportReady = ecoLabelMode==='department' ? departmentReady : aiReady;
            return reportReady ? (
              <div className="reportCompletion">
                <div><span>✓</span><div><strong>Your CEDARS result is ready to preserve or share</strong><small>Save on this device or download a complete CEDARS file above if you want to return to this exact assessment later.</small></div></div>
                <div className="reportCompletionActions">
                  <button type="button" onClick={saveOnThisDevice}><Save size={15}/> Save on this device</button>
                  <button type="button" className="download" onClick={()=>setPage('landing')}>Return to Home</button>
                </div>
              </div>
            ) : (
              <div className="reportCompletion needsWork">
                <div><span>!</span><div><strong>This CEDARS report still needs assessment data</strong><small>{ecoLabelMode==='department' ? 'Complete the core Radiology Department inputs before treating this as a final Department EcoLabel.' : 'Complete the AI model and deployment information needed for an in-use AI Research EcoLabel.'} You can still save incomplete work using the controls above.</small></div></div>
                <div className="reportCompletionActions">
                  <button type="button" onClick={()=>ecoLabelMode==='department' ? (setPage('dashboard'),setDeptSetupOpen(true)) : setPage('ai')}>{ecoLabelMode==='department' ? 'Complete Department input →' : 'Edit AI model details →'}</button>
                  <button type="button" className="download" onClick={()=>setPage('landing')}>Return to Home</button>
                </div>
              </div>
            );
          })()}
          </>}
        </main>
      )}

      {page==='about' && <AboutPage/>}

      {guidedDemo && <GuidedDemo
        kind={guidedDemo.kind}
        stepIndex={guidedDemo.step}
        onStepChange={moveGuidedDemo}
        onRestart={restartGuidedDemo}
        onExit={exitGuidedDemo}
        onKeepExample={keepGuidedDemoExample}
      />}

      <ContributionModal
        open={contributeOpen}
        onClose={()=>setContributeOpen(false)}
        endpoint={CONTRIBUTION_ENDPOINT}
        turnstileSiteKey={TURNSTILE_SITEKEY}
        buildSnapshot={currentAssessmentSnapshot}
      />

      <footer style={{flexWrap:'wrap',gap:16}}>
        <Logo dark/>
        <div style={{flex:1,minWidth:240}}>
          <span>ESG-ready sustainability intelligence for academic hospitals, enterprise healthcare systems, radiology AI teams, and scientific reporting.</span>
          <div style={{fontSize:11,color:'#90a4ae',marginTop:10,lineHeight:1.6,maxWidth:640}}>
            © 2026 CEDARS · code <a href="https://github.com/takinci/cedars/blob/main/LICENSE" style={{color:'#A5D6A7'}} target="_blank" rel="noreferrer">Apache-2.0</a>, content <a href="https://creativecommons.org/licenses/by/4.0/" style={{color:'#A5D6A7'}} target="_blank" rel="noreferrer">CC BY 4.0</a>.
            {' '}Research/estimation tool — literature-based estimates, not measured values or medical/regulatory advice; provided as-is, no warranty.
            {' '}Assessment data stays in your browser by default. Data is transmitted only if you explicitly choose to contribute an assessment to CEDARS research; local saves, portable-file import/export, and normal calculations remain browser-side.
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-start'}}>
          <a href="https://github.com/takinci/cedars/blob/main/sources.md" style={{color:'#A5D6A7',fontSize:13,whiteSpace:'nowrap'}} target="_blank" rel="noreferrer">All assumptions &amp; citations: sources.md</a>
          <a href={FEEDBACK_URL} style={{color:'#A5D6A7',fontSize:13,whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:6}} target="_blank" rel="noreferrer"><Plus size={13}/> Feedback / suggest an improvement ↗</a>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<ExternalLinkProvider><App/></ExternalLinkProvider>);
