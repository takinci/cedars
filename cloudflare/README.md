# CEDARS research-contribution backend

This directory contains the optional backend used **only** when a user explicitly selects **Contribute this assessment**. Normal CEDARS use, local saving, portable-file import/export, and shareable URLs remain browser-side.

The backend is a Cloudflare Worker with a D1 database. No Cloudflare credentials or database secrets belong in the frontend or in Git.

## One-time setup

From the repository root:

```bash
cd cloudflare
npx wrangler login
npx wrangler d1 create cedars-contributions
```

Copy `wrangler.toml.example` to `wrangler.toml`, then replace `REPLACE_WITH_D1_DATABASE_ID` with the ID returned by the create command.

Create the table:

```bash
npx wrangler d1 execute cedars-contributions --remote --file=schema.sql
```

Before deploying, create a free Cloudflare Turnstile widget for `cedarsleaf.com` (and `takinci.github.io` if you want the GitHub Pages hostname to submit as well). Keep the Turnstile **secret key** out of Git, then store it as a Worker secret:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Paste the Turnstile secret when prompted. Then deploy the Worker:

```bash
npx wrangler deploy
```

Wrangler will print a Worker URL such as `https://cedars-contributions.<account>.workers.dev`.

## Connect the frontend

In the GitHub repository, create two repository variables:

```text
VITE_CEDARS_CONTRIBUTE_URL
VITE_CEDARS_TURNSTILE_SITEKEY
```

Set the first to the deployed Worker URL and the second to the Turnstile **sitekey** (the sitekey is public; the secret key is not). The GitHub Pages workflow passes both public values into the Vite build.

For local testing, create `frontend/.env.local` (do not commit it):

```text
VITE_CEDARS_CONTRIBUTE_URL=https://your-worker.workers.dev
VITE_CEDARS_TURNSTILE_SITEKEY=your-public-turnstile-sitekey
```


## Before enabling live identifiable contributions

The frontend is intentionally safe-by-default: if `VITE_CEDARS_CONTRIBUTE_URL` is unset, the contribution action stays disabled. Before setting that variable on the public site, the project team should complete the appropriate institutional research/ethics and data-governance determination for publication-intended, potentially identifiable submissions, and publish the project contact, privacy notice, retention/deletion approach, and any required international data-transfer language. Cloudflare storage does not by itself satisfy those governance obligations.

## Privacy / data minimization

- Cloudflare Turnstile is validated server-side before any database insert.
- The Worker stores no IP address or user-agent field in D1.
- Assessment-sharing consent is required.
- Acknowledgment permission and future-contact permission are separate and optional.
- Email is required only if future contact is requested.
- Users are instructed not to submit patient-identifiable information.
- Allowed browser origins are restricted by `ALLOWED_ORIGINS`.

## Exporting data

Use Wrangler/D1 tooling to query or export the database. Keep exports out of the public repository.

Example count only:

```bash
npx wrangler d1 execute cedars-contributions --remote --command="SELECT COUNT(*) AS submissions FROM contributions;"
```

Do not commit identifiable exports to GitHub.


## Optional Google Sheets mirror

D1 should remain the authoritative record. If the team wants a more convenient collaborative view,
CEDARS can also mirror a compact summary of each successful submission into a restricted Google
Sheet. The mirror is intentionally secondary: a Google outage does not block or erase the D1
submission.

1. Create a Google Sheet for CEDARS submissions. Keep it restricted. If appropriate, share the Sheet
   with the project's Google Group so membership controls who can view/edit the identifiable rows.
2. Open **Extensions -> Apps Script** from the Sheet (or create a standalone Apps Script project) and
   paste the contents of `google-sheets-mirror.gs.example`.
3. From the Sheet URL, copy the spreadsheet ID (the long value between `/d/` and `/edit`). In Apps
   Script, open **Project Settings -> Script Properties** and add:

   ```text
   CEDARS_SHEET_ID=<spreadsheet id>
   CEDARS_SHARED_SECRET=<a long random secret>
   ```

4. In Apps Script choose **Deploy -> New deployment -> Web app**. Execute as the deploying account
   and allow access to **Anyone** so the Cloudflare Worker can POST to it without a Google login.
   Copy the production `/exec` web-app URL. The shared secret above is what prevents unauthorised
   writes to that public endpoint.
5. Store the web-app URL and the same shared secret only as Cloudflare Worker secrets:

   ```bash
   npx wrangler secret put GOOGLE_SHEETS_WEBHOOK_URL
   npx wrangler secret put GOOGLE_SHEETS_SHARED_SECRET
   npx wrangler deploy
   ```

6. Submit a clearly labelled test contribution. Confirm that it appears in both D1 and the Sheet.

The Sheet mirror contains contributor metadata plus a compact assessment summary. It deliberately
**does not copy the full `assessment_json`**; D1 remains the complete source of truth. Keep the Sheet
private because it can contain names and email addresses supplied with permission.
