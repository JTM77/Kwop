import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL;
  return { rules: [{ userAgent: "*", allow: ["/", "/terms", "/privacy", "/share/"], disallow: ["/api/", "/dashboard", "/clips", "/upload", "/settings", "/account", "/pricing"] }], sitemap: `${site}/sitemap.xml` };
}
