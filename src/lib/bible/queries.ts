/**
 * Interogările cititorului (doar pe server). `select` explicit peste tot;
 * `textSearch` se citește doar la căutare (ca filtru, nu se trimite paginii).
 * Orice eroare (bază indisponibilă, tabele lipsă) → null: pagina arată „în curând".
 */
import { prisma } from '../prisma'
import { TtlCache } from './cache'

export interface VerseRow { n: number; text: string }

const HOUR = 60 * 60 * 1000
/** Rândul din `Setting` schimbat de Admin la fiecare scriere: așa află și celelalte procese Passenger. */
export const READER_CACHE_VERSION_KEY = 'bible_cache_version'
const VERSION_CHECK_MS = 5000

interface ReaderCacheState {
  chapterCounts: TtlCache<number>
  chapters: TtlCache<VerseRow[]>
  seenVersion: string | null | undefined
  lastCheck: number
}

// Pe globalThis: acțiunile din Admin și paginile /biblie pot fi în pachete diferite, cu instanțe separate de modul.
const holder = globalThis as unknown as { __bibleReaderCache?: ReaderCacheState }
const cache: ReaderCacheState = holder.__bibleReaderCache ??= {
  chapterCounts: new TtlCache<number>(HOUR, 300),
  chapters: new TtlCache<VerseRow[]>(HOUR, 300),
  seenVersion: undefined,
  lastCheck: 0,
}

/** Golește capitolul din cache-ul acestui proces (celelalte procese află prin versiune, în cel mult 5 secunde). */
export function invalidateChapterCache(slug: string, chapter: number): void {
  cache.chapters.delete(`${slug}/${chapter}`)
}

/** Cel mult o dată la 5 secunde: dacă Adminul a scris între timp, golește cache-ul procesului. Tabelul `Setting` există și fără schema nouă. */
async function syncWithAdminEdits(): Promise<void> {
  const now = Date.now()
  if (now - cache.lastCheck < VERSION_CHECK_MS) return
  cache.lastCheck = now
  try {
    const row = await prisma.setting.findUnique({ where: { key: READER_CACHE_VERSION_KEY }, select: { value: true } })
    const version = row?.value ?? null
    if (cache.seenVersion !== undefined && version !== cache.seenVersion) {
      cache.chapters.clear()
      cache.chapterCounts.clear()
    }
    cache.seenVersion = version
  } catch {
    // baza nu răspunde: rămâne TTL-ul de o oră
  }
}

/** Numărul de capitole din baza de date (0 = carte neimportată); null = baza nu răspunde. */
export async function getChapterCount(slug: string): Promise<number | null> {
  try {
    const hit = cache.chapterCounts.get(slug)
    if (hit !== undefined) return hit
    const n = await prisma.bibleChapter.count({ where: { book: { slug } } })
    // 0 nu se păstrează: o carte importată după pornirea serverului apare imediat
    if (n > 0) cache.chapterCounts.set(slug, n)
    return n
  } catch {
    return null
  }
}

/** Versetele unui capitol, în ordine; null = baza nu răspunde. */
export async function getChapterVerses(slug: string, chapter: number): Promise<VerseRow[] | null> {
  try {
    await syncWithAdminEdits()
    const key = `${slug}/${chapter}`
    const hit = cache.chapters.get(key)
    if (hit) return hit
    const rows = await prisma.bibleVerse.findMany({
      where: { chapter: { chapterNum: chapter, book: { slug } } },
      select: { verseNum: true, textRo: true },
      orderBy: { verseNum: 'asc' },
    })
    const verses = rows.map(r => ({ n: r.verseNum, text: r.textRo }))
    if (verses.length) cache.chapters.set(key, verses)
    return verses
  } catch {
    return null
  }
}

export interface VerseHit { slug: string; chapter: number; verse: number; text: string }

export const SEARCH_PAGE_SIZE = 25

/** Versetele care conțin TOATE cuvintele (deja normalizate), cu LIMIT; null = baza nu răspunde. */
export async function searchVerses(words: string[], page: number): Promise<{ total: number; hits: VerseHit[] } | null> {
  if (!words.length) return { total: 0, hits: [] }
  const where = { AND: words.map(w => ({ textSearch: { contains: w } })) }
  try {
    const [total, rows] = await Promise.all([
      prisma.bibleVerse.count({ where }),
      prisma.bibleVerse.findMany({
        where,
        select: { verseNum: true, textRo: true, chapter: { select: { chapterNum: true, book: { select: { slug: true } } } } },
        orderBy: [{ chapter: { book: { orderNum: 'asc' } } }, { chapter: { chapterNum: 'asc' } }, { verseNum: 'asc' }],
        skip: Math.max(0, page - 1) * SEARCH_PAGE_SIZE,
        take: SEARCH_PAGE_SIZE,
      }),
    ])
    return { total, hits: rows.map(r => ({ slug: r.chapter.book.slug, chapter: r.chapter.chapterNum, verse: r.verseNum, text: r.textRo })) }
  } catch {
    return null
  }
}

/** Toate capitolele existente (pentru sitemap) — o singură interogare; null = baza nu răspunde. */
export async function listAllChapters(): Promise<{ slug: string; chapter: number }[] | null> {
  try {
    const rows = await prisma.bibleChapter.findMany({ select: { chapterNum: true, book: { select: { slug: true } } } })
    return rows.map(r => ({ slug: r.book.slug, chapter: r.chapterNum }))
  } catch {
    return null
  }
}
