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
> CEDARS is an open research platform. A manuscript describing CEDARS has been **submitted for peer review**. The software, interface, defaults, and methods remain under active development and may evolve as validation and evidence improve. The CEDARS Score and EcoLabel are CEDARS-generated assessment and reporting outputs; interpretation should retain the documented methods, assumptions, and provenance.

**Live application:** [cedarsleaf.com](https://cedarsleaf.com)
**About the CEDARS Collaborative:** [international collaborators, institutions, and project background →](https://cedarsleaf.com/?page=about)

CEDARS is a multi-person, multi-institutional, international collaboration spanning radiology, clinical AI, sustainability, and health systems. Collaborator affiliations identify contributors and do not imply institutional endorsement or sponsorship.

---

## What CEDARS does

CEDARS separates the **current assessed state** from **prospective decision support** and **reporting**:

| Stage | Purpose |
|---|---|
| **1 · Profile** | Document the current Radiology Department or AI system and establish the evidence-supported baseline |
| **2 · Decision Workspace** | Explore prospective changes without silently rewriting the current Profile |
| **3 · Report & Share** | Review reproducibility and disclosure gaps, prepare CEDARS materials, and preserve or share the assessment |

Within **Profile**, the Department and AI pathways use parallel four-stage structures:

| Radiology Department | AI Model & Informatics |
|---|---|
| **Context** — region, equipment, workload, energy baseline | **Context** — clinical purpose, model/task context, comparison or assessment setup |
| **Workflow** — how imaging care is delivered today | **Training** — development/training inputs and compute context |
| **Clinical AI** — optional local informatics/Clinical AI use | **Deployment** — inference workload, compute location, and deployment assumptions |
| **Result (EcoLabel)** — current footprint, EcoLabel Score, and EcoLabel | **Result (EcoLabel)** — current lifecycle result, coverage, and EcoLabel |

Department Context is presented in the same order users make the assessment: **Local energy & reporting → Quick-start templates (optional) → Practice & service context → Equipment**. Quick-start templates prefill editable illustrative context/workload/fleet values; users should verify or replace them before reporting.

The **CEDARS EcoLabel Score is interpreted with Result (EcoLabel)**. The Department EcoLabel and AI Research EcoLabel preview the current assessed result in Profile and are carried forward as the same reporting product in **Report & Share**.

No account or installation is required for the public site. An optional Google sign-in lets a user save a private copy of their assessment and continue it on another device — see [Saving, sharing, and privacy](#saving-sharing-and-privacy).

### Two related AI concepts

CEDARS deliberately separates:

- **Clinical AI** — how an AI system is used in a Radiology Department. Local use can add compute while also changing imaging operations, such as scan time, avoided studies, or contrast use.
- **AI Model & Informatics** — the lifecycle characteristics of the AI system itself, including model/task context, training, inference, compute location, deployment assumptions, provenance, and model comparison.

The technical model is described once; local Department use is configured separately.

---

## Core capabilities

### Radiology Department

The Department Profile follows **Context → Workflow → Clinical AI (optional) → Result (EcoLabel)**. CEDARS can estimate and contextualize equipment energy, utilization, energy/carbon per study, electricity emissions, modeled Scope 3 categories, storage/archiving, Clinical AI, contrast-media and resource indicators, and current workflow practices. Local measured values can replace defaults where supported.

### AI Model & Informatics

The AI Profile follows **Context → Training → Deployment → Result (EcoLabel)**. CEDARS starts from three user intentions: assess one AI system already selected or in use, compare like-for-like candidates, or assess a model being developed/evaluated. The underlying record supports single-task imaging AI, LLM/foundation-model and agentic workloads; separate training and inference compute contexts; provenance; deployment-volume and amortized per-study reporting; and an optional **AI Research EcoLabel**. CEDARS does not predict model performance.

### Decision Workspace

The Decision Workspace separates the **current Profile** from **prospective scenarios**. Department opportunities can be ranked from the current assessment when CEDARS can model them; guidance-only AI/informatics checks remain explicitly non-quantified unless sufficient inputs exist. A modeled scenario does not become part of the current Profile until the underlying real-world inputs are deliberately updated after implementation.

### Report & Share

Reporting is organized around:

1. **CEDARS EcoLabel** — the same current result reviewed in Profile
2. **Methods & evidence** — reporting text, assumptions, coverage, and reproducibility
3. **Save & share** — local/browser save, portable file, optional private Google save, shareable link, or explicit research contribution

Outputs include research labels, reporting text, structured methods/reproducibility fields, and portable assessment files. CEDARS labels are assessment and reporting outputs generated from the documented CEDARS record.

---

## Evidence and methodology

CEDARS is **literature-informed**, but not every model parameter has equally strong evidence. Some values are published measurements; others are transparent estimates, proxies, or illustrative defaults where direct evidence is limited. The repository separates methodological decisions from the evidence used to support them:

- **[`METHODS.md`](./METHODS.md)** — scientific and methodological framework: assessment objects, boundaries, lifecycle logic, evidence treatment, comparison rules, prospective scenarios, EcoLabel Score/EcoLabel interpretation, and reporting principles.
- **[`sources.md`](./sources.md)** — authoritative evidence and assumption registry: source roles, parameter provenance, default-setting rationale, benchmark limitations, verification notes, and bibliography.
- **[`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)** — interface and interaction system used to present the methods consistently without changing their scientific meaning.

Relevant references are also linked directly from the public interface where they affect interpretation or guidance. Local measurements should replace defaults for reporting of record whenever available, and model performance is user-supplied rather than predicted by CEDARS.

The detailed bibliography remains centralized in `sources.md`; `METHODS.md` should reference source IDs rather than reproduce a parallel bibliography that can drift out of date.

---

## Saving, sharing, and privacy

Normal calculator use is browser-local by default.

| Option | Purpose |
|---|---|
| **Save on this device** | Browser-local working copy; no account |
| **Complete CEDARS file** | Portable, versioned `.cedars.json` assessment for backup or exact transfer |
| **Reproducible link** | Compact calculator / selected AI-profile configuration; useful for reproducibility, but not a complete multi-model or free-text backup |
| **Continue on another device** | Optional Google sign-in; saves a private copy to the signed-in user's own account only |
| **Contribute this assessment** | Optional research submission after explicit review and consent |

A reproducible URL is **not private**: anyone with the full link can open the encoded configuration. Names, email addresses, consent choices, and patient-identifiable information are not intentionally placed in the shareable URL.

**Continue on another device** is separate from research contribution and is not reviewed or collected by CEDARS — it exists only so a signed-in user can reopen their own work elsewhere, enforced by Firestore security rules restricted to that user's own account (see [`firebase/README.md`](./firebase/README.md)). It does not require research-contribution consent and nothing saved this way is sent to the research-contribution backend.

Research contribution is separate from normal saving and sharing. A contribution is transmitted only when the user explicitly reviews and submits the contribution form; normal calculations, local saves, portable-file import/export, and shareable links remain browser-side.

---

## Reproducibility

The calculation logic is kept in testable modules rather than duplicated in the interface:

| Module | Responsibility |
|---|---|
| `calc.js` | CEDARS Score/Rating and regional carbon/cost helpers |
| `model.js` | Department fleet, dashboard, clinical effects, storage, and intervention calculations |
| `urlstate.js` | Validation and encode/decode of shareable calculator state |
| `ailabel.js` | AI model record → AI Research EcoLabel calculations and reporting fields |
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

- [`METHODS.md`](./METHODS.md) — scientific and methodological framework
- [`sources.md`](./sources.md) — evidence, assumptions, provenance, limitations, and references
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) — visual and interaction system
- [`CHANGELOG.md`](./CHANGELOG.md) — user-facing changes
- [`CITATION.cff`](./CITATION.cff) — software citation metadata
- [About the CEDARS Collaborative](https://cedarsleaf.com/?page=about) — collaborators, institutions, and project background
- [`cloudflare/README.md`](./cloudflare/README.md) — optional research-contribution backend
- [`firebase/README.md`](./firebase/README.md) — optional Google sign-in (verified contributor identity and cross-device cloud save)
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

For scientific or operational reporting of record, review the methodological boundary in [`METHODS.md`](./METHODS.md), the evidence and assumptions in [`sources.md`](./sources.md), and replace defaults with appropriate local measured data where available.

---

<div align="center">

**[Open CEDARS →](https://cedarsleaf.com)**

Radiology sustainability · Clinical AI · Transparent environmental reporting

</div>

<!-- CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD -->

<!-- CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL -->

<!-- CEDARS_CHUNK_9R32D_SERVICE_CONTEXT_RESPONSIVE_HARDENING -->

<!-- CEDARS_CHUNK_9R32E_ECOLABEL_PATHS_PRACTICE_CONTEXT -->

<!-- CEDARS_CHUNK_9R32I_CONTEXT_ORDER_REFERENCE_COPY -->
