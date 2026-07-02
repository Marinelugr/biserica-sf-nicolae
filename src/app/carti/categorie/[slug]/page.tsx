import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'

export const dynamic = 'force-dynamic'

const CATEGORY_META = [
  { key: 'ACATIST',  slug: 'acatist',  icon: '☦', color: '#8B1A1A', bg: '#FDF5F5', border: '#F0D5D5' },
  { key: 'CANON',    slug: 'canon',    icon: '✝', color: '#8B6014', bg: '#FDF8EF', border: '#E8D8B0' },
  { key: 'RUGACIUNE',slug: 'rugaciune',icon: '🕯', color: '#6B4A2A', bg: '#FAF5EE', border: '#DDD0B8' },
  { key: 'SLUJBA',   slug: 'slujba',   icon: '⛪', color: '#4A6A2A', bg: '#F5FAF0', border: '#C8D8B8' },
  { key: 'VIATA',    slug: 'viata',    icon: '✦', color: '#1C4A6A', bg: '#F0F5FA', border: '#B8C8D8' },
  { key: 'PREDICA',  slug: 'predica',  icon: '📖', color: '#4A1A6A', bg: '#F5F0FA', border: '#C8B8D8' },
  { key: 'ALTELE',   slug: 'altele',   icon: '◆', color: '#5A5050', bg: '#F8F7F5', border: '#E0DEDA' },
] as const

type CategoryMeta = typeof CATEGORY_META[number]

async function getBooks(type: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.libraryBook.findMany({
    where: { type },
    select: { slug: true, titleRo: true, titleRu: true, titleEn: true, author: true, source: true, ordine: true },
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
    alternates: { canonical: `/carti/categorie/${slug}` },
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

  const [books, t, locale] = await Promise.all([getBooks(cat.key), getServerT(), getServerLocale()])
  const label = t.books.categories[cat.key]
  const description = t.books.categoryDescriptions[cat.key]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-10 font-body text-sm" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          {t.nav.home}
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/carti" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          {t.books.title}
        </Link>
        <span aria-hidden="true">›</span>
        <span>{label}</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-5xl block mb-4" style={{ color: cat.color }} aria-hidden="true">
          {cat.icon}
        </span>
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.books.title}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: '#1C1B3A' }}>
          {label}
        </h1>
        <p className="font-body text-base" style={{ color: '#5A4A3A' }}>
          {description}
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {/* Lista cărți */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <span style={{ color: '#D4C8A0', fontSize: '48px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4 text-lg" style={{ color: '#8A7050' }}>
            {t.books.noTextsInCategory}
          </p>
          <p className="font-body text-sm mt-2" style={{ color: '#C9A84C' }}>
            {t.books.comingSoon}
          </p>
        </div>
      ) : (
        <div>
          <p className="font-body text-sm mb-6 text-right" style={{ color: '#8A7050' }}>
            {books.length} {books.length === 1 ? t.books.textSingular : t.books.textPlural}
          </p>
          <ul
            className="rounded-xl overflow-hidden divide-y shadow-sm"
            style={{ border: `1px solid ${cat.border}`, backgroundColor: cat.bg }}
          >
            {books.map(book => (
              <li key={book.slug}>
                <Link
                  href={`/carti/${book.slug}`}
                  className="flex items-center justify-between px-6 py-4 group transition-colors hover:bg-white/60"
                >
                  <div>
                    <span
                      className="font-body text-base group-hover:underline underline-offset-2 block"
                      style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}
                    >
                      {pick(locale, book.titleRo, book.titleRu, book.titleEn)}
                    </span>
                    {book.author && (
                      <span className="font-body text-xs mt-0.5 block" style={{ color: '#8A7050' }}>
                        {book.author}
                      </span>
                    )}
                  </div>
                  <span
                    className="ml-4 shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: cat.color }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Back */}
      <div className="mt-10 text-center">
        <Link
          href="/carti"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← {t.common.backTo} {t.books.title}
        </Link>
      </div>
    </div>
  )
}
