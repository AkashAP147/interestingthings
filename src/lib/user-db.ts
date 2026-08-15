import { firestore } from './firebase';

export interface User {
  id: string;
  contact: string; // email or phone
  verified: boolean;
  likes: string[]; // array of discovery IDs
  shares: string[]; // array of discovery IDs
  joinedAt: string;
  passwordHash?: string;
  name?: string;
  username?: string;
  profilePicture?: string;
}

const COLLECTION = 'users';

export async function readUsersDB(): Promise<User[]> {
  try {
    const snapshot = await firestore.collection(COLLECTION).get();
    const users: User[] = [];
    snapshot.forEach(doc => users.push(doc.data() as User));
    return users;
  } catch (error) {
    console.error("Failed to read users DB:", error);
    return [];
  }
}

export async function writeUsersDB(users: User[]): Promise<void> {
  // Not used in Firebase implementation
}

export async function findOrCreateUser(contact: string): Promise<User> {
  const snapshot = await firestore.collection(COLLECTION).where('contact', '==', contact).limit(1).get();
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as User;
  }

  const newUser: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    contact,
    verified: false,
    likes: [],
    shares: [],
    joinedAt: new Date().toISOString()
  };

  await firestore.collection(COLLECTION).doc(newUser.id).set(newUser);
  return newUser;
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  let snapshot = await firestore.collection(COLLECTION).where('contact', '==', identifier).limit(1).get();
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as User;
  }
  
  const username = identifier.startsWith('@') ? identifier.slice(1) : identifier;
  snapshot = await firestore.collection(COLLECTION).where('username', '==', username).limit(1).get();
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as User;
  }
  
  return null;
}

export async function syncFirebaseUser(uid: string, contact: string): Promise<User> {
  const docRef = firestore.collection(COLLECTION).doc(uid);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return docSnap.data() as User;
  }
  
  const newUser: User = {
    id: uid,
    contact,
    verified: true,
    likes: [],
    shares: [],
    joinedAt: new Date().toISOString(),
  };

  await docRef.set(newUser);
  return newUser;
}

export async function verifyUser(id: string): Promise<User | null> {
  const docRef = firestore.collection(COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  
  await docRef.update({ verified: true });
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const docRef = firestore.collection(COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  return docSnap.data() as User;
}

export async function isUsernameTaken(username: string, currentUserId: string): Promise<boolean> {
  if (!username) return false;
  const snapshot = await firestore.collection(COLLECTION).where('username', '==', username).get();
  const exists = snapshot.docs.some(doc => doc.id !== currentUserId);
  return exists;
}

export async function updateUserProfile(id: string, updates: Partial<User>): Promise<User | null> {
  const docRef = firestore.collection(COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  await docRef.update(updates);
  
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as User;
}

import { FieldValue } from 'firebase-admin/firestore';

export async function toggleLike(userId: string, discoveryId: string): Promise<{ liked: boolean; user: User | null }> {
  const docRef = firestore.collection(COLLECTION).doc(userId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return { liked: false, user: null };
  
  const user = docSnap.data() as User;
  const likeIndex = user.likes.indexOf(discoveryId);
  let liked = false;
  
  if (likeIndex === -1) {
    user.likes.push(discoveryId);
    liked = true;
  } else {
    user.likes.splice(likeIndex, 1);
  }

  const discoveryRef = firestore.collection('discoveries').doc(discoveryId);

  // We should ideally use a transaction, but doing it in sequence is fine for now
  await docRef.update({ likes: user.likes });
  await discoveryRef.update({ 
    saves: FieldValue.increment(liked ? 1 : -1) 
  });

  return { liked, user };
}
