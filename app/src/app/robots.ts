import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Allow all crawlers (including AI answer-engine bots — we WANT them to read
// and cite our content). Block only the app internals with no public content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/test", "/results", "/onboarding", "/auth/", "/api/", "/dev/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
