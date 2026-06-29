import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const CATEGORY_META = [
  { key: 'ACATIST',  slug: 'acatist',  icon: '☦', color: '#8B1A1A', bg: '#FDF5F5', border: '#F0D5D5', label: 'Acatiste',       description: 'Acatistele sfinților și ale Maicii Domnului' },
  { key: 'CANON',    slug: 'canon',    icon: '✝', color: '#8B6014', bg: '#FDF8EF', border: '#E8D8B0', label: 'Canoane',        description: 'Canoane de rugăciune și pocăință' },
  { key: 'RUGACIUNE',slug: 'rugaciune',icon: '🕯', color: '#6B4A2A', bg: '#FAF5EE', border: '#DDD0B8', label: 'Rugăciuni',      description: 'Rugăciuni de dimineață, seară și speciale' },
  { key: 'SLUJBA',   slug: 'slujba',   icon: '⛪', color: '#4A6A2A', bg: '#F5FAF0', border: '#C8D8B8', label: 'Slujbe',         description: 'Tipicul slujbelor liturgice ortodoxe' },
  { key: 'VIATA',    slug: 'viata',    icon: '✦', color: '#1C4A6A', bg: '#F0F5FA', border: '#B8C8D8', label: 'Vieți de Sfinți',description: 'Prologul și vieținele sfinților' },
  { key: 'PREDICA',  slug: 'predica',  icon: '📖', color: '#4A1A6A', bg: '#F5F0FA', border: '#C8B8D8', label: 'Predici',        description: 'Cuvântări și predici duhovnicești' },
  { key: 'ALTELE',   slug: 'altele',   icon: '◆', color: '#5A5050', bg: '#F8F7F5', border: '#E0DEDA', label: 'Altele',          description: 'Alte texte liturgice și duhovnicești' },
] as const

type CategoryMeta = typeof CATEGORY_META[number]

async function getBooks(type: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.libraryBook.findMany({
    where: { type },
    select: { slug: true, titleRo: true, author: true, source: true },
    orderBy: { titleRo: 'asc' },
  })
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = CATEGORY_META.find(c => c.slug === slug) as CategoryMeta | undefined
  if (!cat) return {}
  return {
    title: `${cat.label} | Bibliotecă Ortodoxă — Sf. Nicolae Hîrtopul Mic`,
    description: cat.description,
  }
}

export default async function CategoriePage({ params }: Props) {
  const { slug } = await params
  const cat = CATEGORY_META.find(c => c.slug === slug) as CategoryMeta | undefined
  if (!cat) notFound()

  const books = await getBooks(cat.key)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-10 font-body text-sm" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          Acasă
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/carti" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          Bibliotecă Ortodoxă
        </Link>
        <span aria-hidden="true">›</span>
        <span>{cat.label}</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-5xl block mb-4" style={{ color: cat.color }} aria-hidden="true">
          {cat.icon}
        </span>
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          Bibliotecă Ortodoxă
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: '#1C1B3A' }}>
          {cat.label}
        </h1>
        <p className="font-body text-base" style={{ color: '#5A4A3A' }}>
          {cat.description}
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
            Nu sunt texte adăugate în această categorie.
          </p>
          <p className="font-body text-sm mt-2" style={{ color: '#C9A84C' }}>
            Reveniți curând.
          </p>
        </div>
      ) : (
        <div>
          <p className="font-body text-sm mb-6 text-right" style={{ color: '#8A7050' }}>
            {books.length} {books.length === 1 ? 'text' : 'texte'}
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
                      {book.titleRo}
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
          ← Înapoi la Bibliotecă Ortodoxă
        </Link>
      </div>
    </div>
  )
}
