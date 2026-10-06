/**
 * Rețelele sociale ale Părintelui Marin — o singură sursă pentru aside și Footer.
 * Handle-urile sunt date de client; URL-urile sunt derivate din ele.
 * Facebook: dacă e setat în Admin → Contact (`getContactInfo().facebook`), acela are prioritate.
 */
export type SocialKey = 'youtube' | 'tiktok' | 'facebook' | 'telegram' | 'instagram'

export interface SocialLink {
  key: SocialKey
  label: string
  href: string
}

export const SOCIAL_HANDLES: Record<SocialKey, string> = {
  youtube: '@parintelemarin',
  tiktok: '@parintelemarin',
  facebook: 'PreotMarin',
  telegram: 'parintelemarin',
  instagram: 'parintelemarin.official',
}

export const SOCIAL_LINKS: SocialLink[] = [
  { key: 'youtube', label: 'YouTube', href: `https://www.youtube.com/${SOCIAL_HANDLES.youtube}` },
  { key: 'tiktok', label: 'TikTok', href: `https://www.tiktok.com/${SOCIAL_HANDLES.tiktok}` },
  { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/${SOCIAL_HANDLES.facebook}` },
  { key: 'telegram', label: 'Telegram', href: `https://t.me/${SOCIAL_HANDLES.telegram}` },
  { key: 'instagram', label: 'Instagram', href: `https://www.instagram.com/${SOCIAL_HANDLES.instagram}` },
]

/** Lista finală, cu Facebook-ul din setări (dacă e un URL valid) în locul celui implicit. */
export function socialLinks(facebookOverride?: string | null): SocialLink[] {
  const fb = facebookOverride?.trim()
  if (!fb || !/^https?:\/\//i.test(fb)) return SOCIAL_LINKS
  return SOCIAL_LINKS.map(s => (s.key === 'facebook' ? { ...s, href: fb } : s))
}
