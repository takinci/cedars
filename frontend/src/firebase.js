// Optional Google sign-in for the "Contribute this assessment" flow (ContributionModal.jsx).
// Verifies a contributor's identity instead of relying on a free-text name/email; CEDARS itself
// has no accounts and still works fully anonymously when this isn't configured or isn't used.
// The ID token this module produces is re-verified server-side by the Cloudflare Worker — the
// client-side user object is for UI display only and must never be trusted on its own.
import {initializeApp, getApps} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const firebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

const app = firebaseConfigured ? (getApps()[0] || initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) throw new Error('Google sign-in is not configured in this deployment.');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

// callback(user | null) — fires once immediately with the current state, then on every change.
export function onAuthChange(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentIdToken() {
  if (!auth?.currentUser) return '';
  return auth.currentUser.getIdToken();
}
