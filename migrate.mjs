import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';


async function migrate() {
  console.log("Initializing Firebase Admin...");
  
  const credentialData = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  initializeApp({
    credential: cert(credentialData),
    databaseURL: "https://vsmresult-default-rtdb.asia-southeast1.firebasedatabase.app",
  });

  const firestore = getFirestore();
  const database = getDatabase();

  console.log("Starting Migration...");

  try {
    // 1. Migrate Discoveries
    console.log("Migrating Discoveries...");
    const discoveriesSnap = await firestore.collection('discoveries').get();
    let discoveriesCount = 0;
    
    for (const doc of discoveriesSnap.docs) {
      await database.ref(`discoveries/${doc.id}`).set(doc.data());
      discoveriesCount++;
    }
    console.log(`Successfully migrated ${discoveriesCount} discoveries.`);

    // 2. Migrate Users
    console.log("Migrating Users...");
    const usersSnap = await firestore.collection('users').get();
    let usersCount = 0;

    for (const doc of usersSnap.docs) {
      await database.ref(`users/${doc.id}`).set(doc.data());
      usersCount++;
    }
    console.log(`Successfully migrated ${usersCount} users.`);
    
    console.log("Migration Complete! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("\nMigration Failed:", error.message);
    if (error.message.includes("Quota exceeded")) {
      console.error("Your Firestore daily read limit is still exhausted. You must wait until midnight PT for it to reset before you can extract your data.");
    }
    process.exit(1);
  }
}

migrate();
