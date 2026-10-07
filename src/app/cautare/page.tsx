import type { Metadata } from 'next'
import Link from 'next/link'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getServerT } from '@/lib/i18n/server'
import { scheduledGate } from '@/lib/articleVisibility'
import { buildWordWhere } from '@/lib/search'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.cautare.title,
    description: t.meta.cautare.description,
    alternates: buildAlternates('/cautare'),
  }
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

  // Potrivire pe cuvinte individuale: toate cuvintele din query trebuie găsite
  // în titlu SAU conținut, dar nu neapărat consecutive sau în aceeași ordine.
  const bookWhere = buildWordWhere(query, ['titleRo', 'contentRo'])
  const articleWhere = buildWordWhere(query, ['titleRo', 'contentRo'])
  const saintWhere = buildWordWhere(query, ['nameRo', 'lifeRo'])

  try {
    const { prisma } = await import('@/lib/prisma')

    const [books, articles, saints] = await Promise.all([
      prisma.libraryBook.findMany({
        where: bookWhere,
        select: { slug: true, titleRo: true, type: true },
        take: 8,
      }),
      prisma.article.findMany({
        where: {
          published: true,
          AND: [
            scheduledGate,
            ...(articleWhere ? [articleWhere] : []),
          ],
        },
        select: { slug: true, titleRo: true, category: true },
        take: 8,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.saint.findMany({
        where: saintWhere,
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
  biblie: { label: 'Biblie', color: 'var(--blue)' },
  articole: { label: 'Articole', color: 'var(--rose)' },
  rugaciuni: { label: 'Rugăciuni', color: 'var(--gold)' },
  carti: { label: 'Cărți', color: 'var(--gold-d)' },
  sfinti: { label: 'Sfinți', color: 'var(--red)' },
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
    <PageShell aside="compact">
      <PageHead title="Căutare">
        <div className="mt-2">
          <SearchForm action="/cautare" id="search-input" placeholder="Caută pe site..." button="Caută" defaultValue={query} />
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {CATEGORIES.map(cat => (
            <Link key={cat.key} href={`/cautare?q=${encodeURIComponent(query || cat.label)}&cat=${cat.key}`} className="chip">
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>
      </PageHead>

      {query ? (
        totalResults === 0 ? (
          <div className="card text-center">
            <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
            <p className="mt-3 text-[19px]">Nu s-au găsit rezultate pentru &ldquo;{query}&rdquo;</p>
            <p className="mute text-[16px] mt-2">Încercați cu Sfânta Scriptură sau navigați prin categorii.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <Link href={`/biblie?q=${encodeURIComponent(query)}`} className="btn">Caută în Biblie</Link>
              <Link href="/carti" className="btn">Caută în Bibliotecă</Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mute text-[17px]">
              {totalResults} rezultate pentru &ldquo;<strong className="text-ink">{query}</strong>&rdquo;
            </p>
            {Object.entries(results).map(([catKey, items]) => {
              const meta = categoryMeta[catKey] || { label: catKey, color: 'var(--mute)' }
              return (
                <section key={catKey} className="card" style={{ padding: '22px 24px' }} data-reveal>
                  <div className="sec-head" style={{ marginBottom: 6 }}>
                    <h2 className="h-s flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                      {meta.label}
                      <span className="mute text-[16px] font-normal">({items.length})</span>
                    </h2>
                  </div>
                  <ul>
                    {items.map((item, i) => (
                      <li key={i} style={i < items.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                        <Link href={item.href} className="flex items-center justify-between gap-3 py-3 group">
                          <span className="min-w-0">
                            <span className="block group-hover:text-gold transition-colors">{item.title}</span>
                            {item.excerpt && <span className="block mute text-[16px] mt-0.5">{item.excerpt}</span>}
                          </span>
                          <span className="gold shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </>
        )
      ) : (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3">Introduceți un termen pentru a căuta în întregul site.</p>
        </div>
      )}
    </PageShell>
  )
}
