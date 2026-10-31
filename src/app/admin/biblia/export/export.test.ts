import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const findMany = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { bibleVerse: { findMany: (...a: unknown[]) => findMany(...a) } } }))

const { GET: getBook } = await import('./[carte]/route')
const { GET: getAll } = await import('./toate/route')

const row = (slug: string, chapterNum: number, verseNum: number, textRo: string) => ({ verseNum, textRo, chapter: { chapterNum, book: { slug } } })
const book = (carte: string) => getBook(new Request('http://localhost/x'), { params: Promise.resolve({ carte }) })

beforeEach(() => {
  auth.mockReset().mockResolvedValue({ user: { email: 'a@exemplu.md', role: 'admin' } })
  findMany.mockReset()
})

describe('export', () => {
  it('o carte: formatul proiectului, descărcare, no-store', async () => {
    findMany.mockResolvedValue([row('iona', 1, 2, 'doi'), row('iona', 1, 1, 'unu')])
    const res = await book('iona')
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="iona.json"')
    expect(await res.json()).toEqual({ slug: 'iona', chapters: [{ n: 1, verses: [{ n: 1, text: 'unu' }, { n: 2, text: 'doi' }] }] })
  })
  it('carte necunoscută sau neimportată → 404', async () => {
    expect((await book('nu-exista')).status).toBe(404)
    expect(findMany).not.toHaveBeenCalled()
    findMany.mockResolvedValue([])
    expect((await book('iona')).status).toBe(404)
  })
  it('toate: cărțile în ordine canonică; numele fișierului e ignorat de importator', async () => {
    findMany.mockResolvedValue([row('iuda', 1, 1, 'b'), row('iona', 1, 1, 'a')])
    const res = await getAll()
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('content-disposition')).toContain('_biblia-toate.json')
    expect((await res.json()).map((b: { slug: string }) => b.slug)).toEqual(['iona', 'iuda'])
  })
})
