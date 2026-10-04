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
- Homepage journey is now **Input → Score → Improve → Share**.
- The AI pathway keeps the name **AI Model & Informatics** (the earlier plan to rename it *AI Footprint* was reversed for clarity against the Department pathway); README and docs now match the interface.
- The AI Research Label is now a view of the single AI model record rather than a separately-edited copy; the former "mirror until edited" behaviour and its drift are gone. Training energy per run is the model's own figure (measured, GPU-hours, or literature) times the number of runs.
- Header score badge is pathway-aware: it shows the AI model's score in the AI pathway, the Department score elsewhere.
- Department *Water footprint* card now explains that its factor is a data-centre screening proxy and links the evidence; the number is unchanged.
- Deployed `Clinical AI tools` terminology is simplified to **Clinical AI**.
- EcoLabel now states: **Research assessment — not (yet) an external certification.**
- Privacy language now distinguishes browser-local use from explicit research contribution.

### Preserved
- Existing calculation modules and URL-hash calculator behavior are intentionally unchanged by these site/persistence updates.
