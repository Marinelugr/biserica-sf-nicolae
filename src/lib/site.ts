// Domeniul canonic al site-ului. Toate URL-urile absolute (metadataBase, canonical,
// sitemap, robots, OpenGraph, JSON-LD, linkuri de share) se construiesc de aici.
// Slash-ul final e eliminat ca `${SITE_URL}/cale` să nu producă „//".
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://parintelemarin.com').replace(/\/+$/, '')

export const SITE_HOST = new URL(SITE_URL).host
