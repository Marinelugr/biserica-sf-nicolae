import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Căutare',
  description: 'Caută pe site-ul Parohiei Sfântul Ierarh Nicolae: versete Biblie, articole, rugăciuni, cărți, vieți de sfinți.',
}

const CATEGORIES = [
  { key: 'biblie', label: 'Biblie', icon: '📖', href: '/biblie' },
  { key: 'articole', label: 'Articole', icon: '📰', href: '/stiri' },
  { key: 'rugaciuni', label: 'Rugăciuni', icon: '🕯️', href: '/carti' },
  { key: 'carti', label: 'Cărți', icon: '📚', href: '/carti' },
  { key: 'sfinti', label: 'Sfinți', icon: '☦', href: '/calendar' },
]

interface SearchResult {
  category: string
  title: string
  excerpt: string
  href: string
}

async function searchAll(query: string): Promise<Record<string, SearchResult[]>> {
  if (!query) return {}
  const results: Record<string, SearchResult[]> = {}

  try {
    const { prisma } = await import('@/lib/prisma')

    const [books, articles, saints] = await Promise.all([
      prisma.libraryBook.findMany({
        where: {
          OR: [
            { titleRo: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { slug: true, titleRo: true, type: true },
        take: 8,
      }),
      prisma.article.findMany({
        where: {
          published: true,
          OR: [
            { titleRo: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { slug: true, titleRo: true, category: true },
        take: 8,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.saint.findMany({
        where: {
          OR: [
            { nameRo: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { nameRo: true, month: true, day: true },
        take: 8,
      }),
    ])

    if (articles.length > 0) {
      results['articole'] = articles.map(a => ({
        category: 'articole',
        title: a.titleRo,
        excerpt: a.category || '',
        href: `/stiri/${a.slug}`,
      }))
    }

    const rugs = books.filter(b => b.type === 'RUGACIUNE')
    const carti = books.filter(b => b.type !== 'RUGACIUNE')

    if (rugs.length > 0) {
      results['rugaciuni'] = rugs.map(b => ({
        category: 'rugaciuni',
        title: b.titleRo,
        excerpt: 'Rugăciune ortodoxă',
        href: `/carti/${b.slug}`,
      }))
    }

    if (carti.length > 0) {
      results['carti'] = carti.map(b => ({
        category: 'carti',
        title: b.titleRo,
        excerpt: b.type || '',
        href: `/carti/${b.slug}`,
      }))
    }

    if (saints.length > 0) {
      results['sfinti'] = saints.map(s => ({
        category: 'sfinti',
        title: s.nameRo,
        excerpt: `Prăznuit pe ${s.day} ${getMonthName(s.month)}`,
        href: '/calendar',
      }))
    }
  } catch {
    // DB unavailable — return empty
  }

  return results
}

function getMonthName(month: number): string {
  const months = ['', 'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
  return months[month] || ''
}

const categoryMeta: Record<string, { label: string; color: string }> = {
  biblie: { label: 'Biblie', color: '#1C4A6A' },
  articole: { label: 'Articole', color: '#4A6A2A' },
  rugaciuni: { label: 'Rugăciuni', color: '#6B4A2A' },
  carti: { label: 'Cărți', color: '#8B6014' },
  sfinti: { label: 'Sfinți', color: '#8B1A1A' },
}

export default async function CautarePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ''
  const results = await searchAll(query)
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl mb-4" style={{ color: '#1C1B3A' }}>
          Căutare
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {/* Formular căutare */}
      <form className="flex gap-0 max-w-xl mx-auto mb-12 rounded-md overflow-hidden shadow-md" method="get">
        <label htmlFor="search-input" className="sr-only">Caută pe site</label>
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Caută pe site..."
          className="flex-1 px-4 py-3 text-sm font-body outline-none"
          style={{
            border: '1px solid #E8E5E0',
            borderRight: 'none',
            color: '#3A1A1A',
            backgroundColor: '#FAFAF8',
          }}
        />
        <button
          type="submit"
          className="px-5 py-3 text-sm font-body font-medium transition-all hover:opacity-90 flex items-center gap-2"
          style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd" />
          </svg>
          Caută
        </button>
      </form>

      {/* Categorii rapide */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.key}
            href={`/cautare?q=${encodeURIComponent(query || cat.label)}&cat=${cat.key}`}
            className="font-body text-sm px-4 py-1.5 rounded-full border transition-all hover:border-amber-400"
            style={{ color: '#8A7050', borderColor: '#E8E5E0' }}
          >
            {cat.icon} {cat.label}
          </Link>
        ))}
      </div>

      {/* Rezultate */}
      {query ? (
        totalResults === 0 ? (
          <div className="text-center py-20">
            <span style={{ color: '#D4C8A0', fontSize: '48px' }} aria-hidden="true">☦</span>
            <p className="font-body mt-4 text-lg" style={{ color: '#8A7050' }}>
              Nu s-au găsit rezultate pentru &ldquo;{query}&rdquo;
            </p>
            <p className="font-body text-sm mt-2" style={{ color: '#B0A080' }}>
              Încercați cu Sfânta Scriptură sau navigați prin categorii.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Link href={`/biblie?q=${encodeURIComponent(query)}`}
                className="font-body text-sm px-5 py-2 rounded border transition-all hover:border-amber-400"
                style={{ color: '#8A7050', borderColor: '#E8E5E0' }}>
                Caută în Biblie
              </Link>
              <Link href="/carti"
                className="font-body text-sm px-5 py-2 rounded border transition-all hover:border-amber-400"
                style={{ color: '#8A7050', borderColor: '#E8E5E0' }}>
                Caută în Bibliotecă
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-body text-sm mb-8" style={{ color: '#8A7050' }}>
              {totalResults} rezultate pentru &ldquo;<strong style={{ color: '#3A1A1A' }}>{query}</strong>&rdquo;
            </p>

            {/* Rezultate grupate pe categorii */}
            <div className="space-y-10">
              {Object.entries(results).map(([catKey, items]) => {
                const meta = categoryMeta[catKey] || { label: catKey, color: '#8A7050' }
                return (
                  <section key={catKey}>
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden="true"
                      />
                      <h2 className="font-heading text-xl" style={{ color: '#1C1B3A' }}>
                        {meta.label}
                      </h2>
                      <span className="font-body text-sm" style={{ color: '#8A7050' }}>
                        ({items.length})
                      </span>
                    </div>
                    <div className="h-px mb-4" style={{ backgroundColor: '#E8E5E0' }} />
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i}>
                          <Link
                            href={item.href}
                            className="flex items-center justify-between p-3 rounded group transition-colors hover:bg-amber-50"
                            style={{ border: '1px solid #F0EDE8' }}
                          >
                            <div>
                              <p className="font-body text-sm font-medium group-hover:underline underline-offset-2"
                                style={{ color: '#3A1A1A', textDecorationColor: '#C9A84C' }}>
                                {item.title}
                              </p>
                              {item.excerpt && (
                                <p className="font-body text-xs mt-0.5" style={{ color: '#8A7050' }}>
                                  {item.excerpt}
                                </p>
                              )}
                            </div>
                            <span className="ml-3 transition-transform group-hover:translate-x-1 shrink-0"
                              style={{ color: '#C9A84C' }} aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <span style={{ color: '#D4C8A0', fontSize: '48px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4" style={{ color: '#8A7050' }}>
            Introduceți un termen pentru a căuta în întregul site.
          </p>
        </div>
      )}
    </div>
  )
}
