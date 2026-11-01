/**
 * „Continuă lectura": locul de lectură, doar în localStorage-ul acestui browser.
 * Fără cont, fără server, fără cookie-uri. Orice acces la stocare trece prin
 * try/catch: cu stocarea blocată, funcția dispare fără erori.
 */
import type { Locale } from '../i18n/context'
import { localizedHref } from '../i18n/href'
import { getBook } from './books'

export const POSITION_KEY = 'biblia:pozitie'
export const RECENT_KEY = 'biblia:recente'
export const MAX_RECENT = 5
/** Cardul arată poziția curentă, plus capitolele anterioare din listă. */
export const MAX_RECENT_SHOWN = MAX_RECENT - 1

export interface RecentChapter { carte: string; capitol: number; ts: number }
export interface ReadingPosition extends RecentChapter { verset: number }
export interface ReadingHistory { position: ReadingPosition; recent: RecentChapter[] }

// ─── Acces sigur la stocare ──────────────────────────────────────────────────

function readRaw(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}

function writeRaw(key: string, value: string): void {
  try { window.localStorage.setItem(key, value) } catch { /* blocat sau plin */ }
}

function removeRaw(key: string): void {
  try { window.localStorage.removeItem(key) } catch { /* blocat */ }
}

// ─── Validare ────────────────────────────────────────────────────────────────

const isPositiveInt = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 1

function toRecentChapter(value: unknown): RecentChapter | null {
  if (!value || typeof value !== 'object') return null
  const { carte, capitol, ts } = value as Record<string, unknown>
  if (typeof carte !== 'string' || !getBook(carte) || !isPositiveInt(capitol) || !isPositiveInt(ts)) return null
  return { carte, capitol, ts }
}

function parseJson(raw: string): unknown {
  try { return JSON.parse(raw) } catch { return null }
}

export function parsePosition(raw: string): ReadingPosition | null {
  const value = parseJson(raw)
  const chapter = toRecentChapter(value)
  const verset = (value as { verset?: unknown } | null)?.verset
  return chapter && isPositiveInt(verset) ? { ...chapter, verset } : null
}

/** Null dacă lista sau oricare dintre intrări e invalidă; altfel fără dubluri și cel mult MAX_RECENT. */
export function parseRecent(raw: string): RecentChapter[] | null {
  const value = parseJson(raw)
  if (!Array.isArray(value)) return null
  const items = value.map(toRecentChapter)
  if (items.some(item => item === null)) return null
  return dedupe(items as RecentChapter[])
}

const sameChapter = (a: RecentChapter, b: RecentChapter) => a.carte === b.carte && a.capitol === b.capitol

function dedupe(items: RecentChapter[]): RecentChapter[] {
  return items.filter((item, i) => items.findIndex(other => sameChapter(other, item)) === i).slice(0, MAX_RECENT)
}

// ─── Citire și scriere ───────────────────────────────────────────────────────

/** O valoare invalidă se șterge, ca să nu fie validată la nesfârșit. */
function readValid<T>(key: string, parse: (raw: string) => T | null): T | null {
  const raw = readRaw(key)
  if (raw === null) return null
  const parsed = parse(raw)
  if (parsed === null) removeRaw(key)
  return parsed
}

export const readPosition = () => readValid(POSITION_KEY, parsePosition)
export const readRecent = () => readValid(RECENT_KEY, parseRecent) ?? []

export function savePosition(carte: string, capitol: number, verset: number, now = Date.now()): void {
  const position = { carte, capitol, verset, ts: now }
  const serialized = JSON.stringify(position)
  if (!parsePosition(serialized)) return
  writeRaw(POSITION_KEY, serialized)
  const entry: RecentChapter = { carte, capitol, ts: now }
  writeRaw(RECENT_KEY, JSON.stringify(dedupe([entry, ...readRecent()])))
}

// ─── Starea cardului (pentru useSyncExternalStore) ───────────────────────────

const CHANGE_EVENT = 'biblia:istoric'

export function clearHistory(): void {
  removeRaw(POSITION_KEY)
  removeRaw(RECENT_KEY)
  try { window.dispatchEvent(new Event(CHANGE_EVENT)) } catch { /* fără window */ }
}

/** `pageshow`: revenirea cu „Înapoi" din capitol, din bfcache, trebuie să arate poziția nouă. */
export function subscribeHistory(onChange: () => void): () => void {
  const events = [CHANGE_EVENT, 'storage', 'pageshow']
  events.forEach(e => window.addEventListener(e, onChange))
  return () => events.forEach(e => window.removeEventListener(e, onChange))
}

const rawSnapshot = () => `${readRaw(POSITION_KEY)}\n${readRaw(RECENT_KEY)}`
let cached: { raw: string; value: ReadingHistory | null } | null = null

/** Același obiect cât timp stocarea nu s-a schimbat, cum cere useSyncExternalStore. */
export function getHistorySnapshot(): ReadingHistory | null {
  if (cached?.raw === rawSnapshot()) return cached.value
  const position = readPosition()
  const recent = readRecent()
    .filter(item => !position || !sameChapter(item, position))
    .slice(0, MAX_RECENT_SHOWN)
  // citirea poate șterge valori invalide: cheia de cache se ia după ea
  cached = { raw: rawSnapshot(), value: position ? { position, recent } : null }
  return cached.value
}

// ─── Linkuri ─────────────────────────────────────────────────────────────────

export function chapterHref(item: Pick<RecentChapter, 'carte' | 'capitol'>, locale: Locale): string {
  return localizedHref(`/biblie/${item.carte}/${item.capitol}`, locale)
}

export function resumeHref(position: ReadingPosition, locale: Locale): string {
  return `${chapterHref(position, locale)}#v${position.verset}`
}

// ─── Reguli folosite de urmăritorul din pagina de capitol ────────────────────

/** Cel mai de sus verset vizibil. Versetul 0 (titlul unor psalmi) se salvează ca 1, fiindcă poziția are verset ≥ 1. */
export function topVerse(visible: Iterable<number>): number | null {
  const verses = [...visible]
  return verses.length ? Math.max(1, Math.min(...verses)) : null
}

export function verseFromHash(hash: string): number | null {
  const match = /^#v(\d+)$/.exec(hash)
  return match ? Number(match[1]) : null
}

export function isSearchReferrer(referrer: string): boolean {
  try { return new URL(referrer).searchParams.has('q') } catch { return false }
}

/**
 * Pagina deschisă direct la un verset (rezultat de căutare, referință „Ioan 3:16"
 * redirecționată, link trimis de cineva) nu înseamnă lectură: poziția se salvează
 * doar după ce cititorul derulează.
 */
export function waitsForScroll(nav: { hash: string; referrer: string; redirectCount: number }): boolean {
  return verseFromHash(nav.hash) !== null || isSearchReferrer(nav.referrer) || nav.redirectCount > 0
}
