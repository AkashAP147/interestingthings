import { Discovery } from '@/types';
import { firestore } from './firebase';

const COLLECTION = 'discoveries';

export async function readDB(): Promise<Discovery[]> {
  try {
    const snapshot = await firestore.collection(COLLECTION).get();
    const discoveries: Discovery[] = [];
    snapshot.forEach((doc) => discoveries.push(doc.data() as Discovery));
    // Sort by createdAt descending
    return discoveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to read DB:", error);
    return [];
  }
}

export async function writeDB(discoveries: Discovery[]): Promise<void> {
  // Not used in Firebase implementation
}

export async function addDiscovery(discovery: Discovery): Promise<boolean> {
  const snapshot = await firestore.collection(COLLECTION).where('sourceUrl', '==', discovery.sourceUrl).limit(1).get();
  if (!snapshot.empty) {
    return false; // Prevent duplicate
  }
  await firestore.collection(COLLECTION).doc(discovery.id).set(discovery);
  return true;
}

export async function updateDiscoveryStatus(id: string, status: 'published' | 'draft' | 'pending_approval' | 'archived'): Promise<void> {
  const updateData: any = { status };
  if (status === 'published') {
    updateData.publishedAt = new Date().toISOString();
  }
  await firestore.collection(COLLECTION).doc(id).update(updateData);
}

export async function getPendingDiscoveries(): Promise<Discovery[]> {
  const snapshot = await firestore.collection(COLLECTION).where('status', '==', 'pending_approval').get();
  const discoveries: Discovery[] = [];
  snapshot.forEach((doc) => discoveries.push(doc.data() as Discovery));
  return discoveries;
}

export async function deleteDiscovery(id: string): Promise<void> {
  await firestore.collection(COLLECTION).doc(id).delete();
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const snapshot = await firestore.collection("messages").orderBy("createdAt", "desc").get();
    const messages: ContactMessage[] = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() } as ContactMessage));
    return messages;
  } catch (error) {
    console.error("Failed to read messages DB:", error);
    return [];
  }
}

export async function markMessageRead(id: string): Promise<void> {
  await firestore.collection("messages").doc(id).update({ status: 'read' });
}
