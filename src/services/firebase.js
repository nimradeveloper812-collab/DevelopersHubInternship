// src/services/firebase.js
// ============================================================
// NEXUS PLATFORM — Firebase Initialization
// Replace .env values with your own Firebase project config
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// Detect if Firebase is configured yet
export const isFirebaseConfigured = () =>
  Boolean(process.env.REACT_APP_FIREBASE_API_KEY &&
    process.env.REACT_APP_FIREBASE_API_KEY !== 'your_api_key_here');

let app, auth, db, storage;

try {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.warn('Firebase not configured — running in local mode.');
}

export { auth, db, storage };
export default app;
