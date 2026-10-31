import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const revalidatePath = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }))

interface Verse { id: string; chapterId: string; verseNum: number; textRo: string; textSearch: string; reviewed: boolean; editedAt: Date | null }
interface Store { verses: Verse[]; edits: Record<string, unknown>[]; settings: Map<string, string> }

const EDITED = new Date('2026-01-02T03:04:05.678Z')
const db = vi.hoisted(() => ({ prisma: {} as Record<string, unknown>, tx: {} as Record<string, unknown>, calls: [] as string[], failEditCreate: false }))
vi.mock('@/lib/prisma', () => ({ prisma: db.prisma }))

let store: Store
const chapters = [{ id: 'c1', chapterNum: 1, slug: 'iona' }, { id: 'c2', chapterNum: 2, slug: 'iona' }]
const shape = (v: Verse) => {
  const ch = chapters.find(c => c.id === v.chapterId)!
  return { ...v, chapter: { chapterNum: ch.chapterNum, book: { slug: ch.slug } } }
}
const sameInstant = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null)

function client(label: 'root' | 'tx') {
  const note = (name: string) => db.calls.push(`${label}:${name}`)
  return {
    bibleChapter: {
      findFirst: async ({ where }: { where: { chapterNum: number } }) => chapters.find(c => c.chapterNum === where.chapterNum) ?? null,
    },
    bibleVerse: {
      findUnique: async ({ where }: { where: { id?: string; chapterId_verseNum?: { chapterId: string; verseNum: number } } }) => {
        const k = where.chapterId_verseNum
        const v = store.verses.find(x => (k ? x.chapterId === k.chapterId && x.verseNum === k.verseNum : x.id === where.id))
        return v ? shape(v) : null
      },
      findMany: async ({ where }: { where: { textRo: { contains: string } } }) => store.verses.filter(v => v.textRo.includes(where.textRo.contains)).map(shape),
      updateMany: async ({ where, data }: { where: { id: string; editedAt: Date | null }; data: Partial<Verse> }) => {
        note('verse.updateMany')
        const v = store.verses.find(x => x.id === where.id && sameInstant(x.editedAt, where.editedAt))
        if (!v) return { count: 0 }
        Object.assign(v, data)
        return { count: 1 }
      },
      create: async ({ data }: { data: Omit<Verse, 'id' | 'reviewed'> }) => {
        note('verse.create')
        const v = { id: `n${data.verseNum}`, reviewed: false, ...data }
        store.verses.push(v)
        return { id: v.id }
      },
    },
    bibleEdit: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        note('edit.create')
        if (db.failEditCreate) throw new Error('eroare de probă')
        store.edits.push(data)
      },
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => { note('edit.createMany'); store.edits.push(...data) },
    },
    setting: {
      upsert: async ({ where, update }: { where: { key: string }; update: { value: string } }) => { note('setting.upsert'); store.settings.set(where.key, update.value) },
    },
  }
}

Object.assign(db.tx, client('tx'))
Object.assign(db.prisma, client('root'), {
  // la eroare, scrierile se anulează, ca într-o tranzacție reală
  $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const snapshot: Store = { verses: store.verses.map(v => ({ ...v })), edits: [...store.edits], settings: new Map(store.settings) }
    db.calls.push('begin')
    try { return await fn(db.tx) } catch (e) { store = snapshot; throw e } finally { db.calls.push('end') }
  },
})

const { applyReplaceAction, createVerseAction, previewReplaceAction, saveVerseAction, setVerseReviewedAction } = await import('./actions')
const { READER_CACHE_VERSION_KEY } = await import('@/lib/bible/queries')

const verse = (id: string, verseNum: number, textRo: string, editedAt: Date | null = null, chapterId = 'c1'): Verse =>
  ({ id, chapterId, verseNum, textRo, textSearch: textRo, reviewed: false, editedAt })
const writes = () => db.calls.filter(c => c !== 'begin' && c !== 'end')

beforeEach(() => {
  auth.mockReset().mockResolvedValue({ user: { id: 'a', email: 'admin@exemplu.md', role: 'admin' } })
  revalidatePath.mockReset()
  db.calls.length = 0
  db.failEditCreate = false
  store = { verses: [verse('v1', 1, 'fraza inventată unu'), verse('v2', 2, 'fraza inventată doi', EDITED)], edits: [], settings: new Map() }
})

describe('saveVerseAction', () => {
  it('reușită: verset + jurnal + versiunea cache-ului, toate în aceeași tranzacție', async () => {
    const r = await saveVerseAction({ verseId: 'v1', text: 'fraza nouă ş  unu', seenEditedAt: null })
    expect(r).toMatchObject({ ok: true, status: 'saved', text: 'fraza nouă ș unu' })
    expect(db.calls).toEqual(['begin', 'tx:verse.updateMany', 'tx:edit.create', 'tx:setting.upsert', 'end'])
    const v = store.verses[0]
    expect(v.textRo).toBe('fraza nouă ș unu')
    expect(v.textSearch).toBe('fraza noua s unu')
    expect(v.textSearch.length).toBe(v.textRo.length)
    expect(v.editedAt).toBeInstanceOf(Date)
    expect(store.edits).toEqual([{ verseId: 'v1', bookSlug: 'iona', chapterNum: 1, verseNum: 1, action: 'EDIT', oldText: 'fraza inventată unu', newText: 'fraza nouă ș unu', editor: 'admin@exemplu.md' }])
    expect(store.settings.has(READER_CACHE_VERSION_KEY)).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith('/biblie/iona/1')
  })

  it('dacă jurnalul eșuează, versetul rămâne neschimbat', async () => {
    db.failEditCreate = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await saveVerseAction({ verseId: 'v1', text: 'fraza secretă nouă', seenEditedAt: null })
    expect(r.ok).toBe(false)
    expect(store.verses[0].textRo).toBe('fraza inventată unu')
    expect(store.verses[0].editedAt).toBeNull()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secretă')
    spy.mockRestore()
  })

  it('text neschimbat (după normalizare): nu scrie nimic', async () => {
    const r = await saveVerseAction({ verseId: 'v1', text: '  fraza   inventată unu ', seenEditedAt: '2020-01-01T00:00:00.000Z' })
    expect(r).toMatchObject({ ok: true, status: 'unchanged' })
    expect(writes()).toEqual([])
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('conflict: alt editedAt → respins, cu versiunea actuală, fără jurnal', async () => {
    const r = await saveVerseAction({ verseId: 'v2', text: 'altceva', seenEditedAt: null })
    expect(r).toEqual({ ok: false, error: 'Versetul a fost modificat de altcineva.', conflict: { text: 'fraza inventată doi', editedAt: EDITED.toISOString() } })
    expect(store.edits).toEqual([])
    expect(store.settings.size).toBe(0)
    expect(store.verses[1].textRo).toBe('fraza inventată doi')
  })

  it('conflict: două salvări din aceeași versiune, doar prima trece', async () => {
    const [a, b] = await Promise.all([
      saveVerseAction({ verseId: 'v1', text: 'prima variantă', seenEditedAt: null }),
      saveVerseAction({ verseId: 'v1', text: 'a doua variantă', seenEditedAt: null }),
    ])
    expect([a.ok, b.ok].sort()).toEqual([false, true])
    expect(store.edits).toHaveLength(1)
  })

  it('cu editedAt-ul corect trece', async () => {
    expect((await saveVerseAction({ verseId: 'v2', text: 'altceva', seenEditedAt: EDITED.toISOString() })).ok).toBe(true)
  })

  it.each([['gol', '   '], ['control', 'a\u0007b'], ['prea lung', 'a'.repeat(5001)], ['înlocuire', 'a�b']])('respinge pe server: %s', async (_n, text) => {
    expect((await saveVerseAction({ verseId: 'v1', text, seenEditedAt: null })).ok).toBe(false)
    expect(db.calls).toEqual([])
  })

  it('date malformate și verset inexistent', async () => {
    expect((await saveVerseAction({ verseId: 'v1', text: 5, seenEditedAt: null })).ok).toBe(false)
    expect((await saveVerseAction({ verseId: 'v1', text: 'x y', seenEditedAt: 'nu e dată' })).ok).toBe(false)
    expect(await saveVerseAction({ verseId: 'nu', text: 'x y', seenEditedAt: null })).toMatchObject({ ok: false, error: 'Versetul nu mai există.' })
  })
})

describe('setVerseReviewedAction', () => {
  it('schimbă doar bifa: fără editedAt, jurnal sau cache', async () => {
    expect(await setVerseReviewedAction({ verseId: 'v1', reviewed: true, seenEditedAt: null })).toEqual({ ok: true })
    expect(store.verses[0].reviewed).toBe(true)
    expect(store.verses[0].editedAt).toBeNull()
    expect(store.edits).toEqual([])
    expect(revalidatePath).not.toHaveBeenCalled()
  })
  it('respinsă dacă textul s-a schimbat între timp', async () => {
    expect(await setVerseReviewedAction({ verseId: 'v2', reviewed: true, seenEditedAt: null })).toMatchObject({ ok: false, error: 'Versetul a fost modificat de altcineva.' })
    expect(store.verses[1].reviewed).toBe(false)
  })
})

describe('createVerseAction', () => {
  it('creează versetul lipsă, cu jurnal CREATE, în tranzacție', async () => {
    expect(await createVerseAction({ slug: 'iona', chapter: 1, verseNum: 3, text: 'versetul nou ţ' })).toEqual({ ok: true })
    expect(db.calls).toEqual(['begin', 'tx:verse.create', 'tx:edit.create', 'tx:setting.upsert', 'end'])
    expect(store.verses.at(-1)).toMatchObject({ verseNum: 3, textRo: 'versetul nou ț', textSearch: 'versetul nou t' })
    expect(store.edits[0]).toMatchObject({ action: 'CREATE', oldText: null, verseNum: 3 })
    expect(revalidatePath).toHaveBeenCalledWith('/biblie/iona/1')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/biblia/iona/1')
  })
  it('respinge duplicatul', async () => {
    expect(await createVerseAction({ slug: 'iona', chapter: 1, verseNum: 2, text: 'dublură' })).toEqual({ ok: false, error: 'Versetul 2 există deja în acest capitol.' })
    expect(store.edits).toEqual([])
  })
  it.each([[0], [-3], [1.5]])('respinge numărul %s', async n => {
    expect((await createVerseAction({ slug: 'iona', chapter: 1, verseNum: n, text: 'text' })).ok).toBe(false)
    expect(db.calls).toEqual([])
  })
  it('carte sau capitol inexistent; text gol', async () => {
    expect((await createVerseAction({ slug: 'nu-exista', chapter: 1, verseNum: 9, text: 'text' })).ok).toBe(false)
    expect(await createVerseAction({ slug: 'iona', chapter: 99, verseNum: 9, text: 'text' })).toEqual({ ok: false, error: 'Capitolul nu există.' })
    expect((await createVerseAction({ slug: 'iona', chapter: 1, verseNum: 9, text: ' ' })).ok).toBe(false)
  })
})

describe('găsește și înlocuiește', () => {
  const op = { slug: 'iona', find: 'inventată', replace: 'scrisă', wholeWord: true }
  const preview = async () => {
    const r = await previewReplaceAction(op)
    if (!r.ok) throw new Error(r.error)
    return r
  }

  it('previzualizarea nu scrie nimic', async () => {
    const r = await preview()
    expect(r).toMatchObject({ total: 2, applicable: 2 })
    expect(r.samples).toHaveLength(2)
    expect(writes()).toEqual([])
  })

  it('fără confirmare explicită sau fără previzualizare: nimic', async () => {
    const { token } = await preview()
    expect(await applyReplaceAction({ ...op, token, confirmed: false })).toEqual({ ok: false, error: 'Lipsește confirmarea.' })
    expect((await applyReplaceAction({ ...op, confirmed: true })).ok).toBe(false)
    expect((await applyReplaceAction({ ...op, token: '0'.repeat(64), confirmed: true })).ok).toBe(false)
    expect(writes()).toEqual([])
  })

  it('aplică: fiecare verset + jurnal BULK, într-o singură tranzacție', async () => {
    const { token } = await preview()
    db.calls.length = 0
    expect(await applyReplaceAction({ ...op, token, confirmed: true })).toEqual({ ok: true, changed: 2, remaining: 0 })
    expect(db.calls).toEqual(['begin', 'tx:verse.updateMany', 'tx:verse.updateMany', 'tx:edit.createMany', 'tx:setting.upsert', 'end'])
    expect(store.verses.map(v => v.textRo)).toEqual(['fraza scrisă unu', 'fraza scrisă doi'])
    expect(store.verses[0].textSearch).toBe('fraza scrisa unu')
    expect(store.edits.map(e => e.action)).toEqual(['BULK', 'BULK'])
    expect(store.edits[1]).toMatchObject({ oldText: 'fraza inventată doi', newText: 'fraza scrisă doi', editor: 'admin@exemplu.md' })
    expect(revalidatePath).toHaveBeenCalledWith('/biblie/iona/1')
  })

  it('un verset schimbat după previzualizare → nimic nu se scrie', async () => {
    const { token } = await preview()
    store.verses[1].textRo = 'fraza inventată altfel'
    db.calls.length = 0
    const r = await applyReplaceAction({ ...op, token, confirmed: true })
    expect(r).toMatchObject({ ok: false })
    expect(writes()).toEqual([])
    expect(store.verses[0].textRo).toBe('fraza inventată unu')
  })

  it('limita: maximum 500 pe operație, restul rămân raportate', async () => {
    store.verses = Array.from({ length: 530 }, (_, i) => verse(`b${i}`, i + 1, `fraza inventată ${i}`))
    const { token, total, applicable } = await preview()
    expect([total, applicable]).toEqual([530, 500])
    expect(await applyReplaceAction({ ...op, token, confirmed: true })).toEqual({ ok: true, changed: 500, remaining: 30 })
    expect(store.edits).toHaveLength(500)
    expect(store.verses.filter(v => v.textRo.includes('inventată'))).toHaveLength(30)
  })

  it('invalidează toate capitolele atinse', async () => {
    store.verses.push(verse('v3', 1, 'fraza inventată trei', null, 'c2'))
    const { token } = await preview()
    await applyReplaceAction({ ...op, token, confirmed: true })
    expect(revalidatePath.mock.calls.map(c => c[0]).sort()).toEqual(['/biblie/iona/1', '/biblie/iona/2'])
  })
})
