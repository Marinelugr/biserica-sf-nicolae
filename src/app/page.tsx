export const dynamic = 'force-dynamic'

import Hero from '@/components/homepage/Hero'
import LiveStreamCard from '@/components/homepage/LiveStreamCard'
import DailyCards from '@/components/homepage/DailyCards'
import NewsAndLibrary from '@/components/homepage/NewsAndLibrary'
import LiturgicalTodayWidget from '@/components/homepage/LiturgicalTodayWidget'
import NextServiceWidget from '@/components/NextServiceWidget'
import PascalCard from '@/components/PascalCard'
import { getTodayDate } from '@/lib/utils'
import { getServerLocale } from '@/lib/i18n/server'
import { pick, localeToIntl, type Locale } from '@/lib/i18n/pick'

const DEFAULT_WIDGETS = [
  { section: 'sfintii_zilei', order: 0, enabled: true },
  { section: 'evanghelia_zilei', order: 1, enabled: true },
  { section: 'rugaciunea_zilei', order: 2, enabled: true },
  { section: 'stiri_recente', order: 3, enabled: true },
  { section: 'biblioteca_ortodoxa', order: 4, enabled: true },
]

const RUGACIUNI_ZILE: Record<number, string> = {
  0: 'duminica',
  1: 'luni',
  2: 'marti',
  3: 'miercuri',
  4: 'joi',
  5: 'vineri',
  6: 'sambata',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function getWidgetConfig() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const widgets = await prisma.homepageWidget.findMany({ orderBy: { order: 'asc' } })
    const list = widgets.length > 0 ? widgets : DEFAULT_WIDGETS

    const enabled: Record<string, boolean> = {}
    const order: string[] = []
    for (const w of list) {
      enabled[w.section] = w.enabled
      if (w.enabled) order.push(w.section)
    }
    return { enabled, order }
  } catch {
    const enabled: Record<string, boolean> = {}
    const order: string[] = []
    for (const w of DEFAULT_WIDGETS) {
      enabled[w.section] = true
      order.push(w.section)
    }
    return { enabled, order }
  }
}

const FALLBACK_GOSPEL = {
  reference: 'Ioan 1:1',
  text: 'La început era Cuvântul și Cuvântul era la Dumnezeu și Dumnezeu era Cuvântul.',
}

const FALLBACK_PRAYER = {
  title: 'Rugăciunea dimineții',
  text: 'Doamne Iisuse Hristoase, Fiul lui Dumnezeu, miluiește-mă pe mine păcătosul.',
  slug: null as string | null,
}

async function getDailyData(locale: Locale) {
  const { day, month } = getTodayDate()
  const prayerSlug = RUGACIUNI_ZILE[new Date().getDay()]
  const prayerDay = new Date().toLocaleDateString(localeToIntl(locale), { weekday: 'long' })

  try {
    const { prisma } = await import('@/lib/prisma')

    const [saints, prayerBook] = await Promise.all([
      prisma.saint.findMany({
        where: { month, day },
        select: { nameRo: true, nameRu: true, nameEn: true },
        take: 5,
      }),
      prisma.libraryBook.findUnique({
        where: { slug: prayerSlug },
        select: { slug: true, titleRo: true, titleRu: true, titleEn: true, contentRo: true, contentRu: true, contentEn: true },
      }),
    ])

    return {
      saints: saints.map(s => pick(locale, s.nameRo, s.nameRu, s.nameEn)),
      gospel: FALLBACK_GOSPEL,
      prayer: prayerBook
        ? {
            title: pick(locale, prayerBook.titleRo, prayerBook.titleRu, prayerBook.titleEn),
            text: stripHtml(pick(locale, prayerBook.contentRo, prayerBook.contentRu, prayerBook.contentEn)).slice(0, 200) + '…',
            slug: prayerBook.slug,
            day: prayerDay,
          }
        : { ...FALLBACK_PRAYER, day: prayerDay },
    }
  } catch {
    return {
      saints: [],
      gospel: FALLBACK_GOSPEL,
      prayer: { ...FALLBACK_PRAYER, day: prayerDay },
    }
  }
}

async function getHomeContent(locale: Locale) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const [articles, libraryBooks] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, titleRo: true, titleRu: true, titleEn: true, imageUrl: true, publishedAt: true, category: true, contentRo: true, contentRu: true, contentEn: true },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      }),
      prisma.libraryBook.findMany({
        select: { slug: true, titleRo: true, titleRu: true, titleEn: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

    return {
      articles: articles.map(a => ({
        slug: a.slug, title: pick(locale, a.titleRo, a.titleRu, a.titleEn),
        imageUrl: a.imageUrl, publishedAt: a.publishedAt, category: a.category,
        excerpt: stripHtml(pick(locale, a.contentRo, a.contentRu, a.contentEn)).slice(0, 220),
      })),
      libraryBooks: libraryBooks.map(b => ({
        slug: b.slug, title: pick(locale, b.titleRo, b.titleRu, b.titleEn), type: b.type,
      })),
    }
  } catch {
    return { articles: [], libraryBooks: [] }
  }
}

const DAILY_CARD_SECTIONS = ['sfintii_zilei', 'evanghelia_zilei', 'rugaciunea_zilei']

export default async function HomePage() {
  const locale = await getServerLocale()
  const [dailyData, homeContent, widgetConfig] = await Promise.all([
    getDailyData(locale),
    getHomeContent(locale),
    getWidgetConfig(),
  ])

  const { enabled, order } = widgetConfig
  const showDailyCards = DAILY_CARD_SECTIONS.some(s => enabled[s])
  const showNews = enabled['stiri_recente']
  const showLibrary = enabled['biblioteca_ortodoxa']

  return (
    <>
      <Hero />
      <LiveStreamCard />
      <LiturgicalTodayWidget />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PascalCard />
          <NextServiceWidget />
        </div>
      </section>
      {showDailyCards && (
        <DailyCards data={dailyData} enabled={enabled} order={order} />
      )}
      {(showNews || showLibrary) && (
        <NewsAndLibrary
          articles={homeContent.articles}
          libraryBooks={homeContent.libraryBooks}
          showNews={showNews}
          showLibrary={showLibrary}
        />
      )}
    </>
  )
}
