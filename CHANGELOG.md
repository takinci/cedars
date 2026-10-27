# Changelog

## Unreleased

### Added
- **AI Model & Informatics entry step**: *Compare candidate models* (procure/deploy) vs *Assess my own model* (develop), with three ways in for developers (measured numbers · Help me measure · estimate from specification) and a *See an example* band.
- **Help me measure** tool chooser: three questions about the compute setup recommend an open-source energy-measurement tool and name the CEDARS field it fills; tool list verified October 2026, with a feedback notice.
- Provenance tags (*Measured / Estimated / Literature*) on the AI model record; optional water inputs (site WUE, grid water intensity) with a screening fallback that is stated on the label.
- Inline references with DOI link-outs (`refs.js`) and an external-link notice dialog.
- Four worked AI examples (measured CXR classifier, vendor-API report LLM, mAIstro multi-agent workflow, RoentGen synthetic CXR), reproducible by link.
- `ai.test.js` reference tests pinning the AI model grade and label to known outputs.
- Public **About CEDARS** page and collaborator grid.
- Browser-only **Save on this device only** workflow with restore/delete controls.
- Versioned portable `.cedars.json` assessment files with local import/export.
- Explicit **Copy shareable link** action.
- Input provenance labels for advanced equipment overrides.
- Optional research-contribution modal with separate consent, acknowledgment, and future-contact permissions.
- Cloudflare Worker + D1 deployment scaffold for optional research contributions.
- `ROADMAP.md` for shared implementation planning.

### Changed
- Navigation now follows **Set up → See footprint → Improve → Score & EcoLabel → Report & Share**, with result-first Department and AI footprint summaries and technical detail progressively disclosed beneath them.
- AI Model & Informatics now starts from three user intentions: assess an AI system already selected/in use, compare candidates, or assess a model being developed. Candidate comparison keeps essential inputs, side-by-side results, and model selection in one decision workflow.
- Department device duty-cycle profiles are normalized to the average calendar month (730.5 h) before annualization; this removes the prior 31-day-month overcount while preserving each device's relative state mix.
- Avoidable-idle accounting now measures only the recoverable power-state delta; MRI/CT full-shutdown uses the named Off state, PET-CT is excluded from full shutdown, and overlapping idle interventions are not double-counted.
- PACS/RIS application-server power is explicitly separated from long-term archive storage. Server consolidation is now a transparent 20% scenario estimate on the modeled PACS/RIS + workstation compute pool rather than a cloud-PUE-derived saving.
- DICOM transfer uses modality-specific study sizes instead of one 0.3 GB/study average; everyday-equivalency factors are centralized in the model layer.
- Equipment overrides now carry their actual provenance into dashboard/export rows; user-entered values are no longer automatically labeled measured.
- Renewable electricity percentages are disclosure-only in the location-based carbon inventory; they no longer linearly reduce Department, AI, or cloud carbon factors. The renewable intervention is planning guidance until a separate market-based factor is implemented.
- Homepage setup is the primary entry decision; later stages follow the same five-stage assessment journey instead of competing as separate starting points.
- The AI pathway keeps the name **AI Model & Informatics** (the earlier plan to rename it *AI Footprint* was reversed for clarity against the Department pathway); README and docs now match the interface.
- The AI Research Label is now a view of the single AI model record rather than a separately-edited copy; the former "mirror until edited" behaviour and its drift are gone. Training energy per run is the model's own figure (measured, GPU-hours, or literature) times the number of runs.
- Header score badge is pathway-aware: it shows the AI model's score in the AI pathway, the Department score elsewhere.
- Department water, paper, generic hazardous waste, patient travel, and staff commute are no longer auto-promoted from weak generic proxies. They default to **Not assessed** and require local inputs before appearing as reported extended estimates; historical proxy calculations remain screening references only.
- Staff count is no longer inferred from scanner/device counts for commute accounting.
- Department reporting now distinguishes the **Core quantified** operational score boundary from **Extended estimates** and **Not assessed** categories; extended Scope 1/3 and resource estimates do not alter the CEDARS Score.
- Deployed `Clinical AI tools` terminology is simplified to **Clinical AI**.
- AI task-family templates no longer seed scan-time or avoided-imaging benefits; clinical-effect fields now default to zero and require an explicit evidence basis.
- Only locally observed or locally validated clinical effects may reduce the current AI footprint; published external effects and scenario assumptions remain visible but are not credited to the current result.
- Removed the categorical rebound-risk label and the deployment-volume-dependent performance/monthly-kWh ratio; candidate comparison now uses separate performance and environmental-intensity dimensions plus the existing Pareto view.
- Non-default shareable URLs now carry a `v=3` state marker for the revised Department boundary semantics. The pre-v2 AI migration still restores the historical 12% avoided-imaging default as scenario-only disclosure, while v2/v3 links are never misclassified as legacy AI state.
- Portable `.cedars.json` assessments use schema v3; schema-v1/v2 files remain readable and are migrated without inventing new local weak-proxy inputs.
- EcoLabel now states: **Research assessment — not (yet) an external certification.**
- Privacy language now distinguishes browser-local use from explicit research contribution.

### Preserved
- Existing calculation modules and URL-hash calculator behavior are intentionally unchanged by these site/persistence updates.
