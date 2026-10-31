/**
 * Metadata și imaginile Open Graph ale paginilor publice ale Bibliei. Next combină
 * metadata superficial: fără `openGraph` propriu, pagina moștenește din layout
 * `og:url` = prima pagină. Textul biblic nu se copiază în meta sau în imagini.
 */
import type { Metadata } from 'next'
import type { Translations } from '../i18n/ro'
import type { Locale } from '../i18n/pick'
import { buildAlternates } from '../i18n/alternates'
import { localizedHref } from '../i18n/href'
import { OG_LOCALE } from '../openGraph'
import { SITE_URL } from '../site'
import { bookLabel, getBook, type BibleBookInfo } from './books'
import { bookShortName } from './shortNames'

const MAX_TITLE = 65
/** Psalmii au 151 de capitole: cel mai mare număr din canon. */
const MAX_CHAPTER = 151
export const OG_SIZE = { width: 1200, height: 630 }

const COPY: Record<Locale, {
  /** „Sfânta Scriptură" + „(Biblia)": titlul se scurtează prin renunțarea la paranteză. */
  scripture: string
  bible: string
  testaments: string
  indexDescription: string
  bookDescription: (name: string) => string
  chapterDescription: (name: string, n: number) => string
  imageAlt: string
}> = {
  ro: {
    scripture: 'Sfânta Scriptură',
    bible: '(Biblia)',
    testaments: 'Vechiul și Noul Testament',
    indexDescription: 'Sfânta Scriptură în limba română: Vechiul și Noul Testament, pe cărți și capitole.',
    bookDescription: name => `Citește ${name} în limba română, capitol cu capitol.`,
    chapterDescription: (name, n) => `Citește ${name}, capitolul ${n}, în limba română.`,
    imageAlt: 'Emblema parohiei, pe fundal bleumarin, și titlul',
  },
  en: {
    scripture: 'Holy Scripture',
    bible: '(the Bible)',
    testaments: 'Old and New Testament',
    indexDescription: 'The Holy Scripture, with the text in Romanian: the Old and New Testament, by book and chapter.',
    bookDescription: name => `Read ${name}, chapter by chapter. The text is in Romanian.`,
    chapterDescription: (name, n) => `Read ${name}, chapter ${n}. The text is in Romanian.`,
    imageAlt: 'The parish emblem on a dark blue background, with the title',
  },
  ru: {
    scripture: 'Священное Писание',
    bible: '(Библия)',
    testaments: 'Ветхий и Новый Завет',
    indexDescription: 'Священное Писание, текст на румынском языке: Ветхий и Новый Завет, по книгам и главам.',
    bookDescription: name => `Читайте: ${name}, глава за главой. Текст на румынском языке.`,
    chapterDescription: (name, n) => `Читайте: ${name}, глава ${n}. Текст на румынском языке.`,
    imageAlt: 'Эмблема прихода на тёмно-синем фоне и заголовок',
  },
}

/** „Ioan 3" sau „Ioan"; null pe pagina /biblie. */
function reference(locale: Locale, book?: BibleBookInfo, chapter?: number): string | null {
  if (!book) return null
  const name = bookShortName(book, locale)
  return chapter ? `${name} ${chapter}` : name
}

export function bibleTitle(locale: Locale, book?: BibleBookInfo, chapter?: number): string {
  const { scripture, bible } = COPY[locale]
  const full = `${scripture} ${bible}`
  const ref = reference(locale, book, chapter)
  if (!ref) return full
  const title = `${ref} — ${full}`
  return title.length <= MAX_TITLE ? title : `${ref} — ${scripture}`
}

/** Pe pagina de carte, numele întreg; „Evanghelia după Ioan", nu „Sfânta Evanghelie după Ioan". */
function bookFullName(book: BibleBookInfo, locale: Locale): string {
  const gospel = locale === 'ro' ? book.aliases.find(a => a.startsWith('Evanghelia după')) : undefined
  return gospel ?? bookLabel(book, locale)
}

/** Textele de pe imagine. */
export function bibleOgText(locale: Locale, book?: BibleBookInfo, chapter?: number) {
  const { scripture, bible, testaments } = COPY[locale]
  const subtitle = !book ? testaments : chapter ? `${bookShortName(book, locale)} ${chapter}` : bookFullName(book, locale)
  return { scripture, bible, subtitle }
}

/**
 * Mărimea subtitlului, ca să încapă pe un rând între ramele imaginii: 40 px, cel mult
 * până la 28 px. Satori nu măsoară textul; 0,5 em e peste lățimea medie a literelor.
 */
export function ogSubtitleSize(text: string, maxWidth = 1040): number {
  return Math.max(28, Math.min(40, Math.floor(maxWidth / (text.length * 0.5))))
}

/**
 * Limba stă în URL, nu în cookie: Facebook cere imaginea fără cookie-uri. Cu `.png`
 * la sfârșit, cererea ocolește src/proxy.ts (care ar seta cookie-ul de limbă).
 */
export function bibleOgImagePath(locale: Locale, book?: BibleBookInfo, chapter?: number): string {
  return `/og/biblie/${[locale, book?.slug, chapter].filter(Boolean).join('/')}.png`
}

/** Inversul lui bibleOgImagePath; null = URL necunoscut (404). */
export function parseBibleOgParts(parts: string[]): { locale: Locale; book?: BibleBookInfo; chapter?: number } | null {
  if (parts.length < 1 || parts.length > 3) return null
  const last = parts[parts.length - 1]
  if (!last.endsWith('.png')) return null
  const [rawLocale, slug, rawChapter] = [...parts.slice(0, -1), last.slice(0, -'.png'.length)]
  if (rawLocale !== 'ro' && rawLocale !== 'ru' && rawLocale !== 'en') return null
  const locale: Locale = rawLocale
  if (slug === undefined) return { locale }
  const book = getBook(slug)
  if (!book) return null
  if (rawChapter === undefined) return { locale, book }
  if (!/^[1-9]\d{0,2}$/.test(rawChapter)) return null
  const chapter = Number(rawChapter)
  return chapter <= MAX_CHAPTER ? { locale, book, chapter } : null
}

interface PageSeo {
  book?: BibleBookInfo
  chapter?: number
  path: string
  description: string
  ogType: 'website' | 'article'
  robots?: Metadata['robots']
}

function bibleMetadata({ book, chapter, path, description, ogType, robots }: PageSeo, t: Translations, locale: Locale): Metadata {
  const canonical = `${SITE_URL}${localizedHref(path, locale)}`
  const title = bibleTitle(locale, book, chapter)
  const image = `${SITE_URL}${bibleOgImagePath(locale, book, chapter)}`
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
      images: [{ url: image, ...OG_SIZE, type: 'image/png', alt: `${COPY[locale].imageAlt}: ${title}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(robots ? { robots } : {}),
  }
}

/** /biblie; rezultatele căutării nu se indexează, dar linkurile lor se urmează. */
export function bibleIndexMetadata(t: Translations, locale: Locale, isSearch: boolean): Metadata {
  return bibleMetadata({
    path: '/biblie',
    description: COPY[locale].indexDescription,
    ogType: 'website',
    robots: isSearch ? { index: false, follow: true } : undefined,
  }, t, locale)
}

/** /biblie/[carte]; fără text încă: pagina există, dar nu se indexează. */
export function bibleBookMetadata(book: BibleBookInfo, t: Translations, locale: Locale, hasText: boolean): Metadata {
  return bibleMetadata({
    book,
    path: `/biblie/${book.slug}`,
    description: COPY[locale].bookDescription(bookShortName(book, locale)),
    ogType: 'website',
    robots: hasText ? undefined : { index: false, follow: true },
  }, t, locale)
}

/** /biblie/[carte]/[capitol]; fără text încă: pagina există, dar nu se indexează. */
export function bibleChapterMetadata(book: BibleBookInfo, chapter: number, t: Translations, locale: Locale, hasText: boolean): Metadata {
  return bibleMetadata({
    book,
    chapter,
    path: `/biblie/${book.slug}/${chapter}`,
    description: COPY[locale].chapterDescription(bookShortName(book, locale), chapter),
    ogType: 'article',
    robots: hasText ? undefined : { index: false, follow: true },
  }, t, locale)
}
