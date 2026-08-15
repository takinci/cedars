import React, {useState, useMemo, useEffect, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend} from 'chart.js';

const Bar      = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Bar})));
const Doughnut = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Doughnut})));
const Scatter  = React.lazy(() => import('react-chartjs-2').then(m => ({default: m.Scatter})));
import {Leaf, Brain, Download, Activity, Gauge, TrendingDown, Droplets, FileText, Trash2, Cpu, Car, TreePine, Plane, Factory, Zap, Target, AlertTriangle, BarChart3, Home, Flame, Lightbulb, Coffee, Monitor, Server, Database, Wifi, Cloud, Plus, ArrowRight, HardDrive, Globe, Heart, Scan, Bot} from 'lucide-react';
import './styles.css';
import { CARBON_INTENSITY, ELECTRICITY_PRICE, getCI, getPrice, currencySym, CEDARS_RATINGS, cedarsRating, cedarsScore, CEDARS_AI_LO, CEDARS_AI_HI, CEDARS_DEPT_LO, CEDARS_DEPT_HI, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI } from './calc.js';
import { encodeConfig, decodeConfig, SETTINGS_DEFAULTS, SCEN_DEFAULTS } from './urlstate.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend);

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
const DASH_SECTIONS = ['equiv','efficiency','clinicalai','energy','carbon','charts','infrastructure','resources'];
const AI_SECTIONS   = ['model','training','testing','inference','carbon','clinical','infra','benchmark','ecolabel'];

import {
  MODALITY_MB, STORAGE_KWH_PER_TB_ONPREM, STORAGE_KWH_PER_TB_CLOUD, TIME_MULT, TIME_LABEL, EQUIPMENT_UNITS, DEFAULT_EQUIPMENT, buildFleet, INTERVENTIONS, CLOUD, WATER_PER_KWH, EMBODIED_KG_MO, PATIENT_KM_RT, CAR_CO2_KG_KM, PAPER_G_PER_ENC, HAZ_WASTE_G_SCAN, CONTRAST, ICM_MODALITIES, rnd, computeDashboard, SCANNER_STATE_INTERVENTIONS, CLOUD_INTERVENTIONS, STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER, STORAGE_INTERVENTIONS, computeInterventions,
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

// Estimated FTE per device — derived from NHS/BIR radiology workforce benchmarks.
// Imaging devices include technologists, radiologist share, nursing/admin; PACS = IT; workstations = reading radiologists.
const STAFF_PER_DEVICE = {mri_035t:4, mri_15t:5, mri_3t:5, mri_7t:6, ct:4, petct:5, angio:6, fluoro:3, xray:3, ultrasound:2, mammography:2, pacs:2, workstations:1};


// MRI cards rendered as a separate grouped section; other cards below.
// Equipment card tooltips — cite primary source for each modality's power/energy assumptions.
const MRI_035T_TOOLTIP  = 'Permanent magnet; no cryocooler, so idle ≈ off. Active 6 kW estimated from low-field data in EurRad 2024 (doi:10.1007/s00330-024-11056-0) and Heye et al. JMRI 2023 (doi:10.1002/jmri.28994). Projected ~18 MWh/yr — far lower than superconducting systems.';
const MRI_15T_TOOLTIP   = 'Superconducting: cryocooler idle draw (32 kW) often exceeds active scanning power (22 kW). Sources: Heye et al. JMRI 2023 (doi:10.1002/jmri.28994), Radiol 2024 (doi:10.1148/radiol.243453), EurRad 2024 (doi:10.1007/s00330-024-11056-0). Projected ~233 MWh/yr — dominated by cryocooler.';
const MRI_3T_TOOLTIP    = 'Active 30 kW from measured mean of 3T scanners: Heye et al. JMRI 2023 (doi:10.1002/jmri.28994). Idle 15 kW: Radiol 2024 (doi:10.1148/radiol.243453). Standby 5 kW: cryocooler minimum (Herrmann 2012). Projected ~127 MWh/yr. Replace with scanner logs if available.';
const MRI_7T_TOOLTIP    = 'No published sustainability benchmark specific to 7T. Active 45 kW and idle 22 kW extrapolated from high-field MRI data in Neurad 2024 (doi:10.1016/j.neurad.2023.12.001) and EurRad 2024 (doi:10.1007/s00330-024-11056-0). Treat as estimate; replace with vendor TDP.';
const CT_TOOLTIP        = 'Active 60 kW (mid-range MDCT). Sources: Academic Radiology 2024 (doi:10.1016/j.acra.2024.05.004), CJRS 2022 (doi:10.1177/08465371221133074), AJR 2023 (doi:10.2214/AJR.23.30189). Photon-counting CT and dual-source DECT not yet stratified in sustainability literature — enter vendor TDP if known.';
const PETCT_TOOLTIP     = 'Active 22 kW calibrated to annual benchmark of ~66,150 kWh from Vosshenrich et al. Curr Opin Urol 2024 (doi:10.1097/MOU.0000000000001337). Cyclotron energy for isotope production is external and not included here. Embodied carbon ~278 kgCO₂/month.';
const ANGIO_TOOLTIP     = 'Direct power-sensor measurements on an IR suite (Artis pheno). Idle 6.9 kW, active 7.5 kW, off 1.1 kW; annual ~25,525 kWh. For biplane INR suites idle is ~7.4 kW; cath labs ~4.5 kW. Chiller not included. (Vosshenrich et al. AJR 2024, doi:10.2214/AJR.24.30988)';
const FLUORO_TOOLTIP    = 'Direct power-sensor measurements on a multipurpose fluoroscopy unit (Artis zee). Idle 2.8 kW, active 3.1 kW; annual ~11,439 kWh. 96% of energy is nonproductive — powering down overnight is the dominant savings lever. (Vosshenrich et al. AJR 2024, doi:10.2214/AJR.24.30988)';
const XRAY_TOOLTIP      = 'Active 12 kW estimated from AJR 2025 CT/radiography energy review (doi:10.2214/AJR.25.33951) and AJR 2023 (doi:10.2214/AJR.23.30189). Idle substantially lower than CT due to absence of high-power x-ray tube standby. High throughput (2,500+ scans/month) gives low per-scan footprint.';
const ULTRASOUND_TOOLTIP= 'Active draw ~1.5 kW — lowest energy imaging modality by a large margin. References: EUF 2023 systematic review (doi:10.1016/j.euf.2023.09.009), Vosshenrich et al. Curr Opin Urol 2024 (doi:10.1097/MOU.0000000000001337). High scan volumes give lowest kWh/scan across all modalities.';
const MAMMO_TOOLTIP     = 'Active 5 kW; usage pattern (100 active h/month, shorter operating hours than general radiology) derived from EurRad 2026 mammography screening footprint study (doi:10.1007/s00330-026-12373-2). Screening programmes have seasonal throughput variation — adjust scans accordingly.';
const PACS_TOOLTIP      = 'Server/PACS infrastructure draws near-constant power in all states (4 kW baseline per rack/server set). Reference: Radiol 2024 multi-modality IT infrastructure study (doi:10.1148/radiol.240398). Virtualisation and server consolidation can reduce this by 20–40% (Doo 2024, doi:10.1148/radiol.232030).';
const WS_TOOLTIP        = 'Active 2 kW, standby 0.2 kW per workstation. Reference: Radiol 2024 (doi:10.1148/radiol.240398). A 4-workstation department uses ~14 MWh/yr; screen-saver and end-of-day shutdown policies capture most of the avoidable idle energy. Count shared reading stations only.';

const MRI_CARDS = [
  {key:'mri_035t', label:'MRI 0.35T', sublabel:'Low-field / permanent magnet', Icon:Brain, tooltip:MRI_035T_TOOLTIP},
  {key:'mri_15t',  label:'MRI 1.5T',  sublabel:'Superconducting (high idle)',   Icon:Brain, tooltip:MRI_15T_TOOLTIP},
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
// Source: Vosshenrich et al. (Implementation Guide); Heye JMRI 2023 (10.1002/jmri.28994); Klein 2024
const MODALITY_BENCHMARKS = [
  {modality: "MRI 1.5T superconducting",   kwhYear: 269400, note: "Idle >50% of total. Vosshenrich; Heye 2023"},
  {modality: "MRI 3T (state-of-the-art)",  kwhYear: 125000, note: "Range 80 000–170 000 kWh/yr. Heye 2023"},
  {modality: "MRI 0.35T permanent magnet", kwhYear: 16100,  note: "Lowest-field option. Klein 2024; 51% PV self-sufficiency achievable"},
  {modality: "CT scanner",                 kwhYear: 37800,  note: "Idle up to 66% of total (Schoen et al.)"},
  {modality: "PET-CT",                     kwhYear: 66150,  note: "Range 56 700–75 600 kWh/yr; idle 1.5–2× CT"},
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
  taskTypes:      ["Classification", "Segmentation", "Detection", "Reconstruction", "Report generation", "Triage", "Other"],
};





// `model` is the effective spec built from the library entry + the user's edits:
// {gpuKw, inferSec, trainMwh, embCo2Kg, paramsM, dim, resolution, slices,
//  accuracy (0–1), accuracyMetric, scanTimeReductPct, lowValueReductPct}.
function computeAI(cloudProvider, region, model, precision, architecture, customCi, equipment, overrides = {}) {
  // Cloud carbon: use the specific deployment region's grid CI when given (shared with the
  // Infrastructure tab), falling back to the provider's coarse average.
  const baseCf   = CLOUD[cloudProvider] ?? CLOUD["Local compute"];
  const provData = CLOUD_REGIONS[cloudProvider];
  const regionCi = (provData && overrides.cloudRegion != null) ? provData.regions[overrides.cloudRegion] : undefined;
  const cf    = {
    pue: provData?.pue ?? baseCf.pue,
    ci:  (regionCi != null) ? regionCi : baseCf.ci,
  };
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
  // Derive scan volume and per-scan energy from the user's equipment fleet
  const profileDash  = computeDashboard(region, 'Monthly', equipment, customCi);
  const STUDIES      = profileDash.scopes.imagingScans;               // imaging scans/month for this profile
  const AVG_SCAN_KWH = profileDash.totals.energyPerScan || 0.5;       // kWh/scan from this profile (fallback 0.5)

  // ── Phase 1: Training ────────────────────────────────────────────────────
  // trainKwhCustom: GPU-derived energy (tdpKw × n × hours × PUE) — arch factor already baked in.
  // Default: literature estimate scaled by architecture and model size (arch.trainFactor).
  const trainKwhTotal = trainKwhCustom !== null
    ? rnd(trainKwhCustom, 0)
    : rnd(trainMwhBase * 1000 * arch.trainFactor, 0);
  const trainKgCo2e    = rnd(trainKwhTotal * cf.ci, 1);
  const trainGpuHours  = rnd(trainKwhTotal / model.gpuKw, 0); // estimated GPU compute time
  const trainKwhMonth  = rnd(trainKwhTotal / DEPLOY_MO, 2);   // amortised over deployment

  // ── Phase 2: Testing / Validation ────────────────────────────────────────
  // One-time inference run over hold-out test set.
  // Proxy: DLP/CTDIvol dose metrics correlate with net scan energy R²=0.87–0.92 (Schoen et al.)
  const testKwhTotal   = isToken
    ? rnd(tokenKwhPerStudy * TEST_STUDIES * cf.pue * ampF, 4)
    : rnd(model.gpuKw * arch.inferFactor * (model.inferSec / 3600) * TEST_STUDIES * cf.pue * ampF, 4);
  const testKgCo2e     = rnd(testKwhTotal * cf.ci, 4);

  // ── Phase 3: Inference & Deployment ─────────────────────────────────────
  // Inference energy per study; scales with every request — dominant lifetime cost.
  // MRI cooling adds +45% energy overhead during active acquisition (Heye/Vosshenrich)
  const inferKwhPerStudy = isToken
    ? rnd(tokenKwhPerStudy * cf.pue * ampF, 6)
    : rnd(model.gpuKw * arch.inferFactor * (model.inferSec / 3600) * cf.pue * ampF, 6);
  const inferKwhMonthly  = rnd(inferKwhPerStudy * STUDIES, 4);
  const inferKwhLifetime = rnd(inferKwhMonthly * DEPLOY_MO, 1);
  const ampSavingPct     = rnd((1 - ampF) * 100, 0);

  // ── Monthly totals (inference + amortised training) ─────────────────────
  const totalMonthlyKwh  = rnd(inferKwhMonthly + trainKwhMonth, 3);
  const embGpuKgCo2e     = rnd(model.embCo2Kg / DEPLOY_MO, 2);
  const grossKgCo2e      = rnd(totalMonthlyKwh * cf.ci + embGpuKgCo2e, 3);

  // ── Clinical co-benefits ─────────────────────────────────────────────────
  // Scan time reduction → direct scanner energy savings at local grid CI
  // Radiol 2023 (10.1148/radiol.230441): AI reconstruction cuts scan time 45–89%
  const scanEnergySaved  = rnd(STUDIES * AVG_SCAN_KWH * (model.scanTimeReductPct / 100), 1);
  // Low-value imaging reduction → avoided scans (McKee 2024: up to 20%)
  // Recycling Pyramid "Prevent" tier (Implementation Guide §1)
  const scansAvoided     = Math.round(STUDIES * (model.lowValueReductPct / 100));
  const savingsKgCo2e    = rnd((scanEnergySaved + scansAvoided * AVG_SCAN_KWH) * ci, 2);
  const netKgCo2e        = rnd(grossKgCo2e - savingsKgCo2e, 3);

  // ── Infrastructure & efficiency ──────────────────────────────────────────
  const waterLitres     = rnd(totalMonthlyKwh * WATER_PER_KWH, 1);
  // Accuracy % per monthly inference kWh — Green AI efficiency metric
  // Captures diminishing returns of larger models (Implementation Guide §3)
  const efficiencyRatio = inferKwhMonthly > 0 ? rnd((model.accuracy * 100) / inferKwhMonthly, 1) : 0;
  // Rebound risk: faster reads may induce more scan orders, negating savings (§4 counter-metric)
  const reboundRisk     = model.scanTimeReductPct > 60 ? "High" : model.scanTimeReductPct > 30 ? "Moderate" : "Low";

  return {
    architecture, modelSize: sizeLabel(model.paramsM), precision, archDesc: arch.desc,
    paramsM: model.paramsM, dim: model.dim, resolution: model.resolution, slices: model.slices,
    inferSec: model.inferSec, trainMwhBase: model.trainMwh, embCo2KgTotal: model.embCo2Kg,
    training:  {kwhTotal: trainKwhTotal, kgCo2e: trainKgCo2e, gpuHours: trainGpuHours, kwhAmortised: trainKwhMonth},
    testing:   {kwhTotal: testKwhTotal,  kgCo2e: testKgCo2e,  studies: TEST_STUDIES},
    inference: {kwhPerStudy: inferKwhPerStudy, kwhMonthly: inferKwhMonthly, kwhLifetime: inferKwhLifetime, studies: STUDIES},
    monthly:   {kwh: totalMonthlyKwh, co2: rnd(totalMonthlyKwh * cf.ci, 3)},
    ampSavingPct, grossKgCo2e, embGpuKgCo2e, savingsKgCo2e, netKgCo2e,
    pue: cf.pue, cloudCi: cf.ci, waterLitres, efficiencyRatio,
    accuracy: model.accuracy, accuracyMetric: model.accuracyMetric,
    scanTimeReductPct: model.scanTimeReductPct, lowValueReductPct: model.lowValueReductPct,
    scansAvoided, scanEnergySaved, reboundRisk,
    unit: isToken ? 'tokens' : 'gpu', tokensPerStudy, callsPerTask, tokensPerCall, whPer1kTokens: model.whPer1kTokens || 0,
  };
}

// Build a full AI result from a config object (the live `scen` or a saved benchmark
// candidate) under a given department context. Shared by the AI dashboard and the
// benchmark so both use identical math. Returns the computeAI object plus the derived
// inference time and a lifetime-CO₂ roll-up convenient for comparison.
function aiResultFor(cfg, region, customCi, equipment) {
  const gpuPreset = GPU_PRESETS[cfg.trainGpu];
  const trainH    = parseFloat(cfg.trainHours) || 0;
  const trainN    = Math.max(1, parseInt(cfg.trainNumGpus) || 1);
  const pue       = CLOUD[cfg.cloudProvider]?.pue ?? 1.5;
  const trainKwh  = gpuPreset && trainH > 0 ? rnd(gpuPreset.tdpKw * trainN * trainH * pue, 1) : 0;
  const lib = AI_MODEL_BY_KEY[cfg.modelKey] ?? AI_MODEL_LIBRARY[0];
  const paramsM    = parseFloat(cfg.paramsM)    || lib.paramsM;
  const dim        = cfg.dim || lib.dim;
  const resolution = parseFloat(cfg.resolution) || lib.resolution;
  const slices     = dim === '3D' ? (parseFloat(cfg.slices) || lib.slices) : 1;
  const baseSlices = lib.dim === '3D' ? lib.slices : 1;
  const basePixels = lib.resolution * lib.resolution * baseSlices;
  const pixels     = resolution * resolution * slices;
  const inferSecDerived = rnd(lib.inferSec * (paramsM / lib.paramsM) * (pixels / basePixels), 3);
  const inferSecManual  = parseFloat(cfg.inferSec) > 0 ? parseFloat(cfg.inferSec) : null;
  const inferSecAuto    = inferSecManual === null;
  // Token-based (LLM / agentic) fields — only meaningful when the library entry uses tokens.
  const unit          = lib.unit || 'gpu';
  const whPer1kTokens = parseFloat(cfg.whPer1kTokens) > 0 ? parseFloat(cfg.whPer1kTokens) : lib.whPer1kTokens;
  const callsPerTask  = Math.max(1, parseInt(cfg.callsPerTask)  || lib.callsPerTask  || 1);
  const tokensPerCall = Math.max(0, parseFloat(cfg.tokensPerCall) || lib.tokensPerCall || 0);
  const model = {
    gpuKw: lib.gpuKw, trainMwh: lib.trainMwh, embCo2Kg: lib.embCo2Kg,
    paramsM, dim, resolution, slices,
    unit, whPer1kTokens, callsPerTask, tokensPerCall,
    inferSec:   inferSecManual ?? inferSecDerived,
    accuracy:   Math.min(1, Math.max(0, (parseFloat(cfg.accuracyPct) || 0) / 100)),
    accuracyMetric: cfg.accuracyMetric || lib.accuracyMetric,
    scanTimeReductPct: Math.max(0, parseFloat(cfg.scanTimeReductPct) || 0),
    lowValueReductPct: Math.max(0, parseFloat(cfg.lowValueReductPct) || 0),
  };
  const result = computeAI(cfg.cloudProvider, region, model, cfg.precision, cfg.architecture, customCi, equipment,
    {trainKwh, testStudies: cfg.testStudies, deployMonths: cfg.deployMonths, cloudRegion: cfg.cloudRegion});
  const lifetimeCo2 = rnd(result.training.kgCo2e + result.inference.kwhLifetime * result.cloudCi + result.embCo2KgTotal, 1);
  return {...result, inferSecDerived, inferSecAuto, lifetimeCo2};
}

// The AI-model config fields snapshotted into a benchmark candidate (department context —
// region, equipment, customCi — is held constant and applied at compute time).
const AI_CFG_FIELDS = ['modelKey','architecture','precision','paramsM','dim','resolution','slices','inferSec',
  'whPer1kTokens','callsPerTask','tokensPerCall',
  'accuracyPct','accuracyMetric','scanTimeReductPct','lowValueReductPct',
  'cloudProvider','cloudRegion','trainGpu','trainNumGpus','trainHours','testStudies','deployMonths'];
function pickAiCfg(s) {
  return AI_CFG_FIELDS.reduce((o, k) => (o[k] = s[k], o), {});
}
function benchCfgFromLib(key) {
  const m = AI_MODEL_BY_KEY[key] ?? AI_MODEL_LIBRARY[0];
  return {
    id: `ref-${key}`, label: m.label, modelKey: key, architecture: m.architecture, precision: 'float32 (standard)',
    paramsM: String(m.paramsM), dim: m.dim, resolution: String(m.resolution), slices: String(m.slices), inferSec: '',
    whPer1kTokens: m.whPer1kTokens!=null?String(m.whPer1kTokens):'', callsPerTask: m.callsPerTask!=null?String(m.callsPerTask):'1', tokensPerCall: m.tokensPerCall!=null?String(m.tokensPerCall):'',
    accuracyPct: String(m.accuracyPct), accuracyMetric: m.accuracyMetric,
    scanTimeReductPct: String(m.scanTimeReductPct), lowValueReductPct: String(m.lowValueReductPct),
    cloudProvider: 'Local compute', cloudRegion: 'On-premise (Switzerland)',
    trainGpu: '', trainNumGpus: '1', trainHours: '', testStudies: '500', deployMonths: '36',
  };
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
    row(['Scope 1 — Direct',           dash.scopes.scope1Kg]),
    row(['Scope 2 — Electricity',      dash.scopes.scope2Kg]),
    row(['Scope 3 — Embodied carbon',  dash.scopes.scope3EmbKg]),
    row(['Scope 3 — Patient travel',   dash.scopes.scope3TravelKg]),
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
    row([`Data storage / archive (${dash.storage.storedTB} TB over ${dash.storage.retentionYears} yr, ${dash.storage.cloud ? 'cloud' : 'on-prem'})`,
      'Storage', dash.storage.kwh, dash.storage.co2, '', 'N/A', '', 'estimated']),
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
    row(['Region', region, 'Cloud / deployment', scen.cloudProvider]),
    row(['Model template', AI_MODEL_BY_KEY[scen.modelKey]?.label ?? scen.modelKey, 'Reference', AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? '']),
    row(['Architecture', scen.architecture, 'Model size', ai.modelSize]),
    row(['Parameters (M)', ai.paramsM, 'Dimensionality', ai.dim]),
    row([ai.dim==='3D'?'In-plane resolution (px)':'Input resolution (px)', ai.resolution, ai.dim==='3D'?'Through-plane slices':'Slices', ai.dim==='3D' ? ai.slices : 'n/a']),
    ...(ai.dim==='3D' ? [row(['Input volume (voxels)', Math.round((parseFloat(ai.resolution)||0)**2 * (parseFloat(ai.slices)||0))])] : []),
    row(['Precision / AMP', scen.precision, 'Cloud CI (kgCO2e/kWh)', ai.cloudCi]),
    row(['PUE', ai.pue]),
    blank,

    row(['TRAINING (one-time)']),
    row(['Metric', 'Value', 'Unit']),
    row(['Training energy',              ai.training.kwhTotal,    'kWh']),
    row(['Training CO2e',                ai.training.kgCo2e,      'kgCO2e']),
    row(['Estimated GPU compute',        ai.training.gpuHours,    'h']),
    row(['Amortised training / month',   ai.training.kwhAmortised,'kWh/mo (36-month deployment)']),
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
    row(['Lifetime inference energy',    ai.inference.kwhLifetime,    'kWh (36 months)']),
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
    row(['Efficiency ratio',             ai.efficiencyRatio,          'acc%/kWh']),
    row(['Reported performance',         `${rnd(ai.accuracy * 100, 1)}% ${ai.accuracyMetric}`,'user-entered']),
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

// Net annual CO₂ a deployed AI tool adds to a department: amortised training + inference +
// embodied GPU, minus clinical savings (shorter protocols + avoided low-value scans). Net,
// so a tool can be net-negative (reduce department footprint).
function aiToolDeptContribution(t, annualStudies, facilityKwhPerStudy, effectiveCi) {
  const share     = Math.min(100, Math.max(0, parseFloat(t.studiesShare) || 100)) / 100;
  const studiesAI = annualStudies * share;
  const inferKwhPerStudy = Math.max(0, parseFloat(t.inferKwhPerStudy) || 0);
  const trainKwhTotal    = Math.max(0, parseFloat(t.trainKwhTotal)    || 0);
  const embCo2Kg         = Math.max(0, parseFloat(t.embCo2Kg)         || 0);
  const deployMo  = Math.max(1, parseInt(t.deployMonths) || 36);
  const scanRed   = Math.max(0, parseFloat(t.scanTimeReductPct) || 0) / 100;
  const lowVal    = Math.max(0, parseFloat(t.lowValueReductPct) || 0) / 100;
  const kwhYr     = studiesAI * inferKwhPerStudy + trainKwhTotal / deployMo * 12;
  const embCo2Yr  = embCo2Kg / deployMo * 12;
  const grossCo2Yr  = rnd(kwhYr * effectiveCi + embCo2Yr, 1);
  const energySavedYr = studiesAI * facilityKwhPerStudy * scanRed + studiesAI * lowVal * facilityKwhPerStudy;
  const savingsCo2Yr  = rnd(energySavedYr * effectiveCi, 1);
  return {studiesAI: Math.round(studiesAI), kwhYr: rnd(kwhYr, 0), grossCo2Yr, savingsCo2Yr, netCo2Yr: rnd(grossCo2Yr - savingsCo2Yr, 1)};
}

function generateDeptText(d) {
  if (!d.annualStudies) return '';
  return (
    `Environmental footprint. ${d.deptName}${d.hospitalName ? ` (${d.hospitalName})` : ''} consumed an estimated ${d.annualKwh.toLocaleString()} kWh of electricity in the reporting period, generating approximately ${d.totalAnnualCo2.toLocaleString()} kgCO₂e (effective carbon intensity: ${d.effectiveCi} kgCO₂e/kWh; renewable energy: ${d.renewablePct}%; grid region: ${d.region}). ` +
    (d.clinicalToolCount > 0 ? ` This figure reflects ${d.clinicalToolCount} deployed clinical AI tool${d.clinicalToolCount > 1 ? 's' : ''}, whose net compute and clinical savings are included in the department energy above.` : '') +
    ` Across ${d.annualStudies.toLocaleString()} imaging studies, the carbon intensity per study — a measure of how efficiently energy is converted into delivered care — was ${d.co2PerStudy} kgCO₂e/study (${d.kwhPerStudy} kWh/study${d.utilPct != null ? `; ${d.utilPct}% fleet utilisation` : ''}), corresponding to a CEDARS Score of ${d.score}/100 (CEDARS Rating: ${d.leaves}/5 leaves — ${d.ratingLabel}).` +
    (d.interventionCount > 0 ? ` The department has implemented ${d.interventionCount} sustainability intervention${d.interventionCount > 1 ? 's' : ''}, with an estimated energy saving potential of ${d.annualKwhSaving.toLocaleString()} kWh/yr (${d.co2Saving} kgCO₂e/yr).` : '') +
    ` Sustainability metrics were estimated using CEDARS (${d.date}), benchmarked against published radiology carbon-intensity data (e.g. McKee BJ et al., Radiology 2024, DOI: 10.1148/radiol.240219); full methodology and sources: https://github.com/takinci/cedars/blob/main/sources.md.`
  );
}

function downloadDeptPNG(d) {
  const W = 510;
  const rows = [
    ['Annual electricity',   `${d.annualKwh.toLocaleString()} kWh`],
    ['Annual CO₂e',    `${d.totalAnnualCo2.toLocaleString()} kgCO₂e`],
    ...(d.clinicalToolCount > 0 ? [['Clinical AI tools', `${d.clinicalToolCount} deployed (in energy)`]] : []),
    ['Studies / year',       d.annualStudies.toLocaleString()],
    ['Energy per study',     `${d.kwhPerStudy} kWh`],
    ...(d.utilPct != null ? [['Fleet utilisation', `${d.utilPct}% of configured fleet`]] : []),
    ['Carbon intensity',     `${d.effectiveCi} kgCO₂e/kWh (${d.renewablePct}% renewable)`],
    ['Grid region',          d.region],
    ...(d.interventionCount > 0 ? [['Active interventions', `${d.interventionCount} implemented \xb7 ~${d.annualKwhSaving.toLocaleString()} kWh/yr saved`]] : []),
  ];
  const ROW_H = 26, HEADER_H = 72, TIER_H = 84, FOOTER_H = 28;
  const H = HEADER_H + TIER_H + 4 + rows.length * ROW_H + 6 + FOOTER_H + 4;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.fill();
  ctx.strokeStyle = d.ratingColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, W-2, H-2, 13); ctx.stroke();
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath(); ctx.roundRect(1, 1, W-2, HEADER_H, [13,13,0,0]); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText('CEDARS Department EcoLabel', 16, 26);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#A5D6A7';
  ctx.fillText(d.deptName, 16, 48);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#81C784';
  ctx.fillText(`${d.hospitalName ? d.hospitalName + ' \xb7 ' : ''}${d.region} \xb7 ${d.date}`, 16, 66);
  ctx.fillStyle = d.ratingBg;
  ctx.fillRect(2, HEADER_H, W-4, TIER_H);
  // CEDARS Score (big number) + Rating (5 leaves)
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px sans-serif'; ctx.fillStyle = d.ratingColor;
  ctx.fillText(String(d.score), 46, HEADER_H + 48);
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('CEDARS SCORE', 46, HEADER_H + 64);
  ctx.textAlign = 'left';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < d.leaves ? d.ratingColor : '#cfd8dc'; ctx.font = '16px sans-serif'; ctx.fillText('●', 100 + i*16, HEADER_H + 30); }
  ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = d.ratingColor;
  ctx.fillText(`${d.ratingLabel}`, 100, HEADER_H + 52);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#263238';
  ctx.fillText(`${d.co2PerStudy} kgCO₂e per imaging study`, 100, HEADER_H + 70);
  rows.forEach(([k, v], i) => {
    const y = HEADER_H + TIER_H + 4 + i * ROW_H;
    ctx.fillStyle = i%2===0 ? '#f1f8f1' : '#ffffff';
    ctx.fillRect(2, y, W-4, ROW_H);
    ctx.fillStyle = '#607d66'; ctx.font = '11px sans-serif';
    ctx.fillText(k, 14, y+17);
    ctx.fillStyle = '#263238'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(String(v), 200, y+17);
  });
  const footerY = HEADER_H + TIER_H + 4 + rows.length * ROW_H + 6;
  ctx.fillStyle = '#e8f5e9';
  ctx.beginPath(); ctx.roundRect(2, footerY, W-4, FOOTER_H, [0,0,11,11]); ctx.fill();
  ctx.fillStyle = '#2E7D32'; ctx.font = '10px sans-serif';
  ctx.fillText(`CEDARS Score & Rating \xb7 ${d.date} \xb7 CC BY 4.0`, 14, footerY+18);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cedars_dept_label_${(d.deptName||'department').replace(/\W+/g,'_')}.png`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  });
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
    ['Energy per run',           `${d.energyPerRunKwh} kWh${d.energyMeasured ? ' (measured)' : ' (estimated from TDP)'}`],
    ['Total training energy',    `${d.totalEnergyKwh} kWh`],
    ['Training CO₂e (one-time)', `${d.trainCo2} kgCO₂e`],
    ['Renewable energy',         `${d.renewablePct}%`],
    ['Compute provider / PUE',   `${d.cloudProvider} · PUE ${d.pue}`],
    ['Grid region / CI',         `${d.region} · ${d.ci} kgCO₂e/kWh`],
    ['Water footprint (cooling)', `${d.waterLitres.toLocaleString()} L`],
    ...(d.tokenMode && d.tokensPerStudy > 0 ? [['Inference tokens / study', `${d.tokensPerStudy.toLocaleString()} tokens · ${d.inferKwhPerStudy} kWh`]] : []),
    ...(d.perInferCo2g > 0 ? [['Inference CO₂e / study (marginal)', `${d.perInferCo2g} gCO₂e`]] : []),
    ...(d.hasInference ? [
      ['Deployment',                  `${d.inferStudies.toLocaleString()} studies/mo · ${d.deployMonths} mo (${d.lifetimeInferences.toLocaleString()} studies)`],
      ['Effective CO₂e / study',      `${d.effectivePerStudyG} gCO₂e (training amortised + inference)`],
      ...(d.breakEvenStudies != null ? [['Break-even (training = inference)', `~${d.breakEvenStudies.toLocaleString()} studies`]] : []),
    ] : []),
    ['**CEDARS Score**',         d.graded ? `**${d.score} / 100** (${d.gradeBasis === 'amortised' ? 'amortised gCO₂e/study' : 'inference gCO₂e/study'})` : '— (add inference volume to grade)'],
    ['**CEDARS Rating**',        d.graded ? `**${d.leaves} / 5 leaves — ${d.ratingLabel}**` : '—'],
    ['Estimated with',           `CEDARS · ${d.date}`],
  ];
  return [
    '| Metric | Value |',
    '|:---|:---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '> AI research label generated with [CEDARS](https://cedarsleaf.com).',
    '> Reporting framework: Doo FX et al. *Radiology* 2024 · DOI 10.1148/radiol.232030. Full sources: cedarsleaf.com → sources.md.',
  ].join('\n');
}

function downloadEcoPNG(d) {
  const W = 510;
  const rows = [
    ['Task type',                d.taskType],
    ['Architecture',             d.architecture],
    ['Parameters',               d.paramsMillion],
    ['Training dataset',         d.datasetSize],
    ['GPU hardware',             d.gpuHardware],
    ['Training runs',            `${d.numRuns} exp · ${d.totalGpuHours} GPU-h total`],
    ['Energy / run',             `${d.energyPerRunKwh} kWh${d.energyMeasured ? ' (measured)' : ' (est.)'}`],
    ['Total training energy',    `${d.totalEnergyKwh} kWh`],
    [`Training CO₂e`,       `${d.trainCo2} kgCO₂e`],
    ['Renewable energy',         `${d.renewablePct}%`],
    ['Compute / grid',           `${d.cloudProvider} · ${d.region} · ${d.ci} kgCO₂e/kWh`],
    ['Water footprint (cooling)', `${d.waterLitres.toLocaleString()} L`],
    ...(d.perInferCo2g > 0 ? [['Inference / study', `${d.perInferCo2g} gCO₂e`]] : []),
    ...(d.hasInference ? [
      ['Deployment',        `${d.inferStudies.toLocaleString()} studies/mo · ${d.deployMonths} mo`],
      ['Effective / study', `${d.effectivePerStudyG} gCO₂e (amortised)`],
    ] : []),
  ];
  const ROW_H = 26, HEADER_H = 72, RATING_H = 76, FOOTER_H = 28;
  const H = HEADER_H + RATING_H + 4 + rows.length * ROW_H + 6 + FOOTER_H + 4;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.fill();
  ctx.strokeStyle = d.ratingColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, W - 2, H - 2, 13); ctx.stroke();
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath(); ctx.roundRect(1, 1, W - 2, HEADER_H, [13, 13, 0, 0]); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText('CEDARS AI Research Label', 16, 26);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#A5D6A7';
  ctx.fillText(d.projectName, 16, 48);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#81C784';
  ctx.fillText(`AI model footprint disclosure · ${d.date}`, 16, 66);
  // CEDARS Score + Rating band
  ctx.fillStyle = d.ratingBg; ctx.fillRect(2, HEADER_H, W-4, RATING_H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px sans-serif'; ctx.fillStyle = d.ratingColor;
  ctx.fillText(d.graded ? String(d.score) : '—', 46, HEADER_H + 44);
  ctx.font = 'bold 9px sans-serif'; ctx.fillText('CEDARS SCORE', 46, HEADER_H + 60);
  ctx.textAlign = 'left';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < d.leaves ? d.ratingColor : '#cfd8dc'; ctx.font = '15px sans-serif'; ctx.fillText('●', 100 + i*15, HEADER_H + 28); }
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = d.ratingColor;
  ctx.fillText(d.ratingLabel, 100, HEADER_H + 50);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#263238';
  ctx.fillText(
    d.gradeBasis === 'amortised' ? `${d.effectivePerStudyG} gCO₂e/study (amortised)`
      : d.gradeBasis === 'inference' ? `${d.perInferCo2g} gCO₂e/study`
      : d.hasData ? 'Add inference to grade' : 'Enter training data above',
    100, HEADER_H + 66);
  rows.forEach(([k, v], i) => {
    const y = HEADER_H + RATING_H + 4 + i * ROW_H;
    ctx.fillStyle = i % 2 === 0 ? '#f1f8f1' : '#ffffff';
    ctx.fillRect(2, y, W - 4, ROW_H);
    ctx.fillStyle = '#607d66'; ctx.font = '11px sans-serif';
    ctx.fillText(k, 14, y + 17);
    ctx.fillStyle = '#263238'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(String(v), 210, y + 17);
  });
  const footerY = HEADER_H + RATING_H + 4 + rows.length * ROW_H + 6;
  ctx.fillStyle = '#e8f5e9';
  ctx.beginPath(); ctx.roundRect(2, footerY, W - 4, FOOTER_H, [0, 0, 11, 11]); ctx.fill();
  ctx.fillStyle = '#2E7D32'; ctx.font = '10px sans-serif';
  ctx.fillText(`CEDARS · ${d.date} · CC BY 4.0`, 14, footerY + 18);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cedars_ecolabel_${(d.projectName || 'untitled').replace(/\W+/g, '_')}.png`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  });
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

// URL hash state persistence lives in ./urlstate.js (encodeConfig / decodeConfig): it serialises
// the full configuration — department settings + equipment + storage + cost, the AI scenario, and
// the selected interventions — so a shared link reproduces the whole setup. SETTINGS_DEFAULTS and
// SCEN_DEFAULTS are the single source of truth for the initial `settings` / `scen` state below.

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState('landing');

  // Decode a shared link once: the full configuration (settings + equipment + scenario +
  // interventions) is restored into the relevant state objects below.
  const initCfg = useMemo(() => (typeof window !== 'undefined' ? decodeConfig(window.location.hash) : {}), []);
  const { equipment: initEquip, ...initSettings } = initCfg.settings || {};

  // Shared settings — drive all calculations; initialised from the URL hash if present.
  // (storageReformats: 'all' | 'axial' — axial avoids non-essential CT/PET reformats.)
  const [settings, setSettings] = useState(() => ({
    ...SETTINGS_DEFAULTS,
    equipment: {...DEFAULT_EQUIPMENT, ...(initEquip || {})},
    ...initSettings,
  }));
  const setEquip = (key, val) => set('equipment', {...settings.equipment, [key]: val});
  // AI scenario (model spec + cloud + scanner state). SCEN_DEFAULTS is the single source of truth
  // (shared with urlstate.js); restored from a shared link when present.
  const [scen, setScen] = useState(() => ({...SCEN_DEFAULTS, ...(initCfg.scen || {})}));

  const set  = (key, val) => setSettings(s => ({...s, [key]: val}));
  const setS = (key, val) => setScen(s => ({...s, [key]: val}));
  // Logo / brand → Home & start over: clear the department inputs and label back to blank,
  // return to a clean cedarsleaf.com (hash strips at defaults), and scroll to the top.
  const resetToHome = () => {
    setSettings({...SETTINGS_DEFAULTS, equipment: {...DEFAULT_EQUIPMENT}});
    setDeptLabel({
      deptName: '', hospitalName: '', region: '',
      annualKwh: '', annualStudies: '', renewablePct: '0',
      activeInterventions: [], aiTools: [],
    });
    // Also wipe the AI Model & Informatics page (model config, research label, cloud workloads).
    setScen({...SCEN_DEFAULTS});
    setEcoLabel({
      projectName: '', taskType: 'Classification', architecture: '', paramsMillion: '', datasetSize: '',
      gpuModel: 'NVIDIA A100 (80GB SXM4)', customTdpW: '300', gpuCount: '1', trainingHoursPerRun: '',
      numRuns: '1', energyMeasured: false, energyKwhPerRun: '', cloudProvider: 'Local compute',
      region: 'Global average', renewablePct: '0', inferStudiesMonth: '', inferMode: 'kwh',
      inferKwhPerStudy: '', whPer1kTokens: '0.4', callsPerTask: '1', tokensPerCall: '', deployMonths: '36',
    });
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
      ...s, modelKey: key, architecture: m.architecture,
      paramsM: String(m.paramsM), dim: m.dim, resolution: String(m.resolution), slices: String(m.slices), inferSec: '',
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
  const [aiOpen, setAiOpen] = useState({model:true});
  const toggleAi = id => setAiOpen(o => ({...o, [id]: !o[id]}));
  const [trainExpanded, setTrainExpanded] = useState(false);
  const [modelExpanded, setModelExpanded] = useState(false);
  // Scenario tab mode + AI model benchmark shortlist
  const [benchModels, setBenchModels] = useState(() => ['cad','seg3d','report'].map(benchCfgFromLib));
  const addBenchModel = () => setBenchModels(list =>
    list.length >= 6 ? list : [...list, {...pickAiCfg(scen), id: Date.now(),
      label: `${AI_MODEL_BY_KEY[scen.modelKey]?.label ?? 'Model'} (current)`}]);
  const removeBenchModel  = id => setBenchModels(list => list.filter(m => m.id !== id));
  const updateBenchLabel  = (id, label) => setBenchModels(list => list.map(m => m.id === id ? {...m, label} : m));
  const [dashOpen, setDashOpen] = useState({});
  const toggleDash = id => setDashOpen(o => ({...o, [id]: !o[id]}));
  const openDash   = id => { setDashOpen(o => ({...o, [id]: true})); setTimeout(()=>document.getElementById('dash-'+id)?.scrollIntoView({behavior:'smooth',block:'start'}), 50); };
  const [equivScope, setEquivScope] = useState('scope2');
  const [landingAIOpen, setLandingAIOpen] = useState(false);
  const [landingAITools, setLandingAITools] = useState({});
  const [ecoCopied, setEcoCopied] = useState(false);
  const [ecoLabel, setEcoLabel] = useState({
    projectName: '',
    taskType: 'Classification',
    architecture: '',
    paramsMillion: '',
    datasetSize: '',
    gpuModel: 'NVIDIA A100 (80GB SXM4)',
    customTdpW: '300',
    gpuCount: '1',
    trainingHoursPerRun: '',
    numRuns: '1',
    energyMeasured: false,
    energyKwhPerRun: '',
    cloudProvider: 'Local compute',
    region: 'Global average',
    renewablePct: '0',
    inferStudiesMonth: '',
    inferMode: 'kwh',            // 'kwh' (vision, energy/study) | 'tokens' (LLM/agentic)
    inferKwhPerStudy: '',
    whPer1kTokens: '0.4',
    callsPerTask: '1',
    tokensPerCall: '',
    deployMonths: '36',
  });
  const setEco = (key, val) => setEcoLabel(l => ({...l, [key]: val}));
  const [deptCopied, setDeptCopied] = useState(false);
  const [deptLabel, setDeptLabel] = useState(() => ({
    deptName: '', hospitalName: '', region: '',
    annualKwh: '', annualStudies: '', renewablePct: '0',
    activeInterventions: initCfg.activeInterventions || [], aiTools: [],
  }));
  const setDept = (key, val) => setDeptLabel(d => ({...d, [key]: val}));
  const toggleIntervention = name => setDeptLabel(d => ({
    ...d,
    activeInterventions: d.activeInterventions.includes(name)
      ? d.activeInterventions.filter(x => x !== name)
      : [...d.activeInterventions, name],
  }));
  // Deployed AI tools attached to the department — each contributes net annual CO₂.
  const addDeptAiTool    = tool      => setDeptLabel(d => d.aiTools.length >= 5 ? d : ({...d, aiTools: [...d.aiTools, tool]}));
  const removeDeptAiTool = id        => setDeptLabel(d => ({...d, aiTools: d.aiTools.filter(t => t.id !== id)}));
  const updateDeptAiTool = (id,f,v)  => setDeptLabel(d => ({...d, aiTools: d.aiTools.map(t => t.id === id ? {...t, [f]: v} : t)}));

  // Provider + region now live in `scen` (shared with AI lifecycle). This holds only the
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

  const handlePrint = () => { window.print(); };

  // Persist the full configuration to the URL hash so links reproduce the whole setup — department
  // settings + equipment + storage + cost, the AI scenario, and the selected interventions. The
  // hash is stripped whenever everything is back at defaults, keeping cedarsleaf.com clean.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = encodeConfig({ settings, scen, activeInterventions: deptLabel.activeInterventions });
    history.replaceState(null, '', qs ? '#' + qs : window.location.pathname + window.location.search);
  }, [settings, scen, deptLabel.activeInterventions]);

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
    let inferKwhPerStudy = 0, trainKwhMonthly = 0, avoidKeep = 1, scanKeep = 1, contrastKeep = 1;
    tools.forEach(t => {
      const share = Math.min(1, Math.max(0, (parseFloat(t.studiesShare) || 100) / 100));
      inferKwhPerStudy += (parseFloat(t.inferKwhPerStudy) || 0) * share;
      trainKwhMonthly  += (parseFloat(t.trainKwhTotal) || 0) / Math.max(1, parseInt(t.deployMonths) || 36);
      avoidKeep    *= (1 - Math.max(0, parseFloat(t.lowValueReductPct) || 0) / 100 * share);
      scanKeep     *= (1 - Math.max(0, parseFloat(t.scanTimeReductPct) || 0) / 100 * share);
      contrastKeep *= (1 - Math.max(0, parseFloat(t.contrastReductPct) || 0) / 100 * share);
    });
    return {inferKwhPerStudy, trainKwhMonthly, avoidedFrac: 1 - avoidKeep, scanTimeFrac: 1 - scanKeep, contrastFrac: 1 - contrastKeep, count: tools.length};
  }, [deptLabel.aiTools]);
  const dash     = useMemo(() => computeDashboard(settings.region, settings.timePeriod, settings.equipment, settings.customCi, clinicalAdj, {retentionYears: settings.storageRetentionYears, cloud: settings.storageCloud, reformats: settings.storageReformats}), [settings.region, settings.timePeriod, settings.equipment, settings.customCi, clinicalAdj, settings.storageRetentionYears, settings.storageCloud, settings.storageReformats]);
  const scenario = useMemo(() => computeInterventions(deptLabel.activeInterventions, settings.region, settings.timePeriod, settings.equipment, settings.customCi, scen.cloudProvider, scen.scannerState, {retentionYears: settings.storageRetentionYears, cloud: settings.storageCloud, reformats: settings.storageReformats}), [deptLabel.activeInterventions, settings.region, settings.timePeriod, settings.equipment, settings.customCi, scen.cloudProvider, scen.scannerState, settings.storageRetentionYears, settings.storageCloud, settings.storageReformats]);
  const ai       = useMemo(() => aiResultFor(scen, settings.region, settings.customCi, settings.equipment),
    [scen, settings.region, settings.customCi, settings.equipment]);

  // Benchmark: every candidate computed under the SAME department context, so only the
  // model varies. Pareto-efficient = no other candidate is both more accurate and lower-carbon.
  const benchResults = useMemo(() => {
    const rows = benchModels.map(cfg => {
      const r = aiResultFor(cfg, settings.region, settings.customCi, settings.equipment);
      return {
        id: cfg.id, label: cfg.label, sizeLabel: r.modelSize, paramsM: r.paramsM,
        accuracyPct: rnd(r.accuracy * 100, 1), accuracyMetric: r.accuracyMetric,
        trainCo2: r.training.kgCo2e, kwhPerStudy: r.inference.kwhPerStudy,
        netCo2: r.netKgCo2e, lifetimeCo2: r.lifetimeCo2, efficiency: r.efficiencyRatio,
      };
    });
    rows.forEach(a => {
      a.pareto = !rows.some(b => b.id !== a.id &&
        b.accuracyPct >= a.accuracyPct && b.lifetimeCo2 <= a.lifetimeCo2 &&
        (b.accuracyPct > a.accuracyPct || b.lifetimeCo2 < a.lifetimeCo2));
    });
    const minBy = key => rows.length ? Math.min(...rows.map(r => r[key])) : 0;
    const maxBy = key => rows.length ? Math.max(...rows.map(r => r[key])) : 0;
    return {rows, best: {trainCo2: minBy('trainCo2'), netCo2: minBy('netCo2'), lifetimeCo2: minBy('lifetimeCo2'),
      accuracyPct: maxBy('accuracyPct'), efficiency: maxBy('efficiency')}};
  }, [benchModels, settings.region, settings.customCi, settings.equipment]);

  // Worked agentic example: a single-pass vision model vs a single-pass LLM vs a multi-call
  // agent, all on the SAME department volume — surfaces the token multiplier concretely.
  const agenticExample = useMemo(() => {
    const ctx = k => aiResultFor(benchCfgFromLib(k), settings.region, settings.customCi, settings.equipment);
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
  }, [settings.region, settings.customCi, settings.equipment]);

  const landingAIKwh = useMemo(() => {
    if (!landingAIOpen) return 0;
    return rnd(Object.values(landingAITools).reduce((sum, cfg) => {
      const tdpKw = GPU_PRESETS[cfg.gpu]?.tdpKw ?? 0.3;
      const hours = parseFloat(cfg.hoursPerDay) || 0;
      const n     = parseInt(cfg.numGpus, 10) || 1;
      const pue   = CLOUD[cfg.deployment]?.pue ?? 1.5;
      return sum + tdpKw * n * hours * 30 * pue;
    }, 0), 2);
  }, [landingAIOpen, landingAITools]);
  const landingAICo2 = useMemo(() => {
    if (!landingAIOpen) return 0;
    return rnd(landingAIKwh * getCI(settings.region, settings.customCi), 2);
  }, [landingAIOpen, landingAIKwh, settings.region, settings.customCi]);

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
    const IMAGING_MOD = new Set(["MRI","CT","PET-CT","Angio/IR","Fluoroscopy","Radiography","Ultrasound"]);
    const capacityYr = Object.entries(settings.equipment).reduce((s, [key, n]) => {
      const u = EQUIPMENT_UNITS[key];
      return s + ((u && IMAGING_MOD.has(u.modality)) ? Math.max(0, n || 0) * u.scans * 12 : 0);
    }, 0);
    const entered   = parseFloat(settings.actualStudiesYear) > 0 ? parseFloat(settings.actualStudiesYear) : null;
    const studiesYr = entered ?? capacityYr;                 // blank → fleet estimate (utilisation 100%)
    const util      = capacityYr > 0 ? studiesYr / capacityYr : 0;
    const dEnergy   = dash.totals.energyPerScan;             // kWh/study at typical throughput
    const dCo2      = rnd(dEnergy * dash.ci, 3);
    const band = util >= 0.85 ? {label:'High utilisation',    color:'#2E7D32', bg:'#e8f5e9'}
               : util >= 0.40 ? {label:'Typical utilisation', color:'#F57F17', bg:'#fff8e1'}
               : {label:'Under-used fleet',    color:'#c62828', bg:'#ffebee'};
    return {
      capacityYr: Math.round(capacityYr), studiesYr: Math.round(studiesYr), isEstimate: !entered,
      utilPct: rnd(util * 100, 0), util,
      energyPerStudy: util > 0 ? rnd(dEnergy / util, 3) : dEnergy,
      co2PerStudy:    util > 0 ? rnd(dCo2 / util, 3)    : dCo2,
      designedCo2PerStudy: dCo2,
      // Active energy scales with actual volume, so under-utilisation raises the
      // non-productive share (idle/standby/off + unused capacity). At 100% utilisation
      // this equals the fleet's baseline duty cycle; it rises as utilisation falls.
      nonProductivePct: rnd(Math.max(0, 100 - dash.totals.activePct * util), 0),
      band,
    };
  }, [settings.equipment, settings.actualStudiesYear, dash.totals.energyPerScan, dash.totals.activePct, dash.ci]);

  const equivData = useMemo(() => {
    const co2 = equivScope === 'scope2'
      ? dash.scopes.scope2Kg + landingAICo2
      : dash.scopes.scope1Kg + dash.scopes.scope2Kg + dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2 + landingAICo2;
    const kwh = dash.totals.kwh + landingAIKwh;
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
  }, [dash, equivScope, landingAICo2, landingAIKwh, staffCommuteCo2, networkTransferCo2, settings.region, settings.electricityPrice]);

  const ecoLabelData = useMemo(() => {
    const gpuTdpKw = ecoLabel.gpuModel === 'Custom (enter TDP below)'
      ? (parseFloat(ecoLabel.customTdpW) || 300) / 1000
      : (GPU_PRESETS[ecoLabel.gpuModel]?.tdpKw ?? 0.3);
    const cf = CLOUD[ecoLabel.cloudProvider] ?? CLOUD['Local compute'];
    const ci = getCI(settings.region, settings.customCi); // grid follows the AI & Informatics page region
    const gpuCount = Math.max(1, parseInt(ecoLabel.gpuCount) || 1);
    const hoursPerRun = parseFloat(ecoLabel.trainingHoursPerRun) || 0;
    const numRuns = Math.max(1, parseInt(ecoLabel.numRuns) || 1);
    const renewablePct = Math.min(100, Math.max(0, parseFloat(ecoLabel.renewablePct) || 0));
    const totalGpuHours = rnd(gpuCount * hoursPerRun * numRuns, 1);
    const energyPerRunKwh = ecoLabel.energyMeasured
      ? (parseFloat(ecoLabel.energyKwhPerRun) || 0)
      : rnd(gpuTdpKw * gpuCount * hoursPerRun * cf.pue, 2);
    const totalEnergyKwh = rnd(energyPerRunKwh * numRuns, 2);
    const effectiveCi = rnd(ci * (1 - renewablePct / 100), 4);
    const trainCo2 = rnd(totalEnergyKwh * effectiveCi, 2);
    const waterLitres = Math.round(totalEnergyKwh * WATER_PER_KWH);
    const inferStudies = parseFloat(ecoLabel.inferStudiesMonth) || 0;
    // Inference energy per study: a flat kWh (vision models) OR token-driven (LLM / agentic),
    // reusing the same unit as the model library — tokens/study = calls × tokens/call, at
    // whPer1kTokens Wh/1k, × deployment PUE.
    const tokenMode = ecoLabel.inferMode === 'tokens';
    const inferCallsPerTask  = Math.max(1, parseFloat(ecoLabel.callsPerTask)  || 1);
    const inferTokensPerCall = Math.max(0, parseFloat(ecoLabel.tokensPerCall) || 0);
    const inferWhPer1k       = Math.max(0, parseFloat(ecoLabel.whPer1kTokens) || 0);
    const tokensPerStudy     = tokenMode ? Math.round(inferCallsPerTask * inferTokensPerCall) : 0;
    const inferKwhPerStudy = tokenMode
      ? rnd(tokensPerStudy / 1000 * inferWhPer1k / 1000 * cf.pue, 6)
      : (parseFloat(ecoLabel.inferKwhPerStudy) || 0);
    const inferMonthlyKwh = rnd(inferStudies * inferKwhPerStudy, 4);
    const inferCo2Month = rnd(inferMonthlyKwh * effectiveCi, 4);
    const gpuLabel = ecoLabel.gpuModel === 'Custom (enter TDP below)'
      ? `Custom GPU (${ecoLabel.customTdpW || 300} W TDP)`
      : ecoLabel.gpuModel;
    // ── Two-phase model footprint ────────────────────────────────────────────
    // Training is a ONE-TIME capital cost; inference is a MARGINAL cost paid on every study.
    // They behave oppositely, so the label shows both — and grades the amortised combination.
    const deployMonths = Math.max(1, parseInt(ecoLabel.deployMonths) || 36);
    const lifetimeInferences = Math.round(inferStudies * deployMonths);       // total studies over deployment
    const perInferCo2Kg  = inferKwhPerStudy * effectiveCi;                    // kgCO₂e per study (marginal)
    const perInferCo2g   = rnd(perInferCo2Kg * 1000, 3);                     // gCO₂e per study
    const hasInferenceData = inferStudies > 0 && inferKwhPerStudy > 0;
    const trainPerStudyG = lifetimeInferences > 0 ? rnd(trainCo2 * 1000 / lifetimeInferences, 3) : null; // amortised training, g/study
    const effectivePerStudyG = hasInferenceData ? rnd((trainPerStudyG ?? 0) + perInferCo2g, 3)
      : (inferKwhPerStudy > 0 ? perInferCo2g : null);                        // effective g/study
    const breakEvenStudies = perInferCo2Kg > 0 ? Math.round(trainCo2 / perInferCo2Kg) : null; // inference = training
    const trainFlights = rnd(trainCo2 / 255, 2);                             // short-haul economy seats (ICAO 2023)
    const hasData = totalEnergyKwh > 0;
    // Grade the amortised effective gCO₂e/study when a deployment volume is given (this folds
    // training + inference honestly); else the per-inference gCO₂e/study; else disclosure-only.
    const gradeBasis = hasInferenceData ? 'amortised' : (inferKwhPerStudy > 0 ? 'inference' : 'none');
    const gradeValueG = gradeBasis === 'none' ? null : effectivePerStudyG;
    const graded = gradeValueG != null;
    const score = graded ? cedarsScore(gradeValueG, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI) : null;
    const rating = graded ? cedarsRating(score) : null;
    return {
      projectName: ecoLabel.projectName || 'Untitled project',
      taskType: ecoLabel.taskType,
      architecture: ecoLabel.architecture || '—',
      paramsMillion: ecoLabel.paramsMillion ? `${parseFloat(ecoLabel.paramsMillion).toLocaleString()}M params` : '—',
      datasetSize: ecoLabel.datasetSize ? `${parseFloat(ecoLabel.datasetSize).toLocaleString()} studies` : '—',
      gpuHardware: gpuCount > 1 ? `${gpuCount}× ${gpuLabel}` : gpuLabel,
      totalGpuHours, numRuns, energyPerRunKwh, totalEnergyKwh, trainCo2,
      renewablePct, cloudProvider: ecoLabel.cloudProvider, region: settings.region,
      ci, effectiveCi, waterLitres, pue: cf.pue,
      hasInference: inferStudies > 0 && inferKwhPerStudy > 0,
      inferMonthlyKwh, inferCo2Month, inferStudies: Math.round(inferStudies),
      energyMeasured: ecoLabel.energyMeasured,
      deployMonths, lifetimeInferences, perInferCo2g, trainPerStudyG, effectivePerStudyG, breakEvenStudies, trainFlights,
      tokenMode, tokensPerStudy, inferKwhPerStudy: rnd(inferKwhPerStudy, 6),
      hasData, graded, gradeBasis, score,
      leaves: rating?.leaves ?? 0, ratingLabel: rating?.label ?? (hasData ? 'Add inference to grade' : 'Enter training data above'),
      ratingColor: rating?.color ?? '#90a4ae', ratingBg: rating?.bg ?? '#f5f5f5', ratingDesc: rating?.desc ?? '',
      date: new Date().toISOString().slice(0, 7),
    };
  }, [ecoLabel, settings.region, settings.customCi]);

  const deptLabelData = useMemo(() => {
    // Live-by-default: derive from the Radiology Department state; the EcoLabel form
    // fields are optional OVERRIDES (headline numbers + region) when non-empty.
    const mult = TIME_MULT[settings.timePeriod] ?? 1;
    const region = deptLabel.region || settings.region;
    const ci = getCI(region, settings.customCi);
    const renewablePct = Math.min(100, Math.max(0, parseFloat(deptLabel.renewablePct) || 0));
    const effectiveCi = rnd(ci * (1 - renewablePct / 100), 4);
    const liveAnnualKwh     = rnd(dash.totals.kwh / mult * 12, 0);
    const liveAnnualStudies = efficiency.studiesYr;
    const annualKwh     = parseFloat(deptLabel.annualKwh)     > 0 ? parseFloat(deptLabel.annualKwh)     : liveAnnualKwh;
    const annualStudies = parseFloat(deptLabel.annualStudies) > 0 ? parseFloat(deptLabel.annualStudies) : liveAnnualStudies;
    const isLive = !(parseFloat(deptLabel.annualKwh) > 0) && !(parseFloat(deptLabel.annualStudies) > 0);
    const facilityCo2 = rnd(annualKwh * effectiveCi, 1);
    const kwhPerStudy = annualStudies > 0 ? rnd(annualKwh / annualStudies, 2) : 0;
    // Efficiency of converting energy into delivered care: per-study CO₂ already drives
    // the Score; utilisation (studies vs the configured fleet's typical throughput) is
    // the explanatory diagnostic for the "large fleet, low volume" case.
    const fleetCapacityYr = efficiency.capacityYr;
    const utilPct = (fleetCapacityYr > 0 && annualStudies > 0) ? rnd(annualStudies / fleetCapacityYr * 100, 0) : null;
    const hasData = annualStudies > 0;
    // Clinical AI tools now flow through the live department energy (dash), so their net
    // effect (compute − clinical savings) is already in facilityCo2 — no separate fold here
    // (that would double-count).
    const totalAnnualCo2 = facilityCo2;
    const co2PerStudy = annualStudies > 0 ? rnd(totalAnnualCo2 / annualStudies, 3) : 0;
    const score = hasData ? cedarsScore(co2PerStudy, CEDARS_DEPT_LO, CEDARS_DEPT_HI) : null;
    const rating = hasData ? cedarsRating(score) : null;
    // Saving potential comes from the SAME unified, overlap-aware model as the Interventions
    // tab (`scenario` = computeInterventions over deptLabel.activeInterventions), so a ticked
    // action has identical effect in both places. Energy saving is scaled to annual; the
    // carbon-% levers apply multiplicatively to this label's own annualKwh / effectiveCi.
    const monthlyKwhSaving = scenario.monthlyKwhSaved;
    const annualKwhSaving = rnd(monthlyKwhSaving * 12, 0);
    const co2PctFraction = scenario.savings.co2Fraction;
    const potentialFacilityCo2 = Math.max(0, annualKwh - annualKwhSaving) * effectiveCi * (1 - co2PctFraction);
    const co2Saving = rnd(facilityCo2 - potentialFacilityCo2, 1);
    const potentialCo2PerStudy = annualStudies > 0
      ? rnd(Math.max(0, potentialFacilityCo2) / annualStudies, 3) : 0;
    const potentialScore = hasData ? cedarsScore(potentialCo2PerStudy, CEDARS_DEPT_LO, CEDARS_DEPT_HI) : null;
    const potentialRating = potentialScore != null ? cedarsRating(potentialScore) : rating;
    return {
      deptName: deptLabel.deptName || 'Unnamed Department',
      hospitalName: deptLabel.hospitalName || '',
      region, isLive,
      ci, effectiveCi, renewablePct,
      annualKwh, annualStudies, totalAnnualCo2, co2PerStudy, kwhPerStudy,
      fleetCapacityYr, utilPct,
      hasData, score,
      leaves: rating?.leaves ?? 0, ratingLabel: rating?.label ?? 'Enter data above',
      ratingColor: rating?.color ?? '#90a4ae', ratingBg: rating?.bg ?? '#f5f5f5', ratingDesc: rating?.desc ?? '',
      monthlyKwhSaving, annualKwhSaving, co2Saving,
      potentialCo2PerStudy, potentialScore, potentialLeaves: potentialRating?.leaves ?? 0, potentialRatingLabel: potentialRating?.label ?? '',
      interventionCount: deptLabel.activeInterventions.length,
      facilityCo2, clinicalToolCount: clinicalAdj.count,
      date: new Date().toISOString().slice(0, 7),
    };
  }, [deptLabel, settings.customCi, settings.region, settings.timePeriod, dash.totals.kwh, efficiency.capacityYr, efficiency.studiesYr, clinicalAdj.count, scenario.monthlyKwhSaved, scenario.savings.co2Fraction]);

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
  const scopeVals  = [dash.scopes.scope1Kg, dash.scopes.scope2Kg, dash.scopes.scope3EmbKg, dash.scopes.scope3TravelKg, staffCommuteCo2, networkTransferCo2];
  const chartScopes = {
    labels: ['% of total emissions' + dash.totals.label],
    datasets: [
      {label:`Scope 1 — Direct (${scopePct(dash.scopes.scope1Kg)}%)`,              data:[scopePct(dash.scopes.scope1Kg)],       backgroundColor:'#81C784'},
      {label:`Scope 2 — Electricity (${scopePct(dash.scopes.scope2Kg)}%)`,          data:[scopePct(dash.scopes.scope2Kg)],       backgroundColor:'#2E7D32'},
      {label:`Scope 3 — Embodied (${scopePct(dash.scopes.scope3EmbKg)}%)`,          data:[scopePct(dash.scopes.scope3EmbKg)],    backgroundColor:'#4DB6AC'},
      {label:`Scope 3 — Patient travel (${scopePct(dash.scopes.scope3TravelKg)}%)`, data:[scopePct(dash.scopes.scope3TravelKg)], backgroundColor:'#A5D6A7'},
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

  const pages = ['landing','dashboard','ai','ecolabel','scenario'];
  const PAGE_LABELS = {landing:'Home', dashboard:'Radiology Department', ai:'AI Model & Informatics', ecolabel:'EcoLabel', scenario:'Interventions'};

  return (
    <>
      <header>
        <Logo onClick={resetToHome}/>
        <nav>
          {pages.map(p => (
            <button key={p} className={page===p?'on':''} onClick={()=>setPage(p)}>{PAGE_LABELS[p] ?? p}</button>
          ))}
        </nav>
        {/* Ambient EcoLabel — live current grade, follows the user on every tab */}
        <button onClick={()=>setPage('ecolabel')} title="Your current EcoLabel — click for the full disclosure"
          style={{display:'inline-flex',alignItems:'center',gap:7,background:deptLabelData.ratingBg,border:`1.5px solid ${deptLabelData.ratingColor}`,borderRadius:16,padding:'5px 12px 5px 10px',cursor:'pointer',boxShadow:'none',flexShrink:0}}>
          <Leaf size={17} style={{color:deptLabelData.ratingColor}} fill={deptLabelData.ratingColor}/>
          <span style={{fontSize:18,fontWeight:900,color:deptLabelData.ratingColor,lineHeight:1}}>{deptLabelData.hasData ? deptLabelData.score : '—'}</span>
          <span style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontSize:10,fontWeight:800,color:deptLabelData.ratingColor,letterSpacing:'0.04em'}}>ECOLABEL</span>
            <span style={{fontSize:10,color:'#607d66'}}>{deptLabelData.leaves}/5 leaves</span>
          </span>
        </button>
      </header>

      {/* ── Home / Live Calculator ── */}
      {page==='landing' && (
        <main>
          <p className="eyebrow">Radiology + AI + Planetary Health</p>
          <h1 style={{fontSize:44,lineHeight:1.05,margin:'0 0 6px'}}>How much CO₂ does your department emit?</h1>
          <p className="note" style={{marginBottom:20,fontSize:15}}>Set your department → model your AI → see your EcoLabel → improve it.</p>

          {/* ── Journey walkthrough: 1 → 2 → 3 → 4 ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:28}}>
            {[
              {n:1,title:'Your Department',desc:'Set your equipment below',action:'Set up below',scrollTo:'landing-equipment',Icon:Activity},
              {n:2,title:'AI & Informatics',desc:'Model & informatics footprint',action:'Open',page:'ai',Icon:Brain},
              {n:3,title:'Your EcoLabel',desc:'See where you stand',action:'See label',page:'ecolabel',Icon:Leaf,reveal:true},
              {n:4,title:'Improve It',desc:'Model interventions → grade up',action:'Improve',page:'scenario',Icon:TrendingDown},
            ].map(s=>(
              <button key={s.n} onClick={()=> s.scrollTo ? document.getElementById(s.scrollTo)?.scrollIntoView({behavior:'smooth',block:'start'}) : setPage(s.page)} style={{textAlign:'left',background:s.reveal?deptLabelData.ratingBg:'white',border:`2px solid ${s.reveal?deptLabelData.ratingColor:'#e0e0e0'}`,borderRadius:18,padding:16,cursor:'pointer',boxShadow:'0 8px 30px #1b5e2010',display:'flex',flexDirection:'column',gap:8,minHeight:148}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                  <span style={{width:26,height:26,borderRadius:'50%',background:'#2E7D32',color:'white',fontWeight:800,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>{s.n}</span>
                  <s.Icon size={20} style={{color:'#2E7D32'}}/>
                </div>
                <div style={{fontWeight:800,fontSize:16,color:'#1b5e20'}}>{s.title}</div>
                {s.reveal ? (
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:34,fontWeight:900,color:deptLabelData.ratingColor,lineHeight:1}}>{deptLabelData.hasData?deptLabelData.score:'—'}</span>
                    <span><LeafRating leaves={deptLabelData.leaves} size={13} color={deptLabelData.ratingColor}/><div style={{fontSize:11,color:deptLabelData.ratingColor,fontWeight:700,marginTop:2}}>{deptLabelData.ratingLabel}</div></span>
                  </div>
                ) : (
                  <div style={{fontSize:13,color:'#607d66'}}>{s.desc}</div>
                )}
                <span style={{marginTop:'auto',fontSize:12,fontWeight:700,color:'#2E7D32'}}>{s.action} →</span>
              </button>
            ))}
          </div>

          <div className="hero">
          <div>
            {/* Equipment card grid */}
            <div id="landing-equipment" style={{marginBottom:16,scrollMarginTop:90}}>
              <div style={{fontWeight:700,color:'#2E7D32',fontSize:13,marginBottom:8,letterSpacing:'0.03em',textTransform:'uppercase'}}>Equipment in your department</div>

              {/* Subtle department presets — fill a realistic starting fleet; counts stay editable */}
              <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:6}}>
                <span style={{fontSize:11,color:'#90a4ae',fontWeight:600}}>Quick start:</span>
                {DEPARTMENT_PRESETS.map(p=>(
                  <button key={p.key} title={p.desc}
                    onClick={()=>set('equipment', Object.fromEntries(Object.keys(DEFAULT_EQUIPMENT).map(k=>[k, p.equipment[k]||0])))}
                    style={{background:'#f6f8f6',border:'1px solid #e4e9e4',borderRadius:9,padding:'3px 9px',fontSize:11,fontWeight:600,color:'#607d66',cursor:'pointer',boxShadow:'none'}}>
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="note" style={{fontSize:11,marginTop:0,marginBottom:10}}>Illustrative starting points — adjust any device count below.</p>

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
            {/* Region + time period row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
              <Sel label="Region / grid"   value={settings.region}     options={META.regions}     onChange={v=>set('region',v)}/>
              <Sel label="Time period"     value={settings.timePeriod} options={META.timePeriods} onChange={v=>set('timePeriod',v)}/>
            </div>
            {settings.region === 'Editable custom' && (
              <div style={{marginBottom:16}}>
                <label style={{maxWidth:300,fontWeight:700,color:'#2E7D32',display:'flex',flexDirection:'column',gap:8,fontSize:14}}>
                  Custom carbon intensity (kgCO₂e/kWh)
                  <input
                    type="number" min="0" max="2" step="0.001"
                    value={settings.customCi}
                    onChange={e=>set('customCi',e.target.value)}
                  />
                </label>
                <p className="note" style={{marginTop:6,fontSize:12}}>Enter your local utility or national grid factor. Global avg: 0.473 · EU avg: 0.237 (Vosshenrich et al.)</p>
              </div>
            )}

            <p className="note" style={{marginTop:4,padding:'8px 12px',background:'#f1f8f1',borderRadius:12,fontSize:13}}>
              <Brain size={14} style={{verticalAlign:'-2px',marginRight:6,color:'#2E7D32'}}/>
              Deploy <strong>clinical AI tools</strong> (avoided scans, shorter protocols, contrast) on the <button onClick={()=>setPage('dashboard')} style={{background:'none',border:'none',color:'#2E7D32',cursor:'pointer',padding:0,fontSize:13,fontWeight:700,boxShadow:'none'}}>Radiology Department →</button> tab, or model a model's build/run footprint on the <button onClick={()=>setPage('ai')} style={{background:'none',border:'none',color:'#2E7D32',cursor:'pointer',padding:0,fontSize:13,fontWeight:700,boxShadow:'none'}}>AI Model &amp; Informatics →</button> tab.
            </p>
          </div>
          <div className="heroVisual">
            <div style={{color:'#607d66',fontSize:12,marginBottom:8,lineHeight:1.5}}>
              {Object.entries(settings.equipment).filter(([,n])=>n>0).map(([k,n])=>`${n}× ${EQUIPMENT_UNITS[k]?.name??k}`).join(' · ')}
              {' · '}{settings.region}
            </div>
            <div style={{fontSize:56,fontWeight:900,color:'#1b5e20',lineHeight:1}}>{fmtCo2(dash.scopes.scope2Kg + landingAICo2)}</div>
            <div style={{color:'#2E7D32',fontWeight:700,fontSize:16,marginTop:4,marginBottom: landingAIOpen && landingAICo2>0 ? 8 : 20}}>CO₂ · {settings.timePeriod.toLowerCase()}</div>
            {landingAIOpen && landingAICo2>0 && (
              <div style={{fontSize:13,color:'#607d66',marginBottom:16}}>↑ includes {fmtCo2(landingAICo2)} from {Object.keys(landingAITools).length} AI tool{Object.keys(landingAITools).length>1?'s':''}</div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
              {[
                {icon:<Car style={{width:18,height:18}}/>,     n:Math.round((dash.scopes.scope2Kg+landingAICo2)/0.17).toLocaleString(), label:'km driven by car'},
                {icon:<Plane style={{width:18,height:18}}/>,   n:String(rnd((dash.scopes.scope2Kg+landingAICo2)/255,1)),                label:'short-haul flights'},
                {icon:<TreePine style={{width:18,height:18}}/>,n:Math.round((dash.scopes.scope2Kg+landingAICo2)/21).toLocaleString(),  label:'tree-years to offset'},
              ].map((e,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{color:'#2E7D32'}}>{e.icon}</span>
                  <strong style={{color:'#263238'}}>{e.n}</strong>
                  <span style={{color:'#607d66',fontSize:14}}>{e.label}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setPage('dashboard')}>Full breakdown →</button>
          </div>
          </div>
        </main>
      )}


      {/* ── Dashboard ── */}
      {page==='dashboard' && (
        <main>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:8}}>
            <h1 style={{margin:0}}>Radiology Department <span className="badge">{settings.region}</span> <span className="badge">{settings.timePeriod}</span></h1>
            <div style={{display:'flex',gap:8}}>
              <button className="download" onClick={()=>downloadCSV(dash)} style={{padding:'8px 14px',fontSize:13}}><Download/>CSV</button>
              <button className="download" onClick={handlePrint} style={{padding:'8px 14px',fontSize:13}}><Download/>Print / PDF</button>
            </div>
          </div>

          {/* ── Sticky tab nav ── */}
          <div className="stickyControls">
            <div className="aiSummary">
              <span>Total energy <b>{fmtKwh(dash.totals.kwh + landingAIKwh)}{dash.totals.label}</b></span>
              <span>Scope 2 CO₂ <b>{fmtCo2(dash.scopes.scope2Kg + landingAICo2)}</b></span>
              {landingAIOpen && Object.keys(landingAITools).length>0 && <span>AI tools ({Object.keys(landingAITools).length}) <b>{fmtCo2(landingAICo2)}</b></span>}
              <span>Avoidable idle <b>{fmtKwh(dash.totals.idleWasteKwh)}</b></span>
            </div>
          </div>

          {/* ── Overview (always visible) ── */}
          <section className="aiSection" style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:4}}>Overview</h2>
            <p className="note" style={{marginBottom:16}}>Your department at a glance. Every area is listed below — click any row to open its detail; it stays tucked away until you want it.</p>

            {/* Grade hero */}
            <div style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap',background:deptLabelData.ratingBg,border:`2px solid ${deptLabelData.ratingColor}`,borderRadius:20,padding:'18px 22px',marginBottom:18}}>
              <div style={{textAlign:'center',flexShrink:0}}>
                <div style={{fontSize:52,fontWeight:900,color:deptLabelData.ratingColor,lineHeight:1}}>{deptLabelData.hasData?deptLabelData.score:'—'}</div>
                <div style={{fontSize:10,fontWeight:700,color:deptLabelData.ratingColor,letterSpacing:'0.04em'}}>CEDARS SCORE</div>
              </div>
              <div>
                <LeafRating leaves={deptLabelData.leaves} size={24} color={deptLabelData.ratingColor}/>
                <div style={{fontWeight:700,fontSize:16,color:deptLabelData.ratingColor,marginTop:4}}>{deptLabelData.ratingLabel}</div>
                <div style={{fontSize:13,color:'#263238',marginTop:2}}>{deptLabelData.hasData?`${deptLabelData.co2PerStudy} kgCO₂e per imaging study`:'Set up your fleet on the Home page to calculate.'}</div>
              </div>
              <button onClick={()=>setPage('ecolabel')} style={{marginLeft:'auto'}}>Full EcoLabel →</button>
            </div>

            {/* Hero tiles */}
            <div className="cards" style={{marginBottom:18}}>
              <Card icon={<Gauge/>}        title={`Total electricity ${dash.totals.label}`} value={fmtKwh(dash.totals.kwh + landingAIKwh)}       sub="All scanners, PACS, workstations."/>
              <Card icon={<Leaf/>}         title="Carbon (Scope 2)"                          value={fmtCo2(dash.scopes.scope2Kg + landingAICo2)}  sub={`Grid ${dash.ci} kgCO₂e/kWh · ${settings.region}.`}/>
              <Card icon={<Droplets/>}     title={`Electricity cost ${dash.totals.label}`}   value={fmtMoney(equivData.cost, equivData.sym)}      sub={`At ${equivData.sym}${equivData.pricePerKwh}/kWh. Editable under “What it means”.`}/>
              <Card icon={<TrendingDown/>} title={`Avoidable idle ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleWasteKwh)}             sub="Recoverable by standby / power-off — see Interventions."/>
            </div>

            {/* Next steps */}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={()=>openDash('energy')} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none'}}>Open energy detail →</button>
              <button onClick={()=>openDash('carbon')} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none'}}>Open carbon detail →</button>
              <button onClick={()=>setPage('scenario')}><TrendingDown size={15}/> Reduce it — Interventions →</button>
            </div>
          </section>

          {/* ── Accordion: detail sections (click to open) ── */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:22,marginBottom:2}}>
            <h3 style={{margin:0,color:'#2E7D32',fontSize:14}}>Details</h3>
            <button onClick={()=>{const all=DASH_SECTIONS.every(id=>dashOpen[id]); setDashOpen(all?{}:Object.fromEntries(DASH_SECTIONS.map(id=>[id,true])));}} style={{background:'none',border:'1px solid #c8e6c9',color:'#2E7D32',boxShadow:'none',fontSize:12,padding:'6px 12px'}}>
              {DASH_SECTIONS.every(id=>dashOpen[id]) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {/* ── What it means (equivalencies) ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('equiv')} aria-expanded={!!dashOpen['equiv']}>
            <span className="accCaret">{dashOpen['equiv']?'▾':'▸'}</span>
            <span className="accTitle">What it means — everyday equivalents</span>
            <span className="accVal">≈ {fmtBig(equivData.car_km)} km driven</span>
          </button>
          {dashOpen['equiv'] && (
          <section id="dash-equiv" className="aiSection" style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:4}}>What it means in everyday terms</h2>
            <p className="note" style={{marginBottom:16}}>
              Inspired by the <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator" style={{color:'#2E7D32'}} target="_blank" rel="noreferrer">EPA Greenhouse Gas Equivalencies Calculator</a>.
              Switch between Scope 2 (electricity only) or all scopes below.
            </p>

            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              <button className={equivScope==='scope2'?'on':''} onClick={()=>setEquivScope('scope2')} style={{padding:'7px 14px',fontSize:13}}>Scope 2 — electricity only</button>
              <button className={equivScope==='all'?'on':''} onClick={()=>setEquivScope('all')} style={{padding:'7px 14px',fontSize:13}}>All scopes — full lifecycle</button>
            </div>
            <p className="note" style={{marginBottom:24,fontSize:12}}>
              {equivScope==='scope2' ? 'Showing Scope 2 (purchased electricity). Best for comparing with published benchmarks.' : 'Showing Scope 1 + 2 + 3 (direct + electricity + embodied + patient travel). Full lifecycle view.'}
              {' '}Change settings on the <button onClick={()=>setPage('landing')} style={{background:'none',border:'none',color:'#2E7D32',cursor:'pointer',padding:'0 2px',fontSize:12,fontWeight:600,boxShadow:'none'}}>Home page →</button>
            </p>

            {/* Electricity cost — kWh × regional price (editable). Independent of the carbon toggle. */}
            <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:6,padding:'16px 20px',background:'#e8f5e9',border:'1.5px solid #c8e6c9',borderRadius:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:34,fontWeight:900,color:'#1b5e20',lineHeight:1}}>≈ {fmtMoney(equivData.cost, equivData.sym)}</span>
                <div style={{fontSize:13,color:'#607d66'}}>in electricity{dash.totals.label}<br/><span style={{fontSize:11}}>at {equivData.sym}{equivData.pricePerKwh}/kWh · {settings.region}</span></div>
              </div>
              <label style={{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:8,fontSize:12,color:'#2E7D32',fontWeight:700}}>
                Electricity price ({equivData.sym}/kWh)
                <input type="number" min="0" step="0.01" value={settings.electricityPrice} onChange={e=>set('electricityPrice',e.target.value)} placeholder={String(ELECTRICITY_PRICE[settings.region]?.price ?? 0.20)} style={{width:90,padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,background:'white',fontWeight:400}}/>
              </label>
            </div>
            <p className="note" style={{fontSize:11,marginTop:0,marginBottom:20}}>Electricity cost only — an editable estimate. Commercial tariffs vary by region and contract; enter yours to override the {settings.region} default. Cost and carbon are independent (a low-carbon grid is not necessarily cheap).</p>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:20,marginBottom:32}}>
              {[
                {icon:<Car style={{width:40,height:40}}/>,     n:fmtBig(equivData.car_km),        unit:`km driven by car${dash.totals.label}`,      note:'Avg petrol car at 0.17 kgCO₂/km (DEFRA 2023).', bg:'#e8f5e9'},
                {icon:<Plane style={{width:40,height:40}}/>,   n:fmtBig(equivData.flights_short), unit:`short-haul flights${dash.totals.label}`,     note:'Economy seat, ~255 kgCO₂e each (ICAO 2023).',   bg:'#e0f7fa'},
                {icon:<TreePine style={{width:40,height:40}}/>,n:fmtBig(equivData.trees_year),    unit:'trees absorbing for 1 year',                 note:'One mature tree sequesters ~21 kgCO₂/yr.',       bg:'#f1f8e9'},
                {icon:<Home style={{width:40,height:40}}/>,    n:fmtBig(equivData.homes),         unit:`home electricity years${dash.totals.label}`, note:'EU average household: 3,500 kWh/yr.',            bg:'#fff8e1'},
              ].map((c,i)=>(
                <div key={i} style={{background:c.bg,borderRadius:28,padding:'32px 20px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:10,boxShadow:'0 8px 30px #1b5e2012'}}>
                  <div style={{color:'#2E7D32'}}>{c.icon}</div>
                  <div style={{fontSize:46,fontWeight:900,color:'#1b5e20',lineHeight:1}}>{c.n}</div>
                  <div style={{fontWeight:700,fontSize:15,color:'#263238'}}>{c.unit}</div>
                  <div style={{fontSize:12,color:'#607d66',lineHeight:1.5}}>{c.note}</div>
                </div>
              ))}
            </div>

            {landingAIOpen && landingAICo2>0 && (
              <p className="note" style={{marginBottom:20,padding:'10px 14px',background:'#f1f8f1',borderRadius:12}}>
                AI tools add approx. <strong>{fmtCo2(landingAICo2)}</strong>{dash.totals.label} on top of the figures above.{' '}
                <button onClick={()=>setPage('ai')} style={{background:'none',border:'none',color:'#2E7D32',cursor:'pointer',padding:'0 2px',fontSize:13,fontWeight:600,boxShadow:'none'}}>Full AI analysis →</button>
              </p>
            )}

            <section style={{marginBottom:28}}>
              <h2 style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Car style={{color:'#2E7D32'}}/> Transport</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
                {[
                  {icon:<Car/>,   n:fmtBig(equivData.car_years),    unit:'cars driven for a full year',     note:'EU avg passenger car emits 2.1 tCO₂e/yr (EEA 2023).'},
                  {icon:<Plane/>, n:fmtBig(equivData.flights_short), unit:'short-haul economy flights',      note:'~255 kgCO₂e per seat (ICAO 2023). London–Rome class.'},
                  {icon:<Plane/>, n:fmtBig(equivData.flights_long),  unit:'transatlantic long-haul flights', note:'~1,200 kgCO₂e per economy seat (ICAO 2023).'},
                  {icon:<Car/>,   n:fmtBig(equivData.car_km),        unit:'km driven at 0.17 kgCO₂/km',     note:'Avg UK petrol car (DEFRA 2023). Diesel ~0.17 similar.'},
                ].map((c,i)=>(
                  <div key={i} className="card" style={{textAlign:'center',padding:'20px 16px'}}>
                    <div style={{color:'#2E7D32',marginBottom:6}}>{c.icon}</div>
                    <div style={{fontSize:34,fontWeight:900,color:'#1b5e20',lineHeight:1.1}}>{c.n}</div>
                    <div style={{fontWeight:700,fontSize:13,color:'#263238',margin:'6px 0'}}>{c.unit}</div>
                    <div style={{fontSize:11,color:'#607d66',lineHeight:1.5}}>{c.note}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{marginBottom:28}}>
              <h2 style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Home style={{color:'#2E7D32'}}/> Home &amp; everyday life</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
                {[
                  {icon:<Lightbulb/>,n:fmtBig(equivData.led_years),    unit:'LED bulb-switches',     note:'Switching one 60 W incandescent to 10 W LED saves ~50 kWh/yr each.'},
                  {icon:<Activity/>, n:fmtBig(equivData.phone_charges), unit:'smartphone charges',    note:'Full charge of a modern smartphone at ~12 Wh each.'},
                  {icon:<Monitor/>,  n:fmtBig(equivData.stream_hours),  unit:'hours of TV streaming', note:'TV device consumes ~100 W. Equivalent screen time.'},
                  {icon:<Coffee/>,   n:fmtBig(equivData.tea_cups),      unit:'cups of tea or coffee', note:'Boiling 250 ml in a kettle uses ~0.025 kWh per cup.'},
                  {icon:<Cpu/>,      n:fmtBig(equivData.laptop_days),   unit:'laptop working days',   note:'30 W laptop × 8 h/day = 0.24 kWh/day average.'},
                ].map((c,i)=>(
                  <div key={i} className="card" style={{textAlign:'center',padding:'20px 16px'}}>
                    <div style={{color:'#26A69A',marginBottom:6}}>{c.icon}</div>
                    <div style={{fontSize:34,fontWeight:900,color:'#1b5e20',lineHeight:1.1}}>{c.n}</div>
                    <div style={{fontWeight:700,fontSize:13,color:'#263238',margin:'6px 0'}}>{c.unit}</div>
                    <div style={{fontSize:11,color:'#607d66',lineHeight:1.5}}>{c.note}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{marginBottom:28}}>
              <h2 style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><TreePine style={{color:'#2E7D32'}}/> Nature &amp; carbon sinks</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
                {[
                  {icon:<TreePine/>,n:fmtBig(equivData.trees_year), unit:'trees absorbing CO₂ for 1 year', note:'One mature tree sequesters ~21 kgCO₂/yr (IPCC avg).'},
                  {icon:<Leaf/>,    n:fmtBig(equivData.forest_ha),  unit:'hectares of temperate forest',   note:'1 ha temperate forest sequesters ~5.5 tCO₂/yr (FAO).'},
                ].map((c,i)=>(
                  <div key={i} className="card" style={{textAlign:'center',padding:'20px 16px',background:'#f9fbe7'}}>
                    <div style={{color:'#33691e',marginBottom:6}}>{c.icon}</div>
                    <div style={{fontSize:34,fontWeight:900,color:'#1b5e20',lineHeight:1.1}}>{c.n}</div>
                    <div style={{fontWeight:700,fontSize:13,color:'#263238',margin:'6px 0'}}>{c.unit}</div>
                    <div style={{fontSize:11,color:'#607d66',lineHeight:1.5}}>{c.note}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{marginBottom:28}}>
              <h2 style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Flame style={{color:'#c62828'}}/> Fossil fuel equivalent</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
                {[
                  {icon:<Droplets/>,n:fmtBig(equivData.barrels_oil), unit:'barrels of crude oil burned', note:'1 barrel crude oil combustion ≈ 430 kgCO₂e (EPA).'},
                  {icon:<Flame/>,   n:fmtBig(equivData.tonnes_coal), unit:'tonnes of coal burned',       note:'Bituminous coal ≈ 2,350 kgCO₂/tonne combustion (IPCC).'},
                ].map((c,i)=>(
                  <div key={i} className="card" style={{textAlign:'center',padding:'20px 16px',background:'#fff3e0'}}>
                    <div style={{color:'#e65100',marginBottom:6}}>{c.icon}</div>
                    <div style={{fontSize:34,fontWeight:900,color:'#bf360c',lineHeight:1.1}}>{c.n}</div>
                    <div style={{fontWeight:700,fontSize:13,color:'#263238',margin:'6px 0'}}>{c.unit}</div>
                    <div style={{fontSize:11,color:'#607d66',lineHeight:1.5}}>{c.note}</div>
                  </div>
                ))}
              </div>
            </section>

            <p className="note" style={{borderTop:'1px solid #c8e6c9',paddingTop:16}}>
              Sources: DEFRA 2023 (car emissions); ICAO 2023 (aviation); EEA 2023 (EU household energy); IPCC (coal &amp; forest carbon); EPA (crude oil); FAO (forest sequestration).
            </p>
          </section>

          )}

          {/* ── Efficiency — energy into healthcare ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('efficiency')} aria-expanded={!!dashOpen['efficiency']}>
            <span className="accCaret">{dashOpen['efficiency']?'▾':'▸'}</span>
            <span className="accTitle">Efficiency — energy into healthcare</span>
            <span className="accVal">{deptLabelData.co2PerStudy} kgCO₂e/study</span>
          </button>
          {dashOpen['efficiency'] && (
          <section id="dash-efficiency" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
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

          {/* ── Clinical AI tools (deployed — adjust the whole department) ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('clinicalai')} aria-expanded={!!dashOpen['clinicalai']}>
            <span className="accCaret">{dashOpen['clinicalai']?'▾':'▸'}</span>
            <span className="accTitle">Clinical AI tools</span>
            <span className="accVal">{(deptLabel.aiTools||[]).length} deployed</span>
          </button>
          {dashOpen['clinicalai'] && (
          <section id="dash-clinicalai" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:4,display:'flex',alignItems:'center',gap:8}}><Brain style={{color:'#2E7D32'}}/> Clinical AI tools <span style={{fontWeight:400,fontSize:14,color:'#607d66'}}>(deployed — adjusts the whole department)</span></h2>
            <p className="note" style={{marginBottom:12}}>
              Each deployed tool <strong>adds</strong> inference + amortised-training compute and <strong>subtracts</strong> clinical savings — avoided low-value scans, shorter protocols, and contrast reduction. The net effect flows into energy, efficiency, contrast, and your EcoLabel.
              {dash.clinicalMeta.active && <> <strong style={{color:'#2E7D32'}}>Net now: +{fmtKwh(dash.clinicalMeta.aiKwh)} compute − {fmtKwh(dash.clinicalMeta.scannerSavedKwh)} scanner{dash.totals.label}{dash.clinicalMeta.avoidedPct>0?` · ${dash.clinicalMeta.avoidedPct}% scans avoided`:''}{dash.clinicalMeta.contrastPct>0?` · ${dash.clinicalMeta.contrastPct}% less contrast`:''}.</strong></>}
            </p>

            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <select value="" disabled={(deptLabel.aiTools||[]).length>=5} onChange={e=>{
                const m = AI_MODEL_BY_KEY[e.target.value];
                if (!m) return;
                addDeptAiTool({
                  id: Date.now(), label: m.label,
                  inferKwhPerStudy: String(m.unit==='tokens'
                    ? rnd((m.callsPerTask||1)*(m.tokensPerCall||0)/1000*(m.whPer1kTokens||0)/1000*1.2, 4) // tokens/study × Wh/1k × PUE
                    : rnd(m.gpuKw * m.inferSec / 3600 * 1.2, 4)), // gpuKw × s/study × PUE
                  trainKwhTotal: String(Math.round(m.trainMwh * 1000)),
                  embCo2Kg: String(m.embCo2Kg), deployMonths: '36',
                  scanTimeReductPct: String(m.scanTimeReductPct), lowValueReductPct: String(m.lowValueReductPct),
                  contrastReductPct: '0', studiesShare: '100',
                });
              }} style={{padding:'8px 12px',border:'1px solid #c8e6c9',borderRadius:14,background:'white',fontSize:13,fontWeight:700,color:'#2E7D32',cursor:'pointer',opacity:(deptLabel.aiTools||[]).length>=5?0.5:1}}>
                <option value="">+ Add from model library…</option>
                {AI_MODEL_LIBRARY.filter(m=>m.key!=='custom').map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <button disabled={(deptLabel.aiTools||[]).length>=5} onClick={()=>addDeptAiTool({
                id: Date.now(), label: AI_MODEL_BY_KEY[scen.modelKey]?.label ?? 'AI model',
                inferKwhPerStudy: String(ai.inference.kwhPerStudy), trainKwhTotal: String(ai.training.kwhTotal),
                embCo2Kg: String(ai.embCo2KgTotal), deployMonths: String(scen.deployMonths || '36'),
                scanTimeReductPct: String(ai.scanTimeReductPct), lowValueReductPct: String(ai.lowValueReductPct), contrastReductPct: '0', studiesShare: '100',
              })} style={{display:'inline-flex',alignItems:'center',gap:6,opacity:(deptLabel.aiTools||[]).length>=5?0.5:1}}>
                <ArrowRight size={13}/> Import current AI model
              </button>
              <button disabled={(deptLabel.aiTools||[]).length>=5} onClick={()=>addDeptAiTool({
                id: Date.now(), label: '', inferKwhPerStudy: '', trainKwhTotal: '', embCo2Kg: '0',
                deployMonths: '36', scanTimeReductPct: '0', lowValueReductPct: '0', contrastReductPct: '0', studiesShare: '100',
              })} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none',border:'1px dashed #a5d6a7',opacity:(deptLabel.aiTools||[]).length>=5?0.5:1}}>
                <Plus size={13}/> Add clinical AI tool
              </button>
              <span style={{fontSize:12,color:'#607d66',alignSelf:'center'}}>{(deptLabel.aiTools||[]).length} / 5</span>
            </div>

            {(deptLabel.aiTools||[]).map(t => (
              <div key={t.id} style={{border:'1px solid #c8e6c9',borderRadius:12,padding:'12px 14px',marginBottom:10,background:'#fafffa'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <input value={t.label} placeholder="Clinical AI tool name" onChange={e=>updateDeptAiTool(t.id,'label',e.target.value)} style={{flex:1,padding:'6px 10px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:13,fontWeight:600}}/>
                  <button onClick={()=>removeDeptAiTool(t.id)} title="Remove" style={{background:'none',color:'#aaa',padding:4,borderRadius:8,boxShadow:'none',lineHeight:1}}><Trash2 size={15}/></button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>
                  {[
                    ['Inference kWh/study','inferKwhPerStudy','0.001','e.g. 0.02'],
                    ['Training energy (kWh)','trainKwhTotal','1','e.g. 500'],
                    ['Lifespan (months)','deployMonths','1','36'],
                    ['Share of studies (%)','studiesShare','1','100'],
                    ['Low-value scans avoided (%)','lowValueReductPct','1','0'],
                    ['Scan-time reduction (%)','scanTimeReductPct','1','0'],
                    ['Contrast reduction (%)','contrastReductPct','1','0'],
                    ['Embodied GPU (kg)','embCo2Kg','1','0'],
                  ].map(([lab,key,step,ph])=>(
                    <label key={key} style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      {lab}
                      <input type="number" min="0" step={step} value={t[key]??''} placeholder={ph} onChange={e=>updateDeptAiTool(t.id,key,e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:12,background:'white'}}/>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {(deptLabel.aiTools||[]).length === 0 && <p className="note" style={{fontSize:12}}>No clinical AI deployed — the department reflects equipment only. Import the current AI model or add one manually to see its net effect.</p>}
          </section>

          )}

          {/* ── 1. Energy consumption ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('energy')} aria-expanded={!!dashOpen['energy']}>
            <span className="accCaret">{dashOpen['energy']?'▾':'▸'}</span>
            <span className="accTitle">Energy consumption</span>
            <span className="accVal">{fmtKwh(dash.totals.kwh + landingAIKwh)}</span>
          </button>
          {dashOpen['energy'] && (
          <section id="dash-energy" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>1. Energy consumption</h2>
            <div className="cards">
              <Card icon={<Gauge/>}        title={`Total electricity ${dash.totals.label}`}  value={fmtKwh(dash.totals.kwh + landingAIKwh)}  sub={`Scanners, PACS, workstations${dash.storage.kwh>0?', and data storage':''}${landingAIOpen?', and AI tools':''}.`} style={{gridColumn:'span 4'}}/>
              <Card icon={<Activity/>}     title={`Active scanning ${dash.totals.label}`}    value={fmtKwh(dash.totals.activeKwh)}            sub={`${dash.totals.activePct}% of total — energy during actual scan acquisition.`}/>
              <Card icon={<TrendingDown/>} title={`Idle + standby ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleKwh)}              sub={`${dash.totals.idlePct}% of total — between scans and overnight. Primary optimisation target.`}/>
              <Card icon={<TrendingDown/>} title={`Avoidable idle ${dash.totals.label}`}     value={fmtKwh(dash.totals.idleWasteKwh)}         sub="Recoverable by standby / power-off policies."/>
              {dash.storage.kwh > 0 && <Card icon={<Database/>} title={`Data storage / archive ${dash.totals.label}`} value={fmtKwh(dash.storage.kwh)} sub={`${dash.storage.storedTB} TB held over ${dash.storage.retentionYears} yr (${dash.storage.cloud?'cloud':'on-prem'}) at ${dash.storage.intensity} kWh/TB/yr. Part of the total above — configure in Infrastructure.`}/>}
              <Card icon={<Activity/>}     title="Energy per imaging scan"                   value={`${dash.totals.energyPerScan} kWh`}       sub="Total ÷ all scans. Use for modality benchmarking and protocol optimisation."/>
              {landingAIOpen && Object.keys(landingAITools).length>0 && <Card icon={<Cpu/>} title={`AI tools estimate ${dash.totals.label}`} value={fmtKwh(landingAIKwh)} sub={`${Object.keys(landingAITools).length} tool(s): ${Object.keys(landingAITools).map(k=>AI_PRESETS.find(p=>p.key===k)?.label??k).join(', ')}. For full analysis use AI Dashboard.`}/>}
              {sciPerStudy !== null && <Card icon={<Target/>} title="SCI — carbon per imaging study" value={`${sciPerStudy} kgCO₂e`} sub={`Software Carbon Intensity (Green Software Foundation): operational CO₂ (${dash.totals.energyPerScan} kWh × ${dash.ci} CI) + embodied carbon per study. Lower is better. (Doo et al. JACR 2024)`} style={{gridColumn:'span 4'}}/>}
            </div>
          </section>

          )}

          {/* ── 2. Carbon emissions ── */}
          <button type="button" className="accHead" onClick={()=>toggleDash('carbon')} aria-expanded={!!dashOpen['carbon']}>
            <span className="accCaret">{dashOpen['carbon']?'▾':'▸'}</span>
            <span className="accTitle">Carbon emissions — GHG scopes</span>
            <span className="accVal">{fmtCo2(dash.scopes.scope2Kg + landingAICo2)} Scope 2</span>
          </button>
          {dashOpen['carbon'] && (
          <section id="dash-carbon" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:12}}>2. Carbon emissions — GHG Protocol scopes</h2>
            <p className="note" style={{marginBottom:12}}>Scope 1: direct fuel (estimated). Scope 2: purchased electricity. Scope 3: embodied carbon + patient travel + staff commute + DICOM data transfer (all estimated). All {dash.totals.label}. Framework: Doo et al. JACR 2024.</p>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,background:'#f1f8f1',borderRadius:12,padding:'8px 16px',flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#607d66'}}>
                Staff commute — <strong style={{color:'#263238'}}>{derivedStaffCount} FTE estimated</strong> from {Object.values(settings.equipment).reduce((s,n)=>s+(n||0),0)} devices (NHS/BIR workforce ratios)
              </span>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'#2E7D32',marginLeft:'auto'}}>
                Avg one-way commute
                <input type="number" min="0" step="1" value={settings.staffCommuteKm} onChange={e=>set('staffCommuteKm',e.target.value)}
                  style={{width:60,padding:'4px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:12,background:'white'}}/>
                km
              </label>
            </div>
            <div className="cards">
              <Card icon={<Factory/>}    title="Scope 1 — Direct"          value={fmtCo2(dash.scopes.scope1Kg)}       sub="Backup generators, medical gas. Estimated 8% of Scope 2 (McKee 2024)."/>
              <Card icon={<Gauge/>}      title="Scope 2 — Electricity"     value={fmtCo2(dash.scopes.scope2Kg + landingAICo2)}  sub={`Grid at ${dash.ci} kgCO₂e/kWh (${settings.region}).${landingAICo2>0?` Includes ${fmtCo2(landingAICo2)} from AI tools.`:' Primary measured scope.'}`}/>
              <Card icon={<Cpu/>}        title="Scope 3 — Embodied carbon" value={fmtCo2(dash.scopes.scope3EmbKg)}    sub="Hardware manufacturing amortised over lifespan. Extend lifetime to reduce."/>
              <Card icon={<Car/>}        title="Scope 3 — Patient travel"  value={fmtCo2(dash.scopes.scope3TravelKg)} sub={`${dash.scopes.imagingScans.toLocaleString()} scans × ${PATIENT_KM_RT} km avg round trip.`}/>
              <Card icon={<Car/>}        title="Scope 3 — Staff commute"   value={fmtCo2(staffCommuteCo2)}            sub={`~${derivedStaffCount} staff (estimated from device fleet) × ${settings.staffCommuteKm} km one-way × ${STAFF_DAYS_PER_MO} days/mo. DEFRA 2023.`}/>
              <Card icon={<Wifi/>}       title="Scope 3 — Data transfer"   value={fmtCo2(networkTransferCo2)}         sub={`${dash.scopes.imagingScans.toLocaleString()} studies × ${AVG_STUDY_GB} GB avg × 0.001 kWh/GB. DICOM network energy (Aslan et al. 2018).`}/>
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
              <Card icon={<Gauge/>}        title="Scope 3 total"      value={fmtCo2(dash.scopes.scope3Kg + staffCommuteCo2 + networkTransferCo2)} sub="Embodied + patient travel + staff commute + DICOM data transfer. Often larger than Scope 2 in a full lifecycle view."/>
            </div>

            {/* Data storage & archiving — fleet-driven long-term PACS/archive footprint */}
            <div className="inputSummary" style={{marginTop:16}}>
              <h3 style={{marginTop:0,marginBottom:6,color:'#1b5e20',fontSize:15}}>Data storage &amp; archiving</h3>
              <p className="note" style={{marginBottom:12,fontSize:12}}>
                Long-term PACS/archive footprint, derived from your fleet's study volumes × per-modality file sizes, held over the retention period and added to the department total above. Separate from the PACS/reading servers and from DICOM transfer. Editable estimates — Jia et al. <em>Eur Radiol</em> 2026; Doo et al. <em>JACR</em> 2024.
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
              </div>
              <div className="cards">
                <Card icon={<HardDrive/>}    title="Data generated / year" value={`${dash.storage.annualDataTB} TB`} sub="Σ studies/yr × per-modality file size (Doo 2024)."/>
                <Card icon={<Database/>}     title="Archive held"          value={`${dash.storage.storedTB} TB`}   sub={`${dash.storage.retentionYears}-yr retention · ${dash.storage.cloud?'cloud':'on-premises'} (${dash.storage.intensity} kWh/TB/yr).`}/>
                <Card icon={<Zap/>}          title={`Storage energy ${dash.totals.label}`} value={fmtKwh(dash.storage.kwh)} sub={`Included in the department total. ${fmtCo2(dash.storage.co2)}.`}/>
                <Card icon={<Droplets/>}     title={`Storage cost ${dash.totals.label}`}   value={fmtMoney(dash.storage.kwh * getPrice(settings.region, settings.electricityPrice), currencySym(settings.region))} sub="Electricity cost at your tariff; cloud service fees billed separately."/>
              </div>
              <p className="note" style={{marginTop:8,fontSize:11}}>
                These toggles set your <strong>current</strong> storage practice. The same three strategies also appear as tickable actions on the <strong>Interventions</strong> and <strong>EcoLabel</strong> tabs, where their savings are modelled as a <em>change from</em> this current setup (so they never double-count). Levers: <strong>axial-only</strong> avoids non-essential CT/PET reformats (up to ~69% less CT storage, Jia 2026); <strong>cloud</strong> archives run ~40% lower energy; <strong>shorter retention</strong> shrinks the held archive. Excludes backups and embodied storage-hardware carbon (so this undercounts).
              </p>
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
              <Card icon={<Droplets/>} title={`Water footprint ${dash.totals.label}`}      value={fmtL(dash.resources.waterLitres)}  sub={`${WATER_PER_KWH} L/kWh cooling estimate. Google Cloud 0.45 L/kWh; local servers ~2 L/kWh.`}/>
              <Card icon={<FileText/>} title={`Paper consumption ${dash.totals.label}`}    value={`${dash.resources.paperKg} kg`}    sub={`~${PAPER_G_PER_ENC}g/encounter digital workflow. Full film-based: ~200g. (ESR Green Imaging)`}/>
              <Card icon={<Trash2/>}   title={`Hazardous waste ${dash.totals.label}`}      value={`${dash.resources.hazardousKg} kg`} sub="Contrast media disposal, sharps. Replace with waste manifest data."/>
              <Card icon={<Leaf/>}     title={`Total Scope 2 carbon ${dash.totals.label}`} value={fmtCo2(dash.scopes.scope2Kg)}      sub="All electricity-derived emissions. Primary target for renewable energy procurement."/>
            </div>

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
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:8}}>
            <h1 style={{margin:0}}>AI Model &amp; Informatics <span className="badge">{settings.region}</span></h1>
            <div style={{display:'flex',gap:8}}>
              <button className="download" onClick={()=>downloadAICSV(ai, scen, settings.region)} style={{padding:'8px 14px',fontSize:13}}><Download/>CSV</button>
              <button className="download" onClick={handlePrint} style={{padding:'8px 14px',fontSize:13}}><Download/>Print / PDF</button>
            </div>
          </div>
          <p className="note" style={{marginBottom:16}}>Recycling Pyramid priority: Prevent unnecessary scans → Reduce scan energy → Recover/recycle prior data. (Implementation Guide §1)</p>

          {/* ── Sticky controls: selectors + summary bar + tabs ── */}
          <div className="stickyControls" style={{padding:'12px 16px'}}>
            {/* Model library picker + precision + cloud */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
              <label style={{display:'flex',flexDirection:'column',fontWeight:700,color:'#2E7D32',gap:8}}>
                Model <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>— task-family template, fully editable</span>
                <select value={scen.modelKey} onChange={e=>setModel(e.target.value)}>
                  {AI_MODEL_LIBRARY.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </label>
              <Sel label="Precision / AMP"    value={scen.precision}     options={META.precisions}     onChange={v=>setS('precision',v)}/>
              <Sel label="Cloud / deployment" value={scen.cloudProvider} options={META.cloudProviders} onChange={setCloudProvider}/>
            </div>
            <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
              {AI_MODEL_BY_KEY[scen.modelKey]?.reference ? <>Reference: <strong>{AI_MODEL_BY_KEY[scen.modelKey].reference}</strong> · {AI_MODEL_BY_KEY[scen.modelKey].refCite} · </> : null}
              {scen.architecture} · {sizeLabel(scen.paramsM)} · {scen.dim}
            </p>

            {/* Collapsible advanced model parameters */}
            <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #eef7ee'}}>
              <button onClick={()=>setModelExpanded(v=>!v)} style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:6,width:'100%'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#607d66'}}>Advanced model parameters</span>
                <span style={{fontSize:10,color:'#90a4ae'}}>{ai.unit==='tokens'
                  ? `${ai.callsPerTask} call${ai.callsPerTask===1?'':'s'} × ${ai.tokensPerCall.toLocaleString()} tok · ${ai.tokensPerStudy.toLocaleString()} tok/study · ${rnd(ai.inference.kwhPerStudy*1000,2)} Wh`
                  : `${scen.paramsM}M params · ${scen.dim==='3D'?`${scen.resolution}×${scen.resolution}×${scen.slices} voxels`:`${scen.resolution}px`} · ${ai.inferSec}s/study${ai.inferSecAuto?' (auto)':' (manual)'}`}</span>
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
                      Parameters (M)
                      <input type="number" min="0" step="1" value={scen.paramsM} onChange={e=>setS('paramsM',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
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
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11,opacity:scen.dim==='3D'?1:0.5}}>
                      {scen.dim==='3D' ? 'Through-plane slices' : 'Slices (3D only)'}
                      <input type="number" min="1" value={scen.slices} disabled={scen.dim!=='3D'} onChange={e=>setS('slices',e.target.value)} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:scen.dim==='3D'?'white':'#f5f5f5'}}/>
                    </label>
                    <label style={{display:'flex',flexDirection:'column',gap:3,fontWeight:700,color:'#2E7D32',fontSize:11}}>
                      Inference time (s/study)
                      <input type="number" min="0" step="0.1" value={scen.inferSec} onChange={e=>setS('inferSec',e.target.value)} placeholder={`auto: ${ai.inferSecDerived}`} style={{padding:'5px 8px',border:'1px solid #c8e6c9',borderRadius:8,fontSize:11,background:'white'}}/>
                    </label>
                  </div>
                  {scen.dim==='3D' && (() => {
                    const r = parseFloat(scen.resolution)||0, s = parseFloat(scen.slices)||0, v = r*r*s;
                    return <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>Volume <strong>{r} × {r} × {s}</strong> ≈ <strong>{v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v).toLocaleString()} voxels</strong>. Energy scales with voxel count (Green AI 2020; Selvan et al. 2022).</p>;
                  })()}
                  <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>
                    Inference time auto-scales with <strong>params × {scen.dim==='3D'?'in-plane² × slices (voxels)':'resolution²'}</strong> relative to {AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? 'the reference'} (≈ {ai.inferSecDerived}s/study{ai.inferSecAuto?', in use':''}). Enter a measured value to override.
                  </p>
                  </>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible training assumptions */}
            {(()=>{
              const gp = GPU_PRESETS[scen.trainGpu];
              const h  = parseFloat(scen.trainHours) || 0;
              const n  = Math.max(1, parseInt(scen.trainNumGpus) || 1);
              const pue = CLOUD[scen.cloudProvider]?.pue ?? 1.5;
              const estKwh = gp && h > 0 ? rnd(gp.tdpKw * n * h * pue, 1) : null;
              return (
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #eef7ee'}}>
                  <button onClick={()=>setTrainExpanded(v=>!v)} style={{
                    background:'none',border:'none',padding:0,cursor:'pointer',
                    display:'flex',alignItems:'center',gap:6,width:'100%',
                  }}>
                    <span style={{fontSize:11,fontWeight:700,color:'#607d66'}}>Training assumptions</span>
                    {estKwh !== null
                      ? <span style={{fontSize:10,background:'#e8f5e9',color:'#2E7D32',padding:'1px 8px',borderRadius:8,fontWeight:700}}>{estKwh} kWh</span>
                      : <span style={{fontSize:10,color:'#90a4ae'}}>model default · {(ai.trainMwhBase * 1000).toLocaleString()} kWh</span>
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
                      <p className="note" style={{fontSize:10,marginTop:4,marginBottom:0}}>GPU TDP × count × hours × PUE. PUE from cloud/deployment above. Lifespan affects amortisation.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Summary pills + tabs */}
            <div className="aiSummary" style={{marginTop:8,paddingTop:8}}>
              <span>Net impact <b style={{color: ai.netKgCo2e < 0 ? '#2E7D32' : '#c62828'}}>{ai.netKgCo2e} kgCO₂e/mo</b></span>
              <span>Efficiency <b>{ai.efficiencyRatio} acc%/kWh</b></span>
              <span>Cloud CI <b>{ai.cloudCi} kgCO₂e/kWh</b></span>
            </div>
          </div>

          {/* ── Accordion: lifecycle sections (click to open) ── */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',marginTop:4,marginBottom:2}}>
            <button onClick={()=>{const all=AI_SECTIONS.every(id=>aiOpen[id]); setAiOpen(all?{}:Object.fromEntries(AI_SECTIONS.map(id=>[id,true])));}} style={{background:'none',border:'1px solid #c8e6c9',color:'#2E7D32',boxShadow:'none',fontSize:12,padding:'6px 12px'}}>
              {AI_SECTIONS.every(id=>aiOpen[id]) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          {/* ── Model details ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('model')} aria-expanded={!!aiOpen['model']}>
            <span className="accCaret">{aiOpen['model']?'▾':'▸'}</span>
            <span className="accTitle">Model details &amp; reported performance</span>
            <span className="accVal">{ai.modelSize}</span>
          </button>
          {aiOpen['model'] && (
          <section id="ai-model" className="aiSection" style={{background:'none',boxShadow:'none',padding:0}}>
            <h2 style={{marginBottom:12}}>Model details</h2>
            <div className="cards">
              <Card icon={<Brain/>}      title="Architecture"         value={scen.architecture}                         sub={ai.archDesc}/>
              <Card icon={<Cpu/>}        title="Model size"           value={ai.modelSize}                              sub={`${ai.paramsM.toLocaleString()}M params · ${ai.dim} · ${ai.dim==='3D'?`${ai.resolution}×${ai.resolution}×${ai.slices} voxels`:`${ai.resolution}px input`}.`}/>
              <Card icon={<Target/>}     title={`Reported ${ai.accuracyMetric}`} value={`${rnd(ai.accuracy*100,1)}%`}     sub={`Your reported value — default from ${AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? 'reference'}. Edit below. CEDARS does not predict performance.`}/>
              <Card icon={<BarChart3/>}  title="Efficiency ratio"     value={`${ai.efficiencyRatio} acc%/kWh`}          sub={`Reported ${ai.accuracyMetric} % per monthly inference kWh. Use to compare models. (Green AI metric)`}/>
            </div>

            {/* Editable reported performance — decoupled from model size */}
            <div className="inputSummary" style={{marginTop:16}}>
              <h3 style={{marginTop:0,marginBottom:4,color:'#1b5e20',fontSize:15}}>Reported performance &amp; clinical benefit</h3>
              <p className="note" style={{marginBottom:12,fontSize:12}}>
                These are <strong>your reported numbers</strong>, not predictions — defaults come from {AI_MODEL_BY_KEY[scen.modelKey]?.reference ?? 'the reference'} ({AI_MODEL_BY_KEY[scen.modelKey]?.refCite ?? '—'}). Replace with your own validation results.
              </p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Performance value (%)
                  <input type="number" min="0" max="100" step="0.1" value={scen.accuracyPct} onChange={e=>setS('accuracyPct',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}/>
                </label>
                <label style={{display:'flex',flexDirection:'column',gap:4,fontWeight:700,color:'#2E7D32',fontSize:12}}>
                  Metric
                  <select value={scen.accuracyMetric} onChange={e=>setS('accuracyMetric',e.target.value)} style={{padding:'7px 10px',border:'1px solid #c8e6c9',borderRadius:10,fontSize:13,background:'white'}}>
                    {['AUC','Accuracy','Sensitivity','Specificity','Dice','IoU','SSIM','PSNR','RadGraph F1','Other'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
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
              <Card icon={<Leaf/>}       title="Training CO₂e"            value={`${ai.training.kgCo2e} kgCO₂e`}                sub={`At ${ai.cloudCi} kgCO₂e/kWh (${scen.cloudProvider}). Consider low-CI region for training jobs.`}/>
              <Card icon={<Gauge/>}      title="Estimated GPU compute"    value={`~${ai.training.gpuHours.toLocaleString()} h`}  sub="Estimated GPU hours at model GPU power draw. Actual depends on parallelism and hardware."/>
              <Card icon={<Activity/>}   title="Amortised / month"        value={`${ai.training.kwhAmortised} kWh/mo`}           sub="Training cost spread over 36-month deployment lifespan for lifecycle comparison."/>
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
              <Card icon={<Zap/>}        title="Test set energy"          value={`${ai.testing.kwhTotal} kWh`}                   sub={`${ai.testing.studies} studies. One-time cost; small fraction of training energy.`}/>
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
              <Card icon={<Activity/>}   title="Energy per study"         value={`${ai.inference.kwhPerStudy} kWh`}              sub="Per-inference energy including PUE and AMP factor. Scales with every request."/>
              <Card icon={<Zap/>}        title="Monthly inference energy" value={`${ai.inference.kwhMonthly} kWh`}               sub={`Across ${ai.inference.studies.toLocaleString()} studies/month at ${scen.cloudProvider}.`}/>
              <Card icon={<Gauge/>}      title="Lifetime inference total" value={`${ai.inference.kwhLifetime.toLocaleString()} kWh`} sub="36-month deployment. Inference typically exceeds training energy within 1–3 months."/>
              <Card icon={<Droplets/>}   title="Monthly water footprint"  value={`${ai.waterLitres} L`}                          sub={`${WATER_PER_KWH} L/kWh cooling estimate. Often overlooked environmental cost.`}/>
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
              <Card icon={<Cpu/>}         title="Embodied GPU carbon"        value={`${ai.embGpuKgCo2e} kgCO₂e/mo`}            sub={`Total ${ai.embCo2KgTotal} kgCO₂e manufacturing, amortised 36 months. (ESR PP 2025)`}/>
              <Card icon={<TrendingDown/>} title="Clinical savings"          value={`−${ai.savingsKgCo2e} kgCO₂e/mo`}          sub="Scanner time reduction + avoided scans. Replace with measured before/after metering."/>
              <section className="card">
                <div className="cardHead"><BarChart3/><span>Net AI impact / month</span></div>
                <b style={{color: ai.netKgCo2e < 0 ? '#2E7D32' : '#c62828'}}>{ai.netKgCo2e} kgCO₂e</b>
                <p>{ai.netKgCo2e < 0 ? "Net positive — clinical savings outweigh full AI footprint." : "Net negative — AI costs currently exceed measured savings."}</p>
              </section>
            </div>
            <h3 style={{marginTop:24,marginBottom:12,color:'#2E7D32',fontSize:15}}>What this AI footprint means in everyday terms</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
              {[
                {icon:<Car/>,      n:Math.round(ai.grossKgCo2e/0.17).toLocaleString(),          label:'km driven by car',       note:'Gross monthly CO₂ at 0.17 kgCO₂/km (DEFRA 2023)'},
                {icon:<Plane/>,    n:String(rnd(ai.grossKgCo2e/255,1)),                          label:'short-haul flights',     note:'~255 kgCO₂e per economy seat (ICAO 2023)'},
                {icon:<TreePine/>, n:Math.round(ai.grossKgCo2e/21).toLocaleString(),             label:'tree-years to offset',   note:'One mature tree sequesters ~21 kgCO₂/yr'},
                {icon:<Activity/>, n:Math.round(ai.inference.kwhMonthly/0.012).toLocaleString(), label:'smartphone charges',     note:'Monthly inference energy equivalent at 12 Wh/charge'},
              ].map((e,i)=>(
                <div key={i} style={{background:'#f1f8f1',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{color:'#2E7D32',flexShrink:0}}>{e.icon}</span>
                  <div>
                    <div style={{fontWeight:900,fontSize:22,color:'#1b5e20',lineHeight:1}}>{e.n}</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#263238',marginTop:2}}>{e.label}</div>
                    <div style={{fontSize:11,color:'#607d66',marginTop:1}}>{e.note}</div>
                  </div>
                </div>
              ))}
            </div>
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
              <Card icon={<TrendingDown/>} title="Scan time reduction"        value={`${ai.scanTimeReductPct}%`}                sub={`AI reconstruction/denoising. Saves ${ai.scanEnergySaved} kWh/month in scanner energy. (Radiol 2023: 45–89% range)`}/>
              <Card icon={<Leaf/>}         title="Low-value imaging avoided"  value={`${ai.lowValueReductPct}%`}               sub={`~${ai.scansAvoided} scans/month avoided. Reduces energy, contrast waste, and data storage. (McKee 2024: up to 20%)`}/>
              <Card icon={<Zap/>}          title="Scanner energy saved/month" value={`${ai.scanEnergySaved} kWh`}              sub="Direct hardware energy saving from shorter protocols and avoided acquisitions."/>
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
              Inspired by <a href="https://www.cloudcarbonfootprint.org/" style={{color:'#2E7D32'}} target="_blank" rel="noreferrer">Cloud Carbon Footprint</a>.
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

          {/* ── Model benchmark (moved from Compare) ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('benchmark')} aria-expanded={!!aiOpen['benchmark']}>
            <span className="accCaret">{aiOpen['benchmark']?'▾':'▸'}</span>
            <span className="accTitle">Model benchmark — accuracy vs carbon</span>
            <span className="accVal">Pareto</span>
          </button>
          {aiOpen['benchmark'] && (
          <section id="ai-benchmark" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:4}}>Model benchmark — accuracy vs carbon</h2>
            <p className="note" style={{marginBottom:8}}>
              Compare candidate AI models on the accuracy-vs-carbon trade-off. Every candidate is evaluated under the <strong>same department context</strong> ({settings.region}, your current equipment fleet) — only the model varies.
            </p>
            <p className="note" style={{marginBottom:16,fontSize:12}}>
              Performance values are <strong>user-reported</strong>, not predicted by CEDARS — set the current model's configuration in the tabs above, then add it as a candidate.
            </p>

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
              <button onClick={addBenchModel} disabled={benchModels.length>=6} style={{display:'inline-flex',alignItems:'center',gap:6,opacity:benchModels.length>=6?0.5:1}}>
                <Plus size={14}/> Add current model
              </button>
              <button onClick={()=>setBenchModels(['cad','seg3d','report'].map(benchCfgFromLib))} style={{background:'#e8f5e9',color:'#2E7D32',boxShadow:'none',border:'1px dashed #a5d6a7'}}>
                Reset to reference set
              </button>
              <span style={{fontSize:12,color:'#607d66'}}>{benchModels.length} / 6 candidates{benchModels.length>=6?' (max)':''}</span>
            </div>

            {benchResults.rows.length === 0 ? (
              <p className="note">No candidates. Add the current model, or reset to the reference set.</p>
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
                    <th style={{padding:'8px 10px'}}>Net CO₂e/mo</th>
                    <th style={{padding:'8px 10px'}}>Lifetime CO₂e</th>
                    <th style={{padding:'8px 10px'}}>Efficiency</th>
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
                        <td style={{padding:'7px 10px',...hi(r.accuracyPct===best.accuracyPct)}}>{r.accuracyPct}% <span style={{color:'#90a4ae',fontWeight:400,fontSize:11}}>{r.accuracyMetric}</span></td>
                        <td style={{padding:'7px 10px',...hi(r.trainCo2===best.trainCo2)}}>{fmtCo2(r.trainCo2)}</td>
                        <td style={{padding:'7px 10px'}}>{r.kwhPerStudy}</td>
                        <td style={{padding:'7px 10px',...hi(r.netCo2===best.netCo2)}}>{r.netCo2}</td>
                        <td style={{padding:'7px 10px',...hi(r.lifetimeCo2===best.lifetimeCo2)}}>{fmtCo2(r.lifetimeCo2)}</td>
                        <td style={{padding:'7px 10px',...hi(r.efficiency===best.efficiency)}}>{r.efficiency}</td>
                        <td style={{padding:'7px 10px'}}>
                          <button onClick={()=>removeBenchModel(r.id)} title="Remove" style={{background:'none',color:'#aaa',padding:4,borderRadius:8,boxShadow:'none',lineHeight:1}}><Trash2 size={15}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <section style={{marginBottom:16}}>
              <h2 style={{marginBottom:4}}>Accuracy vs carbon</h2>
              <p className="note" style={{marginBottom:12}}>Upper-left is best (high performance, low carbon). <strong style={{color:'#2E7D32'}}>★ green points</strong> are Pareto-efficient — no other candidate beats them on both axes.</p>
              {(()=>{
                const data = {datasets:[{
                  label:'Candidates',
                  data: benchResults.rows.map(r=>({x:r.lifetimeCo2, y:r.accuracyPct, _label:r.label})),
                  pointBackgroundColor: benchResults.rows.map(r=>r.pareto?'#2E7D32':'#b0bec5'),
                  pointBorderColor: benchResults.rows.map(r=>r.pareto?'#1b5e20':'#90a4ae'),
                  pointRadius: benchResults.rows.map(r=>r.pareto?8:6),
                  pointHoverRadius: 10,
                }]};
                const opts = {
                  responsive:true, maintainAspectRatio:false,
                  plugins:{legend:{display:false}, tooltip:{callbacks:{label: ctx => ` ${ctx.raw._label}: ${ctx.parsed.y}% · ${fmtCo2(ctx.parsed.x)} lifetime`}}},
                  scales:{
                    x:{title:{display:true,text:'Lifetime CO₂e (kg)'}, beginAtZero:true},
                    y:{title:{display:true,text:'Reported performance (%)'}},
                  },
                };
                return <div style={{height:320}}><Suspense fallback={<div style={{height:320}}/>}><Scatter data={data} options={opts}/></Suspense></div>;
              })()}
            </section>
            <p className="note">Different reported metrics (AUC, Dice, SSIM…) are not directly comparable on the y-axis — compare like-for-like tasks. Carbon uses cloud CI; clinical savings use the {settings.region} grid.</p>
            </>)}
          </section>

          )}

          {/* ── Research label — AI model disclosure (moved from EcoLabel) ── */}
          <button type="button" className="accHead" onClick={()=>toggleAi('ecolabel')} aria-expanded={!!aiOpen['ecolabel']}>
            <span className="accCaret">{aiOpen['ecolabel']?'▾':'▸'}</span>
            <span className="accTitle">Research label — AI model disclosure</span>
            <span className="accVal">{ecoLabelData.graded ? `Score ${ecoLabelData.score}` : '—'}</span>
          </button>
          {aiOpen['ecolabel'] && (
          <section id="ai-ecolabel" className="aiSection" style={{background:'none',boxShadow:'none',padding:0,marginTop:28}}>
            <h2 style={{marginBottom:8}}>Research label — AI model disclosure</h2>
          <p className="note" style={{marginBottom:8}}>
            Disclose a single AI model's footprint on its own — no department context. Unlike the department label, an AI model has <strong>two distinct costs</strong>: <strong>training</strong> (a one-time capital cost) and <strong>inference</strong> (a marginal cost paid on every study). The label shows both, then grades the <strong>amortised</strong> efficiency — training spread over the studies served, plus inference — so a large model deployed at scale can still score well.
            To see how a deployed model affects an imaging operation's footprint, attach it under <strong>Clinical AI tools</strong> on the Radiology Department tab.
            Fields align with the AI environmental reporting framework recommended in Doo FX et al. <em>Radiology</em> 2024 (DOI 10.1148/radiol.232030).
          </p>
          <p className="note" style={{marginBottom:16}}>
            Measure training energy with <a href="https://codecarbon.io/" style={{color:'#2E7D32'}} target="_blank" rel="noreferrer">CodeCarbon</a>, <code>nvidia-smi</code>, or your cloud provider's carbon dashboard for the most accurate figures.
          </p>

          {/* ── Pre-fill from dashboards ── */}
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24,padding:'12px 16px',background:'#f1f8f1',border:'1.5px solid #c8e6c9',borderRadius:16}}>
            <button onClick={()=>{
              const ARCH_TASK = {
                'CNN / ResNet':              'Classification',
                'U-Net (segmentation)':      'Segmentation',
                'EfficientNet':              'Classification',
                'Vision Transformer (ViT)':  'Detection',
                'Diffusion / Generative AI': 'Reconstruction',
                'LLM / Agent (transformer)': 'Report generation',
              };
              // If the current AI model is token-based (LLM / agentic), pre-fill the label's
              // inference in token mode with its calls/tokens; otherwise use flat kWh/study.
              const tokenPrefill = ai.unit === 'tokens'
                ? {inferMode:'tokens', whPer1kTokens:String(ai.whPer1kTokens ?? 0.4), callsPerTask:String(ai.callsPerTask ?? 1), tokensPerCall:String(ai.tokensPerCall ?? 0)}
                : {inferMode:'kwh', ...(ai.inference?.kwhPerStudy != null ? {inferKwhPerStudy: String(ai.inference.kwhPerStudy)} : {})};
              setEcoLabel(e=>({
                ...e,
                ...(scen.architecture                 ? {architecture:      scen.architecture}                              : {}),
                ...(ARCH_TASK[scen.architecture]       ? {taskType:          ARCH_TASK[scen.architecture]}                   : {}),
                ...(scen.paramsM                       ? {paramsMillion:     String(scen.paramsM)}                           : {}),
                ...(GPU_PRESETS[scen.trainGpu]         ? {gpuModel:          scen.trainGpu}                                  : {}),
                ...(parseInt(scen.trainNumGpus) > 0    ? {gpuCount:          String(parseInt(scen.trainNumGpus))}            : {}),
                ...(parseFloat(scen.trainHours) > 0    ? {trainingHoursPerRun: String(scen.trainHours)}                     : {}),
                ...(scen.cloudProvider                 ? {cloudProvider:     scen.cloudProvider}                             : {}),
                ...(parseInt(scen.deployMonths) > 0    ? {deployMonths:      String(parseInt(scen.deployMonths))}            : {}),
                ...(dash.scopes.imagingScans > 0       ? {inferStudiesMonth: String(Math.round(dash.scopes.imagingScans))}   : {}),
                ...tokenPrefill,
              }));
            }} style={{
              display:'inline-flex',alignItems:'center',gap:7,
              background:'#2E7D32',color:'white',border:'none',borderRadius:10,
              padding:'7px 16px',cursor:'pointer',fontSize:12,fontWeight:700,
            }}>
              <ArrowRight size={13}/> Pre-fill from dashboards
            </button>
            <span style={{fontSize:11,color:'#607d66'}}>
              Copies the model specs (architecture, task, parameters, GPU/training, cloud, deployment) and inference energy from the AI model above · inference studies/month from the Radiology dashboard · grid region follows this page
            </span>
          </div>

          {/* ── Form ── */}
          <div className="inputSummary" style={{marginBottom:24}}>
            <h2 style={{marginTop:0, marginBottom:16, color:'#1b5e20'}}>Model &amp; task</h2>
            <div className="grid grid3">
              <label>
                Project / model name
                <input type="text" value={ecoLabel.projectName} onChange={e=>setEco('projectName',e.target.value)} placeholder="e.g. CXR-Net lung nodule detector"/>
              </label>
              <Sel label="Task type" value={ecoLabel.taskType} options={META.taskTypes} onChange={v=>setEco('taskType',v)}/>
              <label>
                Architecture (free text)
                <input type="text" value={ecoLabel.architecture} onChange={e=>setEco('architecture',e.target.value)} placeholder="e.g. EfficientNet-B4"/>
              </label>
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
            <div style={{marginTop:16}}>
              <label style={{flexDirection:'row', alignItems:'center', gap:12, fontWeight:400, color:'#263238', cursor:'pointer'}}>
                <input type="checkbox" checked={ecoLabel.energyMeasured} onChange={e=>setEco('energyMeasured',e.target.checked)} style={{width:18,height:18,accentColor:'#2E7D32'}}/>
                I measured energy directly (CodeCarbon / nvidia-smi) — enter kWh per run below
              </label>
              {ecoLabel.energyMeasured && (
                <div style={{marginTop:12, maxWidth:320}}>
                  <label>
                    Measured energy per run (kWh)
                    <input type="number" min="0" step="0.01" value={ecoLabel.energyKwhPerRun} onChange={e=>setEco('energyKwhPerRun',e.target.value)} placeholder="e.g. 24.0"/>
                  </label>
                </div>
              )}
              {!ecoLabel.energyMeasured && (
                <p className="note" style={{marginTop:8}}>
                  Energy estimated from GPU TDP × count × hours × PUE. Use measured values for higher accuracy.
                </p>
              )}
            </div>
          </div>

          <div className="inputSummary" style={{marginBottom:24}}>
            <h2 style={{marginTop:0, marginBottom:16, color:'#1b5e20'}}>Deployment context</h2>
            <div className="grid grid3">
              <Sel label="Compute provider" value={ecoLabel.cloudProvider} options={META.cloudProviders} onChange={v=>setEco('cloudProvider',v)}/>
              <label style={{opacity:0.9}}>
                Grid region <span style={{fontWeight:400,fontSize:11,color:'#607d66'}}>(follows this page)</span>
                <input type="text" value={settings.region} readOnly title="Change the grid region on the Home page." style={{background:'#f5f5f5',cursor:'not-allowed'}}/>
                <span style={{fontWeight:400,fontSize:10,color:'#90a4ae',marginTop:3,lineHeight:1.3}}>To change it, set <strong>Region / grid</strong> on the <strong>Home</strong> page — the whole tool (this label included) uses that one grid.</span>
              </label>
              <label>
                Renewable energy (%)
                <input type="number" min="0" max="100" value={ecoLabel.renewablePct} onChange={e=>setEco('renewablePct',e.target.value)} placeholder="0–100"/>
              </label>
            </div>
            <p className="note" style={{marginTop:8}}>Renewable energy % reduces the effective carbon intensity. Set to 100 for green tariff or matched renewable certificates (RECs).</p>
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
                Monthly study volume
                <input type="number" min="0" value={ecoLabel.inferStudiesMonth} onChange={e=>setEco('inferStudiesMonth',e.target.value)} placeholder="e.g. 1200"/>
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

          {/* ── Preview ── */}
          <h2>Label preview</h2>
          <div style={{display:'flex', gap:28, flexWrap:'wrap', alignItems:'flex-start', marginBottom:32}}>
            {/* Visual card */}
            <div style={{background:'white', border:'2px solid #2E7D32', borderRadius:14, overflow:'hidden', minWidth:280, maxWidth:510, fontFamily:'Inter,sans-serif', boxShadow:'0 8px 30px #1b5e2020', flexShrink:0}}>
              <div style={{background:'#1b5e20', padding:'14px 18px'}}>
                <div style={{color:'white', fontWeight:700, fontSize:16, display:'flex', alignItems:'center', gap:8}}>
                  <Leaf style={{width:16,height:16}}/> CEDARS AI Research Label
                </div>
                <div style={{color:'#A5D6A7', fontSize:13, marginTop:4}}>{ecoLabelData.projectName}</div>
                <div style={{color:'#81C784', fontSize:11, marginTop:2}}>AI model footprint disclosure · {ecoLabelData.date}</div>
              </div>
              <div style={{background:ecoLabelData.ratingBg, padding:'16px 18px', display:'flex', alignItems:'center', gap:18}}>
                <div style={{textAlign:'center', flexShrink:0}}>
                  <div style={{fontSize:44, fontWeight:900, color:ecoLabelData.ratingColor, lineHeight:1}}>{ecoLabelData.graded ? ecoLabelData.score : '—'}</div>
                  <div style={{fontSize:10, fontWeight:700, color:ecoLabelData.ratingColor, letterSpacing:'0.04em'}}>CEDARS SCORE</div>
                </div>
                <div>
                  <LeafRating leaves={ecoLabelData.leaves} size={20} color={ecoLabelData.ratingColor}/>
                  <div style={{fontWeight:700, fontSize:14, color:ecoLabelData.ratingColor, marginTop:4}}>{ecoLabelData.ratingLabel}</div>
                  <div style={{fontSize:11, color:'#263238', marginTop:2}}>
                    {ecoLabelData.gradeBasis==='amortised' ? `${ecoLabelData.effectivePerStudyG} gCO₂e / study (in use, amortised)`
                      : ecoLabelData.gradeBasis==='inference' ? `${ecoLabelData.perInferCo2g} gCO₂e / study (inference)`
                      : ecoLabelData.hasData ? 'Add inference volume below to grade in-use efficiency' : 'Enter training data above to calculate'}
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
                ['Energy per run',           `${ecoLabelData.energyPerRunKwh} kWh${ecoLabelData.energyMeasured ? ' (measured)' : ' (est. from TDP)'}`],
                ['Total training energy',    `${ecoLabelData.totalEnergyKwh} kWh`],
                ['Training CO₂e',       `${ecoLabelData.trainCo2} kgCO₂e`],
                ['Renewable energy',         `${ecoLabelData.renewablePct}%`],
                ['Compute / PUE',            `${ecoLabelData.cloudProvider} · PUE ${ecoLabelData.pue}`],
                ['Grid region / CI',         `${ecoLabelData.region} · ${ecoLabelData.ci} kgCO₂e/kWh`],
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
                  navigator.clipboard.writeText(generateEcoMarkdown(ecoLabelData));
                  setEcoCopied(true);
                  setTimeout(()=>setEcoCopied(false), 2000);
                }}
                style={ecoCopied ? {background:'#26A69A'} : undefined}
              >
                <FileText/> {ecoCopied ? 'Copied!' : 'Copy markdown table'}
              </button>
              <p className="note" style={{maxWidth:220, fontSize:12, margin:0}}>
                PNG badge: embed in posters, slides, or PDF appendices.<br/><br/>
                Markdown table: paste into LaTeX supplementary files, GitHub READMEs, or preprint appendices.
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

          {/* ── CEDARS disclosure checklist ── */}
          <section style={{marginBottom:24}}>
            <h2 style={{marginBottom:4}}>CEDARS disclosure checklist</h2>
            <p className="note" style={{marginBottom:12}}>The minimum set of items for a reproducible environmental footprint — a reporting standard modelled on CLAIM/DEAL. Report these alongside your study.</p>
            {(()=>{
              const d = ecoLabelData;
              const items = [
                ['1', 'Compute hardware (type, count)', d.gpuHardware, d.gpuHardware !== '—', 'AI workload'],
                ['2', 'Total energy (kWh) / GPU-hours', d.hasData ? `${d.totalEnergyKwh.toLocaleString()} kWh · ${d.totalGpuHours} GPU-h` : '—', d.hasData, 'AI workload'],
                ['3', 'Grid carbon intensity, location, source', `${d.ci} kgCO₂e/kWh · ${d.region} · ${d.renewablePct}% renewable`, !!d.region, 'AI + cloud'],
                ['4', 'Cloud provider & PUE', `${d.cloudProvider} · PUE ${d.pue}`, !!d.cloudProvider, 'Cloud'],
                ['5', 'Training vs inference split', `Training ${d.trainCo2} kgCO₂e · Inference ${d.hasInference ? `${d.inferCo2Month} kgCO₂e/mo` : 'not reported'}`, d.hasData, 'AI workload'],
                ['6', 'Water footprint', d.waterLitres > 0 ? `${d.waterLitres.toLocaleString()} L` : 'not reported', d.waterLitres > 0, 'Water use'],
                ['7', 'CEDARS Score + Rating', d.graded ? `Score ${d.score} · ${d.leaves}/5 leaves (${d.ratingLabel})` : 'add inference volume to grade', d.graded, 'Score / Rating'],
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
          </section>

          {/* ── Markdown preview ── */}
          <section>
            <h2>Markdown table</h2>
            <pre style={{background:'#f1f8f1', borderRadius:14, padding:'16px 20px', fontSize:12, lineHeight:1.6, overflow:'auto', border:'1px solid #c8e6c9', fontFamily:'monospace', whiteSpace:'pre-wrap'}}>
              {generateEcoMarkdown(ecoLabelData)}
            </pre>
          </section>

          {/* ── Paper text ── */}
          <section style={{marginTop:24}}>
            <h2>Ready-to-paste paragraph</h2>
            <p className="note" style={{marginBottom:8}}>Copy this into a dedicated <strong>Environmental Impact</strong> section or supplementary material of your submission.</p>
            <pre style={{background:'#f1f8f1', borderRadius:14, padding:'16px 20px', fontSize:12, lineHeight:1.8, border:'1px solid #c8e6c9', fontFamily:'monospace', whiteSpace:'pre-wrap'}}>
              {`Environmental impact. ${ecoLabelData.projectName} was trained using ${ecoLabelData.gpuHardware} ` +
               `for ${ecoLabelData.totalGpuHours} GPU-hours across ${ecoLabelData.numRuns} experiment${ecoLabelData.numRuns>1?'s':''}. ` +
               `Total training energy consumption was ${ecoLabelData.totalEnergyKwh} kWh ` +
               `(${ecoLabelData.energyPerRunKwh} kWh per run${ecoLabelData.energyMeasured ? ', directly measured' : ', estimated from GPU TDP'}), ` +
               `with an estimated carbon footprint of ${ecoLabelData.trainCo2} kgCO₂e ` +
               `(${ecoLabelData.cloudProvider}; grid: ${ecoLabelData.region}, ${ecoLabelData.ci} kgCO₂e/kWh; ` +
               `renewable energy: ${ecoLabelData.renewablePct}%; PUE: ${ecoLabelData.pue}). ` +
               `The estimated cooling water footprint is ${ecoLabelData.waterLitres.toLocaleString()} L.` +
               (ecoLabelData.perInferCo2g > 0
                 ? ` Inference costs ${ecoLabelData.perInferCo2g} gCO₂e per study.`
                 : '') +
               (ecoLabelData.hasInference
                 ? ` Amortised over ${ecoLabelData.lifetimeInferences.toLocaleString()} studies (${ecoLabelData.deployMonths}-month deployment), the effective footprint is ${ecoLabelData.effectivePerStudyG} gCO₂e per study` +
                   (ecoLabelData.breakEvenStudies != null ? ` (training-cost break-even at ~${ecoLabelData.breakEvenStudies.toLocaleString()} studies)` : '') + '.'
                 : '') +
               (ecoLabelData.graded ? ` This corresponds to a CEDARS Score of ${ecoLabelData.score}/100 (${ecoLabelData.leaves}/5 leaves — ${ecoLabelData.ratingLabel}).` : '') +
               ` Sustainability metrics were estimated using CEDARS (${ecoLabelData.date}), following the framework of Doo FX et al. (Radiology 2024, DOI: 10.1148/radiol.232030).`}
            </pre>
          </section>
          </section>
          )}

        </main>
      )}

      {/* ── Interventions ── */}
      {page==='scenario' && (
        <main>
          <h1 style={{margin:'0 0 8px'}}>Interventions</h1>
          <p className="note" style={{marginBottom:16}}>Build your department's <strong>intervention program</strong> — tick every lever you plan to implement and see their <strong>combined</strong> impact. The same ticks appear as your implemented actions on the <strong>EcoLabel</strong> tab. (The AI-model benchmark now lives on the <strong>AI Model &amp; Informatics</strong> tab.)</p>

          {/* Multi-select intervention program — shared selection with the EcoLabel */}
          <div className="inputSummary" style={{marginBottom:16}}>
            <h2 style={{marginTop:0,marginBottom:6,color:'#1b5e20'}}>Choose interventions <span style={{fontWeight:400,fontSize:14,color:'#607d66'}}>(tick all you plan to implement)</span></h2>
            <p className="note" style={{marginBottom:12}}>
              {scenario.count>0
                ? <><strong style={{color:'#2E7D32'}}>{scenario.count} selected · −{scenario.savings.kwh.toLocaleString()} kWh · −{scenario.savings.co2.toLocaleString()} kgCO₂e{dash.totals.label}</strong> ({scenario.savings.pctEnergy}% energy · {scenario.savings.pctCo2}% carbon)</>
                : 'No interventions selected yet — tick one or more below to model their combined effect.'}
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
              {Object.entries(INTERVENTIONS).map(([name, data]) => {
                const active = deptLabel.activeInterventions.includes(name);
                return (
                  <label key={name} style={{flexDirection:'row',alignItems:'flex-start',gap:10,fontWeight:400,color:'#263238',cursor:'pointer',background:active?'#e8f5e9':'#fafafa',borderRadius:10,padding:'10px 12px',border:active?'1.5px solid #81C784':'1px solid #e0e0e0'}}>
                    <input type="checkbox" checked={active} onChange={()=>toggleIntervention(name)} style={{width:16,height:16,accentColor:'#2E7D32',marginTop:2,flexShrink:0}}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{name}</div>
                      <div style={{fontSize:12,color:'#607d66'}}>{data.note}{data.kwh>0?` · ~${(data.kwh*12).toLocaleString()} kWh/yr`:''}{data.co2Pct?` · −${data.co2Pct}% carbon`:''}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Global assumptions — applied to whichever ticked levers use them */}
          <div className="grid" style={{marginBottom:8}}>
            <Sel label={<span>Scanner state target {scenario.usesScanner ? <span className="badge">in use</span> : <span style={{fontWeight:400,color:'#aaa',fontSize:11}}>no ticked lever uses this</span>}</span>}
                 value={scen.scannerState} options={META.scannerStates} onChange={v=>setS('scannerState',v)}/>
            <Sel label={<span>Cloud provider {scenario.usesCloud ? <span className="badge">in use</span> : <span style={{fontWeight:400,color:'#aaa',fontSize:11}}>no ticked lever uses this</span>}</span>}
                 value={scen.cloudProvider} options={META.cloudProviders} onChange={v=>setS('cloudProvider',v)}/>
          </div>
          <p className="note" style={{marginBottom:16}}>
            Global assumptions applied to whichever ticked levers use them.
            {scenario.usesScanner && <> Scanner state target sets how deep the overnight/standby power-down goes (Standby saves less than Off).</>}
            {scenario.usesCloud   && <> Cloud provider sets the carbon intensity of compute ({scen.cloudProvider}: {(CLOUD[scen.cloudProvider]??CLOUD["Local compute"]).ci} kgCO₂e/kWh vs region {getCI(settings.region, settings.customCi)} kgCO₂e/kWh).</>}
          </p>
          {/* Impact on your EcoLabel — current → projected */}
          {(()=>{
            const cur = deptLabelData;
            const frac = scenario.baseline.co2 > 0 ? scenario.savings.co2 / scenario.baseline.co2 : 0;
            const projCo2Study = rnd(cur.co2PerStudy * (1 - frac), 3);
            const projScore = cur.hasData ? cedarsScore(projCo2Study, CEDARS_DEPT_LO, CEDARS_DEPT_HI) : null;
            const projRating = projScore != null ? cedarsRating(projScore) : null;
            const mkBox = (title, score, leaves, color, bg, label) => (
              <div style={{flex:1,minWidth:210,background:bg,border:`2px solid ${color}`,borderRadius:16,padding:'14px 18px'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#607d66',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{title}</div>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{fontSize:42,fontWeight:900,color,lineHeight:1}}>{score ?? '—'}</div>
                  <div>
                    <LeafRating leaves={leaves} size={16} color={color}/>
                    <div style={{fontSize:13,fontWeight:700,color,marginTop:3}}>{label}</div>
                  </div>
                </div>
              </div>
            );
            return (
              <div style={{marginBottom:24}}>
                <h2 style={{marginBottom:8}}>Impact on your EcoLabel</h2>
                <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                  {mkBox('Current', cur.hasData?cur.score:null, cur.leaves, cur.ratingColor, cur.ratingBg, cur.ratingLabel)}
                  <ArrowRight size={26} style={{color:'#90a4ae',flexShrink:0}}/>
                  {mkBox(scenario.count>0?`Projected · ${scenario.count} intervention${scenario.count===1?'':'s'}`:'Projected', projScore, projRating?.leaves ?? 0, projRating?.color ?? '#90a4ae', projRating?.bg ?? '#f5f5f5', projRating?.label ?? '')}
                </div>
                {projScore != null && (
                  scenario.count === 0
                    ? <p className="note" style={{marginTop:8}}>Tick one or more interventions above to project their combined impact on your CEDARS Score.</p>
                    : projScore === cur.score
                      ? <p className="note" style={{marginTop:8}}>Your {scenario.count} selected intervention{scenario.count===1?'':'s'} don't move your CEDARS Score band, but still cut {scenario.savings.co2.toLocaleString()} kgCO₂e{scenario.baseline.co2>0?` (${scenario.savings.pctEnergy}% energy)`:''}.</p>
                      : <p className="note" style={{marginTop:8}}>Your {scenario.count} selected intervention{scenario.count===1?'':'s'} shift your CEDARS Score <strong>{projScore>cur.score?'+':''}{projScore-cur.score}</strong> points ({cur.co2PerStudy} → {projCo2Study} kgCO₂e/study).</p>
                )}
              </div>
            );
          })()}

          {(()=>{
            const price = getPrice(settings.region, settings.electricityPrice);
            const sym   = currencySym(settings.region);
            const mult  = TIME_MULT[settings.timePeriod] ?? 1;
            const annualSaved = scenario.savings.kwh / mult * 12 * price;
            return (
            <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:8}}>
              <h2 style={{margin:0}}>Energy, carbon &amp; cost — before vs after</h2>
              <label style={{flexDirection:'row',alignItems:'center',gap:8,fontSize:12,color:'#2E7D32',fontWeight:700}}>
                Electricity price ({sym}/kWh)
                <input type="number" min="0" step="0.01" value={settings.electricityPrice} onChange={e=>set('electricityPrice',e.target.value)} placeholder={String(ELECTRICITY_PRICE[settings.region]?.price ?? 0.20)} style={{width:84,padding:'6px 9px',border:'1px solid #c8e6c9',borderRadius:10,background:'white',fontWeight:400}}/>
              </label>
            </div>
            <div className="scenarioGrid">
              <section className="card">
                <div className="cardHead"><Gauge/><span>Baseline ({settings.timePeriod})</span></div>
                <p><b>{scenario.baseline.kwh.toLocaleString()} kWh</b></p>
                <p>{scenario.baseline.co2.toLocaleString()} kgCO₂e</p>
                <p style={{color:'#607d66'}}>{fmtMoney(scenario.baseline.kwh*price, sym)}</p>
              </section>
              <section className="card savings">
                <div className="cardHead"><TrendingDown/><span>Projected savings</span></div>
                <b>−{scenario.savings.kwh.toLocaleString()} kWh</b>
                <p>−{scenario.savings.co2.toLocaleString()} kgCO₂e</p>
                <p style={{fontWeight:800,color:'#1b5e20'}}>−{fmtMoney(scenario.savings.kwh*price, sym)}{dash.totals.label}</p>
                <p><span className="badge">{scenario.savings.pctEnergy}% energy reduction</span></p>
              </section>
              <section className="card">
                <div className="cardHead"><Leaf/><span>After interventions</span></div>
                <p><b>{scenario.projected.kwh.toLocaleString()} kWh</b></p>
                <p>{scenario.projected.co2.toLocaleString()} kgCO₂e</p>
                <p style={{color:'#607d66'}}>{fmtMoney(scenario.projected.kwh*price, sym)}</p>
              </section>
            </div>
            {scenario.count>0 && scenario.savings.kwh>0 && (
              <p className="note" style={{marginTop:12,padding:'10px 14px',background:'#e8f5e9',borderRadius:12,fontSize:13}}>
                <strong style={{color:'#1b5e20'}}>≈ {fmtMoney(annualSaved, sym)}/year</strong> in avoided electricity cost — most operational levers (overnight power-down, standby) need little or no capital outlay. Electricity cost only; an editable estimate at {sym}{price}/kWh.
              </p>
            )}
            </>
            );
          })()}
          <div className="charts" style={{marginTop:24}}>
            <section><h2>Chart</h2><Suspense fallback={<div style={{height:200}}/>}><Bar data={chartScenario}/></Suspense></section>
          </div>
          <p className="note" style={{marginTop:12}}>Region: {settings.region} — {settings.timePeriod} figures. Change region or time period on the Input page.</p>
        </main>
      )}

      {/* ── Eco-label ── */}
      {page==='ecolabel' && (
        <main>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
            <h1 style={{margin:0}}>CEDARS EcoLabel</h1>
          </div>

            <p className="note" style={{marginBottom:16}}>
              Generate a department-level sustainability label for ESG reports, accreditation submissions, or public sustainability disclosures.
              The CEDARS Score (0–100) and Rating (1–5 leaves) are based on kgCO₂e per imaging study — a measure of how efficiently the department converts energy into <em>delivered care</em>, so a busy department scores well even at a high absolute footprint, while an under-used fleet does not. Benchmarked against published radiology carbon-intensity data — see the <a href="https://github.com/takinci/cedars/blob/main/sources.md" target="_blank" rel="noreferrer" style={{color:'#2E7D32'}}>full source list</a> — following the design logic of consumer ecolabels such as Energy Star and the <a href="https://europa.eu/youreurope/citizens/consumers/shopping/energy-labels/index_en.htm" target="_blank" rel="noreferrer" style={{color:'#2E7D32'}}>EU Energy Label</a> (Regulation EU 2021/341).
            </p>

            {/* ── Pre-fill from Radiology Dashboard ── */}
            <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24,padding:'12px 16px',background:'#f1f8f1',border:'1.5px solid #c8e6c9',borderRadius:16}}>
              <button onClick={()=>{
                const mult = TIME_MULT[settings.timePeriod] ?? 1;
                const monthlyKwh = dash.totals.kwh / mult;
                // Use the actual imaging volume entered on the Efficiency tab if set;
                // otherwise fall back to the fleet's typical throughput.
                const annualStudies = efficiency.studiesYr;
                setDeptLabel(d=>({
                  ...d,
                  region: settings.region,
                  ...(monthlyKwh > 0    ? {annualKwh:     String(Math.round(monthlyKwh * 12))} : {}),
                  ...(annualStudies > 0 ? {annualStudies:  String(annualStudies)}              : {}),
                }));
              }} style={{
                display:'inline-flex',alignItems:'center',gap:7,
                background:'#2E7D32',color:'white',border:'none',borderRadius:10,
                padding:'7px 16px',cursor:'pointer',fontSize:12,fontWeight:700,
              }}>
                <ArrowRight size={13}/> Pre-fill from dashboards
              </button>
              <span style={{fontSize:11,color:'#607d66'}}>
                Copies grid region · electricity (kWh) · and imaging studies/year ({efficiency.isEstimate ? 'fleet estimate' : 'your actual volume from the Efficiency tab'})
              </span>
            </div>

            <div className="inputSummary" style={{marginBottom:24}}>
              <h2 style={{marginTop:0,marginBottom:16,color:'#1b5e20'}}>Department identity</h2>
              <div className="grid grid3">
                <label>Department name<input type="text" value={deptLabel.deptName} onChange={e=>setDept('deptName',e.target.value)} placeholder="e.g. Radiology — MRI Unit"/></label>
                <label>Hospital / institution<input type="text" value={deptLabel.hospitalName} onChange={e=>setDept('hospitalName',e.target.value)} placeholder="e.g. University Hospital Basel"/></label>
                <label>Grid region
                  <select value={deptLabel.region} onChange={e=>setDept('region',e.target.value)}>
                    <option value="">— use current ({settings.region}) —</option>
                    {META.regions.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="inputSummary" style={{marginBottom:24}}>
              <h2 style={{marginTop:0,marginBottom:6,color:'#1b5e20'}}>Energy &amp; imaging volume <span style={{fontWeight:400,fontSize:14,color:'#607d66'}}>(live from Radiology Department — override only if you have measured figures)</span></h2>
              <p className="note" style={{marginBottom:12}}>
                {deptLabelData.isLive
                  ? <>Currently <strong style={{color:'#2E7D32'}}>live</strong> from your Radiology Department state. Leave blank to keep it live; enter a value to override.</>
                  : <>Using your <strong>overridden</strong> figures. Clear a field to return it to the live value.</>}
              </p>
              <div className="grid grid3">
                <label>Annual electricity (kWh)<input type="number" min="0" value={deptLabel.annualKwh} onChange={e=>setDept('annualKwh',e.target.value)} placeholder={`live: ${deptLabelData.annualKwh.toLocaleString()}`}/></label>
                <label>Total imaging studies / year<input type="number" min="0" value={deptLabel.annualStudies} onChange={e=>setDept('annualStudies',e.target.value)} placeholder={`live: ${deptLabelData.annualStudies.toLocaleString()}`}/></label>
                <label>Renewable energy (%)<input type="number" min="0" max="100" value={deptLabel.renewablePct} onChange={e=>setDept('renewablePct',e.target.value)} placeholder="0–100"/></label>
              </div>
              <p className="note" style={{marginTop:8}}>Live kWh comes from the Radiology Department energy model; live studies from the Efficiency tab (actual volume, else fleet estimate). Override with utility bills / RIS counts for publication-quality figures.</p>
            </div>

            {/* Clinical AI tools now live on the Radiology Department tab */}
            <p className="note" style={{marginBottom:24,padding:'10px 14px',background:'#f1f8f1',borderRadius:12}}>
              <Brain size={14} style={{verticalAlign:'-2px',marginRight:6}}/>
              {deptLabelData.clinicalToolCount > 0
                ? <>{deptLabelData.clinicalToolCount} clinical AI tool{deptLabelData.clinicalToolCount>1?'s':''} deployed — configured on the <strong>Radiology Department</strong> tab, and already reflected in the energy and score above.</>
                : <>Deploy clinical AI tools on the <strong>Radiology Department</strong> tab to see their effect on this label.</>}
            </p>

            <div className="inputSummary" style={{marginBottom:32}}>
              <h2 style={{marginTop:0,marginBottom:8,color:'#1b5e20'}}>Sustainability actions <span style={{fontWeight:400,fontSize:14,color:'#607d66'}}>(tick implemented interventions)</span></h2>
              <p className="note" style={{marginBottom:16}}>
                Checking implemented interventions shows your saving potential and strengthens your label documentation. This is the <strong>same selection</strong> as the <strong>Interventions</strong> tab — tick here or there, the combined impact is identical.
                {deptLabel.activeInterventions.length > 0 && (
                  <> <strong style={{color:'#2E7D32'}}>{deptLabel.activeInterventions.length} selected · saving potential: {deptLabelData.annualKwhSaving.toLocaleString()} kWh/yr ({deptLabelData.co2Saving} kgCO₂e/yr)</strong></>
                )}
              </p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                {Object.entries(INTERVENTIONS).map(([name, data]) => {
                  const active = deptLabel.activeInterventions.includes(name);
                  return (
                    <label key={name} style={{flexDirection:'row',alignItems:'flex-start',gap:10,fontWeight:400,color:'#263238',cursor:'pointer',background:active?'#e8f5e9':'#fafafa',borderRadius:10,padding:'10px 12px',border:active?'1.5px solid #81C784':'1px solid #e0e0e0'}}>
                      <input type="checkbox" checked={active} onChange={()=>toggleIntervention(name)} style={{width:16,height:16,accentColor:'#2E7D32',marginTop:2,flexShrink:0}}/>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{name}</div>
                        <div style={{fontSize:12,color:'#607d66'}}>{data.note}{data.kwh>0?` · ~${(data.kwh*12).toLocaleString()} kWh/yr saving`:''}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <h2>Label preview</h2>
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
                    {deptLabelData.interventionCount>0 && deptLabelData.potentialLeaves!==deptLabelData.leaves && (
                      <div style={{fontSize:12,color:'#2E7D32',marginTop:3}}>With active interventions → potential Score {deptLabelData.potentialScore} ({deptLabelData.potentialLeaves}/5 leaves)</div>
                    )}
                  </div>
                </div>
                {[
                  ['Annual electricity',   deptLabelData.annualKwh>0 ? `${deptLabelData.annualKwh.toLocaleString()} kWh` : '—'],
                  ['Annual CO₂e',         deptLabelData.totalAnnualCo2>0 ? `${deptLabelData.totalAnnualCo2.toLocaleString()} kgCO₂e` : '—'],
                  ...(deptLabelData.clinicalToolCount>0 ? [['Clinical AI tools', `${deptLabelData.clinicalToolCount} deployed (reflected in energy)`]] : []),
                  ['Studies / year',       deptLabelData.annualStudies>0 ? deptLabelData.annualStudies.toLocaleString() : '—'],
                  ['Energy per study',     deptLabelData.kwhPerStudy>0 ? `${deptLabelData.kwhPerStudy} kWh` : '—'],
                  ...(deptLabelData.utilPct != null ? [['Fleet utilisation', `${deptLabelData.utilPct}% of configured fleet`]] : []),
                  ['Effective grid CI',    `${deptLabelData.effectiveCi} kgCO₂e/kWh (${deptLabelData.renewablePct}% renewable)`],
                  ['Grid region',          deptLabelData.region],
                  ...(deptLabelData.interventionCount>0 ? [['Active interventions', `${deptLabelData.interventionCount} implemented · ${deptLabelData.annualKwhSaving.toLocaleString()} kWh/yr saving`]] : []),
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
                  <FileText/> {deptCopied ? 'Copied!' : 'Copy ESG paragraph'}
                </button>
                <p className="note" style={{maxWidth:220,fontSize:12,margin:0}}>
                  PNG badge: embed in sustainability reports, posters, or accreditation submissions.<br/><br/>
                  ESG paragraph: paste into your hospital's annual sustainability report or ESR Green Imaging self-assessment.
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

            {/* ── CEDARS disclosure checklist (department) ── */}
            <section style={{marginBottom:24}}>
              <h2 style={{marginBottom:4}}>CEDARS disclosure checklist</h2>
              <p className="note" style={{marginBottom:12}}>The minimum set of items for a reproducible department footprint — a reporting standard modelled on CLAIM/DEAL.</p>
              {(()=>{
                const d = deptLabelData;
                const items = [
                  ['1', 'Imaging operation (studies / year)', d.hasData ? `${d.annualStudies.toLocaleString()} studies/yr` : '—', d.hasData, 'Department'],
                  ['2', 'Total energy (kWh / year)', d.annualKwh > 0 ? `${d.annualKwh.toLocaleString()} kWh` : '—', d.annualKwh > 0, 'Department'],
                  ['3', 'Grid carbon intensity, location, source', `${d.effectiveCi} kgCO₂e/kWh · ${d.region} · ${d.renewablePct}% renewable`, !!d.region, 'Grid'],
                  ['4', 'Annual carbon footprint (facility + AI)', d.totalAnnualCo2 > 0 ? `${d.totalAnnualCo2.toLocaleString()} kgCO₂e` : '—', d.totalAnnualCo2 > 0, 'Department'],
                  ['5', 'Clinical AI tools deployed', d.clinicalToolCount > 0 ? `${d.clinicalToolCount} (net effect in dept energy)` : 'none deployed', d.clinicalToolCount > 0, 'Clinical AI'],
                  ['6', 'Active mitigation / interventions', d.interventionCount > 0 ? `${d.interventionCount} · ~${d.annualKwhSaving.toLocaleString()} kWh/yr saved` : 'none reported', d.interventionCount > 0, 'Interventions'],
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
            </section>

            {deptLabelData.annualStudies>0 && (
              <section style={{marginTop:0}}>
                <h2>Ready-to-paste ESG paragraph</h2>
                <p className="note" style={{marginBottom:8}}>Copy into your hospital's annual sustainability report, ESR Green Imaging self-assessment, or accreditation documentation.</p>
                <pre style={{background:'#f1f8f1',borderRadius:14,padding:'16px 20px',fontSize:12,lineHeight:1.8,border:'1px solid #c8e6c9',fontFamily:'monospace',whiteSpace:'pre-wrap'}}>
                  {generateDeptText(deptLabelData)}
                </pre>
              </section>
            )}
        </main>
      )}

      <footer style={{flexWrap:'wrap',gap:16}}>
        <Logo dark/>
        <div style={{flex:1,minWidth:240}}>
          <span>ESG-ready sustainability intelligence for academic hospitals, enterprise healthcare systems, radiology AI teams, and scientific reporting.</span>
          <div style={{fontSize:11,color:'#90a4ae',marginTop:10,lineHeight:1.6,maxWidth:640}}>
            © 2026 CEDARS · code <a href="https://github.com/takinci/cedars/blob/main/LICENSE" style={{color:'#A5D6A7'}} target="_blank" rel="noreferrer">Apache-2.0</a>, content <a href="https://creativecommons.org/licenses/by/4.0/" style={{color:'#A5D6A7'}} target="_blank" rel="noreferrer">CC BY 4.0</a>.
            {' '}Research/estimation tool — literature-based estimates, not measured values or medical/regulatory advice; provided as-is, no warranty.
            {' '}Runs entirely in your browser: no data collected, no cookies, nothing leaves your device.
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

createRoot(document.getElementById('root')).render(<App/>);
