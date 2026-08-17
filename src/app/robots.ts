import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://interestingthings.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/messages/", "/settings/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
