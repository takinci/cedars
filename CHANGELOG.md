# Changelog

This changelog is organized by **product/scientific area**, not by internal patch number. Within each area, consequential decision points are listed **most recent first**. Git history remains the detailed implementation audit trail.

## EcoLabel & reporting

- **2026-11-07 — Department Score no longer drifts from a scans/unit override entered alongside an explicit modality volume.** The utilisation correction that scales modeled active energy toward real demand compares entered volume against a capacity denominator; that denominator must match the literature-default throughput the active-hours assumption was itself calibrated against. Previously the local "scans/unit" override (Advanced equipment parameters) silently replaced that denominator — so entering it after an explicit, unchanged modality volume shifted the Score even though nothing about real workload had changed, and the same override-driven total also leaked into the PACS/RIS and Workstation reference-energy scaling. Both capacity denominators are now always literature-pinned. The scans/unit override still legitimately drives the *derived* modality-volume placeholder shown when no explicit volume is entered — only its separate, inconsistent role as a Score-math denominator was removed.
- **2026-11-07 — AI deployment workload falls back to a literature default instead of blocking the Score.** Deployment scale (studies/month) is routinely unknown while evaluating a candidate model, before any real deployment exists — unlike training energy, which already had a literature fallback. An unentered scale now defaults to the published small-practice volume (5,100 studies/month; Doo et al. JACR 2024, the same anchor already used elsewhere as the comparison-workload default) so a Score is still produced, with the assumption disclosed throughout (EcoLabel, PNG export, Markdown/methods export, Report page) rather than silently blocked. This does not relax the "missing information is not treated as zero" guardrail: an unentered *footprint* (training or per-study inference energy) still blocks grading exactly as before — only the recurring-use *scale* now has a disclosed default, matching how CEDARS already treats other unmeasured-but-estimable physical quantities.
- **2026-11-04 — EcoLabel family and public method finalized.** CEDARS now presents one EcoLabel family with two assessment paths: Radiology Department and AI Model & Informatics. Both use a common 0–100 EcoLabel Score and 1–5-leaf reporting grammar while retaining pathway-specific physical meaning. Department leaves describe operational energy relative to the CEDARS service reference; AI leaves describe carbon per study/use. Absolute energy/carbon, assessment coverage, missing information, and provenance remain separately visible. The public EcoLabel Method page uses an infographic-first explanation with technical assumptions collapsed into Methods & Sources.
- **2026-11-04 — Department service reference and Context finalized.** Department Context is ordered as local energy/reporting → optional illustrative Quick-start → Practice & service context → Equipment. The numerical Department reference is driven by represented equipment and physical workload; practice size, sites, setting, location, service hours, and operating/mixed/teleradiology status travel with the reference for like-for-like interpretation rather than acting as bonus points. Score 50 means “at the CEDARS reference,” not the 50th percentile. Interpretation-only/teleradiology assessments disclose relevant digital/IT impacts without receiving a scanner-operations rating. Context/workload consistency checks prevent misleading scores.
- **2026-11-04 — Result, reporting, and interpretation standardized.** Result (EcoLabel) and Report & Share carry the same current-state reporting object, with pathway-appropriate leaf wording and explicit coverage. Decision Workspace remains prospective and cannot silently rewrite the current Profile or double-credit an implemented practice. AI “per use” is defined as amortized training plus recurring deployment/inference impact, with deployment scale and changing compute efficiency kept visible. Methods, evidence, and reproducibility details remain linked to the same assessment record.
- **2026-10-31 to 2026-11-02 — Research reporting hierarchy established.** Methods/provenance, current-state Results, prospective Decision Workspace outputs, and save/share actions were separated into distinct roles. Representative commits: [`3372166e`](https://github.com/takinci/cedars/commit/3372166e998f87c99efb231c3c631e7ba5edf596), [`1e88f6c6`](https://github.com/takinci/cedars/commit/1e88f6c69b417f168067964aef62d39ca7c7f90f).

## Assessment workflows

- **2026-11-04 — Department and AI Profile pathways finalized.** Department follows **Context → Workflow → Clinical AI (optional) → Result (EcoLabel)**; AI follows **Context → Training → Deployment → Result (EcoLabel)**. Required Context inputs gate later Department stages, walkthrough examples satisfy the same gate, and optional clinical/performance evidence remains separate from environmental scoring.
- **2026-11-04 — Current-state Workflow and prospective Decision Workspace aligned.** Department stages and intervention IDs use one causal grammar; already-implemented practices are carried forward rather than credited twice. CT/MRI/workstation power-management coverage is recorded in the current Profile, while Decision Workspace models only incremental opportunity. Current workflow observations can inform prospective choices without automatically becoming savings, and Clinical-AI efficiency levers require a recorded local Clinical AI use.
- **2026-11-04 — Energy and electricity-cost context carried into decisions.** Workflow shows the current modeled energy/cost baseline; Decision Workspace shows projected energy, operational carbon, electricity cost, and estimated electricity savings from the same configured/default tariff. Combined scenarios explain overlapping savings and count shared energy effects once. These remain electricity-only estimates rather than total cost-of-care claims.
- **2026-11-03 — Gating and progression strengthened.** Required Context inputs control later Department stages, while walkthrough examples satisfy the same gate rather than bypassing it. AI lifecycle progression and return/escape routes were similarly clarified. Representative commits: [`e8397693`](https://github.com/takinci/cedars/commit/e83976936b52caa8225af2b246af4f6379dffa32), [`753beb9d`](https://github.com/takinci/cedars/commit/753beb9d2b86f3bae2aca4c0cc03ffe05c2a79c5).
- **2026-10-31 — Controlled stage navigation replaced observer/anchor-driven progression.** This removed page-jump feedback loops and established the discrete Profile-stage model used by both pathways. Representative commit: [`b255887e`](https://github.com/takinci/cedars/commit/b255887eea4eb76d70b46c61028532480b7fbde9).

## Evidence, methods & scientific assumptions

- **2026-11-04 — Evidence governance and reproducibility consolidated.** `METHODS.md` defines the governing workflow/boundary logic; `sources.md` records evidence roles, source scope, numerical defaults, limitations, and maintained tool-version snapshots; `frontend/src/refs.js` provides stable public citation IDs. “Help me measure” distinguishes direct telemetry, usage/specification estimates, external benchmarks, and embodied-hardware data so provenance remains reproducible.
- **2026-11-04 — Scientific guardrails remain explicit.** Missing information is not treated as zero; Department and AI water remain separate disclosures rather than score components; and clinical/performance suitability remains a gate rather than a compensatory weight. Lower environmental burden cannot mathematically offset an unsuitable clinical option.
- **2026-11-03 — Documentation ownership formalized.** Scientific logic, evidence/default provenance, and presentation rules were separated across `METHODS.md`, `sources.md`, and `docs/DESIGN_SYSTEM.md`. Representative commits: [`9490cb7e`](https://github.com/takinci/cedars/commit/9490cb7eb58527761b64378c6b6e946c2d518d28), [`00475d1b`](https://github.com/takinci/cedars/commit/00475d1b2e761c970843967b4aaba202c307a00d).

## Persistence, privacy & deployment

- **2026-11-04 — Optional Google identity and private cloud save added without changing the local-first model.** Google sign-in can support private cross-device Firestore save and can optionally verify contributor identity for research contribution; those are separate actions. Anonymous/free-text contribution remains available, and ordinary calculations, local save, and portable-file import/export remain browser-side by default.
- **Current architecture — Browser-local remains the default.** Local save, calculations, portable `.cedars.json` import/export, and normal assessment use do not require research contribution; contribution remains an explicit review-and-submit action.
- **Current schema — Portable assessments use schema v3.** Earlier schemas remain readable through migration logic without inventing newly required local inputs.

## UX, accessibility & guided use

- **2026-11-04 — Responsive and dark-mode visual system hardened.** Blue denotes editable/action surfaces; results/context, modeled opportunities, and disabled/gated states use consistent visual roles. Header, workflow rails, Decision Workspace, Report & Share, cards, and controls reflow under browser zoom/narrow effective widths rather than clipping or collapsing, and dark-mode text/button contrast is normalized.
- **2026-11-04 — Guided walkthroughs and public navigation aligned with the release workflow.** Walkthrough targeting is deterministic, highlighted regions remain visible, the guide can be exited at every step, and copy follows **current Profile → Result (EcoLabel) → optional Decision Workspace → EcoLabel/Methods/Save & Share**. Evidence and EcoLabel Method actions use consistent assessment CTAs and reporting selectors use consistent “output” language.
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

<!-- CEDARS_CHUNK_9R32K_CHANGELOG_SOURCES_CLEANUP -->
