import { beforeEach, describe, expect, it, vi } from 'vitest'
import ro from '@/lib/i18n/ro'
import ru from '@/lib/i18n/ru'
import en from '@/lib/i18n/en'
import { BIBLE_BOOKS } from '@/lib/bible/books'
import { bibleChapterMetadata } from '@/lib/bible/seo'
import { SITE_URL } from '@/lib/site'

type L = 'ro' | 'ru' | 'en'
const env = vi.hoisted(() => ({ locale: 'ro' as string, count: 21 as number | null }))
const VERSE_MARKER = 'MARKER-VERSET-DE-TEST'
const dicts = { ro, ru, en }

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/i18n/server', () => ({
  getServerLocale: async () => env.locale,
  getServerT: async () => dicts[env.locale as L],
}))
vi.mock('@/lib/bible/queries', () => ({
  SEARCH_PAGE_SIZE: 25,
  getChapterCount: async () => env.count,
  getChapterVerses: async () => [{ n: 1, text: VERSE_MARKER }],
  searchVerses: async () => null,
}))

const index = () => import('./page')
const book = () => import('./[carte]/page')
const chapter = () => import('./[carte]/[capitol]/page')

async function chapterMeta(carte: string, capitol: string) {
  return (await chapter()).generateMetadata({ params: Promise.resolve({ carte, capitol }) })
}
async function indexMeta(q?: string) {
  return (await index()).generateMetadata({ searchParams: Promise.resolve({ q }) })
}
const titleOf = (m: { title?: unknown }) => (m.title as { absolute: string }).absolute
const og = (m: { openGraph?: unknown }) => m.openGraph as Record<string, unknown> & { images: { url: string }[] }

beforeEach(() => {
  env.locale = 'ro'
  env.count = 151
})

describe('capitol', () => {
  it.each([
    ['ioan', '3', 'Ioan 3 — Biblia', 'Citește Ioan, capitolul 3, în limba română.'],
    ['psalmi', '50', 'Psalmii 50 — Biblia', 'Citește Psalmii, capitolul 50, în limba română.'],
    ['1-corinteni', '13', '1 Corinteni 13 — Biblia', 'Citește 1 Corinteni, capitolul 13, în limba română.'],
  ])('%s/%s: titlu, descriere, canonical și og:url proprii', async (carte, capitol, title, description) => {
    const m = await chapterMeta(carte, capitol)
    const url = `${SITE_URL}/biblie/${carte}/${capitol}`
    expect(titleOf(m)).toBe(title)
    expect(m.description).toBe(description)
    expect(m.alternates?.canonical).toBe(url)
    expect(og(m).url).toBe(url)
    expect(og(m).title).toBe(title)
    expect(og(m).type).toBe('article')
    expect(og(m).locale).toBe('ro_RO')
    expect(m.robots).toBeUndefined()
  })

  it('textul versetelor nu ajunge în metadata', async () => {
    expect(JSON.stringify(await chapterMeta('ioan', '3'))).not.toContain(VERSE_MARKER)
  })

  it('URL necanonic (03): fără metadata proprie (pagina dă 404)', async () => {
    expect(await chapterMeta('ioan', '03')).toEqual({})
  })

  it('carte neimportată: tot canonical propriu, dar noindex, follow', async () => {
    env.count = 0
    const m = await chapterMeta('ioan', '3')
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie/ioan/3`)
    expect(m.robots).toEqual({ index: false, follow: true })
  })

  it('capitol inexistent: fără metadata proprie (pagina dă 404)', async () => {
    env.count = 21
    expect(await chapterMeta('ioan', '99')).toEqual({})
  })

  it('toate cele 80 de cărți au nume scurt și canonical propriu', () => {
    for (const b of BIBLE_BOOKS) {
      const m = bibleChapterMetadata(b, 1, ro, 'ro', true)
      expect(b.aliases[0]).toBeTruthy()
      expect(titleOf(m)).toBe(`${b.aliases[0]} 1 — Biblia`)
      expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie/${b.slug}/1`)
    }
  })
})

describe('carte', () => {
  it('/biblie/ioan: titlu și canonical proprii', async () => {
    const m = await (await book()).generateMetadata({ params: Promise.resolve({ carte: 'ioan' }) })
    expect(titleOf(m)).toBe('Ioan — Biblia')
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie/ioan`)
    expect(og(m).url).toBe(`${SITE_URL}/biblie/ioan`)
    expect(og(m).type).toBe('website')
  })
})

describe('index și căutare', () => {
  it('/biblie: titlu, canonical, Open Graph și imaginea implicită', async () => {
    const m = await indexMeta()
    expect(titleOf(m)).toBe('Biblia — text în limba română')
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie`)
    expect(og(m).url).toBe(`${SITE_URL}/biblie`)
    expect(og(m).type).toBe('website')
    expect(m.robots).toBeUndefined()
  })

  it('?q=…: canonical spre /biblie, noindex, follow', async () => {
    const m = await indexMeta('dumnezeu')
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie`)
    expect(og(m).url).toBe(`${SITE_URL}/biblie`)
    expect(m.robots).toEqual({ index: false, follow: true })
  })

  it('q gol nu e căutare', async () => {
    expect((await indexMeta('   ')).robots).toBeUndefined()
  })
})

describe('limbi', () => {
  it.each([
    ['en', 'en_US', `${SITE_URL}/en/bible`, `${SITE_URL}/en/bible/ioan/3`],
    ['ru', 'ru_RU', `${SITE_URL}/ru/bibliya`, `${SITE_URL}/ru/bibliya/ioan/3`],
  ])('%s: canonical propriu, hreflang spre toate variantele', async (locale, ogLocale, indexUrl, chapterUrl) => {
    env.locale = locale
    const i = await indexMeta()
    const c = await chapterMeta('ioan', '3')
    expect(i.alternates?.canonical).toBe(indexUrl)
    expect(og(i).url).toBe(indexUrl)
    expect(c.alternates?.canonical).toBe(chapterUrl)
    expect(og(c).url).toBe(chapterUrl)
    expect(og(c).locale).toBe(ogLocale)
    expect(c.alternates?.languages).toMatchObject({
      ro: `${SITE_URL}/biblie/ioan/3`,
      ru: `${SITE_URL}/ru/bibliya/ioan/3`,
      en: `${SITE_URL}/en/bible/ioan/3`,
      'x-default': `${SITE_URL}/biblie/ioan/3`,
    })
    expect((await indexMeta('dumnezeu')).alternates?.canonical).toBe(indexUrl)
  })
})
