/** Citirile cozii de revizuire. Doar pentru Admin; cititorul public nu ajunge aici. */
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { getBook } from './books'
import { isStale, REVIEW_STATUSES, type ReviewStatus } from './reviewCore'

export interface ReviewFilters {
  status: ReviewStatus
  detector?: string
  book?: string
  confidence?: 'medie' | 'mica' | 'cititor'
  source?: 'audit' | 'cititor'
}

type RawParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Orice valoare necunoscută din URL se ignoră. */
export function parseFilters(raw: RawParams): ReviewFilters {
  const status = one(raw.stare)
  const detector = one(raw.detector)
  const book = one(raw.carte)
  const confidence = one(raw.incredere)
  const source = one(raw.sursa)
  return {
    status: REVIEW_STATUSES.includes(status as ReviewStatus) ? status as ReviewStatus : 'PENDING',
    detector: detector && /^[A-HR]$/.test(detector) ? detector : undefined,
    book: book && getBook(book) ? book : undefined,
    confidence: confidence === 'medie' || confidence === 'mica' || confidence === 'cititor' ? confidence : undefined,
    source: source === 'audit' || source === 'cititor' ? source : undefined,
  }
}

export function filtersQuery(f: ReviewFilters, position?: number): string {
  const q = new URLSearchParams()
  if (f.status !== 'PENDING') q.set('stare', f.status)
  if (f.detector) q.set('detector', f.detector)
  if (f.book) q.set('carte', f.book)
  if (f.confidence) q.set('incredere', f.confidence)
  if (f.source) q.set('sursa', f.source)
  if (position) q.set('i', String(position))
  const s = q.toString()
  return s ? `?${s}` : ''
}

function whereOf(f: ReviewFilters): Prisma.BibleReviewItemWhereInput {
  return {
    status: f.status,
    ...(f.detector ? { detector: f.detector } : {}),
    ...(f.book ? { bookSlug: f.book } : {}),
    ...(f.confidence ? { confidence: f.confidence } : {}),
    ...(f.source ? { source: f.source } : {}),
  }
}

/** Cititor întâi („cititor” < „medie” < „mica”), apoi ordinea cărților. */
const ORDER: Prisma.BibleReviewItemOrderByWithRelationInput[] = [
  { confidence: 'asc' },
  { verse: { chapter: { book: { orderNum: 'asc' } } } },
  { chapterNum: 'asc' },
  { verseNum: 'asc' },
  { id: 'asc' },
]

const ITEM_SELECT = {
  id: true, bookSlug: true, chapterNum: true, verseNum: true, detector: true, fragment: true, suggestion: true, reason: true,
  confidence: true, source: true, message: true, status: true, createdAt: true,
  verse: { select: { id: true, chapterId: true, textRo: true, editedAt: true } },
} satisfies Prisma.BibleReviewItemSelect

export type ReviewRow = Prisma.BibleReviewItemGetPayload<{ select: typeof ITEM_SELECT }>

export interface ReviewCounts {
  byStatus: Record<ReviewStatus, number>
  byDetector: { detector: string; pending: number; total: number }[]
  bySource: { source: string; pending: number; total: number }[]
}

export function summarizeCounts(rows: { status: string; detector: string; source: string; count: number }[]): ReviewCounts {
  const byStatus = Object.fromEntries(REVIEW_STATUSES.map(s => [s, 0])) as Record<ReviewStatus, number>
  const add = (map: Map<string, { pending: number; total: number }>, key: string, r: { status: string; count: number }) => {
    const e = map.get(key) ?? { pending: 0, total: 0 }
    e.total += r.count
    if (r.status === 'PENDING') e.pending += r.count
    map.set(key, e)
  }
  const detectors = new Map<string, { pending: number; total: number }>()
  const sources = new Map<string, { pending: number; total: number }>()
  for (const r of rows) {
    if (r.status in byStatus) byStatus[r.status as ReviewStatus] += r.count
    add(detectors, r.detector, r)
    add(sources, r.source, r)
  }
  return {
    byStatus,
    byDetector: [...detectors].map(([detector, v]) => ({ detector, ...v })).sort((a, b) => a.detector.localeCompare(b.detector)),
    bySource: [...sources].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.source.localeCompare(a.source)),
  }
}

export async function reviewCounts(): Promise<ReviewCounts> {
  const rows = await prisma.bibleReviewItem.groupBy({ by: ['status', 'detector', 'source'], _count: { _all: true } })
  return summarizeCounts(rows.map(r => ({ status: r.status, detector: r.detector, source: r.source, count: r._count._all })))
}

/** Pentru cardul de pe /admin/biblia. Null dacă tabelele nu există încă: pagina nu trebuie să pice. */
export async function pendingReviewCount(): Promise<number | null> {
  try {
    return await prisma.bibleReviewItem.count({ where: { status: 'PENDING' } })
  } catch {
    return null
  }
}

const STALE_BATCH = 25
const STALE_ROUNDS = 40

export interface QueuePosition { item: ReviewRow | null; total: number; position: number; staleSkipped: number }

/**
 * Elementul de la poziția cerută. Cele în așteptare al căror fragment nu mai e în verset devin
 * STALE și se sar. O singură tranziție, adevărată indiferent de cine a deschis pagina.
 */
export async function loadQueuePosition(filters: ReviewFilters, position: number): Promise<QueuePosition> {
  const where = whereOf(filters)
  let staleSkipped = 0
  let at = position
  for (let round = 0; round < STALE_ROUNDS; round++) {
    const rows = await prisma.bibleReviewItem.findMany({ where, orderBy: ORDER, skip: at, take: STALE_BATCH, select: ITEM_SELECT })
    if (filters.status !== 'PENDING') {
      const total = await prisma.bibleReviewItem.count({ where })
      return { item: rows[0] ?? null, total, position: at, staleSkipped: 0 }
    }
    const firstFresh = rows.findIndex(r => !isStale(r.verse.textRo, r.fragment))
    const stale = (firstFresh === -1 ? rows : rows.slice(0, firstFresh)).map(r => r.id)
    if (stale.length) {
      const { count } = await prisma.bibleReviewItem.updateMany({
        where: { id: { in: stale }, status: 'PENDING' },
        data: { status: 'STALE', resolvedBy: 'automat', resolvedAt: new Date() },
      })
      staleSkipped += count
    }
    if (firstFresh !== -1) {
      const total = await prisma.bibleReviewItem.count({ where })
      return { item: rows[firstFresh], total, position: at, staleSkipped }
    }
    if (rows.length < STALE_BATCH) {
      const total = await prisma.bibleReviewItem.count({ where })
      // poziție dincolo de capăt: rămâne pe ultimul, dacă mai sunt
      if (at > 0 && at >= total && total > 0) { at = total - 1; continue }
      return { item: null, total, position: at, staleSkipped }
    }
  }
  return { item: null, total: await prisma.bibleReviewItem.count({ where }), position: at, staleSkipped }
}

export async function neighborVerses(chapterId: string, verseNum: number) {
  const rows = await prisma.bibleVerse.findMany({
    where: { chapterId, verseNum: { in: [verseNum - 1, verseNum + 1] } },
    select: { verseNum: true, textRo: true },
  })
  return {
    prev: rows.find(r => r.verseNum === verseNum - 1) ?? null,
    next: rows.find(r => r.verseNum === verseNum + 1) ?? null,
  }
}

export async function reviewFacets() {
  const books = await prisma.bibleReviewItem.groupBy({ by: ['bookSlug'], where: { status: 'PENDING' }, _count: { _all: true } })
  return new Map(books.map(b => [b.bookSlug, b._count._all]))
}

export function isMissingTable(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2021' || err.code === 'P2022')
}
