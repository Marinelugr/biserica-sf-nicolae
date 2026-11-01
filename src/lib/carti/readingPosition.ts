/**
 * „Continuă lectura" la cărțile din Bibliotecă, tipul `carte`. Toate cărțile sunt
 * HTML din editor, într-un singur `.rich.reading`; unitatea de poziție se alege în
 * browser, din structura textului. Doc: docs/CONTINUA-LECTURA-CARTI.md.
 */
import type { Locale } from '../i18n/context'
import { localizedHref } from '../i18n/href'
import { MAX_RECENT, createReadingStore, isPositiveInt, parseJson, parseRecentList, uniqueRecent } from '../reading-position'

export const MAX_RECENT_SHOWN = MAX_RECENT - 1
/** Sub atâtea titluri, textul nu are secțiuni utile: poziția e procentul. */
export const MIN_SECTIONS = 3
/** Un titlu e scurt; un paragraf îngroșat mai lung e doar text evidențiat. */
const MAX_HEADING_CHARS = 80
/** Sub acest procent, cititorul e încă la început: nu e un loc de reluat. */
export const MIN_PERCENT = 3

export type BookLocation = { sectiune: string; ancora: string } | { procent: number }
export type BookPosition = { id: string; ts: number } & BookLocation
/** O carte citită recent; locul lipsește până când cititorul avansează. */
export type RecentBook = { id: string; ts: number } | BookPosition
export interface BookHistory { position: BookPosition | null; recent: RecentBook[] }

// ─── Validare ────────────────────────────────────────────────────────────────

const VALID_SLUG = /^[\p{L}\p{N}-]{1,200}$/u
const VALID_ANCHOR = /^s\d{1,4}$/

function toRecentBook(value: unknown): RecentBook | null {
  if (!value || typeof value !== 'object') return null
  const { id, ts, sectiune, ancora, procent } = value as Record<string, unknown>
  if (typeof id !== 'string' || !VALID_SLUG.test(id) || !isPositiveInt(ts)) return null
  const hasSection = sectiune !== undefined || ancora !== undefined
  if (hasSection && procent !== undefined) return null
  if (hasSection) {
    if (typeof sectiune !== 'string' || !sectiune || sectiune.length > MAX_HEADING_CHARS) return null
    if (typeof ancora !== 'string' || !VALID_ANCHOR.test(ancora)) return null
    return { id, ts, sectiune, ancora }
  }
  if (procent !== undefined) return isPositiveInt(procent) && procent <= 100 ? { id, ts, procent } : null
  return { id, ts }
}

export const hasLocation = (book: RecentBook): book is BookPosition => 'procent' in book || 'ancora' in book

const sameBook = (a: RecentBook, b: RecentBook) => a.id === b.id

export function parseBookPosition(raw: string): BookPosition | null {
  const book = toRecentBook(parseJson(raw))
  return book && hasLocation(book) ? book : null
}

export function parseRecentBooks(raw: string): RecentBook[] | null {
  return parseRecentList(raw, toRecentBook, sameBook)
}

// ─── Citire și scriere ───────────────────────────────────────────────────────

const store = createReadingStore<BookPosition, RecentBook, BookHistory>({
  tip: 'carte',
  parsePosition: parseBookPosition,
  parseRecent: parseRecentBooks,
  select: (position, recent) => (position || recent.length ? { position, recent } : null),
})

export const BOOK_POSITION_KEY = store.positionKey
export const BOOK_RECENT_KEY = store.recentKey
export const readBookPosition = store.readPosition
export const readRecentBooks = store.readRecent
export const clearBookHistory = store.clear
export const subscribeBookHistory = store.subscribe
export const getBookHistorySnapshot = store.getSnapshot

/** Locul salvat pentru această carte. Lista recentă le ține pe ultimele 5, nu doar pe ultima. */
export function savedLocation(id: string): BookPosition | null {
  const entry = store.readRecent().find(book => book.id === id)
  if (entry && hasLocation(entry)) return entry
  const position = store.readPosition()
  return position?.id === id ? position : null
}

/** Cartea a fost deschisă: urcă în listă și își păstrează locul salvat. */
export function touchBook(id: string, now = Date.now()): void {
  const entry = { ...savedLocation(id), id, ts: now }
  store.writeRecent(uniqueRecent<RecentBook>([entry, ...store.readRecent()], sameBook))
}

export function saveBookLocation(id: string, location: BookLocation, now = Date.now()): void {
  const position = { id, ts: now, ...location } as BookPosition
  if (!parseBookPosition(JSON.stringify(position))) return
  store.writePosition(position)
  store.writeRecent(uniqueRecent<RecentBook>([position, ...store.readRecent()], sameBook))
}

/** Cartea s-a terminat sau a fost modificată: rămâne doar la „Citite recent". */
export function forgetBookLocation(id: string, now = Date.now()): void {
  if (store.readPosition()?.id === id) store.removePosition()
  const others = store.readRecent().filter(book => book.id !== id)
  store.writeRecent(uniqueRecent<RecentBook>([{ id, ts: now }, ...others], sameBook))
}

/** Scoate cărțile care nu mai există în Bibliotecă. */
export function pruneMissingBooks(existing: ReadonlySet<string>): void {
  if (existing.size === 0) return
  const position = store.readPosition()
  const recent = store.readRecent()
  const kept = recent.filter(book => existing.has(book.id))
  if (position && !existing.has(position.id)) store.removePosition()
  if (kept.length !== recent.length) store.writeRecent(kept)
}

// ─── Linkuri și etichete ─────────────────────────────────────────────────────

export function bookHref(id: string, locale: Locale): string {
  return localizedHref(`/carti/${id}`, locale)
}

export function resumeBookHref(position: BookPosition, locale: Locale): string {
  return `${bookHref(position.id, locale)}#${'ancora' in position ? position.ancora : `p${position.procent}`}`
}

export function placeLabel(location: BookLocation): string {
  return 'sectiune' in location ? location.sectiune : `${location.procent}%`
}

export const isResumeHash = (hash: string) => /^#(s\d+|p\d+)$/.test(hash)

// ─── Structura textului ──────────────────────────────────────────────────────

const isTitleSized = (text: string) => text.length > 0 && text.length <= MAX_HEADING_CHARS

function isHeading(el: Element): boolean {
  const text = el.textContent?.trim() ?? ''
  if (!isTitleSized(text)) return false
  if (/^H[1-4]$/.test(el.tagName)) return true
  // Acatistele din editor au „Condac 1", „Icos 1" ca paragrafe doar îngroșate.
  return el.tagName === 'P' && el.children.length === 1 && el.firstElementChild!.tagName === 'STRONG'
    && el.firstElementChild!.textContent?.trim() === text
}

export interface BookSection { element: HTMLElement; title: string; anchor: string }

/** Secțiunile textului, în ordine. Gol dacă sunt prea puține: atunci poziția e procentul. */
export function findSections(content: Element): BookSection[] {
  const sections = Array.from(content.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p'))
    .filter(isHeading)
    .map((element, i) => ({ element, title: element.textContent!.trim(), anchor: `s${i + 1}` }))
  return sections.length >= MIN_SECTIONS ? sections : []
}

/** Cât din text a trecut de linia de lectură, în procente întregi între 0 și 100. */
export function percentRead(contentTop: number, contentHeight: number, line: number): number {
  if (contentHeight <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((line - contentTop) / contentHeight * 100)))
}
