import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import baseExampleConfig from '../../firebase-applet-config.example.json';

// Safely load local uncommitted config if present in dev environment
// Uses import.meta.glob so fresh git clones without firebase-applet-config.json build cleanly!
const localConfigModules = import.meta.glob<{ default: Record<string, string> }>('../../firebase-applet-config.json', {
  eager: true
});
const localConfig = (localConfigModules['../../firebase-applet-config.json']?.default as Record<string, string>) || {};
const rawFirebaseConfig = { ...baseExampleConfig, ...localConfig };

// Securely assemble Firebase client configuration:
// 1. Injected via GitHub Secrets or build-time environment variable (VITE_FIREBASE_API_KEY)
// 2. Injected at runtime from Google Secret Manager via server index.html (window.__FIREBASE_CONFIG__)
// 3. Local uncommitted dev config (gitignored firebase-applet-config.json)
// ZERO hardcoded secrets are committed to GitHub or source control.
const getResolvedApiKey = (): string => {
  const envKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || '';
  if (envKey && envKey.trim().length > 5) return envKey.trim();

  // Runtime injection from Google Secret Manager
  if (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.apiKey) {
    const runtimeKey = (window as any).__FIREBASE_CONFIG__.apiKey as string;
    if (runtimeKey && runtimeKey.trim().length > 5) return runtimeKey.trim();
  }

  // Local uncommitted development configuration
  if (rawFirebaseConfig.apiKey && rawFirebaseConfig.apiKey.trim().length > 5) {
    return rawFirebaseConfig.apiKey.trim();
  }

  return '';
};

export const firebaseConfig = {
  ...rawFirebaseConfig,
  apiKey: getResolvedApiKey(),
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ||
    (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.projectId) ||
    rawFirebaseConfig.projectId ||
    'her-journel',
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ||
    (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.authDomain) ||
    rawFirebaseConfig.authDomain ||
    'her-journel.firebaseapp.com',
  firestoreDatabaseId:
    (import.meta.env.VITE_FIRESTORE_DATABASE_ID as string) ||
    (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.firestoreDatabaseId) ||
    rawFirebaseConfig.firestoreDatabaseId ||
    'ai-studio-reflect-86bb1722-fdae-4406-b5d8-592426ee33a5',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ||
    rawFirebaseConfig.storageBucket ||
    'her-journel.firebasestorage.app',
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ||
    rawFirebaseConfig.messagingSenderId ||
    '556746620508',
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string) ||
    rawFirebaseConfig.appId ||
    '1:556746620508:web:fd49e09bc95dc7ef5cf099'
};

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Validate connection per Firebase skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_probe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline or network restricted.');
      return false;
    }
    // Document not found is fine, connection is alive
    return true;
  }
}

// Auth helpers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

export async function signInWithDemoUser(email = 'bankupalli.raviteja@gmail.com') {
  // Signs in anonymously or returns authenticated user context
  try {
    const userCred = await signInAnonymously(auth);
    return userCred.user;
  } catch (err) {
    console.warn('Anonymous auth failed, returning dev state', err);
    return null;
  }
}

export async function logOut() {
  await fbSignOut(auth);
}
