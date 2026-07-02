import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bibliotecă Ortodoxă',
  description: 'Acatiste, canoane, rugăciuni, slujbe și cărți ortodoxe. Biblioteca digitală a Parohiei Sfântul Ierarh Nicolae.',
}

const CATEGORY_META = [
  { key: 'ACATIST', icon: '☦', color: '#8B1A1A', bg: '#FDF5F5', border: '#F0D5D5' },
  { key: 'CANON',   icon: '✝', color: '#8B6014', bg: '#FDF8EF', border: '#E8D8B0' },
  { key: 'RUGACIUNE', icon: '🕯', color: '#6B4A2A', bg: '#FAF5EE', border: '#DDD0B8' },
  { key: 'SLUJBA',  icon: '⛪', color: '#4A6A2A', bg: '#F5FAF0', border: '#C8D8B8' },
  { key: 'VIATA',   icon: '✦', color: '#1C4A6A', bg: '#F0F5FA', border: '#B8C8D8' },
  { key: 'PREDICA', icon: '📖', color: '#4A1A6A', bg: '#F5F0FA', border: '#C8B8D8' },
  { key: 'ALTELE',  icon: '◆', color: '#5A5050', bg: '#F8F7F5', border: '#E0DEDA' },
] as const

type CategoryKey = typeof CATEGORY_META[number]['key']

async function getCounts(): Promise<Record<string, number>> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const groups = await prisma.libraryBook.groupBy({
      by: ['type'],
      _count: { _all: true },
    })
    return Object.fromEntries(groups.map(g => [g.type ?? 'ALTELE', g._count._all]))
  } catch {
    return {}
  }
}

async function getRecentBooks() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.libraryBook.findMany({
      select: { slug: true, titleRo: true, titleRu: true, titleEn: true, type: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
  } catch {
    return []
  }
}

export default async function CartiPage() {
  const [counts, recentBooks, t, locale] = await Promise.all([getCounts(), getRecentBooks(), getServerT(), getServerLocale()])
  const totalBooks = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.books.subtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-5" style={{ color: '#1C1B3A' }}>
          {t.books.title}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>

        <form className="flex gap-0 max-w-xl mx-auto rounded-md overflow-hidden shadow-sm" action="/cautare" method="get">
          <label htmlFor="library-search" className="sr-only">{t.books.searchPlaceholder}</label>
          <input
            id="library-search"
            type="search"
            name="q"
            placeholder={t.books.searchPlaceholder}
            className="flex-1 px-4 py-3 text-sm font-body outline-none"
            style={{ border: '1px solid #E8E5E0', borderRight: 'none', color: '#3A1A1A', backgroundColor: '#FAFAF8' }}
          />
          <button type="submit" className="px-6 py-3 font-body text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}>
            {t.books.searchBtn}
          </button>
        </form>
      </div>

      {totalBooks === 0 ? (
        <div className="text-center py-16">
          <span style={{ color: '#D4C8A0', fontSize: '56px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4 text-lg" style={{ color: '#8A7050' }}>
            {t.books.inProgress}
          </p>
          <p className="font-body text-sm mt-2 flex items-center justify-center gap-2" style={{ color: '#C9A84C' }}>
            <span>☦</span> {t.books.comingSoon}
          </p>
        </div>
      ) : (
        <>
          <section className="mb-14">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORY_META.map(cat => {
                const count = counts[cat.key] || 0
                return (
                  <Link
                    key={cat.key}
                    href={`/carti/categorie/${cat.key.toLowerCase()}`}
                    className="group flex flex-col items-center text-center p-6 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ backgroundColor: cat.bg, border: `1px solid ${cat.border}` }}
                  >
                    <span
                      className="text-3xl mb-3 block transition-transform group-hover:scale-110"
                      style={{ color: cat.color }}
                      aria-hidden="true"
                    >
                      {cat.icon}
                    </span>
                    <h2 className="font-heading text-lg mb-1" style={{ color: '#1C1B3A' }}>
                      {t.books.categories[cat.key as CategoryKey]}
                    </h2>
                    <p className="font-body text-xs mb-3" style={{ color: '#8A7050' }}>
                      {t.books.categoryDescriptions[cat.key]}
                    </p>
                    {count > 0 && (
                      <span
                        className="font-body text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cat.color, color: '#F2EBD9' }}
                      >
                        {count} {count === 1 ? t.books.textSingular : t.books.textPlural}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>

          {recentBooks.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
                <h2 className="font-body text-xs uppercase tracking-[0.35em]" style={{ color: '#8A7050' }}>
                  {t.books.recentlyAdded}
                </h2>
                <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ backgroundColor: '#E8E5E0' }}>
                {recentBooks.map(book => {
                  const cat = CATEGORY_META.find(c => c.key === book.type)
                  return (
                    <li key={book.slug} style={{ backgroundColor: '#FFFFFF' }}>
                      <Link
                        href={`/carti/${book.slug}`}
                        className="flex items-center justify-between p-4 group transition-colors hover:bg-amber-50"
                      >
                        <div className="flex items-center gap-2">
                          {cat && (
                            <span className="text-sm shrink-0" style={{ color: cat.color }} aria-hidden="true">
                              {cat.icon}
                            </span>
                          )}
                          <span className="font-body text-sm group-hover:underline underline-offset-2"
                            style={{ color: '#3A1A1A', textDecorationColor: '#C9A84C' }}>
                            {pick(locale, book.titleRo, book.titleRu, book.titleEn)}
                          </span>
                        </div>
                        <span className="ml-3 transition-transform group-hover:translate-x-1 shrink-0"
                          style={{ color: '#C9A84C' }} aria-hidden="true">→</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
