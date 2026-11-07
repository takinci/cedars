# CEDARS — Scientific and Methodological Framework

## Purpose

CEDARS (Carbon, Energy Diagnostics and Reporting for Sustainability) is a research platform for estimating, interpreting, improving, and reporting environmental impacts associated with radiology departments and medical artificial intelligence (AI). The framework is designed to make assumptions, system boundaries, uncertainty, and evidence provenance visible rather than collapse heterogeneous environmental and clinical considerations into a single opaque result.

This document defines the **scientific and methodological logic** of CEDARS. Numerical defaults, source-specific evidence, validation/benchmark studies, and assumption provenance are governed in [`sources.md`](./sources.md). The interface should implement this framework without altering its meaning; presentation rules are defined in [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md).

CEDARS is research software under active development. Its Score and EcoLabel are CEDARS-generated assessment and reporting outputs whose interpretation depends on the documented methods, assumptions, and provenance.

---

## 1. Methodological architecture

CEDARS separates four related but distinct activities:

1. **Profile the current state** — document the care environment or AI system and the available evidence.
2. **Interpret the current footprint** — report quantified environmental results within an explicit boundary and identify what was not assessed.
3. **Improve prospectively** — test scenarios or planning actions without rewriting the current baseline.
4. **Report and preserve provenance** — export assumptions, evidence context, disclosure gaps, and reproducibility information with the result.

The governing distinction is therefore:

> **Profile = documented current state. Improve = prospective or hypothetical state.**

A prospective scenario does not become part of the current Sustainability Profile until the underlying inputs are updated to reflect an implemented change.

---

## 2. Assessment objects

CEDARS supports two related assessment objects.

### Radiology Department

The Department pathway represents the **care environment**: imaging equipment, utilization and power states, imaging activity, storage/informatics, selected resource and Scope 3 categories when data are available, and Clinical AI as it is deployed locally.

The Department assessment is intended to answer questions such as:

- What is the current modeled operational footprint of this radiology environment?
- Which components drive that footprint within the assessed boundary?
- Which prospective changes are worth evaluating in the local workflow?

### AI Model & Informatics

The AI pathway represents the **AI system and its lifecycle** rather than the entire clinical department. It supports three decision contexts:

- assess one system already selected, purchased, or deployed;
- compare candidates addressing the same clinical need; or
- develop, train, fine-tune, or materially retrain an AI system.

A technical model record can be reused across local deployments, while deployment-specific workload, compute context, and locally observed workflow effects remain properties of the use setting.

---

## 3. System boundaries and disclosure

CEDARS does not treat an assessment as complete merely because a numerical result is available. Every result should be interpreted with its **system boundary** and **coverage**.

The framework distinguishes:

- **core quantified results** that enter the current scored boundary;
- **extended estimates** that are reported separately when supported;
- **not assessed / unavailable** categories; and
- **prospective scenarios** that belong to Improve rather than the current baseline.

Environmental domains with different units or evidentiary status should not be combined solely to produce a more comprehensive-looking score. Energy, carbon, water, materials, contrast, travel, and embodied impacts may therefore be disclosed separately when a defensible common aggregation is unavailable.

**Missing is not zero.** Absence of training data, water data, workflow-effect evidence, or a Scope 3 category must not be interpreted as absence of impact.

---

## 4. Evidence, provenance, and uncertainty

CEDARS distinguishes the origin of values and claims because evidence quality changes how a result should be interpreted.

Inputs may be based on:

- local measurement;
- local records or validated estimates;
- published/literature evidence;
- transparent modeled assumptions; or
- illustrative defaults used only as editable starting points.

Published evidence is not automatically promoted to a local effect or a universal default. Source applicability depends on the measured population, equipment, workflow, hardware, geography, duration, system boundary, and method.

The authoritative source roles and default-setting rationale are maintained in [`sources.md`](./sources.md). When evidence conflicts, CEDARS should preserve the conflict and document the choice rather than silently average incompatible studies.

---

## 5. Radiology Department methodology

Department modeling organizes environmental opportunities around the radiology workflow rather than a flat list of interventions:

**Order / need → Schedule / prepare → Acquire → Process / interpret → Store / follow-up**, with **Infrastructure & lifecycle** as a cross-cutting layer.

This structure is descriptive, not prescriptive. A modeled environmental opportunity does not establish clinical appropriateness, operational feasibility, or a required implementation order.

Equipment energy is modeled from the available fleet, operating states, time allocation, and user/local overrides. Storage, informatics, contrast, embodied impacts, and other categories are included only where the implemented model and evidence support them. Weak generic proxies should not be promoted to current reported values merely to make the inventory appear complete.

Power-management coverage for CT, MRI, and reporting workstations is part of the **current Profile** when it is documented locally. Prospective power-management scenarios are modeled from the incremental gap between current and target coverage rather than re-crediting the whole fleet. CT, MRI, and workstations remain separate because their safe low-power states and operational constraints differ.

Department **Workflow** and **Decision Workspace** use the same causal stage map and intervention identifiers. A practice documented as already implemented is carried forward as current-state context and is not credited again as prospective savings. The Process / interpret AI-efficiency lever is shown in both places but requires a recorded local Clinical AI use before it can be modeled as a Department change.

Electricity cost is contextual rather than a total cost-of-care estimate. It is calculated from modeled electricity × the configured or regional-default electricity price. Workflow shows the current estimated electricity-cost baseline; Decision Workspace carries forward that same baseline and shows projected electricity cost and estimated electricity savings for the prospective scenario.

Current Department Score boundaries, default values, and benchmark limitations are specified in [`sources.md`](./sources.md).

---

## 6. AI lifecycle methodology

The public AI Profile follows the lifecycle:

**Context → Training → Deployment → Result (EcoLabel)**

This sequence is both a user workflow and a scientific separation of concerns. **Context** records clinical purpose, model/task identity, and optional performance/validation evidence. **Training** records one-time development or fine-tuning burden. **Deployment** records recurring inference workload, deployment compute context, and optional workflow/downstream-effect and water disclosures. **Result (EcoLabel)** summarizes what the available lifecycle record supports without treating unavailable phases as zero.

Training scientifically precedes inference, but the two phases may occur on different hardware, in different compute locations, under different facility overheads, and under different organizational control. Their compute contexts should therefore be represented separately when they differ.

### Context and performance evidence

Clinical purpose and performance/validation evidence provide interpretation and governance context. They are not substituted for environmental measurements, and CEDARS does not predict clinical performance. Environmental comparison is meaningful only among systems that meet the relevant clinical and operational requirements.

### Training / development

Training is a development-phase burden. Where direct energy measurement or defensible GPU-hours are available, those values should take precedence over generalized estimates. Development reporting should account for materially relevant experimentation, tuning, repeats, and retraining when those activities are part of the assessed boundary rather than reporting only the final successful run.

### Inference / deployment

Inference is a recurring deployment burden. Per-use energy may be measured directly or estimated from supported workload and hardware assumptions. For LLM, multimodal, and agentic systems, workload may be better represented by calls, tokens, model/serving choices, and orchestration than by a single image-model forward-pass abstraction.

Workflow and downstream effects belong to the deployment context because they arise from use in care rather than from the model artifact alone. Published external evidence may contextualize these effects, but only locally observed or locally validated effects may alter the current modeled footprint. Prospective assumptions remain in the Decision Workspace.

Water is an optional resource disclosure within Deployment. It is reported separately from the current carbon-and-energy Score; unavailable water data remain explicitly not assessed rather than being treated as zero.

### Compute context

Clinical location and compute location are distinct. A radiology department may be in one region while model training or inference occurs in another cloud or datacenter region. Training and deployment may also use different providers or regions. CEDARS should not infer one location from another.

---

## 7. Clinical context and candidate comparison

Environmental comparison is meaningful only when the compared systems address a sufficiently aligned decision.

For candidate comparison, CEDARS therefore separates:

- shared clinical purpose / intended use;
- performance and validation evidence;
- deployment/workflow context; and
- environmental intensity.

**Clinical suitability precedes environmental differentiation.** CEDARS should not create a compensatory weighted score in which a lower environmental burden can mathematically offset inadequate clinical performance or an inappropriate use case.

Performance and environmental burden remain separate dimensions. Environmental comparisons are interpreted among options that meet the clinical and operational requirements defined for the decision.

For a single-model environmental assessment, incomplete clinical evidence does not necessarily prevent footprint accounting, but the limitation must remain visible and must not be mistaken for evidence of clinical suitability.

---

## 8. Workflow and system effects

AI may change downstream clinical operations as well as add compute. These effects are not generally intrinsic properties of a model and should not be assumed from a task label or publication alone.

CEDARS distinguishes:

- **locally observed effects**;
- **locally validated estimates**;
- **published external evidence**; and
- **scenario assumptions**.

Only locally observed or locally validated effects may alter the current modeled footprint. Published external evidence can contextualize a profile; scenario assumptions belong in Improve. A value of “no current effect credit” means that CEDARS is not modifying the current baseline on the basis of the available evidence; it does not prove that no workflow effect exists.

System effects and rebound should be reported when relevant rather than converted into unsupported categorical risk scores.

---

## 9. Prospective improvement scenarios

Improve is a **prospective decision-support layer**, not an automatic optimization engine.

A scenario may quantify a change when the current assessment and intervention model support a defensible calculation. Other actions may remain planning guidance. Quantified opportunity rankings represent modeled environmental opportunity under the entered assumptions; they are not clinical recommendations.

Where interventions act on overlapping energy or resource pools, the combined scenario calculation is authoritative. Standalone intervention estimates should not simply be added when that would double-count the same underlying burden.

Clinical, safety, legal, privacy, reliability, and operational requirements constrain whether a prospective change is appropriate to implement.

---

## 10. CEDARS EcoLabel Score, Rating, improvement potential, and EcoLabel

CEDARS uses **one EcoLabel family with two assessment paths**. The Department and AI pathways share the same reporting grammar—0–100 EcoLabel Score, 1–5 leaves, absolute-impact disclosure, assessment context, and provenance—but use different physical quantities appropriate to the system being assessed.

A Department EcoLabel Score and an AI EcoLabel Score therefore share a visual/reporting scale; they are **not the same physical metric and should not be interpreted as directly comparable footprints**.

### Radiology Department path: reference-adjusted operational energy

The Department EcoLabel asks how operational energy compares with the CEDARS reference for the physical imaging service represented by the assessment.

1. **Describe the service.** Enter the equipment and studies physically performed by the represented service. Practice/service context can include operation relationship (scanner-operating, mixed, or interpretation-only/teleradiology), exact radiologist count, derived practice-size group, represented sites, facility setting, location type, and service hours.
2. **Build the matched reference.** CEDARS constructs an operational-energy reference from the represented fleet, modality workload, and versioned literature/default assumptions documented in [`sources.md`](./sources.md).
3. **Compare current operation.** Current modeled imaging/PACS/reporting energy is compared with the matched reference:

```text
ratio = observed modeled operational kWh / matched reference kWh
EcoLabel Score = clamp(round(50 - 50 * log2(ratio)), 0, 100)
```

Thus `0.50×` reference maps to 100, `1.00×` to 50, and `2.00×` to 0. **Score 50 means “at the CEDARS matched reference,” not “50th percentile.”** Department leaf labels describe much lower / lower / near / higher / much higher energy than reference.

Absolute electricity and location-based carbon remain separately visible. Changing only the grid carbon factor changes absolute carbon but does not directly improve the Department EcoLabel Score. Qualitative sustainability-practice documentation does not create bonus points; a practice changes the score only when its physical effect is represented in the operational-energy model.

### Practice & service context

In the Department Context UI, **Local energy & reporting** appears first, followed by optional **Quick-start templates · illustrative data**, then **Practice & service context**. A quick-start template may prefill illustrative service context, workload, equipment, and current workflow values; every value remains editable and should be verified or replaced before reporting.

For an equipment-operating service, the preferred workload is the number of studies physically performed on the equipment represented by the assessment. Mixed practices should exclude externally acquired interpretation-only studies from the scanner-operations denominator.

An interpretation-only/teleradiology service can still report workstation, PACS, storage, cloud, and related environmental impacts, but does not receive the scanner-operations rating because the acquisition equipment is outside the represented physical system.

When available, CEDARS records the exact number of radiologists and maps it to the six published practice-size groups (**1–2, 3–9, 10–24, 25–49, 50–99, ≥100 radiologists**). Practice size, sites, facility setting, location, service hours, and operating model are carried with the Department service reference so the result can be interpreted in the appropriate practice context. The current numerical energy reference is calculated from represented equipment and physical workload; practice type itself does not create bonus points or an unvalidated numerical adjustment.

### AI Model & Informatics path: lifecycle carbon intensity

The AI Research EcoLabel retains the lifecycle carbon-intensity approach. When the required lifecycle basis is available, the EcoLabel Score uses amortized training (`training CO₂ ÷ lifetime studies/uses`) plus recurring inference carbon per study/use on the documented v1 log-scale anchors. Missing lifecycle phases are not treated as zero: an unentered training or per-study inference *footprint* still withholds the Score. Deployment *scale* (studies/month) is treated differently, because — unlike a footprint — it already has a documented literature anchor CEDARS uses elsewhere as a default comparison workload (5,100 studies/month for a small US practice; Doo et al. JACR 2024). When scale is not entered but a per-study inference figure exists, CEDARS grades against that literature default rather than withholding the Score, and discloses the assumption (EcoLabel, exports, Report page) so it is never mistaken for the model's actual deployment.

Clinical/performance suitability remains a gate rather than a compensatory score component: a lower environmental burden does not make an unsuitable AI system clinically acceptable.

### Shared leaf display and reporting

Both paths use a 0–100 EcoLabel Score and 1–5-leaf visual grammar. The text attached to the leaves is pathway-specific:
- **Department:** distance from the matched operational-energy reference.
- **AI:** lifecycle carbon-intensity band on the current provisional research scale.

### Improvement Potential

Decision Workspace remains prospective and separate from the current EcoLabel. It applies candidate changes without overwriting the current Profile. Overlapping savings are counted once by the combined scenario calculation.

### Future empirical calibration

The Department v1.1 method is a transparent engineering/literature reference model. Future peer-adjusted or percentile language should be introduced only after real-world data are sufficient to estimate and externally validate which service covariates materially explain operational-energy variation. AI anchors likewise remain research anchors pending stronger deployment datasets.

<!-- CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD -->
<!-- CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL -->
<!-- CEDARS_CHUNK_9R32E_ECOLABEL_PATHS_PRACTICE_CONTEXT -->

### AI score per use

For the AI Research EcoLabel, **per use** means the allocated training impact per expected lifetime use plus the recurring deployment/inference impact for that use. Training can be energy-intensive up front, but its per-use contribution falls as it is amortized over more expected uses; at sufficiently high deployment volume, cumulative inference can exceed the amortized training share. CEDARS therefore keeps training and deployment inputs separate rather than assuming a fixed split. Hardware generation, software/model architecture, data-center efficiency, compute location, and electricity mix can all change these quantities over time, so the reported result should retain its measurement/estimation context and provenance. See `Masanet-Joule-2024-AIData` and `Patterson-Computer-2022` in `sources.md`.

## 11. Reproducibility and reporting

A CEDARS result should travel with enough information to understand how it was produced. Reporting should preserve, as applicable:

- assessment object and boundary;
- time period and workload denominator;
- location and carbon-intensity assumptions;
- equipment, hardware, and compute context;
- measured versus estimated provenance;
- lifecycle coverage;
- clinical/performance context when relevant;
- workflow-effect evidence basis;
- material missing inputs and limitations; and
- the distinction between current and prospective results.

Portable assessment files and Methods-ready exports are intended to preserve these assumptions rather than only the headline number.

---

## 12. Method maintenance

Scientific changes should be made as coordinated changes to the method, evidence registry, implementation, and reporting language.

When changing a calculation, default, boundary, Score interpretation, or evidence-dependent recommendation:

1. update the relevant methodological statement here if the governing logic changes;
2. update [`sources.md`](./sources.md) with the evidence role, rationale, and affected variable/output;
3. update code/tests so implementation matches the documented method;
4. update public-facing explanatory text when interpretation changes; and
5. record the change in [`CHANGELOG.md`](./CHANGELOG.md) when it affects users or reported outputs.

The method should evolve through explicit revisions rather than accumulating undocumented exceptions in the interface or calculation code.

<!-- CEDARS_CHUNK_9R30_FINAL_WORKFLOW_COST_LINKAGE -->

<!-- CEDARS_CHUNK_9R32D_SERVICE_CONTEXT_RESPONSIVE_HARDENING -->

<!-- CEDARS_CHUNK_9R32I_CONTEXT_ORDER_REFERENCE_COPY -->

<!-- CEDARS_CHUNK_9R32J_AI_PER_USE_CONTEXT_GATE -->
