// Optional Google sign-in, used in two independent places:
//  1. The "Contribute this assessment" flow (ContributionModal.jsx) — verifies a contributor's
//     identity server-side (by the Cloudflare Worker) instead of relying on free-text name/email.
//  2. Cross-device "continue later" cloud save (main.jsx / SaveSharePanel.jsx / SaveUtility.jsx) —
//     writes the current assessment to a Firestore document private to the signed-in user, via
//     security rules (request.auth.uid == uid), so nobody else — including the CEDARS team — can
//     read it. This is NOT the research-contribution path and is not reviewed or collected by
//     anyone; it exists purely so the signed-in user can reopen their own work elsewhere.
// CEDARS itself has no accounts and still works fully anonymously when sign-in isn't configured
// or isn't used — both features degrade to their existing browser-local/anonymous behavior.
import {initializeApp, getApps} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged} from 'firebase/auth';
import {getFirestore, doc, setDoc, getDoc} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const firebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

const app = firebaseConfigured ? (getApps()[0] || initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
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

// One cloud save slot per signed-in user — mirrors the existing single-slot "Save on this
// device" model, just reachable from any device after signing in. Overwrites on each save.
function cloudAssessmentRef() {
  if (!db || !auth?.currentUser) throw new Error('Sign in with Google first.');
  return doc(db, 'users', auth.currentUser.uid, 'assessment', 'current');
}

export async function saveAssessmentToCloud(snapshot) {
  const updatedAt = new Date().toISOString();
  await setDoc(cloudAssessmentRef(), {data: snapshot, updatedAt});
  return updatedAt;
}

// Returns {data, updatedAt} or null if nothing has been saved yet for this user.
export async function loadAssessmentFromCloud() {
  const snap = await getDoc(cloudAssessmentRef());
  return snap.exists() ? snap.data() : null;
}
