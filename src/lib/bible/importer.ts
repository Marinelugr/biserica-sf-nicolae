/**
 * Importul Bibliei în baza de date: plan, scriere pe carte (într-o tranzacție),
 * verificare, ștergere. Clientul se primește ca parametru (Prisma în scripturi,
 * un client fals în teste). Fără React/Next și fără `@/`.
 */
import { BIBLE_BOOKS, getBook, type BibleBookInfo } from './books'
import type { ParsedBook } from './parse'
import { normalizeForSearch } from './search'

// ─── Garda de conexiune ─────────────────────────────────────────────────────

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** Doar numele gazdei din URL-ul bazei (fără utilizator, parolă, port, bază). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^\[|\]$/g, '') || '(necunoscută)'
  } catch {
    return '(URL invalid)'
  }
}

export function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.has(host) || LOCAL_HOSTS.has(`[${host}]`)
}

export interface HostGuardOptions { allowRemote?: boolean; yesHost?: string }

/** Scrierea e permisă pe localhost; pe altă gazdă doar cu --allow-remote ȘI --yes-host=<gazda exactă>. */
export function checkWriteAllowed(host: string, opts: HostGuardOptions): { ok: true } | { ok: false; reason: string } {
  if (isLocalHost(host)) return { ok: true }
  if (!opts.allowRemote) return { ok: false, reason: `Gazda „${host}" nu e locală. Pentru scriere sunt necesare --allow-remote și --yes-host=${host}.` }
  if (opts.yesHost !== host) return { ok: false, reason: `--yes-host trebuie să fie exact „${host}" (am primit „${opts.yesHost ?? ''}").` }
  return { ok: true }
}

// ─── Clientul (subsetul folosit din Prisma) ──────────────────────────────────

type Count = { count: number }

export interface BibleTx {
  bibleBook: {
    findUnique(args: { where: { slug: string }; select: { id: true } }): Promise<{ id: string } | null>
    findMany(args: { select: { slug: true; _count: { select: { chapters: true } } } }): Promise<{ slug: string; _count: { chapters: number } }[]>
    create(args: { data: { slug: string; nameRo: string; testament: string; orderNum: number }; select: { id: true } }): Promise<{ id: string }>
    deleteMany(args?: { where?: { id?: string } }): Promise<Count>
  }
  bibleChapter: {
    createMany(args: { data: { bookId: string; chapterNum: number }[] }): Promise<Count>
    findMany(args: { where: { bookId: string }; select: { id: true; chapterNum: true } }): Promise<{ id: string; chapterNum: number }[]>
    deleteMany(args?: { where?: { bookId?: string } }): Promise<Count>
    count(args: { where: { book: { slug: string } } }): Promise<number>
  }
  bibleVerse: {
    createMany(args: { data: { chapterId: string; verseNum: number; textRo: string; textSearch: string }[] }): Promise<Count>
    deleteMany(args?: { where?: { chapter?: { bookId: string } } }): Promise<Count>
    count(args: { where: { chapter: { book: { slug: string } } } }): Promise<number>
  }
}

export interface BibleDb extends BibleTx {
  $transaction<T>(fn: (tx: BibleTx) => Promise<T>, options?: { timeout?: number; maxWait?: number }): Promise<T>
}

export const TX_OPTIONS = { timeout: 300_000, maxWait: 20_000 }
export const BATCH_SIZE = 1000

// ─── Planul ────────────────────────────────────────────────────────────────

export interface PlanOptions { only?: string[]; replaceBook?: string }

export interface PlanItem {
  slug: string
  action: 'create' | 'replace' | 'skip'
  chapters: number
  verses: number
  /** Capitole deja existente în baza de date. */
  existing: number
}

export interface ImportPlan { items: PlanItem[]; create: number; replace: number; skip: number; chapters: number; verses: number }

/** Ce s-ar face, fără nicio scriere. `existing` = slug → numărul de capitole din baza de date. */
export function planImport(books: ParsedBook[], existing: Map<string, number>, opts: PlanOptions = {}): ImportPlan {
  const only = opts.only?.length ? new Set(opts.only) : null
  const items: PlanItem[] = []
  for (const info of BIBLE_BOOKS) {
    const book = books.find(b => b.slug === info.slug)
    if (!book || (only && !only.has(info.slug))) continue
    const have = existing.get(info.slug) ?? 0
    const action: PlanItem['action'] = opts.replaceBook === info.slug ? 'replace' : have > 0 ? 'skip' : 'create'
    items.push({
      slug: info.slug, action, existing: have,
      chapters: book.chapters.length,
      verses: book.chapters.reduce((n, c) => n + c.verses.length, 0),
    })
  }
  const todo = items.filter(i => i.action !== 'skip')
  return {
    items,
    create: items.filter(i => i.action === 'create').length,
    replace: items.filter(i => i.action === 'replace').length,
    skip: items.filter(i => i.action === 'skip').length,
    chapters: todo.reduce((n, i) => n + i.chapters, 0),
    verses: todo.reduce((n, i) => n + i.verses, 0),
  }
}

export async function existingChapters(db: BibleTx): Promise<Map<string, number>> {
  const rows = await db.bibleBook.findMany({ select: { slug: true, _count: { select: { chapters: true } } } })
  return new Map(rows.map(r => [r.slug, r._count.chapters]))
}

// ─── Scrierea ──────────────────────────────────────────────────────────────

/** Șterge o carte (versete → capitole → carte; cheile străine sunt RESTRICT). */
export async function deleteBook(tx: BibleTx, slug: string): Promise<void> {
  const book = await tx.bibleBook.findUnique({ where: { slug }, select: { id: true } })
  if (!book) return
  await tx.bibleVerse.deleteMany({ where: { chapter: { bookId: book.id } } })
  await tx.bibleChapter.deleteMany({ where: { bookId: book.id } })
  await tx.bibleBook.deleteMany({ where: { id: book.id } })
}

/** Scrie o carte întreagă în tranzacția primită; loturi de cel mult `batchSize` versete. */
export async function writeBook(tx: BibleTx, info: BibleBookInfo, book: ParsedBook, batchSize = BATCH_SIZE): Promise<{ chapters: number; verses: number }> {
  const { id: bookId } = await tx.bibleBook.create({
    data: { slug: info.slug, nameRo: info.labelRo, testament: info.testament, orderNum: info.orderNum },
    select: { id: true },
  })
  await tx.bibleChapter.createMany({ data: book.chapters.map(c => ({ bookId, chapterNum: c.n })) })
  const ids = new Map((await tx.bibleChapter.findMany({ where: { bookId }, select: { id: true, chapterNum: true } })).map(c => [c.chapterNum, c.id]))
  const rows = book.chapters.flatMap(c => c.verses.map(v => ({
    chapterId: ids.get(c.n)!,
    verseNum: v.n,
    textRo: v.text,
    textSearch: normalizeForSearch(v.text),
  })))
  if (rows.some(r => !r.chapterId)) throw new Error(`${info.slug}: capitolele create nu corespund`)
  let verses = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    verses += (await tx.bibleVerse.createMany({ data: rows.slice(i, i + batchSize) })).count
  }
  return { chapters: book.chapters.length, verses }
}

/** Numerele din baza de date = cele din JSON? */
export async function verifyBook(db: BibleTx, book: ParsedBook): Promise<string | null> {
  const [chapters, verses] = await Promise.all([
    db.bibleChapter.count({ where: { book: { slug: book.slug } } }),
    db.bibleVerse.count({ where: { chapter: { book: { slug: book.slug } } } }),
  ])
  const wantVerses = book.chapters.reduce((n, c) => n + c.verses.length, 0)
  if (chapters !== book.chapters.length || verses !== wantVerses) {
    return `${book.slug}: în baza de date ${chapters} capitole / ${verses} versete, în JSON ${book.chapters.length} / ${wantVerses}`
  }
  return null
}

export interface ApplyLog { (line: string): void }

/**
 * Aplică planul: fiecare carte în tranzacția ei (o eroare anulează doar cartea
 * respectivă și oprește importul). Întoarce erorile; lista goală = totul scris și verificat.
 */
export async function applyPlan(db: BibleDb, books: ParsedBook[], plan: ImportPlan, log: ApplyLog = () => {}, batchSize = BATCH_SIZE): Promise<string[]> {
  for (const item of plan.items) {
    if (item.action === 'skip') { log(`= ${item.slug}: are deja ${item.existing} capitole, omisă`); continue }
    const info = getBook(item.slug)!
    const book = books.find(b => b.slug === item.slug)!
    try {
      const r = await db.$transaction(async tx => {
        if (item.action === 'replace') await deleteBook(tx, item.slug)
        return writeBook(tx, info, book, batchSize)
      }, TX_OPTIONS)
      const bad = await verifyBook(db, book)
      if (bad) return [bad]
      log(`${item.action === 'replace' ? '↻' : '+'} ${item.slug}: ${r.chapters} capitole, ${r.verses} versete`)
    } catch (err) {
      return [`${item.slug}: ${err instanceof Error ? err.message : String(err)} — tranzacția cărții a fost anulată; importul s-a oprit`]
    }
  }
  return []
}

/** Șterge DOAR rândurile din cele trei tabele ale Bibliei. */
export async function wipeBible(db: BibleDb): Promise<{ books: number; chapters: number; verses: number }> {
  return db.$transaction(async tx => {
    const verses = (await tx.bibleVerse.deleteMany()).count
    const chapters = (await tx.bibleChapter.deleteMany()).count
    const books = (await tx.bibleBook.deleteMany()).count
    return { books, chapters, verses }
  }, TX_OPTIONS)
}
