import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    let credentialData;

    // 1. Try reading the single JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        credentialData = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (err) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON.");
      }
    } 
    
    // 2. Fallback to individual components
    if (!credentialData) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        credentialData = { projectId, clientEmail, privateKey };
      }
    }

    if (!credentialData) {
      console.warn("Firebase environment variables are missing. Using default local app (might fail if not authorized).");
    } else {
      initializeApp({
        credential: cert(credentialData),
        databaseURL: "https://vsmresult-default-rtdb.asia-southeast1.firebasedatabase.app",
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = getFirestore();
export const database = getDatabase();
export const auth = getAuth();
