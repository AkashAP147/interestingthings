import { Discovery } from "@/types";
import { readDB } from "./db";
import { unstable_cache } from "next/cache";

export const getDailyDiscoveries = unstable_cache(
  async (): Promise<Discovery[]> => {
    const all = await readDB();
    const published = all.filter(d => d.status === "published");
    // Shuffle and pick 5 randomly
    const shuffled = published.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  },
  ['daily-discoveries-v2'],
  { revalidate: 3600, tags: ['discoveries-v2'] }
);

export const getAllDiscoveries = unstable_cache(
  async (): Promise<Discovery[]> => {
    const all = await readDB();
    return all.filter(d => d.status === "published");
  },
  ['all-discoveries-v2'],
  { revalidate: 3600, tags: ['discoveries-v2'] }
);

export const getDiscoveryBySlug = unstable_cache(
  async (slug: string): Promise<Discovery | undefined> => {
    const all = await readDB();
    return all.find(d => d.slug === slug);
  },
  ['discovery-by-slug-v2'],
  { revalidate: 3600, tags: ['discoveries-v2'] }
);

export const getDiscoveriesByCategory = unstable_cache(
  async (categoryId: string): Promise<Discovery[]> => {
    const all = await readDB();
    return all.filter(d => d.categoryId === categoryId && d.status === "published");
  },
  ['discoveries-by-category-v2'],
  { revalidate: 3600, tags: ['discoveries-v2'] }
);

export const getTrendingDiscoveries = unstable_cache(
  async (): Promise<Discovery[]> => {
    const all = await readDB();
    return all.filter(d => d.status === "published").sort((a, b) => b.views - a.views).slice(0, 5);
  },
  ['trending-discoveries-v2'],
  { revalidate: 3600, tags: ['discoveries-v2'] }
);

export const getRandomDiscovery = async (): Promise<Discovery | null> => {
  const published = await getAllDiscoveries();
  if (published.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * published.length);
  return published[randomIndex];
};
