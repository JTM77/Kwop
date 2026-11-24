import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vidflow — faceless clips from long videos",
    short_name: "Vidflow",
    description: "AI finds the viral moments in your long videos and adds kinetic captions and b-roll.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#060606",
    theme_color: "#060606",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
