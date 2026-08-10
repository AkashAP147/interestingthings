import { firestore } from './firebase';

export interface User {
  id: string;
  contact: string; // email or phone
  verified: boolean;
  likes: string[]; // array of discovery IDs
  shares: string[]; // array of discovery IDs
  joinedAt: string;
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

  await docRef.update({ likes: user.likes });
  return { liked, user };
}
