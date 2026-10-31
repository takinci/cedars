# CEDARS — Scientific and Methodological Framework

## Purpose

CEDARS (Carbon, Energy Diagnostics and Reporting for Sustainability) is a research platform for estimating, interpreting, improving, and reporting environmental impacts associated with radiology departments and medical artificial intelligence (AI). The framework is designed to make assumptions, system boundaries, uncertainty, and evidence provenance visible rather than collapse heterogeneous environmental and clinical considerations into a single opaque result.

This document defines the **scientific and methodological logic** of CEDARS. Numerical defaults, source-specific evidence, validation/benchmark studies, and assumption provenance are governed in [`sources.md`](./sources.md). The interface should implement this framework without altering its meaning; presentation rules are defined in [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md).

CEDARS is research software under active development. Its Score and EcoLabel are research reporting outputs, not external certification.

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

Current Department Score boundaries, default values, and benchmark limitations are specified in [`sources.md`](./sources.md).

---

## 6. AI lifecycle methodology

The AI lifecycle is represented directionally:

**Purpose / evaluation context → Training / development → Inference / deployment → monitoring and reporting**

Training scientifically precedes inference, but the two phases may occur on different hardware, in different compute locations, under different facility overheads, and under different organizational control. Their compute contexts should therefore be represented separately when they differ.

### Training / development

Training is a development-phase burden. Where direct energy measurement or defensible GPU-hours are available, those values should take precedence over generalized estimates. Development reporting should account for materially relevant experimentation, tuning, repeats, and retraining when those activities are part of the assessed boundary rather than reporting only the final successful run.

### Inference / deployment

Inference is a recurring deployment burden. Per-use energy may be measured directly or estimated from supported workload and hardware assumptions. For LLM/multimodal/agentic systems, workload may be better represented by calls, tokens, model/serving choices, and orchestration than by a single image-model forward-pass abstraction.

### Compute context

Clinical location and compute location are distinct. A radiology department may be in one region while model training or inference occurs in another cloud or datacenter region. CEDARS should not infer one from the other.

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

## 10. CEDARS Score and EcoLabel

The CEDARS Score is intended to summarize a defined environmental-intensity result **within a stated boundary**, not the total sustainability of a department or AI system.

Current implementation principles include:

- a scored context uses a defined carbon-intensity quantity rather than a tunable weighted composite of unrelated environmental domains;
- categories outside the scored boundary remain separately disclosed;
- reference ranges and anchors must be labeled according to their actual validation status; and
- missing lifecycle phases or categories must not be treated as zero to obtain a score.

The current equations, boundaries, reference ranges, and their limitations are documented in [`sources.md`](./sources.md). Where anchors remain heuristic rather than empirically calibrated, that limitation is part of the method and must remain visible.

The EcoLabel is a structured research reporting output derived from the assessment record. It is **not an external certification**.

---

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
