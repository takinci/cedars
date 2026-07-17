<div align="center">

<img src="./Logo only.png" alt="CEDARS logo" width="120"/>

# CEDARS

### Carbon, Energy Diagnostics and Reporting for Sustainability

**Measure the environmental footprint of clinical imaging — energy, carbon, water, and AI — and turn it into a standardised, shareable disclosure, directly in your browser.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-takinci.github.io%2Fcedars-2E7D32?style=for-the-badge&logo=github)](https://takinci.github.io/cedars/)
[![Built with React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?style=flat-square&logo=chartdotjs)](https://www.chartjs.org)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-222?style=flat-square&logo=github)](https://takinci.github.io/cedars/)

</div>

---

## What is CEDARS?

CEDARS (Carbon, Energy Diagnostics and Reporting for Sustainability) is a browser-based tool that takes a radiology department **end-to-end**: **measure** your footprint (equipment + deployed clinical AI), **disclose** it as a standardised **CEDARS Score & Rating** ecolabel, and **improve** it by modelling interventions — all from published literature defaults you can override with your own measured data. A **live EcoLabel badge follows you on every tab** and updates as you change inputs.

It deliberately separates two kinds of "AI":

- **Clinical AI** — deployed tools that change imaging *operations* (denoising, protocol shortening, triage, avoided low-value scans). These live in the **Radiology Department**, where their net effect flows into the department's energy, efficiency, contrast, and EcoLabel.
- **AI model & informatics footprint** — the cost of *building and running* a model (training, inference, cloud/informatics). This has its own tab, for research disclosure and model benchmarking.

No installation. No backend. No data leaves your browser.

**→ Try it live: [takinci.github.io/cedars](https://takinci.github.io/cedars/)**

---

## What can it do?

Five tabs following a **measure → disclose → improve** journey: **Home · Radiology Department · AI Model & Informatics · EcoLabel · Interventions**. A live EcoLabel badge sits in the header throughout.

### 🏠 Home

A numbered **1 → 2 → 3 → 4 walkthrough** so a first-time user sees the whole pathway at a glance: set your equipment fleet, preview AI, see your live EcoLabel grade, and jump to improvements. Equipment is edited right here on the landing page.

### 🔋 Radiology Department

Your equipment fleet (MRI by field strength, CT, PET-CT, X-ray, mammography, ultrasound, angio/IR, fluoroscopy, PACS, workstations) and everything the department footprint contains:

| Section | What it tracks |
|---|---|
| **Efficiency — energy into healthcare** | Fleet **utilisation** (studies vs capacity), **CO₂ per study** at your actual volume, and **non-productive energy %** — so a busy department scores well even at a high absolute footprint |
| **Clinical AI tools** | Deploy clinical AI (from the model library, an imported model, or manual entry); each **adds** compute and **subtracts** clinical savings (avoided scans, shorter protocols, contrast reduction), adjusting the *whole* department consistently |
| **Energy** | Total kWh/MWh, active vs idle, avoidable idle, energy per scan |
| **Carbon (GHG Scopes)** | Scope 1 · Scope 2 · Scope 3 (embodied hardware, patient travel, **staff commute** auto-estimated from the fleet, **DICOM data transfer**) + per-study **Software Carbon Intensity (SCI)** |
| **Resource footprint** | Water, paper, hazardous waste, and **contrast media & contamination** (iodinated + gadolinium load to wastewater, contrast wasted) |
| **Equivalencies** | Car km, flights, tree-years, phone charges, household-electricity years |

### 🤖 AI Model & Informatics

The footprint of building and running a model — R&D / informatics, distinct from clinical effect:

- **Task-family model library** — editable, literature-anchored templates: Classification/triage, detection, 2D & 3D segmentation, reconstruction/denoising, diffusion synthesis, report generation (LLM/VLM), foundation/prompt models, Custom.
- **Advanced parameters** (progressive disclosure) — params, 2D/3D, resolution, slices; inference energy **scales physically** with `params × resolution² (× slices)`.
- **GPU training-energy estimator** — training kWh from GPU × count × hours × PUE, or a measured value.
- **Performance is user-owned, never predicted** — reported accuracy (AUC/Dice/SSIM…) and clinical co-benefits are entered, defaulting to the cited reference.
- **Lifecycle tabs** — Training · Testing · Inference · Carbon · Clinical · **Infrastructure** (full cloud-carbon: compute, storage, transfer, cross-region optimisation).
- **Benchmark** — shortlist candidate models under one department context; read the **accuracy-vs-carbon trade-off** on a Pareto scatter (efficient models starred).
- **Research label** — a standalone AI-model disclosure label for manuscript/paper submission.

### 🏷️ EcoLabel — CEDARS Score & Rating

The department's clean, citable, **current-state** disclosure, after the design logic of Energy Star and the EU Energy Label:

- **CEDARS Score** — a continuous **0–100** value from the per-study footprint.
- **CEDARS Rating** — a recognisable **1–5 leaf** badge mapped from the Score.
- **Disclosure checklist** — the minimum items for a reproducible footprint (hardware, energy, grid intensity, cloud/PUE, training–inference split, water, Score + Rating), modelled on CLAIM/DEAL.
- **Live by default** — derived automatically from your Radiology Department state; override the headline figures (annual kWh, studies, region) with measured data for publication.
- **Export** as a PNG badge, markdown table, or ready-to-paste paper/ESG paragraph.

### 🛠️ Interventions

Model an operational lever (scanners off overnight, standby, reduce low-value imaging, shorten protocols, renewable electricity, lower-carbon region, …) and see the **Impact on your EcoLabel** — your **current → projected** grade side by side, plus before/after energy and carbon.

### 📤 Export

Per-dashboard CSV reports, print-to-PDF, and the EcoLabel exports above — all carrying key assumption citations so reports are audit-ready.

---

## Configurable inputs

Core settings are reflected in the URL hash — copy the link to share your exact configuration:

- **Equipment fleet** — set the count of each device type
- **Actual imaging studies / year** (optional) — drives fleet utilisation and the live EcoLabel; blank uses the fleet estimate
- **Region / grid** — Switzerland, France, Germany, United States, United Kingdom, EU average, Global average, or a custom carbon intensity
- **Time period** — Monthly, Quarterly, Annual
- **Renewable %** and **custom grid intensity** where applicable
- **Cloud provider & region** — Local / AWS / Azure / Google Cloud, with per-region grid intensity for AI and infrastructure

Staff-commute headcount is derived automatically from the device fleet (NHS/BIR workforce ratios), so it needs no manual entry.

---

## Scientific basis

Every default value is sourced from peer-reviewed literature and listed in **[sources.md](./sources.md)**. Selected references:

| Area | Source |
|---|---|
| MRI active power (≈30 kW, 3T) | Heye et al. *J Magn Reson Imaging* 2023 · DOI [10.1002/jmri.28994](https://doi.org/10.1002/jmri.28994) |
| CT active power (40–80 kW) | Acra 2024 · DOI [10.1016/j.acra.2024.05.004](https://doi.org/10.1016/j.acra.2024.05.004) |
| Interventional imaging power (direct sensor) | Vosshenrich et al. *AJR* 2024 · DOI [10.2214/AJR.24.30988](https://doi.org/10.2214/AJR.24.30988) |
| Carbon intensity by region | Our World in Data 2022–2023 · [ourworldindata.org](https://ourworldindata.org/grapher/carbon-intensity-electricity) |
| AI footprint & lifecycle framework | Doo et al. *Radiology* 2024 · DOI [10.1148/radiol.232030](https://doi.org/10.1148/radiol.232030) |
| LLM energy vs. model size | Doo et al. *Radiology* 2024 · DOI [10.1148/radiol.240320](https://doi.org/10.1148/radiol.240320) |
| DICOM network energy (0.001 kWh/GB) | Aslan et al. *J Industrial Ecology* 2018 · DOI [10.1111/jiec.12630](https://doi.org/10.1111/jiec.12630) |
| Software Carbon Intensity (SCI) | Green Software Foundation · SCI Specification v1.0 |
| Intervention savings | McKee et al. *Radiology* 2024 · DOI [10.1148/radiol.240219](https://doi.org/10.1148/radiol.240219) |
| Ecolabel design logic | Energy Star · EU Energy Label (Regulation EU 2021/341) |
| AI model library anchors | CheXNet, U-Net, nnU-Net, MedSAM, diffusion recon (see sources.md) |

> **All values are literature-derived defaults.** Replace them with your own scanner logs, utility bills, GPU measurements, or validation results for publication-quality reporting. CEDARS **models energy** but only **records performance** — it never predicts a model's accuracy.

---

## Run locally

```bash
git clone https://github.com/takinci/cedars.git
cd cedars/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To build for deployment:

```bash
npm run build   # outputs to ../docs/
```

> Requires Node 20+ (Vite 5).

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Icons | Lucide React |
| Hosting | GitHub Pages (static, no backend) |
| CI/CD | GitHub Actions |

---

## Who is it for?

- **Radiologists and clinical leads** — understand your department's footprint and find quick wins
- **Sustainability officers** — generate Scope 1/2/3 estimates and CEDARS disclosures for ESG reporting
- **Medical physicists** — benchmark scanner energy against published literature
- **AI developers and governance teams** — model a model's build/run footprint, benchmark candidates on accuracy-vs-carbon, and generate a research-disclosure label; deploy clinical AI to a department to see its net operational effect
- **Academic researchers** — generate a standardised CEDARS EcoLabel for a manuscript, with a reproducible disclosure checklist
- **Healthcare executives** — communicate performance in accessible equivalencies

---

## Assumptions and governance

1. Prefer measured data — scanner logs, smart meters, utility bills, GPU measurements always override defaults
2. Literature values are transparent defaults, not authoritative truth
3. Mark every input as *measured*, *estimated*, or *assumed*
4. Carbon intensity must be editable and region-specific
5. Separate AI gross footprint from estimated sustainability benefits
6. Report Scope 1, 2, and 3 separately
7. **Energy may be modelled; model performance may only be recorded** — accuracy and clinical benefit are user-entered, never predicted

See [sources.md](./sources.md) for the full assumptions-governance document.

---

<div align="center">

Built for radiology sustainability research · Evidence-based · Open source

[**→ Open CEDARS**](https://takinci.github.io/cedars/)

</div>
