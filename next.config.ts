import type { NextConfig } from "next";

// Domeniul canonic. Vechiul domeniu (biserica-sf-nicolae.org) și www-urile
// redirecționează permanent aici, păstrând path-ul și query-ul.
const CANONICAL_ORIGIN = 'https://parintelemarin.com'
const REDIRECTED_HOSTS = [
  'biserica-sf-nicolae.org',
  'www.biserica-sf-nicolae.org',
  'www.parintelemarin.com',
]

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
      // Rutele /api/cron/* sunt excluse: cron-urile Vercel nu urmează redirecturi.
      ...REDIRECTED_HOSTS.map(host => ({
        source: '/:path((?!api/cron/).*)',
        has: [{ type: 'host' as const, value: host }],
        destination: `${CANONICAL_ORIGIN}/:path`,
        permanent: true,
      })),
      // „Media" a fost unificat în „Video" — evită linkuri moarte din bookmark-uri vechi
      { source: '/admin/media', destination: '/admin/video', permanent: false },
      { source: '/admin/media/:path*', destination: '/admin/video', permanent: false },
    ]
  },
};

export default nextConfig;
