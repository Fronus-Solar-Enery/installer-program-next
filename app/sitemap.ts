import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "https://installer.fronus.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
