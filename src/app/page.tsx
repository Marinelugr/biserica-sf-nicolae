export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Fragment, type ReactNode } from 'react'
import Hero from '@/components/homepage/Hero'
import LiveStreamCard from '@/components/homepage/LiveStreamCard'
import DailyCards from '@/components/homepage/DailyCards'
import NewsAndLibrary from '@/components/homepage/NewsAndLibrary'
import LiturgicalTodayWidget from '@/components/homepage/LiturgicalTodayWidget'
import NextServiceWidget from '@/components/NextServiceWidget'
import PascalCard from '@/components/PascalCard'
import PriestMessageSection from '@/components/homepage/PriestMessageSection'
import CobaltAurora from '@/components/homepage/CobaltAurora'
import { getTodayDate } from '@/lib/utils'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { localeToIntl, type Locale } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { publicArticleWhere } from '@/lib/articleVisibility'
import { mergeHomepageWidgets, DEFAULT_HOMEPAGE_WIDGETS } from '@/lib/homepageWidgets'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: { absolute: t.meta.site.title },
    description: t.meta.site.description,
    alternates: buildAlternates('/'),
  }
}

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
    const merged = mergeHomepageWidgets(widgets)

    const enabled: Record<string, boolean> = {}
    for (const w of merged) enabled[w.section] = w.enabled
    return { enabled, orderedSections: merged.map(w => w.section) }
  } catch {
    const enabled: Record<string, boolean> = {}
    for (const w of DEFAULT_HOMEPAGE_WIDGETS) enabled[w.section] = true
    return { enabled, orderedSections: DEFAULT_HOMEPAGE_WIDGETS.map(w => w.section) }
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
        select: { nameRo: true },
        take: 5,
      }),
      prisma.libraryBook.findUnique({
        where: { slug: prayerSlug },
        select: { slug: true, titleRo: true, contentRo: true },
      }),
    ])

    return {
      saints: saints.map(s => s.nameRo),
      gospel: FALLBACK_GOSPEL,
      prayer: prayerBook
        ? {
            title: prayerBook.titleRo,
            text: stripHtml(prayerBook.contentRo).slice(0, 200) + '…',
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
        where: publicArticleWhere,
        select: { slug: true, titleRo: true, imageUrl: true, publishedAt: true, category: true, contentRo: true },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      }),
      prisma.libraryBook.findMany({
        select: { slug: true, titleRo: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

    return {
      articles: articles.map(a => ({
        slug: a.slug, title: a.titleRo,
        imageUrl: a.imageUrl, publishedAt: a.publishedAt, category: a.category,
        excerpt: stripHtml(a.contentRo).slice(0, 220),
      })),
      libraryBooks: libraryBooks.map(b => ({
        slug: b.slug, title: b.titleRo, type: b.type,
      })),
    }
  } catch {
    return { articles: [], libraryBooks: [] }
  }
}

const DAILY_CARD_SECTIONS = ['sfintii_zilei', 'evanghelia_zilei', 'rugaciunea_zilei']

/** Secțiunile individuale mapate pe blocul vizual în care sunt randate. */
function unitForSection(section: string): string {
  if (DAILY_CARD_SECTIONS.includes(section)) return 'daily_cards'
  if (section === 'stiri_recente' || section === 'biblioteca_ortodoxa') return 'news_library'
  return section
}

const UNIT_ORDER_FALLBACK = ['hero', 'astazi_calendar', 'pascal_slujbe', 'mesajul_parintelui', 'daily_cards', 'news_library']

export default async function HomePage() {
  const locale = await getServerLocale()
  const [dailyData, homeContent, widgetConfig] = await Promise.all([
    getDailyData(locale),
    getHomeContent(locale),
    getWidgetConfig(),
  ])

  const { enabled, orderedSections } = widgetConfig
  const dailyOrder = orderedSections.filter(s => DAILY_CARD_SECTIONS.includes(s) && enabled[s])
  const showDailyCards = DAILY_CARD_SECTIONS.some(s => enabled[s])
  const showNews = !!enabled['stiri_recente']
  const showLibrary = !!enabled['biblioteca_ortodoxa']

  // Ordinea blocurilor de nivel superior, derivată din configurarea admin
  const units: string[] = []
  for (const s of orderedSections) {
    const u = unitForSection(s)
    if (!units.includes(u)) units.push(u)
  }
  for (const u of UNIT_ORDER_FALLBACK) if (!units.includes(u)) units.push(u)

  const renderUnit = (unit: string): ReactNode => {
    switch (unit) {
      case 'hero':
        return enabled['hero'] === false ? null : <Hero key="hero" />
      case 'astazi_calendar':
        return enabled['astazi_calendar'] === false ? null : <LiturgicalTodayWidget key="astazi_calendar" />
      case 'pascal_slujbe':
        return enabled['pascal_slujbe'] === false ? null : (
          <section key="pascal_slujbe" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PascalCard />
              <NextServiceWidget />
            </div>
          </section>
        )
      case 'mesajul_parintelui':
        return enabled['mesajul_parintelui'] === false ? null : <PriestMessageSection key="mesajul_parintelui" />
      case 'daily_cards':
        return showDailyCards
          ? <DailyCards key="daily_cards" data={dailyData} enabled={enabled} order={dailyOrder} />
          : null
      case 'news_library':
        return (showNews || showLibrary)
          ? (
            <NewsAndLibrary
              key="news_library"
              articles={homeContent.articles}
              libraryBooks={homeContent.libraryBooks}
              showNews={showNews}
              showLibrary={showLibrary}
            />
          )
          : null
      default:
        return null
    }
  }

  return (
    <div className="relative" style={{ backgroundColor: '#04080F' }}>
      <CobaltAurora />
      <div className="relative" style={{ zIndex: 2 }}>
        {units.map(u => (
          <Fragment key={u}>
            {renderUnit(u)}
            {u === 'hero' && <LiveStreamCard />}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
