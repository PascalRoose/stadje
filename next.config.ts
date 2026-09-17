import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // City photos in data/cities.json come from Wikimedia Commons (research.md: no re-hosting) —
    // only used server-side by app/api/puzzle/image/route.ts, never linked to directly.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
    // Our own image proxy (?date=YYYY-MM-DD varies daily, so an exact `search` match isn't
    // practical — the route itself validates `date` and never proxies an attacker-controlled
    // URL, so allowing any query string on this one pathname is safe).
    localPatterns: [
      {
        pathname: "/api/puzzle/image",
      },
    ],
  },
};

export default nextConfig;
