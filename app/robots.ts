import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: ["/", "/terms", "/privacy", "/share/"], disallow: ["/api/", "/dashboard", "/clips", "/upload", "/settings", "/account", "/pricing"] }], sitemap: `${site}/sitemap.xml` };
}
