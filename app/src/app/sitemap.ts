import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public, indexable pages. Add /about, /blog, and /blog/[slug] entries here as
// those pages ship (Phase 2).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
