import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ headers: new Map<string, string>() }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: (k: string) => h.headers.get(k) ?? null }) }))

// Fără sesiune: dacă formularul public ar cere autentificare, testul ar cădea aici.
vi.mock('@/auth', () => ({ auth: () => { throw new Error('formularul public nu verifică sesiunea') } }))

interface Throttle { keyHash: string; createdAt: Date }
const db = vi.hoisted(() => ({
  prisma: {} as Record<string, unknown>,
  throttles: [] as Throttle[],
  items: [] as Record<string, unknown>[],
  verseExists: true,
  fail: null as Error | null,
  transactions: 0,
}))
vi.mock('../prisma', () => ({ prisma: db.prisma }))

const client = {
  bibleReportThrottle: {
    count: async ({ where }: { where: { keyHash: string; createdAt: { gte: Date } } }) =>
      db.throttles.filter(t => t.keyHash === where.keyHash && t.createdAt >= where.createdAt.gte).length,
    create: async ({ data }: { data: { keyHash: string } }) => { db.throttles.push({ keyHash: data.keyHash, createdAt: new Date() }) },
    deleteMany: async ({ where }: { where: { createdAt: { lt: Date } } }) => {
      db.throttles = db.throttles.filter(t => t.createdAt >= where.createdAt.lt)
      return { count: 0 }
    },
  },
  bibleVerse: { findFirst: async () => (db.verseExists ? { id: 'v1' } : null) },
  bibleReviewItem: { create: async ({ data }: { data: Record<string, unknown> }) => { db.items.push(data) } },
}
Object.assign(db.prisma, client, {
  $transaction: async (fn: (tx: typeof client) => Promise<unknown>) => {
    db.transactions++
    if (db.fail) throw db.fail
    return fn(client)
  },
})

const { submitVerseReport } = await import('./reportAction')

const input = (over: Record<string, unknown> = {}) => ({ slug: 'iona', chapter: 1, verse: 2, message: 'lipsește un cuvânt', website: '', ...over })

beforeEach(() => {
  db.throttles = []
  db.items = []
  db.verseExists = true
  db.fail = null
  db.transactions = 0
  h.headers = new Map([['x-forwarded-for', '203.0.113.7'], ['user-agent', 'Navigator de probă']])
  vi.stubEnv('AUTH_SECRET', 'sare-de-proba')
})

describe('submitVerseReport', () => {
  it('fără sesiune: creează elementul ca cititor', async () => {
    expect(await submitVerseReport(input())).toEqual({ ok: true })
    expect(db.items).toEqual([{
      verseId: 'v1', bookSlug: 'iona', chapterNum: 1, verseNum: 2,
      detector: 'R', fragment: '', confidence: 'cititor', source: 'cititor', message: 'lipsește un cuvânt',
    }])
  })
  it('mesajul e opțional', async () => {
    expect(await submitVerseReport(input({ message: '' }))).toEqual({ ok: true })
    expect(db.items[0].message).toBeNull()
  })
  it('a 11-a raportare într-o oră e respinsă', async () => {
    for (let i = 0; i < 10; i++) expect(await submitVerseReport(input())).toEqual({ ok: true })
    expect(await submitVerseReport(input())).toEqual({ ok: false, code: 'limit' })
    expect(db.items).toHaveLength(10)
  })
  it('după o oră limita se reia', async () => {
    for (let i = 0; i < 10; i++) await submitVerseReport(input())
    db.throttles.forEach(t => { t.createdAt = new Date(Date.now() - 61 * 60 * 1000) })
    expect(await submitVerseReport(input())).toEqual({ ok: true })
  })
  it('alt vizitator are limita lui', async () => {
    for (let i = 0; i < 10; i++) await submitVerseReport(input())
    h.headers.set('x-forwarded-for', '203.0.113.9')
    expect(await submitVerseReport(input())).toEqual({ ok: true })
  })
  it('o adresă inventată în fața listei nu ocolește limita', async () => {
    for (let i = 0; i < 10; i++) {
      h.headers.set('x-forwarded-for', `10.0.0.${i}, 203.0.113.7`)
      await submitVerseReport(input())
    }
    h.headers.set('x-forwarded-for', '10.0.0.99, 203.0.113.7')
    expect(await submitVerseReport(input())).toEqual({ ok: false, code: 'limit' })
  })
  it('intrările mai vechi de 24 h se șterg', async () => {
    db.throttles.push({ keyHash: 'vechi', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) })
    await submitVerseReport(input())
    expect(db.throttles.some(t => t.keyHash === 'vechi')).toBe(false)
  })
  it('nu păstrează adresa în clar', async () => {
    await submitVerseReport(input())
    expect(db.throttles[0].keyHash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify([db.throttles, db.items])).not.toContain('203.0.113.7')
  })
  it('capcana: răspuns identic, nimic scris, fără bază', async () => {
    expect(await submitVerseReport(input({ website: 'http://robot.test' }))).toEqual({ ok: true })
    expect(db.items).toEqual([])
    expect(db.transactions).toBe(0)
  })
  it.each([
    ['carte necunoscută', { slug: 'inventata' }, 'invalid'],
    ['capitol nevalid', { chapter: -1 }, 'invalid'],
    ['verset de alt tip', { verse: 'unu' }, 'invalid'],
    ['mesaj lung', { message: 'a'.repeat(301) }, 'too-long'],
    ['adresă web', { message: 'vezi http://exemplu.test' }, 'url'],
  ])('%s: respins fără scriere', async (_n, over, code) => {
    expect(await submitVerseReport(input(over))).toEqual({ ok: false, code })
    expect(db.items).toEqual([])
  })
  it('verset inexistent: respins și neconsumat din limită', async () => {
    db.verseExists = false
    expect(await submitVerseReport(input())).toEqual({ ok: false, code: 'invalid' })
    expect(db.throttles).toEqual([])
  })
  it('tabele lipsă: mesaj prietenos, fără excepție și fără conținut în log', async () => {
    db.fail = new Error('P2021 tabelul lipsește: lipsește un cuvânt')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await submitVerseReport(input())).toEqual({ ok: false, code: 'unavailable' })
    expect(JSON.stringify(spy.mock.calls)).not.toContain('cuvânt')
    spy.mockRestore()
  })
  it('fără sare: nu scrie', async () => {
    vi.stubEnv('AUTH_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')
    expect(await submitVerseReport(input())).toEqual({ ok: false, code: 'unavailable' })
    expect(db.transactions).toBe(0)
  })
})
