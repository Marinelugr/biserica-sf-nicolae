import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    qualities: [60, 75, 90],
  },
  async redirects() {
    return [
      // „Media" a fost unificat în „Video" — evită linkuri moarte din bookmark-uri vechi
      { source: '/admin/media', destination: '/admin/video', permanent: false },
      { source: '/admin/media/:path*', destination: '/admin/video', permanent: false },
    ]
  },
};

export default nextConfig;
