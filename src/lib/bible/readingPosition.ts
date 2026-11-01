/**
 * „Continuă lectura" la Biblie, peste modulul comun din `src/lib/reading-position.ts`.
 * Cheile vechi `biblia:pozitie` și `biblia:recente` se mută la prima citire.
 */
import type { Locale } from '../i18n/context'
import { localizedHref } from '../i18n/href'
import { MAX_RECENT, createReadingStore, isPositiveInt, parseJson, parseRecentList, uniqueRecent } from '../reading-position'
import { getBook } from './books'

export const LEGACY_POSITION_KEY = 'biblia:pozitie'
export const LEGACY_RECENT_KEY = 'biblia:recente'
/** Cardul arată poziția curentă, plus capitolele anterioare din listă. */
export const MAX_RECENT_SHOWN = MAX_RECENT - 1

export interface RecentChapter { carte: string; capitol: number; ts: number }
export interface ReadingPosition extends RecentChapter { verset: number }
export interface ReadingHistory { position: ReadingPosition; recent: RecentChapter[] }

// ─── Validare ────────────────────────────────────────────────────────────────

function toRecentChapter(value: unknown): RecentChapter | null {
  if (!value || typeof value !== 'object') return null
  const { carte, capitol, ts } = value as Record<string, unknown>
  if (typeof carte !== 'string' || !getBook(carte) || !isPositiveInt(capitol) || !isPositiveInt(ts)) return null
  return { carte, capitol, ts }
}

const sameChapter = (a: RecentChapter, b: RecentChapter) => a.carte === b.carte && a.capitol === b.capitol

export function parsePosition(raw: string): ReadingPosition | null {
  const value = parseJson(raw)
  const chapter = toRecentChapter(value)
  const verset = (value as { verset?: unknown } | null)?.verset
  return chapter && isPositiveInt(verset) ? { ...chapter, verset } : null
}

/** Null dacă lista sau oricare dintre intrări e invalidă; altfel fără dubluri și cel mult MAX_RECENT. */
export function parseRecent(raw: string): RecentChapter[] | null {
  return parseRecentList(raw, toRecentChapter, sameChapter)
}

// ─── Citire și scriere ───────────────────────────────────────────────────────

const store = createReadingStore<ReadingPosition, RecentChapter, ReadingHistory>({
  tip: 'biblia',
  parsePosition,
  parseRecent,
  legacy: { position: LEGACY_POSITION_KEY, recent: LEGACY_RECENT_KEY },
  select: (position, recent) => position && {
    position,
    recent: recent.filter(item => !sameChapter(item, position)).slice(0, MAX_RECENT_SHOWN),
  },
})

export const POSITION_KEY = store.positionKey
export const RECENT_KEY = store.recentKey
export const readPosition = store.readPosition
export const readRecent = store.readRecent
export const clearHistory = store.clear
export const subscribeHistory = store.subscribe
export const getHistorySnapshot = store.getSnapshot

export function savePosition(carte: string, capitol: number, verset: number, now = Date.now()): void {
  const position = { carte, capitol, verset, ts: now }
  if (!parsePosition(JSON.stringify(position))) return
  const recent = uniqueRecent([{ carte, capitol, ts: now }, ...store.readRecent()], sameChapter)
  store.writePosition(position)
  store.writeRecent(recent)
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
