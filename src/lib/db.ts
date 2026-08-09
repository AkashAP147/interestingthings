import fs from 'fs/promises';
import path from 'path';
import { Discovery } from '@/types';

const DB_PATH = path.join(process.cwd(), 'database', 'discoveries.json');

export async function readDB(): Promise<Discovery[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read DB:", error);
    return [];
  }
}

export async function writeDB(discoveries: Discovery[]): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(discoveries, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to DB:", error);
  }
}

export async function addDiscovery(discovery: Discovery): Promise<void> {
  const discoveries = await readDB();
  discoveries.unshift(discovery);
  await writeDB(discoveries);
}

export async function updateDiscoveryStatus(id: string, status: 'published' | 'draft' | 'pending_approval' | 'archived'): Promise<void> {
  const discoveries = await readDB();
  const index = discoveries.findIndex(d => d.id === id);
  if (index !== -1) {
    discoveries[index].status = status;
    if (status === 'published') {
      discoveries[index].publishedAt = new Date().toISOString();
    }
    await writeDB(discoveries);
  }
}

export async function getPendingDiscoveries(): Promise<Discovery[]> {
  const discoveries = await readDB();
  return discoveries.filter(d => d.status === 'pending_approval');
}

export async function deleteDiscovery(id: string): Promise<void> {
  const discoveries = await readDB();
  const filtered = discoveries.filter(d => d.id !== id);
  await writeDB(filtered);
}
