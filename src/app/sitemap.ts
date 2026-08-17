import { MetadataRoute } from "next";
import { getAllDiscoveries } from "@/lib/data";
import { categories } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://interestingthings.app";

  // Base routes
  const routes = [
    "",
    "/discover",
    "/categories",
    "/trending",
    "/search",
    "/about",
    "/contact",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Categories
  const categoryRoutes = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Discoveries
  const discoveries = await getAllDiscoveries();
  const discoveryRoutes = discoveries.map((d) => ({
    url: `${baseUrl}/discover/${d.slug}`,
    lastModified: new Date(d.publishedAt || d.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...discoveryRoutes];
}
