import type { Locale } from './context'

type TranslatedSlugs = Partial<Record<'ru' | 'en', string>>

/**
 * Canonical (RO) path → translated slug per locale, for SEO-friendly URLs.
 * Only routes whose slug actually differs by locale need an entry — anything
 * absent here (e.g. /video, /live) is assumed identical across locales.
 */
export const SLUG_MAP: Record<string, TranslatedSlugs> = {
  '/paroh': { ru: '/nastoyatel', en: '/parish-priest' },
  '/calendar': { ru: '/kalendar' },
  '/carti/categorie': { ru: '/biblioteka/kategoriya', en: '/library/category' },
  '/carti': { ru: '/biblioteka', en: '/library' },
  '/biblie': { ru: '/bibliya', en: '/bible' },
  '/istoria-bisericii': { ru: '/istoriya-tserkvi', en: '/church-history' },
  '/sfantul-nicolae': { ru: '/svyatoy-nikolay', en: '/saint-nicholas' },
  '/donatii': { ru: '/pozhertvovaniya', en: '/donations' },
  '/contact': { ru: '/kontakt' },
  '/despre': { ru: '/o-tserkvi', en: '/about' },
  '/stiri': { ru: '/novosti', en: '/news' },
  '/sfintii': { ru: '/svyatye', en: '/saints' },
  '/cautare': { ru: '/poisk', en: '/search' },
  '/magazin': { en: '/shop' },
  '/politica-de-confidentialitate': { ru: '/politika-konfidentsialnosti', en: '/privacy-policy' },
}

// Longest canonical path first so nested routes (e.g. /carti/categorie) match
// before their shorter parent (/carti).
const CANONICAL_PATHS = Object.keys(SLUG_MAP).sort((a, b) => b.length - a.length)

/** Canonical RO path → the URL segment used for the given locale. */
export function translatePath(canonicalPath: string, locale: Locale): string {
  if (locale === 'ro') return canonicalPath
  for (const canonical of CANONICAL_PATHS) {
    if (canonicalPath === canonical || canonicalPath.startsWith(`${canonical}/`)) {
      const translated = SLUG_MAP[canonical][locale]
      if (!translated) break
      return translated + canonicalPath.slice(canonical.length)
    }
  }
  return canonicalPath
}

/** Locale-specific URL segment (as seen after the /ru or /en prefix is stripped) → canonical RO path. */
export function untranslatePath(localizedPath: string, locale: Locale): string {
  if (locale === 'ro') return localizedPath
  for (const canonical of CANONICAL_PATHS) {
    const translated = SLUG_MAP[canonical][locale]
    if (!translated) continue
    if (localizedPath === translated || localizedPath.startsWith(`${translated}/`)) {
      return canonical + localizedPath.slice(translated.length)
    }
  }
  return localizedPath
}
