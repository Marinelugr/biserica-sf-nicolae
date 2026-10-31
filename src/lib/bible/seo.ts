/**
 * Metadata pentru paginile publice ale Bibliei. Next combină metadata superficial:
 * fără `openGraph` propriu, pagina moștenește din layout `og:url` = prima pagină.
 * Descrierile sunt generice: textul biblic nu se copiază în meta.
 */
import type { Metadata } from 'next'
import type { Translations } from '../i18n/ro'
import type { Locale } from '../i18n/pick'
import { buildAlternates } from '../i18n/alternates'
import { localizedHref } from '../i18n/href'
import { SITE_URL } from '../site'
import { bookLabel, type BibleBookInfo } from './books'

// La fel ca în src/app/layout.tsx (verificat de metadata.test.ts).
const OG_IMAGE = { url: '/images/12.jpg', width: 1200, height: 800 }
const OG_LOCALE: Record<Locale, string> = { ro: 'ro_RO', ru: 'ru_RU', en: 'en_US' }

const COPY: Record<Locale, {
  indexTitle: string
  indexDescription: string
  suffix: string
  bookDescription: (name: string) => string
  chapterDescription: (name: string, n: number) => string
}> = {
  ro: {
    indexTitle: 'Biblia — text în limba română',
    indexDescription: 'Citește Biblia în limba română: Vechiul și Noul Testament, pe cărți și capitole.',
    suffix: 'Biblia',
    bookDescription: name => `Citește ${name} în limba română, capitol cu capitol.`,
    chapterDescription: (name, n) => `Citește ${name}, capitolul ${n}, în limba română.`,
  },
  en: {
    indexTitle: 'The Bible — text in Romanian',
    indexDescription: 'Read the Bible in Romanian: the Old and New Testament, by book and chapter.',
    suffix: 'The Bible',
    bookDescription: name => `Read ${name} in Romanian, chapter by chapter.`,
    chapterDescription: (name, n) => `Read ${name}, chapter ${n}, in Romanian.`,
  },
  ru: {
    indexTitle: 'Библия — текст на румынском языке',
    indexDescription: 'Читайте Библию на румынском языке: Ветхий и Новый Завет, по книгам и главам.',
    suffix: 'Библия',
    bookDescription: name => `Читайте: ${name}, на румынском языке, глава за главой.`,
    chapterDescription: (name, n) => `Читайте: ${name}, глава ${n}, на румынском языке.`,
  },
}

/** În română, numele scurt folosit deja la referințe („Ioan", nu „Sfânta Evanghelie după Ioan"). */
function bookName(book: BibleBookInfo, locale: Locale): string {
  return locale === 'ro' ? book.aliases[0] : bookLabel(book, locale)
}

interface PageSeo {
  path: string
  title: string
  description: string
  ogType: 'website' | 'article'
  robots?: Metadata['robots']
}

function bibleMetadata({ path, title, description, ogType, robots }: PageSeo, t: Translations, locale: Locale): Metadata {
  const canonical = `${SITE_URL}${localizedHref(path, locale)}`
  return {
    title: { absolute: title },
    description,
    alternates: { ...buildAlternates(path), canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: ogType,
      locale: OG_LOCALE[locale],
      siteName: t.meta.site.twitterTitle,
      images: [{ ...OG_IMAGE, alt: t.meta.site.ogTitle }],
    },
    ...(robots ? { robots } : {}),
  }
}

/** /biblie; rezultatele căutării nu se indexează, dar linkurile lor se urmează. */
export function bibleIndexMetadata(t: Translations, locale: Locale, isSearch: boolean): Metadata {
  const c = COPY[locale]
  return bibleMetadata({
    path: '/biblie',
    title: c.indexTitle,
    description: c.indexDescription,
    ogType: 'website',
    robots: isSearch ? { index: false, follow: true } : undefined,
  }, t, locale)
}

/** /biblie/[carte]; fără text încă: pagina există, dar nu se indexează. */
export function bibleBookMetadata(book: BibleBookInfo, t: Translations, locale: Locale, hasText: boolean): Metadata {
  const c = COPY[locale]
  const name = bookName(book, locale)
  return bibleMetadata({
    path: `/biblie/${book.slug}`,
    title: `${name} — ${c.suffix}`,
    description: c.bookDescription(name),
    ogType: 'website',
    robots: hasText ? undefined : { index: false, follow: true },
  }, t, locale)
}

/** /biblie/[carte]/[capitol]; fără text încă: pagina există, dar nu se indexează. */
export function bibleChapterMetadata(book: BibleBookInfo, chapter: number, t: Translations, locale: Locale, hasText: boolean): Metadata {
  const c = COPY[locale]
  const name = bookName(book, locale)
  return bibleMetadata({
    path: `/biblie/${book.slug}/${chapter}`,
    title: `${name} ${chapter} — ${c.suffix}`,
    description: c.chapterDescription(name, chapter),
    ogType: 'article',
    robots: hasText ? undefined : { index: false, follow: true },
  }, t, locale)
}
