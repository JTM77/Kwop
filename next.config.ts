import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // put <title>/<meta description> in the <head> for every visitor (not streamed later),
  // so link previews, search engines and audits always see them
  htmlLimitedBots: /.*/,
};

export default nextConfig;
