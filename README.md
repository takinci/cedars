<div align="center">

<img src="./Logo only.png" alt="CEDARS logo" width="120"/>

# CEDARS

### Carbon, Energy Diagnostics and Reporting for Sustainability

**A browser-based research platform for estimating, improving, and reporting the environmental footprint of radiology departments and clinical AI.**

[![Live site](https://img.shields.io/badge/Live-cedarsleaf.com-2E7D32?style=for-the-badge)](https://cedarsleaf.com)
[![License](https://img.shields.io/badge/code-Apache--2.0-455A64?style=flat-square)](./LICENSE)
[![Content](https://img.shields.io/badge/content-CC%20BY%204.0-455A64?style=flat-square)](https://creativecommons.org/licenses/by/4.0/)

</div>

---

## Project status

> **Research software · active development**
>
> CEDARS is an open research platform. A manuscript describing CEDARS has been **submitted for peer review**. The software, interface, defaults, and methods remain under active development and may evolve as validation and evidence improve. The CEDARS Score and EcoLabel are research outputs, **not an external certification**.

**Live application:** [cedarsleaf.com](https://cedarsleaf.com)

---

## What CEDARS does

CEDARS turns radiology sustainability data into a structured workflow:

| Step | Purpose |
|---|---|
| **1 · Input** | Describe a Radiology Department or an AI model / informatics workload |
| **2 · Score & EcoLabel** | Interpret the current footprint using the CEDARS Score, Rating, and standardized label |
| **3 · Improve** | Test prospective changes separately from the current state and compare projected effects |
| **4 · Report (& Share)** | Review reporting details, prepare CEDARS materials, and preserve or share the assessment |

No account or installation is required for the public site.

### Two related AI concepts

CEDARS deliberately separates:

- **Clinical AI** — how an AI system is used in a Radiology Department. Local use can add compute while also changing imaging operations, such as scan time, avoided studies, or contrast use.
- **AI Model & Informatics** — the lifecycle characteristics of the AI system itself, including model/task context, training, inference, compute location, deployment assumptions, provenance, and model comparison.

The technical model is described once; local Department use is configured separately.

---

## Core capabilities

### Radiology Department

CEDARS can estimate and contextualize equipment energy, utilization, energy/carbon per study, electricity emissions, modeled Scope 3 categories, storage/archiving, clinical AI, contrast-media and resource indicators, current practices, and projected intervention scenarios. Local measured values can replace defaults where supported.

### AI Model & Informatics

CEDARS supports one selected model or like-for-like candidate comparison; single-task imaging AI, LLM/foundation-model, and agentic workloads; separate training and inference compute contexts; provenance; deployment-volume and amortized per-study reporting; and an **AI Research Label**. CEDARS does not predict model performance.

### Improve

The Improve workspace separates **current practice** from **future scenarios**. Opportunities are ranked from the current assessment when CEDARS can model them; guidance-only AI/informatics checks remain explicitly non-quantified unless sufficient inputs exist.

### Report (& Share)

Reporting is organized around:

1. **Review & finalize**
2. **Prepare your CEDARS materials**
3. **Preserve or share**

Outputs include EcoLabels, reporting text, structured methods/reproducibility fields, and portable assessment files.

---

## Evidence and methodology

CEDARS is **literature-informed**, but not every model parameter has equally strong evidence. Some values are published measurements; others are transparent estimates, proxies, or illustrative defaults where direct evidence is limited.

- The authoritative assumptions, parameter provenance, evidence limitations, and full bibliography are maintained in **[`sources.md`](./sources.md)**.
- Relevant references are also linked directly from the public interface where they affect interpretation or guidance.
- Local measurements should replace defaults for reporting of record whenever available.
- Model performance is user-supplied and is not predicted by CEDARS.

Keeping the detailed bibliography in `sources.md` avoids duplicating partial reference lists that can drift out of date.

---

## Saving, sharing, and privacy

Normal calculator use is browser-local by default.

| Option | Purpose |
|---|---|
| **Save on this device** | Browser-local working copy |
| **Complete CEDARS file** | Portable, versioned `.cedars.json` assessment for backup or exact transfer |
| **Reproducible link** | Compact current calculator/current AI-model configuration; not a complete multi-model backup |
| **Contribute this assessment** | Optional research submission after explicit review and consent |

A reproducible URL is **not private**: anyone with the full link can open the encoded configuration. Names, email addresses, consent choices, and patient-identifiable information are not intentionally placed in the shareable URL.

Research contribution is separate from normal saving and sharing. Until the optional contribution service is deployed/configured, that action remains disabled.

---

## Reproducibility

The calculation logic is kept in testable modules rather than duplicated in the interface:

| Module | Responsibility |
|---|---|
| `calc.js` | CEDARS Score/Rating and regional carbon/cost helpers |
| `model.js` | Department fleet, dashboard, clinical effects, storage, and intervention calculations |
| `urlstate.js` | Validation and encode/decode of shareable calculator state |
| `ailabel.js` | AI model record → AI Research Label calculations and reporting fields |
| `aiRecords.js` | Canonical AI model records and Department-use persistence |

Vitest regression tests pin fixed inputs to known outputs, and the production build runs through GitHub Actions before deployment. `package-lock.json` is committed for reproducible dependency resolution.

---

## Run locally

Requirements: **Node ≥22.12**.

```bash
git clone https://github.com/takinci/cedars.git
cd cedars/frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm test
npm run build
```

Current frontend stack includes React 18, Vite 8, Chart.js, Lucide React, and Vitest.

---

## Repository guide

- [`sources.md`](./sources.md) — scientific assumptions, provenance, evidence limitations, and references
- [`CHANGELOG.md`](./CHANGELOG.md) — user-facing changes
- [`ROADMAP.md`](./ROADMAP.md) — active/planned work
- [`CITATION.cff`](./CITATION.cff) — software citation metadata
- [`cloudflare/README.md`](./cloudflare/README.md) — optional research-contribution backend
- [GitHub Issues](https://github.com/takinci/cedars/issues) — bugs, feedback, and feature suggestions

The public **About CEDARS** page lists current collaborators. Displayed affiliations identify collaborators and do not imply institutional review, endorsement, or sponsorship.

---

## Citation

A manuscript describing CEDARS has been submitted for peer review. Until a publication citation is available, please cite the software using GitHub's **Cite this repository** function, which reads [`CITATION.cff`](./CITATION.cff).

When the associated manuscript is published, the preferred article citation will be added to `CITATION.cff`.

---

## License

- **Software/source code:** [Apache License 2.0](./LICENSE)
- **Content, methodology, documentation, and generated labels/badges:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Suggested content attribution: *CEDARS (cedarsleaf.com), CC BY 4.0.*

The names **CEDARS**, the leaf mark, and **CEDARS Score / Rating** identify this project; Apache-2.0 does not grant trademark rights.

---

## Disclaimer

CEDARS is a **research and estimation tool**. Outputs may include literature-based estimates, modeled values, proxies, and user-entered data. They are not medical, clinical, financial, regulatory, or certification advice and are provided as-is without warranty.

For scientific or operational reporting of record, review the assumptions in [`sources.md`](./sources.md) and replace defaults with appropriate local measured data where available.

---

<div align="center">

**[Open CEDARS →](https://cedarsleaf.com)**

Radiology sustainability · Clinical AI · Transparent environmental reporting

</div>
