import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = SITE_URL;
  return ["", "/signup", "/login", "/terms", "/privacy"].map((p) => ({ url: `${site}${p}`, lastModified: new Date() }));
}
