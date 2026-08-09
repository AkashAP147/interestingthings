import fs from 'fs/promises';
import path from 'path';

export interface User {
  id: string;
  contact: string; // email or phone
  verified: boolean;
  likes: string[]; // array of discovery IDs
  shares: string[]; // array of discovery IDs
  joinedAt: string;
}

const DB_PATH = path.join(process.cwd(), 'database', 'users.json');

export async function readUsersDB(): Promise<User[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read users DB:", error);
    return [];
  }
}

export async function writeUsersDB(users: User[]): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to users DB:", error);
  }
}

export async function findOrCreateUser(contact: string): Promise<User> {
  const users = await readUsersDB();
  const existing = users.find(u => u.contact === contact);
  if (existing) return existing;

  const newUser: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    contact,
    verified: false,
    likes: [],
    shares: [],
    joinedAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeUsersDB(users);
  return newUser;
}

export async function verifyUser(id: string): Promise<User | null> {
  const users = await readUsersDB();
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return null;

  users[userIndex].verified = true;
  await writeUsersDB(users);
  return users[userIndex];
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsersDB();
  return users.find(u => u.id === id) || null;
}

export async function toggleLike(userId: string, discoveryId: string): Promise<{ liked: boolean; user: User | null }> {
  const users = await readUsersDB();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { liked: false, user: null };

  const user = users[userIndex];
  const likeIndex = user.likes.indexOf(discoveryId);
  let liked = false;
  
  if (likeIndex === -1) {
    user.likes.push(discoveryId);
    liked = true;
  } else {
    user.likes.splice(likeIndex, 1);
  }

  await writeUsersDB(users);
  return { liked, user };
}
