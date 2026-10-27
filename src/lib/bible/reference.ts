/**
 * Referințe biblice („Ioan 3:16", „1 Cor 13", „Mt 5", „Ps 50") → carte + capitol + verset.
 * Fără importuri din React/Next și fără `@/` (folosit și la extragerea din Word).
 */
import { BIBLE_BOOKS, getBook, type BibleBookInfo } from './books'

export interface BibleReference {
  slug: string
  chapter?: number
  verse?: number
  verseTo?: number
}

const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4' }

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Cheia de potrivire a unui nume de carte: fără diacritice, litere mici, fără
 * puncte și spații; „I Cor"/„II Cor" → „1cor"/„2cor".
 */
export function aliasKey(name: string): string {
  const n = fold(name.normalize('NFC'))
    .replace(/[.'’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(iv|iii|ii|i) (?=[a-z])/, (m: string) => ROMAN[m.trim()] + ' ')
  return n.replace(/[^a-z0-9]/g, '')
}

/** Toate numele unei cărți: slug, eticheta română și alias-urile. */
export function bookNames(book: BibleBookInfo): string[] {
  return [book.slug.replace(/-/g, ' '), book.labelRo, ...book.aliases]
}

let INDEX: Map<string, string | null> | null = null

/** cheie → slug (sau null dacă aceeași cheie ar duce la două cărți). */
export function aliasIndex(): Map<string, string | null> {
  if (INDEX) return INDEX
  const map = new Map<string, string | null>()
  for (const book of BIBLE_BOOKS) {
    for (const name of new Set(bookNames(book).map(aliasKey))) {
      if (!name) continue
      const prev = map.get(name)
      map.set(name, prev === undefined || prev === book.slug ? book.slug : null)
    }
  }
  INDEX = map
  return map
}

/** Cartea după nume/alias/abreviere; null dacă nu există sau e ambiguu („Regi" fără număr). */
export function findBookByName(name: string): BibleBookInfo | null {
  const key = aliasKey(name)
  if (!key) return null
  const slug = aliasIndex().get(key)
  return slug ? getBook(slug) ?? null : null
}

const REF_RE = /^(.*?\p{L}[^\d]*?)\s*(\d{1,3})(?:\s*[:,.]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?\s*$/u

/**
 * „Ioan 3:16", „Ioan 3,16", „Ioan 3.16", „Ioan 3, 16-18", „Ioan 3", „1 Cor 13:4",
 * „1Cor 13", „Evanghelia după Matei 5", cu sau fără diacritice. Null pentru orice
 * altceva (inclusiv nume ambigue). Nu aruncă niciodată.
 */
export function parseReference(input: unknown): BibleReference | null {
  try {
    if (typeof input !== 'string') return null
    const s = input.normalize('NFC').replace(/\s+/g, ' ').trim()
    if (!s || s.length > 100) return null

    const m = s.match(REF_RE)
    if (!m) {
      const book = findBookByName(s)
      return book ? { slug: book.slug } : null
    }
    const book = findBookByName(m[1])
    if (!book) return null
    const chapter = Number(m[2])
    if (!Number.isInteger(chapter) || chapter < 1) return null
    const ref: BibleReference = { slug: book.slug, chapter }
    if (m[3] !== undefined) {
      const verse = Number(m[3])
      if (verse < 1) return null
      ref.verse = verse
      if (m[4] !== undefined) {
        const verseTo = Number(m[4])
        if (verseTo < verse) return null
        if (verseTo > verse) ref.verseTo = verseTo
      }
    }
    return ref
  } catch {
    return null
  }
}
