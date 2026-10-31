/**
 * Valorile Open Graph implicite ale site-ului. Next combină metadata superficial:
 * o pagină cu `openGraph` propriu nu mai moștenește nimic din cel din layout, iar una
 * fără el moștenește și `og:url` = prima pagină. De aceea fiecare pagină își dă URL-ul.
 */
import type { Metadata } from 'next'
import type { Translations } from './i18n/ro'
import { SITE_URL } from './site'

type Locale = 'ro' | 'ru' | 'en'

export const OG_IMAGE = { url: '/images/12.jpg', width: 1200, height: 800 }
export const OG_LOCALE: Record<Locale, string> = { ro: 'ro_RO', ru: 'ru_RU', en: 'en_US' }

export function siteOpenGraph(t: Translations, locale: Locale, url: string = SITE_URL): NonNullable<Metadata['openGraph']> {
  const m = t.meta.site
  return {
    type: 'website',
    locale: OG_LOCALE[locale],
    url,
    siteName: m.twitterTitle,
    title: m.ogTitle,
    description: m.ogDescription,
    images: [{ ...OG_IMAGE, alt: m.ogTitle }],
  }
}
