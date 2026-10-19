import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are served from Cloudflare R2 (public bucket on img.tops-car.com).
  images: {
    unoptimized: true, // R2 images are uploaded already resized to WebP
  },
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;

// Lets `next dev` read Cloudflare bindings (R2 etc.) locally.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
