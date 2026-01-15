// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✅ Vercel Image Optimization'a gitme → 402 biter
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;