# CEDARS optional Google sign-in (Firebase)

CEDARS has no accounts. Google sign-in is **optional** and powers two independent, unrelated features — nothing in the core calculator requires it, and both features degrade gracefully (hidden/disabled) when it isn't configured:

1. **Verified contributor identity** on the **Contribute this assessment** research-submission form (`frontend/src/ContributionModal.jsx`) — lets a contributor sign in instead of typing a free-text name/email. Re-verified server-side by the Cloudflare Worker; see [`cloudflare/README.md`](../cloudflare/README.md) for that half of the setup.
2. **Cross-device cloud save** (`frontend/src/SaveSharePanel.jsx`, `SaveUtility.jsx`) — lets a signed-in user save a private copy of their in-progress assessment and reopen it on another device. This is **not** research contribution: nothing saved this way is reviewed, collected, or visible to anyone but the signed-in user. **Save on this device** (browser-local, no account) remains the default.

Both features share one Firebase project and one sign-in flow. Set this up once.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project**. Analytics is optional; decline it unless you specifically want it.
2. Inside the project, register a web app (the `</>` icon). No Firebase Hosting needed — CEDARS keeps using GitHub Pages.
3. Firebase shows a `firebaseConfig` object (`apiKey`, `authDomain`, `projectId`, `appId`, …). These are public client identifiers, not secrets.

## 2. Enable Google sign-in

1. **Authentication → Get started → Sign-in method → Add new provider → Google** → enable it, pick a support email, save.
2. **Authentication → Settings → Authorized domains** → add `cedarsleaf.com` and `takinci.github.io`.

## 3. Enable Firestore (needed for cloud save only, step 1 already covers the Contribute identity feature)

1. **Firestore Database → Create database**.
2. Pick a location (cannot be changed later).
3. Start in **Production mode** — not test mode, which allows anyone to read/write for 30 days.
4. **Rules** tab → replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/assessment/{docId} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

5. **Publish**. This rule is what actually makes a saved assessment private — it restricts every document under `users/{uid}/` to requests where the signed-in user's UID matches, so nobody else (including anyone with Firebase console access) can read another user's save. The app only ever writes one document per user, at `users/{uid}/assessment/current`, which the Save/Restore buttons overwrite each time — not a list of multiple saves.

## 4. Connect the frontend

Add four **GitHub repository variables** (**Settings → Secrets and variables → Actions → Variables** tab — Variables, not Secrets, since these are public client identifiers):

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Set each to the matching value from the `firebaseConfig` object in step 1. The GitHub Pages workflow ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)) passes all four into the Vite build — leaving any of them unset keeps both sign-in features hidden, same as the Turnstile/contribute-URL pattern elsewhere in this repo.

For local testing, add them to `frontend/.env.local` (gitignored):

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=...
```

## 5. If you're also enabling verified contributor identity

That feature needs one more step on the **Cloudflare Worker** side (it independently re-verifies the Google ID token server-side rather than trusting the browser) — see "Optional: Google sign-in for verified contributor identity" in [`cloudflare/README.md`](../cloudflare/README.md).
