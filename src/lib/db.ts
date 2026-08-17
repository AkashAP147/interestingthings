import { Discovery } from '@/types';
import { database } from './firebase';

const COLLECTION = 'discoveries';

let cachedDiscoveries: Discovery[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function readDB(): Promise<Discovery[]> {
  const now = Date.now();
  if (cachedDiscoveries && (now - lastCacheTime < CACHE_DURATION)) {
    return cachedDiscoveries;
  }

  try {
    const snapshot = await database.ref('discoveries').once('value');
    const data = snapshot.val() || {};
    const discoveries = Object.keys(data).map(key => data[key] as Discovery);
    // Sort by createdAt descending
    const sorted = discoveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    cachedDiscoveries = sorted;
    lastCacheTime = now;
    return sorted;
  } catch (error) {
    console.error("Failed to read DB:", error);
    return cachedDiscoveries || [];
  }
}

export async function writeDB(discoveries: Discovery[]): Promise<void> {
  // Not used in Firebase implementation
}

export async function addDiscovery(discovery: Discovery): Promise<boolean> {
  const snapshot = await database.ref('discoveries').orderByChild('sourceUrl').equalTo(discovery.sourceUrl).once('value');
  if (snapshot.exists()) {
    return false; // Prevent duplicate
  }
  await database.ref(`discoveries/${discovery.id}`).set(discovery);
  return true;
}

export async function updateDiscoveryStatus(id: string, status: 'published' | 'draft' | 'pending_approval' | 'archived'): Promise<void> {
  const updateData: any = { status };
  if (status === 'published') {
    updateData.publishedAt = new Date().toISOString();
  }
  await database.ref(`discoveries/${id}`).update(updateData);
}

export async function getPendingDiscoveries(): Promise<Discovery[]> {
  const snapshot = await database.ref('discoveries').orderByChild('status').equalTo('pending_approval').once('value');
  const data = snapshot.val() || {};
  return Object.keys(data).map(key => data[key] as Discovery);
}

export async function deleteDiscovery(id: string): Promise<void> {
  await database.ref(`discoveries/${id}`).remove();
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
    const snapshot = await database.ref('contactMessages').once('value');
    const data = snapshot.val() || {};
    const messages = Object.keys(data).map(key => ({ id: key, ...data[key] } as ContactMessage));
    return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to read messages DB:", error);
    return [];
  }
}

export async function markMessageRead(id: string): Promise<void> {
  await database.ref(`contactMessages/${id}`).update({ status: 'read' });
}
