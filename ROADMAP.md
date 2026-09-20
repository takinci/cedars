# CEDARS Roadmap

This roadmap is a lightweight collaboration note for work that is planned or actively being implemented. Completed user-facing changes should move to `CHANGELOG.md` when merged.

## In progress — site usability, persistence, and collaboration

- [x] Public **About CEDARS** page with collaborator affiliations and a non-endorsement note.
- [x] Homepage journey: **Input → Score → Improve → Share**.
- [x] User-facing AI terminology:
  - **Clinical AI** — environmental impact of AI used in clinical practice.
  - **AI Footprint** — environmental footprint of building and running the AI itself.
- [x] EcoLabel clarification: **Research assessment — not (yet) an external certification.**
- [x] Provenance options for local equipment overrides:
  - Literature default
  - Measured locally
  - Estimated locally
  - Assumed / other
- [x] **Save on this device only** using browser local storage.
- [x] Portable, versioned **Download CEDARS file / Open CEDARS file** workflow.
- [x] Preserve the existing shareable URL-hash workflow and add an explicit copy-link action.
- [x] Optional **Contribute this assessment** interface with separate permissions for:
  - assessment sharing,
  - acknowledgment/contributor listing,
  - future contact.
- [x] Cloudflare Worker + D1 backend scaffold for optional research contributions.

## Deployment step still required

The contribution form is implemented but remains non-transmitting until the project team deploys the Cloudflare Worker/D1 backend and sets the GitHub repository variable `VITE_CEDARS_CONTRIBUTE_URL`. See `cloudflare/README.md`.

## Later / ongoing

- Incrementally extract UI sections from the large `frontend/src/main.jsx` file after the new functionality is stable.
- Expand provenance tracking beyond advanced equipment overrides where it improves scientific reporting without making data entry burdensome.
- Add migration functions if future CEDARS save-file schema versions change.
- Consider a contributor/admin export workflow that does not expose identifiable contribution data in the public repository.

## Implementation principles

- Preserve existing calculation logic unless a calculation change is intentional, reviewed, and documented.
- Normal calculator use stays browser-local by default.
- Never place names, email addresses, consent data, patient information, or other sensitive information in the shareable URL.
- A shareable URL is reproducible, not private.
- Do not commit Cloudflare credentials, identifiable research exports, or other secrets/data extracts to GitHub.
- Run the reference tests and production build after meaningful changes.
