import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const revalidatePath = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }))

interface Verse { id: string; textRo: string; textSearch: string; editedAt: Date | null }
interface Item {
  id: string; status: string; fragment: string; suggestion: string | null; detector: string; source: string
  verseId: string; bookSlug: string; chapterNum: number; verseNum: number; resolvedBy?: string; resolvedAt?: Date
}
interface Store { verses: Verse[]; items: Item[]; edits: Record<string, unknown>[]; settings: Map<string, string> }

const EDITED = new Date('2026-01-02T03:04:05.678Z')
const db = vi.hoisted(() => ({ prisma: {} as Record<string, unknown>, tx: {} as Record<string, unknown>, calls: [] as string[], failEdit: false, stealItem: false }))
vi.mock('@/lib/prisma', () => ({ prisma: db.prisma }))

let store: Store
const same = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null)

interface ItemWhere { id?: string | { in: string[] }; status?: string; source?: string; detector?: string; fragment?: { contains: string } }
function matches(i: Item, w: ItemWhere) {
  if (typeof w.id === 'string' && i.id !== w.id) return false
  if (typeof w.id === 'object' && !w.id.in.includes(i.id)) return false
  if (w.status && i.status !== w.status) return false
  if (w.source && i.source !== w.source) return false
  if (w.detector && i.detector !== w.detector) return false
  if (w.fragment && !i.fragment.includes(w.fragment.contains)) return false
  return true
}

function client(label: 'root' | 'tx') {
  const note = (name: string) => db.calls.push(`${label}:${name}`)
  return {
    bibleReviewItem: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const i = store.items.find(x => x.id === where.id)
        return i ? { ...i, verse: store.verses.find(v => v.id === i.verseId) } : null
      },
      findMany: async ({ where, take }: { where: ItemWhere; take: number }) => store.items.filter(i => matches(i, where)).slice(0, take).map(i => ({ id: i.id })),
      count: async ({ where }: { where: ItemWhere }) => store.items.filter(i => matches(i, where)).length,
      updateMany: async ({ where, data }: { where: ItemWhere; data: Partial<Item> }) => {
        note('item.updateMany')
        if (db.stealItem) return { count: 0 }
        const found = store.items.filter(i => matches(i, where))
        found.forEach(i => Object.assign(i, data))
        return { count: found.length }
      },
    },
    bibleVerse: {
      findUnique: async ({ where }: { where: { id: string } }) => store.verses.find(v => v.id === where.id) ?? null,
      updateMany: async ({ where, data }: { where: { id: string; editedAt: Date | null }; data: Partial<Verse> }) => {
        note('verse.updateMany')
        const v = store.verses.find(x => x.id === where.id && same(x.editedAt, where.editedAt))
        if (!v) return { count: 0 }
        Object.assign(v, data)
        return { count: 1 }
      },
    },
    bibleEdit: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        note('edit.create')
        if (db.failEdit) throw new Error('eroare de probă')
        store.edits.push(data)
      },
    },
    setting: {
      upsert: async ({ where, update }: { where: { key: string }; update: { value: string } }) => { note('setting.upsert'); store.settings.set(where.key, update.value) },
    },
  }
}
Object.assign(db.tx, client('tx'))
Object.assign(db.prisma, client('root'), {
  $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const snapshot: Store = { verses: store.verses.map(v => ({ ...v })), items: store.items.map(i => ({ ...i })), edits: [...store.edits], settings: new Map(store.settings) }
    db.calls.push('begin')
    try { return await fn(db.tx) } catch (e) { store = snapshot; throw e } finally { db.calls.push('end') }
  },
})

const { applyReviewItemAction, editReviewItemAction, ignoreAllAction, ignoreReviewItemAction, previewIgnoreAllAction } = await import('./actions')
const { READER_CACHE_VERSION_KEY } = await import('@/lib/bible/queries')

const item = (over: Partial<Item> = {}): Item => ({
  id: 'i1', status: 'PENDING', fragment: 'unu [[doi]] trei', suggestion: 'dou', detector: 'F', source: 'audit',
  verseId: 'v1', bookSlug: 'iona', chapterNum: 1, verseNum: 2, ...over,
})
const TX = ['begin', 'tx:verse.updateMany', 'tx:edit.create', 'tx:item.updateMany', 'tx:setting.upsert', 'end']

beforeEach(() => {
  auth.mockReset().mockResolvedValue({ user: { id: 'a', email: 'admin@exemplu.md', role: 'admin' } })
  revalidatePath.mockReset()
  db.calls.length = 0
  db.failEdit = false
  db.stealItem = false
  store = {
    verses: [{ id: 'v1', textRo: 'zero unu doi trei', textSearch: 'zero unu doi trei', editedAt: null }],
    items: [item()], edits: [], settings: new Map(),
  }
})

describe('Aplică propunerea', () => {
  it('verset + jurnal + element + cache, în aceeași tranzacție', async () => {
    const r = await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(r).toMatchObject({ ok: true })
    expect(db.calls).toEqual(TX)
    const v = store.verses[0]
    expect(v.textRo).toBe('zero unu dou trei')
    expect(v.textSearch).toBe('zero unu dou trei')
    expect(v.editedAt).toBeInstanceOf(Date)
    expect(store.edits).toEqual([{ verseId: 'v1', bookSlug: 'iona', chapterNum: 1, verseNum: 2, action: 'EDIT', oldText: 'zero unu doi trei', newText: 'zero unu dou trei', editor: 'admin@exemplu.md' }])
    expect(store.items[0]).toMatchObject({ status: 'APPLIED', resolvedBy: 'admin@exemplu.md' })
    expect(store.settings.has(READER_CACHE_VERSION_KEY)).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith('/biblie/iona/1')
  })
  it('normalizează rezultatul: sedila din propunere devine virgulă', async () => {
    store.items[0].suggestion = 'ş'
    await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(store.verses[0].textRo).toBe('zero unu ș trei')
    expect(store.verses[0].textSearch).toBe('zero unu s trei')
  })
  it('conflict de concurență: respins, nimic scris', async () => {
    store.verses[0].editedAt = EDITED
    const r = await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(r).toMatchObject({ ok: false, conflict: true })
    expect(store.verses[0].textRo).toBe('zero unu doi trei')
    expect(store.edits).toEqual([])
    expect(store.items[0].status).toBe('PENDING')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
  it('fragmentul a dispărut: elementul devine STALE, versetul rămâne', async () => {
    store.verses[0].textRo = 'alt text'
    const r = await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(r).toMatchObject({ ok: false, stale: true })
    expect(store.items[0].status).toBe('STALE')
    expect(store.edits).toEqual([])
  })
  it('fragmentul apare de mai multe ori: refuz, fără scriere', async () => {
    store.verses[0].textRo = 'unu doi trei, unu doi trei'
    const r = await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(r).toMatchObject({ ok: false })
    expect((r as { error: string }).error).toMatch(/de 2 ori/)
    expect(db.calls).toEqual(['begin', 'end'])
  })
  it('element fără propunere: refuz', async () => {
    store.items[0].suggestion = null
    expect((await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })).ok).toBe(false)
    expect(store.edits).toEqual([])
  })
  it('element deja rezolvat: refuz', async () => {
    store.items[0].status = 'IGNORED'
    expect((await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })).ok).toBe(false)
    expect(store.edits).toEqual([])
  })
  it('elementul rezolvat de altcineva în timpul scrierii: versetul se anulează', async () => {
    db.stealItem = true
    const r = await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })
    expect(r.ok).toBe(false)
    expect(store.verses[0].textRo).toBe('zero unu doi trei')
    expect(store.edits).toEqual([])
  })
  it('dacă jurnalul eșuează, nimic nu rămâne și textul nu ajunge în log', async () => {
    db.failEdit = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })).ok).toBe(false)
    expect(store.verses[0].textRo).toBe('zero unu doi trei')
    expect(store.items[0].status).toBe('PENDING')
    expect(JSON.stringify(spy.mock.calls)).not.toContain('dou')
    spy.mockRestore()
  })
  it('rezultat nevalid: refuz', async () => {
    store.items[0].suggestion = '�'
    expect((await applyReviewItemAction({ itemId: 'i1', seenEditedAt: null, option: 0 })).ok).toBe(false)
    expect(store.edits).toEqual([])
  })
})

describe('Editează', () => {
  it('verset + jurnal + element + cache, în aceeași tranzacție; normalizat', async () => {
    const r = await editReviewItemAction({ itemId: 'i1', seenEditedAt: null, text: ' text  nou ş ' })
    expect(r).toMatchObject({ ok: true })
    expect(db.calls).toEqual(TX)
    expect(store.verses[0].textRo).toBe('text nou ș')
    expect(store.verses[0].textSearch).toBe('text nou s')
    expect(store.edits[0]).toMatchObject({ action: 'EDIT', newText: 'text nou ș' })
    expect(store.items[0].status).toBe('EDITED')
    expect(revalidatePath).toHaveBeenCalledWith('/biblie/iona/1')
  })
  it('conflict de concurență: respins', async () => {
    store.verses[0].editedAt = EDITED
    const r = await editReviewItemAction({ itemId: 'i1', seenEditedAt: '2020-01-01T00:00:00.000Z', text: 'text nou' })
    expect(r).toMatchObject({ ok: false, conflict: true })
    expect(store.verses[0].textRo).toBe('zero unu doi trei')
    expect(store.items[0].status).toBe('PENDING')
  })
  it('funcționează și la raportările de cititor', async () => {
    store.items[0] = item({ source: 'cititor', detector: 'R', fragment: '', suggestion: null })
    expect((await editReviewItemAction({ itemId: 'i1', seenEditedAt: null, text: 'text nou' })).ok).toBe(true)
    expect(store.items[0].status).toBe('EDITED')
  })
  it('text neschimbat sau gol: refuz', async () => {
    expect((await editReviewItemAction({ itemId: 'i1', seenEditedAt: null, text: 'zero unu doi trei' })).ok).toBe(false)
    expect((await editReviewItemAction({ itemId: 'i1', seenEditedAt: null, text: '   ' })).ok).toBe(false)
    expect(store.edits).toEqual([])
  })
})

describe('Ignoră', () => {
  it('atinge doar elementul', async () => {
    expect((await ignoreReviewItemAction({ itemId: 'i1' })).ok).toBe(true)
    expect(store.items[0]).toMatchObject({ status: 'IGNORED', resolvedBy: 'admin@exemplu.md' })
    expect(db.calls).toEqual(['root:item.updateMany'])
    expect(revalidatePath).not.toHaveBeenCalled()
  })
  it('deja rezolvat: refuz', async () => {
    store.items[0].status = 'APPLIED'
    expect((await ignoreReviewItemAction({ itemId: 'i1' })).ok).toBe(false)
    expect(store.items[0].status).toBe('APPLIED')
  })
})

describe('Ignoră toate', () => {
  const many = (n: number) => Array.from({ length: n }, (_, i) => item({ id: `m${i}`, fragment: `alt ${i} [[Numele]] sus` }))

  it('numără aceeași țintă, același detector, doar audit și doar în așteptare', async () => {
    store.items = [
      ...many(3),
      item({ id: 'alta', fragment: 'alt [[Altul]] sus' }),
      item({ id: 'det', fragment: 'x [[Numele]] y', detector: 'D' }),
      item({ id: 'gata', fragment: 'x [[Numele]] z', status: 'IGNORED' }),
    ]
    expect(await previewIgnoreAllAction({ itemId: 'm0' })).toEqual({ ok: true, total: 3, now: 3, remaining: 0, target: 'Numele' })
  })
  it('limitat la 500 pe operație, restul rămân', async () => {
    store.items = many(502)
    expect(await previewIgnoreAllAction({ itemId: 'm0' })).toMatchObject({ total: 502, now: 500, remaining: 2 })
    expect(await ignoreAllAction({ itemId: 'm0', confirmed: true })).toEqual({ ok: true, ignored: 500, remaining: 2 })
    expect(store.items.filter(i => i.status === 'IGNORED')).toHaveLength(500)
  })
  it('fără confirmare: nimic', async () => {
    store.items = many(2)
    expect((await ignoreAllAction({ itemId: 'm0', confirmed: false })).ok).toBe(false)
    expect(store.items.every(i => i.status === 'PENDING')).toBe(true)
  })
  it('raportare de cititor: refuz', async () => {
    store.items = [item({ fragment: '', source: 'cititor', detector: 'R' })]
    expect((await previewIgnoreAllAction({ itemId: 'i1' })).ok).toBe(false)
    expect((await ignoreAllAction({ itemId: 'i1', confirmed: true })).ok).toBe(false)
  })
  it('caracterele speciale din țintă se escapează', async () => {
    store.items = [item({ fragment: 'a [[50%_x]] b' })]
    expect(await previewIgnoreAllAction({ itemId: 'i1' })).toMatchObject({ ok: true, target: '50%_x' })
    // clientul fals caută literal, deci forma scăpată nu găsește nimic: dovada că se escapează
    expect(await previewIgnoreAllAction({ itemId: 'i1' })).toMatchObject({ total: 0 })
  })
})
