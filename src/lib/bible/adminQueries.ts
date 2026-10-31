/** Citirile Adminului Bibliei (coloanele noi apar doar aici și în acțiuni, niciodată în cititor). */
import { prisma } from '../prisma'
import { buildBookExport, escapeLike, gapCount, type ReplaceRow } from './adminCore'
import type { ParsedBook } from './parse'

export interface ChapterStats { chapterNum: number; verses: number; reviewed: number; edited: number; gaps: number }

/** Statisticile fiecărui capitol; toată Biblia sau o carte. Fără textul versetelor. */
export async function chapterStats(slug?: string): Promise<(ChapterStats & { slug: string })[]> {
  const inBook = slug ? { chapter: { book: { slug } } } : {}
  const [chapters, all, positive, reviewed, edited] = await Promise.all([
    prisma.bibleChapter.findMany({
      where: slug ? { book: { slug } } : {},
      select: { id: true, chapterNum: true, book: { select: { slug: true } } },
      orderBy: { chapterNum: 'asc' },
    }),
    prisma.bibleVerse.groupBy({ by: ['chapterId'], where: inBook, _count: { _all: true } }),
    prisma.bibleVerse.groupBy({ by: ['chapterId'], where: { ...inBook, verseNum: { gt: 0 } }, _count: { _all: true }, _max: { verseNum: true } }),
    prisma.bibleVerse.groupBy({ by: ['chapterId'], where: { ...inBook, reviewed: true }, _count: { _all: true } }),
    prisma.bibleVerse.groupBy({ by: ['chapterId'], where: { ...inBook, editedAt: { not: null } }, _count: { _all: true } }),
  ])
  const counts = (rows: { chapterId: string; _count: { _all: number } }[]) => new Map(rows.map(r => [r.chapterId, r._count._all]))
  const allBy = counts(all), reviewedBy = counts(reviewed), editedBy = counts(edited)
  const positiveBy = new Map(positive.map(r => [r.chapterId, r]))
  return chapters.map(c => {
    const p = positiveBy.get(c.id)
    return {
      slug: c.book.slug,
      chapterNum: c.chapterNum,
      verses: allBy.get(c.id) ?? 0,
      reviewed: reviewedBy.get(c.id) ?? 0,
      edited: editedBy.get(c.id) ?? 0,
      gaps: gapCount(p?._count._all ?? 0, p?._max.verseNum),
    }
  })
}

export interface BookStats { chapters: number; verses: number; reviewed: number; edited: number; gaps: number }

export function sumStats(rows: ChapterStats[]): BookStats {
  return rows.reduce<BookStats>(
    (t, r) => ({ chapters: t.chapters + 1, verses: t.verses + r.verses, reviewed: t.reviewed + r.reviewed, edited: t.edited + r.edited, gaps: t.gaps + r.gaps }),
    { chapters: 0, verses: 0, reviewed: 0, edited: 0, gaps: 0 },
  )
}

/** „100%” doar când toate versetele sunt revizuite. */
export function reviewedPercent(reviewed: number, verses: number): number {
  if (!verses) return 0
  return reviewed === verses ? 100 : Math.min(99, Math.round((reviewed / verses) * 100))
}

export async function loadChapterForEditor(slug: string, chapter: number) {
  const [row, count] = await Promise.all([
    prisma.bibleChapter.findFirst({
      where: { chapterNum: chapter, book: { slug } },
      select: {
        verses: {
          select: { id: true, verseNum: true, textRo: true, reviewed: true, editedAt: true },
          orderBy: { verseNum: 'asc' },
        },
      },
    }),
    prisma.bibleChapter.count({ where: { book: { slug } } }),
  ])
  return row ? { verses: row.verses, chapterCount: count } : null
}

/** Versetele din carte care conțin textul exact, în ordinea cărții. */
export async function loadReplaceRows(db: Pick<typeof prisma, 'bibleVerse'>, slug: string, find: string): Promise<ReplaceRow[]> {
  const rows = await db.bibleVerse.findMany({
    where: { chapter: { book: { slug } }, textRo: { contains: escapeLike(find) } },
    select: { id: true, verseNum: true, textRo: true, editedAt: true, chapter: { select: { chapterNum: true } } },
    orderBy: [{ chapter: { chapterNum: 'asc' } }, { verseNum: 'asc' }],
  })
  return rows.map(r => ({ id: r.id, chapterNum: r.chapter.chapterNum, verseNum: r.verseNum, textRo: r.textRo, editedAt: r.editedAt }))
}

export const JOURNAL_PAGE_SIZE = 50

export async function loadJournal(page: number) {
  const [total, rows] = await Promise.all([
    prisma.bibleEdit.count(),
    prisma.bibleEdit.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * JOURNAL_PAGE_SIZE,
      take: JOURNAL_PAGE_SIZE,
      select: { id: true, bookSlug: true, chapterNum: true, verseNum: true, action: true, oldText: true, newText: true, editor: true, createdAt: true },
    }),
  ])
  return { total, rows }
}

/** O carte în formatul bible-data; null dacă nu are versete. */
export async function loadBookExport(slug: string): Promise<ParsedBook | null> {
  const rows = await prisma.bibleVerse.findMany({
    where: { chapter: { book: { slug } } },
    select: { verseNum: true, textRo: true, chapter: { select: { chapterNum: true } } },
  })
  if (!rows.length) return null
  return buildBookExport(slug, rows.map(r => ({ chapterNum: r.chapter.chapterNum, verseNum: r.verseNum, textRo: r.textRo })))
}
