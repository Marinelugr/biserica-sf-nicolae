export const dynamic = 'force-dynamic'

import Hero from '@/components/homepage/Hero'
import LiveStreamCard from '@/components/homepage/LiveStreamCard'
import DailyCards from '@/components/homepage/DailyCards'
import NewsAndLibrary from '@/components/homepage/NewsAndLibrary'
import LiturgicalTodayWidget from '@/components/homepage/LiturgicalTodayWidget'
import { getTodayDate } from '@/lib/utils'
import { getServerLocale } from '@/lib/i18n/server'
import { pick, localeToIntl, type Locale } from '@/lib/i18n/pick'

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

export default async function HomePage() {
  const locale = await getServerLocale()
  const [dailyData, homeContent] = await Promise.all([
    getDailyData(locale),
    getHomeContent(locale),
  ])

  return (
    <>
      <Hero />
      <LiveStreamCard />
      <LiturgicalTodayWidget />
      <DailyCards data={dailyData} todayLabel={getTodayLabel(locale)} />
      <NewsAndLibrary
        articles={homeContent.articles}
        libraryBooks={homeContent.libraryBooks}
      />
    </>
  )
}
