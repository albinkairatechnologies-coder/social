import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "generativelandingpagev2.googleapis.com" },
    ],
  },
};

export default nextConfig;
