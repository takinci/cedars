# Changelog

This changelog is organized by **product/scientific area**, not by internal patch number. Within each area, consequential decision points are listed **most recent first**. Git history remains the detailed implementation audit trail.

## EcoLabel & reporting

- **2026-11-04 — Final Context gating and AI per-use explanation.** Department Context now makes the required sequence explicit: users choose the local country/grid context first, while Quick-start, Practice & service context, and Equipment remain visible but muted/disabled until that selection is made. EcoLabel Method now defines AI "per use" beside the AI leaf scale, explaining training amortization, recurring inference, deployment-scale dependence, and changing hardware/software efficiency with Masanet et al. (Joule 2024) and Patterson et al. (Computer 2022) cited in Methods & Sources.

- **2026-11-04 — Department Context order and service-reference copy refined.** Local energy/reporting now appears first, followed by optional illustrative quick-start templates and then Practice & service context. Quick-start archetypes prefill editable service/workload/fleet context, including an illustrative practice-size range; optional modality workload is shown with a dashed optional treatment and improved dark-mode contrast. Public copy now explains that practice/service details travel with the service reference for like-for-like interpretation, while the current numerical energy reference remains driven by represented equipment and physical workload rather than unvalidated practice-type bonus points. Walkthrough, EcoLabel Method, README, llms.txt, METHODS.md, and sources.md were synchronized.
- **2026-11-04 — Department practice/service context render repair.** Practice size, radiologist count, represented sites, service setting, hours, and scanner-operating/mixed/teleradiology status are now nested inside the visible Department Context card so they cannot disappear during surrounding layout rewrites. This patch also bundles the planned layperson EcoLabel Method polish when 9R32G has not yet been applied.

<!-- CEDARS_CHUNK_9R32H_PRACTICE_CONTEXT_RENDER_REPAIR -->
<!-- CEDARS_CHUNK_9R32G_ECOLABEL_METHOD_LAYPERSON_POLISH bundled in 9R32H -->

- **2026-11-04 — EcoLabel Method simplified into one continuous two-path infographic.** Department and AI calculation summaries now live directly inside their respective paths; technical assumptions, calibration notes, evidence navigation, and full Methods & Sources are consolidated into one accordion. Public labels avoid technical shorthand such as ‘reference-adjusted’ and ‘lifecycle carbon intensity,’ and the assessment CTA matches the Evidence page.

<!-- CEDARS_CHUNK_9R32F_ECOLABEL_METHOD_SIMPLIFICATION -->

- **2026-11-04 — Two-path EcoLabel method and practice-context UI.** Reframed the public method page around one EcoLabel family with two assessment paths (Radiology Department and AI Model & Informatics), converted the page to an infographic-first layout with technical details collapsed, renamed the shared umbrella metric to **EcoLabel Score**, made Department and AI leaf interpretations pathway-specific, and clarified that their scores share a reporting scale but not a physical metric. Department Context now presents a plain-language **Practice & service context** card with editable blue inputs for operation model/teleradiology, radiologist count, sites, setting/location, service hours, and physical workload; radiologist count derives the published practice-size context without awarding score points.
- **2026-11-04 — Department EcoLabel moved to reference-adjusted service normalization.** The Department rating now compares modeled operational energy with a CEDARS reference matched to the represented fleet and modality workload, with Score 50 marking the matched reference rather than a peer percentile. Absolute kWh, kgCO₂e/study, and annual carbon remain separate disclosures. Facility/location/service-hours context and the published six-bin radiologist practice-size taxonomy are preserved for future validation but do not directly award score points; interpretation-only/teleradiology services are disclosure-only for the scanner-operations rating.
- **2026-11-04 — Service-context and responsive hardening.** Department Context now surfaces the physical service boundary before grid/carbon assumptions, including operation relationship (with interpretation-only/teleradiology), exact radiologist count with derived published practice-size band, represented imaging sites, facility/location, and service hours. Added workload/fleet consistency guardrails, removed the inherited white band on EcoLabel Method, repaired dark-mode walkthrough bullet contrast, and made the header, workflow rail, Decision Workspace, and Report & Share reflow earlier under browser zoom/narrow effective widths.

- **2026-11-04 — Footprint Score framing and public EcoLabel Method added.** The existing numerical Score is now named the **CEDARS Footprint Score**; leaf labels describe footprint magnitude rather than implying peer rank or mitigation effort. The v1 Department and AI anchors are explicitly provisional research anchors, and a public EcoLabel Method page explains the equation, boundaries, Improvement Potential, service context, and future calibration.

- **2026-11-04 — One CEDARS EcoLabel family.** Department and AI Research EcoLabels now use the same shell, palette, leaf-scale grammar, coverage hierarchy, key-result structure, assessment-context rows, and provenance footer. Result (EcoLabel) and Report & Share render the same reporting object rather than parallel visual products.
- **2026-11-04 — Coverage is explicit rather than implied.** Department Result distinguishes the operational Score boundary, categories assessed beyond the Score, and categories not assessed; compact counts disclose the actual category names. Missing lifecycle phases in AI remain visible and are not treated as zero.
- **2026-11-04 — Result interpretation is parallel.** Department and AI Results both include an “Interpret the result / Put this result in everyday terms” layer. AI distinguishes per-study intensity from deployment-period total impact so scale comparisons do not blur those two questions.
- **2026-11-04 — Report & Share order stabilized.** EcoLabel is the first reporting product, followed by Methods/evidence and Save & share. Public copy emphasizes CEDARS-generated assessment provenance rather than repetitive certification disclaimers.
- **2026-10-31 to 2026-11-02 — Research reporting hierarchy established.** Methods/provenance, current-state Results, prospective Decision Workspace outputs, and save/share actions were separated into distinct roles. Representative commits: [`3372166e`](https://github.com/takinci/cedars/commit/3372166e998f87c99efb231c3c631e7ba5edf596), [`1e88f6c6`](https://github.com/takinci/cedars/commit/1e88f6c69b417f168067964aef62d39ca7c7f90f).

## Assessment workflows

- **2026-11-04 — Decision Workspace context made action-oriented.** Current workflow observations such as potentially avoidable imaging are carried into the relevant prospective stage as decision context without being automatically converted into savings; combined scenarios explain overlap in plain language and the dead before/after scroll button was removed.

- **2026-11-04 — Workflow and Decision Workspace now use one stage/lever grammar.** Current practices and prospective changes use the same causal stage mapping; an already-implemented practice is carried forward rather than credited twice. The Process / interpret AI-efficiency lever is visible on both sides and requires a recorded local Clinical AI use before Department modeling.
- **2026-11-04 — Electricity-cost context now follows the baseline into decisions.** Workflow shows the current estimated electricity-cost baseline; Decision Workspace shows baseline and projected electricity cost plus estimated savings from the same configured/default tariff. These are electricity-only estimates, not total cost-of-care claims.
- **2026-11-04 — Current-state power management made explicit.** Department Workflow records CT, MRI, and reporting-workstation power-management coverage separately; Decision Workspace models only the incremental current-to-target opportunity. Representative commit: [`960134b`](https://github.com/takinci/cedars/commit/960134bbb379fd48d99323e5cfaacc50e33d7116).
- **2026-11-04 — Department Profile finalized as Context → Workflow → Clinical AI (optional) → Result (EcoLabel).** “Digital + AI” was renamed **Clinical AI** to distinguish local deployment/use from the separate AI Model & Informatics record.
- **2026-11-04 — AI Profile finalized as Context → Training → Deployment → Result (EcoLabel).** Performance/validation remains optional Context evidence; workflow/downstream effects and optional resource disclosures belong to Deployment; technical assumptions remain separate estimation inputs.
- **2026-11-03 — Gating and progression strengthened.** Required Context inputs control later Department stages, while walkthrough examples satisfy the same gate rather than bypassing it. AI lifecycle progression and return/escape routes were similarly clarified. Representative commits: [`e8397693`](https://github.com/takinci/cedars/commit/e83976936b52caa8225af2b246af4f6379dffa32), [`753beb9d`](https://github.com/takinci/cedars/commit/753beb9d2b86f3bae2aca4c0cc03ffe05c2a79c5).
- **2026-10-31 — Controlled stage navigation replaced observer/anchor-driven progression.** This removed page-jump feedback loops and established the discrete Profile-stage model used by both pathways. Representative commit: [`b255887e`](https://github.com/takinci/cedars/commit/b255887eea4eb76d70b46c61028532480b7fbde9).

## Evidence, methods & scientific assumptions

- **2026-11-04 — Evidence registry reconciled with current CEDARS behavior.** `METHODS.md` documents the governing workflow/boundary logic; `sources.md` records evidence roles, source scope, numerical defaults, limitations, and maintained tool-version snapshots.
- **2026-11-04 — Measurement-tool provenance made reproducible.** “Help me measure” distinguishes direct telemetry, usage/specification estimates, external benchmarks, and embodied-hardware data. Version-specific CEDARS reference snapshots are retained even when newer upstream releases are observed.
- **2026-11-04 — Water remains a separate disclosure.** Department water requires appropriate local data for reporting; the generic 1.8 L/kWh value is only a screening reference. AI water distinguishes optional compute-site/grid inputs from screening/not-assessed states and does not enter the current carbon-and-energy Score.
- **2026-11-04 — Clinical quality remains a gate, not a compensatory weight.** Candidate comparison keeps clinical/performance suitability and environmental intensity as separate dimensions; lower environmental burden cannot mathematically offset an unsuitable clinical option.
- **2026-11-03 — Documentation ownership formalized.** Scientific logic, evidence/default provenance, and presentation rules were separated across `METHODS.md`, `sources.md`, and `docs/DESIGN_SYSTEM.md`. Representative commits: [`9490cb7e`](https://github.com/takinci/cedars/commit/9490cb7eb58527761b64378c6b6e946c2d518d28), [`00475d1b`](https://github.com/takinci/cedars/commit/00475d1b2e761c970843967b4aaba202c307a00d).

## Persistence, privacy & deployment

- **2026-11-04 — Optional Google sign-in can verify contributor identity.** Research contribution can use Google sign-in to verify a contributor's name/email server-side; anonymous/free-text contribution remains available when sign-in is not used. This is separate from private cross-device cloud save.

- **2026-11-04 — Optional private Google-account save added.** A signed-in user can reopen a private Firestore working copy across devices; this remains separate from research contribution. Representative commit: [`473f72b6`](https://github.com/takinci/cedars/commit/473f72b6674e31ca5664d43a73a4a4b0d66de45b).
- **Current architecture — Browser-local remains the default.** Local save, calculations, portable `.cedars.json` import/export, and normal assessment use do not require research contribution; contribution remains an explicit review-and-submit action.
- **Current schema — Portable assessments use schema v3.** Earlier schemas remain readable through migration logic without inventing newly required local inputs.

## UX, accessibility & guided use

- **2026-11-04 — Guided walkthrough targeting made deterministic.** Stale targets were removed, targets are awaited before scrolling/highlighting, the guide card moves away from the highlighted region, walkthrough copy is bullet-based, and the final save step teaches no-login local/file options versus optional private Google save without opening an overlapping header menu.

- **2026-11-04 — Walkthroughs and final public copy reconciled with the release workflow.** The three guided journeys now explain the sequence in plain language as **current Profile → Result (EcoLabel) and interpretation → prospective Decision Workspace → EcoLabel/Methods/Save & share**. Report & Share is walked in the same order as the UI, homepage AI wording is task-oriented rather than jargon-list based, and report selectors consistently use “output” terminology.

- **2026-11-04 — Department Workflow containment finalized.** Editable blue cards and current-practice controls are explicitly box-sized within the stage workspace so they cannot paint outside the parent border at desktop or responsive widths.
- **2026-11-04 — Visual-language parity pass.** Blue denotes editable/action surfaces; dark-mode contrast and label readability were normalized; Department/AI stage footers use parallel action layouts; responsive cards reflow instead of clipping.
- **2026-11-04 — Evidence library actions consolidated.** Methods & Sources, pause/resume, and Start assessment are grouped beneath the Evidence introduction rather than competing with the page heading.
- **2026-11-03 — Walkthroughs aligned to real workflows.** Guided journeys cover Department operations, clinical AI evaluation/use, and AI development/retraining; illustrative examples remain optional and dismissible. Representative commits: [`5b1e9178`](https://github.com/takinci/cedars/commit/5b1e917825546672a9276d708140e35c0d88d9a5), [`dfa9374d`](https://github.com/takinci/cedars/commit/dfa9374de477701da1cf5be7fe68bb300b4e4f1d).
- **2026-11-01 — Sustainability and Evidence pages consolidated.** The public narrative and reading library were reorganized around practical radiology/AI sustainability questions with clearer source presentation. Representative commits: [`d6bd8ccc`](https://github.com/takinci/cedars/commit/d6bd8ccc5a76825f733c760329979085c1b24fe6), [`a00feb09`](https://github.com/takinci/cedars/commit/a00feb09381852787dd464b88f7e6845e21128e9).

## Detailed history

- **Repository planning:** actionable future work is tracked in GitHub Issues; scientific limitations remain in `METHODS.md` / `sources.md`, while completed user-facing changes remain summarized here.

This file intentionally records **user-facing and scientific decision points**, not every implementation checkpoint. For exact file-level changes, intermediate fixes, and authorship, use the repository's Git history.

<!-- CEDARS_CHUNK_9R30_FINAL_WORKFLOW_COST_LINKAGE -->

<!-- CEDARS_CHUNK_9R31A_FINAL_WALKTHROUGH_REPORT_COPY -->

<!-- CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD -->

<!-- CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL -->

<!-- CEDARS_CHUNK_9R32D_SERVICE_CONTEXT_RESPONSIVE_HARDENING -->

<!-- CEDARS_CHUNK_9R32E_ECOLABEL_PATHS_PRACTICE_CONTEXT -->

<!-- CEDARS_CHUNK_9R32I_CONTEXT_ORDER_REFERENCE_COPY -->

<!-- CEDARS_CHUNK_9R32J_AI_PER_USE_CONTEXT_GATE -->
