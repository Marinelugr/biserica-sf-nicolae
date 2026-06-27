export const dynamic = 'force-dynamic'

import Hero from '@/components/homepage/Hero'
import DailyCards from '@/components/homepage/DailyCards'
import NewsAndLibrary from '@/components/homepage/NewsAndLibrary'
import { getTodayDate } from '@/lib/utils'

const FALLBACK_GOSPEL = {
  reference: 'Ioan 1:1',
  text: 'La început era Cuvântul și Cuvântul era la Dumnezeu și Dumnezeu era Cuvântul.',
}

const FALLBACK_PRAYER = {
  title: 'Rugăciunea dimineții',
  text: 'Doamne Iisuse Hristoase, Fiul lui Dumnezeu, miluiește-mă pe mine păcătosul.',
}

async function getDailyData() {
  const { day, month } = getTodayDate()

  try {
    const { prisma } = await import('@/lib/prisma')

    const [saints, prayer, schedule] = await Promise.all([
      prisma.saint.findMany({
        where: { month, day },
        select: { nameRo: true },
        take: 5,
      }),
      prisma.prayer.findFirst({
        where: { type: 'RUGACIUNE_ZILEI' },
        select: { titleRo: true, textRo: true },
      }),
      prisma.serviceSchedule.findMany({
        where: { year: new Date().getFullYear(), month, day },
        select: { time: true, serviceRo: true },
        orderBy: { time: 'asc' },
        take: 5,
      }),
    ])

    return {
      saints: saints.map(s => s.nameRo),
      gospel: FALLBACK_GOSPEL,
      prayer: prayer
        ? { title: prayer.titleRo, text: prayer.textRo.slice(0, 220) + '…' }
        : FALLBACK_PRAYER,
      schedule: schedule.map(s => ({ time: s.time, service: s.serviceRo })),
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

async function getHomeContent() {
  try {
    const { prisma } = await import('@/lib/prisma')

    const [articles, libraryBooks] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, titleRo: true, imageUrl: true, publishedAt: true, category: true },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      }),
      prisma.libraryBook.findMany({
        select: { slug: true, titleRo: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

    return { articles, libraryBooks }
  } catch {
    return { articles: [], libraryBooks: [] }
  }
}

function getTodayLabel(): string {
  const { day, month, year } = getTodayDate()
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ro-MD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function HomePage() {
  const [dailyData, homeContent] = await Promise.all([
    getDailyData(),
    getHomeContent(),
  ])

  return (
    <>
      <Hero />
      <DailyCards data={dailyData} todayLabel={getTodayLabel()} />
      <NewsAndLibrary
        articles={homeContent.articles}
        libraryBooks={homeContent.libraryBooks}
      />
    </>
  )
}
