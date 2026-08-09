import { Discovery } from "@/types";
import { readDB } from "./db";

export async function getDailyDiscoveries(): Promise<Discovery[]> {
  const all = await readDB();
  return all.filter(d => d.featured && d.status === "published").slice(0, 5);
}

export async function getAllDiscoveries(): Promise<Discovery[]> {
  const all = await readDB();
  return all.filter(d => d.status === "published");
}

export async function getDiscoveryBySlug(slug: string): Promise<Discovery | undefined> {
  const all = await readDB();
  return all.find(d => d.slug === slug);
}

export async function getDiscoveriesByCategory(categoryId: string): Promise<Discovery[]> {
  const all = await readDB();
  return all.filter(d => d.categoryId === categoryId && d.status === "published");
}

export async function getTrendingDiscoveries(): Promise<Discovery[]> {
  const all = await readDB();
  return all.filter(d => d.status === "published").sort((a, b) => b.views - a.views).slice(0, 5);
}

export async function getRandomDiscovery(): Promise<Discovery | null> {
  const all = await readDB();
  const published = all.filter(d => d.status === "published");
  if (published.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * published.length);
  return published[randomIndex];
}
