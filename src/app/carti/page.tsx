import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.carti.title,
    description: t.meta.carti.description,
    alternates: buildAlternates('/carti'),
  }
}

const CATEGORY_META = [
  { key: 'ACATIST',   icon: '☦' },
  { key: 'CANON',     icon: '✝' },
  { key: 'RUGACIUNE', icon: '🕯' },
  { key: 'SLUJBA',    icon: '⛪' },
  { key: 'VIATA',     icon: '✦' },
  { key: 'PREDICA',   icon: '📖' },
  { key: 'ALTELE',    icon: '◆' },
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
      select: { slug: true, titleRo: true, type: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
  } catch {
    return []
  }
}

export default async function CartiPage() {
  const [counts, recentBooks, t] = await Promise.all([getCounts(), getRecentBooks(), getServerT()])
  const totalBooks = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.books.subtitle} title={t.books.title}>
        <div className="mt-2">
          <SearchForm action="/cautare" id="library-search" placeholder={t.books.searchPlaceholder} button={t.books.searchBtn} />
        </div>
      </PageHead>

      {totalBooks === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3 text-[19px]">{t.books.inProgress}</p>
          <p className="gold mt-2 flex items-center justify-center gap-2">
            <span aria-hidden="true">☦</span> {t.books.comingSoon}
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-4" aria-label={t.books.title}>
            {CATEGORY_META.map(cat => {
              const count = counts[cat.key] || 0
              return (
                <Link key={cat.key} href={`/carti/categorie/${cat.key.toLowerCase()}`} className="tile group" data-reveal>
                  <span className="ic" aria-hidden="true">{cat.icon}</span>
                  <h2 className="h-s group-hover:text-gold transition-colors">{t.books.categories[cat.key as CategoryKey]}</h2>
                  {count > 0 && (
                    <span className="mute text-[16px]">
                      {count} {count === 1 ? t.books.textSingular : t.books.textPlural}
                    </span>
                  )}
                </Link>
              )
            })}
          </section>

          {recentBooks.length > 0 && (
            <section className="card" style={{ padding: '22px 24px' }} data-reveal>
              <div className="sec-head" style={{ marginBottom: 6 }}>
                <h2 className="eyebrow">{t.books.recentlyAdded}</h2>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {recentBooks.map(book => {
                  const cat = CATEGORY_META.find(c => c.key === book.type)
                  return (
                    <li key={book.slug} style={{ borderBottom: '1px solid var(--line)' }}>
                      <Link href={`/carti/${book.slug}`} className="flex items-center justify-between gap-3 py-3 group">
                        <span className="flex items-center gap-2.5 min-w-0">
                          {cat && <span className="gold shrink-0" aria-hidden="true">{cat.icon}</span>}
                          <span className="group-hover:text-gold transition-colors">{book.titleRo}</span>
                        </span>
                        <span className="gold shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </PageShell>
  )
}
