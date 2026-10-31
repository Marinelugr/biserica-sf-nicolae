import { beforeEach, describe, expect, it, vi } from 'vitest'
import ro from '@/lib/i18n/ro'
import ru from '@/lib/i18n/ru'
import en from '@/lib/i18n/en'
import { BIBLE_BOOKS, getBook } from '@/lib/bible/books'
import { bibleChapterMetadata, bibleOgImagePath, bibleOgText, bibleTitle, ogSubtitleSize, parseBibleOgParts } from '@/lib/bible/seo'
import { bookShortName } from '@/lib/bible/shortNames'
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
    ['ioan', '3', 'Ioan 3 — Sfânta Scriptură (Biblia)', 'Citește Ioan, capitolul 3, în limba română.'],
    ['psalmi', '50', 'Psalmii 50 — Sfânta Scriptură (Biblia)', 'Citește Psalmii, capitolul 50, în limba română.'],
    ['1-corinteni', '13', '1 Corinteni 13 — Sfânta Scriptură (Biblia)', 'Citește 1 Corinteni, capitolul 13, în limba română.'],
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
      expect(titleOf(m)).toBe(`${b.aliases[0]} 1 — Sfânta Scriptură (Biblia)`)
      expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie/${b.slug}/1`)
    }
  })
})

describe('carte', () => {
  it('/biblie/ioan: titlu și canonical proprii', async () => {
    const m = await (await book()).generateMetadata({ params: Promise.resolve({ carte: 'ioan' }) })
    expect(titleOf(m)).toBe('Ioan — Sfânta Scriptură (Biblia)')
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/biblie/ioan`)
    expect(og(m).url).toBe(`${SITE_URL}/biblie/ioan`)
    expect(og(m).type).toBe('website')
  })
})

describe('index și căutare', () => {
  it('/biblie: titlu, canonical, Open Graph și imaginea implicită', async () => {
    const m = await indexMeta()
    expect(titleOf(m)).toBe('Sfânta Scriptură (Biblia)')
    expect(m.description).toBe('Sfânta Scriptură în limba română: Vechiul și Noul Testament, pe cărți și capitole.')
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

describe('titluri: limite și traduceri', () => {
  const locales: L[] = ['ro', 'en', 'ru']

  it.each([
    ['ro', 'Sfânta Scriptură (Biblia)', 'Ioan 3 — Sfânta Scriptură (Biblia)'],
    ['en', 'Holy Scripture (the Bible)', 'John 3 — Holy Scripture (the Bible)'],
    ['ru', 'Священное Писание (Библия)', 'От Иоанна 3 — Священное Писание (Библия)'],
  ])('%s', (locale, index, chapter) => {
    expect(bibleTitle(locale as L)).toBe(index)
    expect(bibleTitle(locale as L, getBook('ioan'), 3)).toBe(chapter)
  })

  it.each([
    ['1-corinteni', 16, '1 Corinteni 16 — Sfânta Scriptură (Biblia)'],
    ['cantarea-cantarilor', 8, 'Cântarea Cântărilor 8 — Sfânta Scriptură (Biblia)'],
    ['faptele-apostolilor', 28, 'Faptele Apostolilor 28 — Sfânta Scriptură (Biblia)'],
  ])('nume lung, în română: %s', (slug, chapter, title) => {
    expect(bibleTitle('ro', getBook(slug), chapter)).toBe(title)
  })

  it('peste 65 de caractere, paranteza dispare', () => {
    const long = { ...getBook('ioan')!, aliases: ['Un nume de carte foarte lung, de probă'] }
    expect(bibleTitle('ro', long, 3)).toBe('Un nume de carte foarte lung, de probă 3 — Sfânta Scriptură')
  })

  it('toate cărțile, în toate limbile: ≤ 70 de caractere, nume scurt, og:title fără sufix', () => {
    for (const locale of locales) for (const b of BIBLE_BOOKS) {
      expect(bookShortName(b, locale)).toBeTruthy()
      for (const chapter of [undefined, 151]) {
        expect(bibleTitle(locale, b, chapter).length).toBeLessThanOrEqual(70)
      }
      const m = bibleChapterMetadata(b, 151, dicts[locale], locale, true)
      expect(og(m).title).toBe(bibleTitle(locale, b, 151))
      expect(og(m).title).not.toContain('|')
    }
  })
})

describe('imaginea Open Graph', () => {
  const ioan = getBook('ioan')!

  it('URL absolut, dimensiuni, alt și twitter:card, în limba paginii', async () => {
    env.locale = 'en'
    const m = await chapterMeta('ioan', '3')
    const image = (m.openGraph as { images: Record<string, unknown>[] }).images[0]
    const url = `${SITE_URL}/og/biblie/en/ioan/3.png`
    expect(image).toMatchObject({ url, width: 1200, height: 630, type: 'image/png' })
    expect(image.alt).toContain('John 3')
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', images: [url] })
  })

  it.each([
    ['/biblie', () => indexMeta(), `${SITE_URL}/og/biblie/ro.png`],
    ['/biblie/ioan', async () => (await book()).generateMetadata({ params: Promise.resolve({ carte: 'ioan' }) }), `${SITE_URL}/og/biblie/ro/ioan.png`],
    ['/biblie/ioan/3', () => chapterMeta('ioan', '3'), `${SITE_URL}/og/biblie/ro/ioan/3.png`],
  ])('%s: og:image are URL absolut, 1200×630 și alt', async (_route, load, url) => {
    const m = await load()
    const [image] = (m.openGraph as { images: { url: string; width: number; height: number; alt: string }[] }).images
    expect(image.url).toBe(url)
    expect(new URL(image.url).protocol).toBe('https:')
    expect(image.width).toBe(1200)
    expect(image.height).toBe(630)
    expect(image.alt.length).toBeGreaterThan(0)
  })

  it.each([
    ['ro', undefined, undefined, 'Sfânta Scriptură', '(Biblia)', 'Vechiul și Noul Testament'],
    ['en', undefined, undefined, 'Holy Scripture', '(the Bible)', 'Old and New Testament'],
    ['ru', undefined, undefined, 'Священное Писание', '(Библия)', 'Ветхий и Новый Завет'],
    ['ro', 'ioan', undefined, 'Sfânta Scriptură', '(Biblia)', 'Evanghelia după Ioan'],
    ['ro', 'ioan', 3, 'Sfânta Scriptură', '(Biblia)', 'Ioan 3'],
    ['en', 'faptele-apostolilor', 1, 'Holy Scripture', '(the Bible)', 'Acts of the Apostles 1'],
    ['ru', '1-corinteni', 13, 'Священное Писание', '(Библия)', '1 Коринфянам 13'],
  ])('textele imaginii: %s %s %s', (locale, slug, chapter, scripture, bible, subtitle) => {
    expect(bibleOgText(locale as L, slug ? getBook(slug) : undefined, chapter)).toEqual({ scripture, bible, subtitle })
  })

  it('subtitlul: 40 px la texte scurte, niciodată sub 28 px, și încape în rama de 1040 px', () => {
    expect(ogSubtitleSize('Ioan 3')).toBe(40)
    expect(ogSubtitleSize('x'.repeat(500))).toBe(28)
    for (const locale of ['ro', 'en', 'ru'] as L[]) for (const b of BIBLE_BOOKS) {
      const { subtitle } = bibleOgText(locale, b)
      const size = ogSubtitleSize(subtitle)
      expect(size).toBeGreaterThanOrEqual(28)
      expect(subtitle.length * size * 0.5).toBeLessThanOrEqual(1040)
    }
  })

  it('calea se poate citi înapoi', () => {
    for (const [locale, book, chapter] of [['ro'], ['ru', ioan], ['en', ioan, 3]] as [L, typeof ioan?, number?][]) {
      const parts = bibleOgImagePath(locale, book, chapter).split('/').slice(3)
      expect(parseBibleOgParts(parts)).toEqual({ locale, ...(book ? { book } : {}), ...(chapter ? { chapter } : {}) })
    }
  })

  it.each([
    [['fr.png']], [['ro']], [['ro', 'nu-exista.png']], [['ro', 'ioan', '0.png']],
    [['ro', 'ioan', '03.png']], [['ro', 'ioan', '152.png']], [['ro', 'ioan', '3', 'x.png']], [[]],
  ])('URL necunoscut: %j', parts => {
    expect(parseBibleOgParts(parts)).toBeNull()
  })
})
