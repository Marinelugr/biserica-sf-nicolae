export const dynamic = 'force-dynamic'

import Hero from '@/components/homepage/Hero'
import LiveStreamCard from '@/components/homepage/LiveStreamCard'
import DailyCards from '@/components/homepage/DailyCards'
import NewsAndLibrary from '@/components/homepage/NewsAndLibrary'
import LiturgicalTodayWidget from '@/components/homepage/LiturgicalTodayWidget'
import { getTodayDate } from '@/lib/utils'
import { getServerLocale } from '@/lib/i18n/server'
import { pick, localeToIntl, type Locale } from '@/lib/i18n/pick'

const DEFAULT_WIDGETS = [
  { section: 'sfintii_zilei', order: 0, enabled: true },
  { section: 'evanghelia_zilei', order: 1, enabled: true },
  { section: 'rugaciunea_zilei', order: 2, enabled: true },
  { section: 'program_slujbe', order: 3, enabled: true },
  { section: 'stiri_recente', order: 4, enabled: true },
  { section: 'biblioteca_ortodoxa', order: 5, enabled: true },
]

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
}

async function getDailyData(locale: Locale) {
  const { day, month } = getTodayDate()

  try {
    const { prisma } = await import('@/lib/prisma')

    const [saints, prayer, schedule] = await Promise.all([
      prisma.saint.findMany({
        where: { month, day },
        select: { nameRo: true, nameRu: true, nameEn: true },
        take: 5,
      }),
      prisma.prayer.findFirst({
        where: { type: 'RUGACIUNE_ZILEI' },
        select: { titleRo: true, titleRu: true, titleEn: true, textRo: true, textRu: true, textEn: true },
      }),
      prisma.serviceSchedule.findMany({
        where: { year: new Date().getFullYear(), month, day },
        select: { time: true, serviceRo: true, serviceRu: true },
        orderBy: { time: 'asc' },
        take: 5,
      }),
    ])

    return {
      saints: saints.map(s => pick(locale, s.nameRo, s.nameRu, s.nameEn)),
      gospel: FALLBACK_GOSPEL,
      prayer: prayer
        ? {
            title: pick(locale, prayer.titleRo, prayer.titleRu, prayer.titleEn),
            text: pick(locale, prayer.textRo, prayer.textRu, prayer.textEn).slice(0, 220) + '…',
          }
        : FALLBACK_PRAYER,
      schedule: schedule.map(s => ({ time: s.time, service: pick(locale, s.serviceRo, s.serviceRu, null) })),
    }
  } catch {
    return {
      saints: [],
      gospel: FALLBACK_GOSPEL,
      prayer: FALLBACK_PRAYER,
      schedule: [],
    }
  }
}

async function getHomeContent(locale: Locale) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const [articles, libraryBooks] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, titleRo: true, titleRu: true, titleEn: true, imageUrl: true, publishedAt: true, category: true },
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
      })),
      libraryBooks: libraryBooks.map(b => ({
        slug: b.slug, title: pick(locale, b.titleRo, b.titleRu, b.titleEn), type: b.type,
      })),
    }
  } catch {
    return { articles: [], libraryBooks: [] }
  }
}

function getTodayLabel(locale: Locale): string {
  const { day, month, year } = getTodayDate()
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(localeToIntl(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const DAILY_CARD_SECTIONS = ['sfintii_zilei', 'evanghelia_zilei', 'rugaciunea_zilei', 'program_slujbe']

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
      {showDailyCards && (
        <DailyCards data={dailyData} todayLabel={getTodayLabel(locale)} enabled={enabled} order={order} />
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
