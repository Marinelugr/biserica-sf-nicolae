import { describe, it, expect } from 'vitest'
import { applyPlan, checkWriteAllowed, existingChapters, hostOf, isLocalHost, planImport, wipeBible, type BibleDb, type BibleTx } from './importer'
import { syntheticBible } from './synthetic'
import { normalizeForSearch } from './search'

interface Store {
  books: { id: string; slug: string; nameRo: string; testament: string; orderNum: number }[]
  chapters: { id: string; bookId: string; chapterNum: number }[]
  verses: { id: string; chapterId: string; verseNum: number; textRo: string; textSearch: string }[]
}

/** Client fals: aceeași formă ca Prisma pentru ce folosește importatorul; tranzacția se anulează la eroare. */
function fakeDb(opts: { failOnVerseBatch?: number } = {}) {
  let store: Store = { books: [], chapters: [], verses: [] }
  let seq = 0
  const writes = { count: 0 }
  const batches: number[] = []
  const bookOf = (chapterId: string) => store.chapters.find(c => c.id === chapterId)?.bookId
  const slugOf = (bookId?: string) => store.books.find(b => b.id === bookId)?.slug
  const tx: BibleTx = {
    bibleBook: {
      findUnique: async ({ where }) => store.books.find(b => b.slug === where.slug) ? { id: store.books.find(b => b.slug === where.slug)!.id } : null,
      findMany: async () => store.books.map(b => ({ slug: b.slug, _count: { chapters: store.chapters.filter(c => c.bookId === b.id).length } })),
      create: async ({ data }) => {
        writes.count++
        if (store.books.some(b => b.slug === data.slug)) throw new Error('slug unic')
        const id = `b${++seq}`; store.books.push({ id, ...data }); return { id }
      },
      deleteMany: async (a) => { writes.count++; const before = store.books.length; store.books = a?.where?.id ? store.books.filter(b => b.id !== a.where!.id) : []; return { count: before - store.books.length } },
    },
    bibleChapter: {
      createMany: async ({ data }) => { writes.count++; for (const d of data) store.chapters.push({ id: `c${++seq}`, ...d }); return { count: data.length } },
      findMany: async ({ where }) => store.chapters.filter(c => c.bookId === where.bookId).map(c => ({ id: c.id, chapterNum: c.chapterNum })),
      deleteMany: async (a) => { writes.count++; const before = store.chapters.length; store.chapters = a?.where?.bookId ? store.chapters.filter(c => c.bookId !== a.where!.bookId) : []; return { count: before - store.chapters.length } },
      count: async ({ where }) => store.chapters.filter(c => slugOf(c.bookId) === where.book.slug).length,
    },
    bibleVerse: {
      createMany: async ({ data }) => {
        writes.count++
        batches.push(data.length)
        if (opts.failOnVerseBatch && batches.length === opts.failOnVerseBatch) throw new Error('eroare de probă')
        for (const d of data) store.verses.push({ id: `v${++seq}`, ...d })
        return { count: data.length }
      },
      deleteMany: async (a) => { writes.count++; const before = store.verses.length; store.verses = a?.where?.chapter ? store.verses.filter(v => bookOf(v.chapterId) !== a.where!.chapter!.bookId) : []; return { count: before - store.verses.length } },
      count: async ({ where }) => store.verses.filter(v => slugOf(bookOf(v.chapterId)) === where.chapter.book.slug).length,
    },
  }
  const db: BibleDb = {
    ...tx,
    async $transaction(fn) {
      const snapshot = JSON.parse(JSON.stringify(store)) as Store
      try { return await fn(tx) } catch (e) { store = snapshot; throw e }
    },
  }
  return { db, store: () => store, writes, batches }
}

const books = syntheticBible((slug, ch) => (slug === 'psalmi' && ch === 119 ? 176 : 2)).filter(b => ['iona', 'psalmi', 'iuda'].includes(b.slug))

describe('garda de gazdă', () => {
  it('doar numele gazdei, fără parolă', () => {
    expect(hostOf('postgresql://user:parola-secreta@db.exemplu.md:5432/postgres')).toBe('db.exemplu.md')
    expect(hostOf('postgresql://u:p@[::1]:5432/x')).toBe('::1')
    expect(hostOf('nu e url')).toBe('(URL invalid)')
  })
  it('local permis; la distanță doar cu --allow-remote și --yes-host exact', () => {
    for (const h of ['localhost', '127.0.0.1', '::1']) { expect(isLocalHost(h)).toBe(true); expect(checkWriteAllowed(h, {}).ok).toBe(true) }
    const remote = 'aws-0-eu-west-1.pooler.exemplu.com'
    expect(checkWriteAllowed(remote, {}).ok).toBe(false)
    expect(checkWriteAllowed(remote, { allowRemote: true }).ok).toBe(false)
    expect(checkWriteAllowed(remote, { allowRemote: true, yesHost: 'alta.gazda.com' }).ok).toBe(false)
    expect(checkWriteAllowed(remote, { yesHost: remote }).ok).toBe(false)
    expect(checkWriteAllowed(remote, { allowRemote: true, yesHost: remote }).ok).toBe(true)
    expect(checkWriteAllowed('localhost.exemplu.com', {}).ok).toBe(false)
  })
})

describe('plan și aplicare', () => {
  it('planul nu scrie nimic', async () => {
    const f = fakeDb()
    const plan = planImport(books, await existingChapters(f.db))
    expect(plan.items.map(i => i.action)).toEqual(['create', 'create', 'create'])
    expect(plan.verses).toBe(books.reduce((n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0), 0))
    expect(f.writes.count).toBe(0)
  })

  it('scrie, verifică, apoi omite cărțile existente (idempotent)', async () => {
    const f = fakeDb()
    expect(await applyPlan(f.db, books, planImport(books, new Map()))).toEqual([])
    const s = f.store()
    expect(s.books.map(b => b.slug).sort()).toEqual(['iona', 'iuda', 'psalmi'])
    expect(s.chapters.filter(c => c.bookId === s.books.find(b => b.slug === 'psalmi')!.id)).toHaveLength(151)
    expect(s.verses.every(v => v.textSearch === normalizeForSearch(v.textRo))).toBe(true)
    const again = planImport(books, await existingChapters(f.db))
    expect(again.items.every(i => i.action === 'skip')).toBe(true)
    const w = f.writes.count
    expect(await applyPlan(f.db, books, again)).toEqual([])
    expect(f.writes.count).toBe(w)
  })

  it('loturi de cel mult batchSize versete', async () => {
    const f = fakeDb()
    const ps = books.filter(b => b.slug === 'psalmi')
    await applyPlan(f.db, ps, planImport(ps, new Map()), undefined, 100)
    expect(Math.max(...f.batches)).toBeLessThanOrEqual(100)
    expect(f.batches.reduce((a, b) => a + b, 0)).toBe(150 * 2 + 176)
  })

  it('--only și --replace-book', async () => {
    const f = fakeDb()
    await applyPlan(f.db, books, planImport(books, new Map(), { only: ['iona'] }))
    expect(f.store().books.map(b => b.slug)).toEqual(['iona'])
    const changed = books.map(b => b.slug === 'iona' ? { ...b, chapters: b.chapters.slice(0, 2) } : b)
    const plan = planImport(changed, await existingChapters(f.db), { replaceBook: 'iona' })
    expect(plan.items.find(i => i.slug === 'iona')?.action).toBe('replace')
    expect(await applyPlan(f.db, changed, { ...plan, items: plan.items.filter(i => i.slug === 'iona') })).toEqual([])
    expect(f.store().chapters).toHaveLength(2)
    expect(f.store().books).toHaveLength(1)
  })

  it('la eroare tranzacția cărții se anulează și importul se oprește', async () => {
    const f = fakeDb({ failOnVerseBatch: 2 })
    const errors = await applyPlan(f.db, books, planImport(books, new Map()), undefined, 100)
    expect(errors[0]).toMatch(/psalmi: eroare de probă — tranzacția cărții a fost anulată/)
    // psalmi (nr. 22) e prima carte din plan: anulată, iar importul nu a continuat cu iona și iuda
    expect(f.store()).toEqual({ books: [], chapters: [], verses: [] })
  })

  it('wipe șterge doar cele 3 tabele, în ordinea versete → capitole → cărți', async () => {
    const f = fakeDb()
    await applyPlan(f.db, books, planImport(books, new Map()))
    const r = await wipeBible(f.db)
    expect(r.books).toBe(3)
    expect(f.store()).toEqual({ books: [], chapters: [], verses: [] })
  })
})
