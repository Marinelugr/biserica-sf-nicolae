import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

const CATEGORY_META = [
  { key: 'ACATIST',  slug: 'acatist',  icon: '☦' },
  { key: 'CANON',    slug: 'canon',    icon: '✝' },
  { key: 'RUGACIUNE',slug: 'rugaciune',icon: '🕯' },
  { key: 'SLUJBA',   slug: 'slujba',   icon: '⛪' },
  { key: 'VIATA',    slug: 'viata',    icon: '✦' },
  { key: 'PREDICA',  slug: 'predica',  icon: '📖' },
  { key: 'ALTELE',   slug: 'altele',   icon: '◆' },
] as const

type CategoryMeta = typeof CATEGORY_META[number]

async function getBooks(type: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.libraryBook.findMany({
    where: { type },
    select: { slug: true, titleRo: true, author: true, source: true, ordine: true },
    orderBy: [{ ordine: 'asc' }, { titleRo: 'asc' }],
  })
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = CATEGORY_META.find(c => c.slug === slug) as CategoryMeta | undefined
  if (!cat) return {}
  const t = await getServerT()
  const label = t.books.categories[cat.key]
  const description = t.books.categoryDescriptions[cat.key]
  return {
    title: `${label} | Bibliotecă Ortodoxă — Sf. Nicolae Hîrtopul Mic`,
    description,
    alternates: buildAlternates(`/carti/categorie/${slug}`),
    openGraph: {
      title: `${label} | Bibliotecă Ortodoxă`,
      description,
      type: 'website',
      url: `/carti/categorie/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
    },
  }
}

export default async function CategoriePage({ params }: Props) {
  const { slug } = await params
  const cat = CATEGORY_META.find(c => c.slug === slug) as CategoryMeta | undefined
  if (!cat) notFound()

  const [books, t] = await Promise.all([getBooks(cat.key), getServerT()])
  const label = t.books.categories[cat.key]
  const description = t.books.categoryDescriptions[cat.key]

  return (
    <PageShell aside="compact">
      <PageHead
        crumbs={[{ href: '/', label: t.nav.home }, { href: '/carti', label: t.books.title }, { label }]}
        eyebrow={<><span aria-hidden="true">{cat.icon}</span> {t.books.title}</>}
        title={label}
      >
        <p className="mute text-[19px]">{description}</p>
      </PageHead>

      {books.length === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3 text-[19px]">{t.books.noTextsInCategory}</p>
          <p className="gold mt-2">{t.books.comingSoon}</p>
        </div>
      ) : (
        <section className="card" style={{ padding: '14px 24px' }}>
          <p className="mute text-[16px] text-right pt-2">
            {books.length} {books.length === 1 ? t.books.textSingular : t.books.textPlural}
          </p>
          <ul>
            {books.map((book, i) => (
              <li key={book.slug} style={i < books.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                <Link href={`/carti/${book.slug}`} className="flex items-center justify-between gap-4 py-4 group">
                  <span className="min-w-0">
                    <span className="h-s block group-hover:text-gold transition-colors" style={{ fontSize: 21 }}>{book.titleRo}</span>
                    {book.author && <span className="mute text-[16px] block mt-0.5">{book.author}</span>}
                  </span>
                  <span className="gold shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card" style={{ padding: '20px 24px' }}>
        <Link href="/carti" className="link-gold text-[17px]">
          ← {t.common.backTo} {t.books.title}
        </Link>
      </div>
    </PageShell>
  )
}
