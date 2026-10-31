import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const article = vi.fn()
const book = vi.fn()
const saint = vi.fn()
const chapter = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    article: { findMany: (...a: unknown[]) => article(...a) },
    libraryBook: { findMany: (...a: unknown[]) => book(...a) },
    saint: { findMany: (...a: unknown[]) => saint(...a) },
    bibleChapter: { findMany: (...a: unknown[]) => chapter(...a) },
  },
}))

const HOUR = 60 * 60 * 1000
const load = async () => (await import('./sitemap')).default
const urls = (rows: { url: string }[]) => rows.map(r => r.url)

beforeEach(() => {
  // înainte de import: cache-ul își ia ceasul la creare
  vi.useFakeTimers()
  vi.resetModules()
  article.mockReset().mockResolvedValue([])
  book.mockReset().mockResolvedValue([])
  saint.mockReset().mockResolvedValue([{ slug: 'sfant-proba' }])
  chapter.mockReset().mockResolvedValue([{ chapterNum: 3, book: { slug: 'iona' } }])
})
afterEach(() => { vi.useRealTimers() })

describe('cache-ul sitemap-ului', () => {
  it('a doua cerere nu mai atinge baza și dă același rezultat', async () => {
    const sitemap = await load()
    const first = await sitemap()
    expect(urls(first)).toContain('https://parintelemarin.com/biblie/iona/3')
    expect(urls(first)).toContain('https://parintelemarin.com/sfintii/sfant-proba')
    expect(await sitemap()).toEqual(first)
    expect(saint).toHaveBeenCalledTimes(1)
    expect(chapter).toHaveBeenCalledTimes(1)
  })

  it('după o oră se recitește', async () => {
    const sitemap = await load()
    await sitemap()
    saint.mockResolvedValue([{ slug: 'sfant-nou' }])
    vi.advanceTimersByTime(HOUR - 1)
    expect(urls(await sitemap())).not.toContain('https://parintelemarin.com/sfintii/sfant-nou')
    vi.advanceTimersByTime(1)
    expect(urls(await sitemap())).toContain('https://parintelemarin.com/sfintii/sfant-nou')
  })

  it.each([
    ['articole', article],
    ['cărți', book],
    ['sfinți', saint],
    ['capitole', chapter],
  ])('o eroare la %s: parțial servit, dar nepăstrat', async (_name, failing) => {
    const healthy = failing.getMockImplementation()
    const sitemap = await load()
    failing.mockRejectedValueOnce(new Error('bază indisponibilă'))
    const partial = await sitemap()
    expect(urls(partial)).toContain('https://parintelemarin.com/despre')
    expect(failing.getMockImplementation()).toBe(healthy)
    const next = await sitemap()
    expect(failing).toHaveBeenCalledTimes(2)
    expect(urls(next)).toContain('https://parintelemarin.com/biblie/iona/3')
  })

  it('o Biblie goală, fără eroare, e un rezultat valid și se păstrează', async () => {
    chapter.mockResolvedValue([])
    const sitemap = await load()
    await sitemap()
    await sitemap()
    expect(chapter).toHaveBeenCalledTimes(1)
  })
})
