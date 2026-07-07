import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import PublicGallery from '@/components/PublicGallery'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'

export const dynamic = 'force-dynamic'

const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const FEAST_COLORS: Record<string, string> = { MARE: '#8B1A1A', MIJLOCIE: '#8B6014', MIC: '#5A4020' }

type Props = { params: Promise<{ slug: string }> }

async function getSaint(slug: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.saint.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const saint = await getSaint(slug)
  if (!saint) return {}
  const locale = await getServerLocale()
  const title = pick(locale, saint.nameRo, saint.nameRu, saint.nameEn)
  const life = pick(locale, saint.lifeRo || '', saint.lifeRu, saint.lifeEn)
  const plain = life.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title: `${title} | Sfinți`,
    description: plain || `Viața și prăznuirea ${title}.`,
    alternates: buildAlternates(`/sfintii/${slug}`),
    openGraph: {
      title, description: plain, type: 'article',
      url: `/sfintii/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: saint.iconUrl ? [{ url: saint.iconUrl }] : [],
    },
  }
}

export default async function SaintPage({ params }: Props) {
  const { slug } = await params
  const [saint, t, locale] = await Promise.all([getSaint(slug), getServerT(), getServerLocale()])
  if (!saint) notFound()

  const { prisma } = await import('@/lib/prisma')
  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'saint', entityId: saint.id },
    orderBy: { order: 'asc' },
  })

  const title = pick(locale, saint.nameRo, saint.nameRu, saint.nameEn)
  const life = pick(locale, saint.lifeRo || '', saint.lifeRu, saint.lifeEn)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-10 font-body text-sm flex-wrap" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          {t.nav.home}
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/sfintii" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          {t.saints.title}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-10">
        {saint.iconUrl ? (
          <div className="w-32 h-32 mx-auto mb-5 rounded-full overflow-hidden shadow-md" style={{ border: '2px solid #E8E5E0' }}>
            <Image src={saint.iconUrl} alt={title} width={128} height={128} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <span className="text-4xl block mb-4" style={{ color: '#8B1A1A' }} aria-hidden="true">☦</span>
        )}
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {saint.day} {MONTHS_FULL[saint.month - 1]}
        </p>
        <h1 className="font-heading leading-tight mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(22px, 4vw, 36px)' }}>
          {title}
        </h1>
        {saint.feastType && (
          <span
            className="font-body text-xs px-3 py-1 rounded-full"
            style={{ backgroundColor: FEAST_COLORS[saint.feastType] || '#5A4020', color: '#F2EBD9' }}
          >
            {t.saints.feastTypes[saint.feastType as 'MARE' | 'MIJLOCIE' | 'MIC'] || saint.feastType}
          </span>
        )}
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {/* Content */}
      {life ? (
        <div
          className="font-body prose prose-lg max-w-none"
          style={{ color: '#2A1A0A', lineHeight: 1.9, fontSize: '1.05rem' }}
          dangerouslySetInnerHTML={{ __html: life }}
        />
      ) : (
        <p className="font-body text-center italic" style={{ color: '#8A7050' }}>
          {t.saints.noLifeText}
        </p>
      )}

      {/* Galerie imagini */}
      {gallery.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <span className="font-body text-xs uppercase tracking-[0.3em]" style={{ color: '#8A7050' }}>{t.common.gallery}</span>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <PublicGallery items={gallery} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-14 pt-8 flex items-center justify-center" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href="/sfintii"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          {t.saints.backToList}
        </Link>
      </div>

      <style>{`
        .prose h2 { color: #1C1B3A; font-size: 1.3rem; margin: 2rem 0 0.75rem; font-family: 'Cormorant Garamond', Georgia, serif; }
        .prose h3 { color: #3A2A1A; font-size: 1.1rem; margin: 1.5rem 0 0.5rem; font-family: 'Cormorant Garamond', Georgia, serif; }
        .prose p { margin-bottom: 1.1rem; }
        .prose strong { color: #1C1B3A; }
        .prose em { color: #5A4A3A; }
        .prose ul, .prose ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose li { margin-bottom: 0.4rem; }
        .prose hr { border-color: #E8E5E0; margin: 2rem 0; }
        .prose blockquote { border-left: 3px solid #C9A84C; padding-left: 1rem; color: #5A4A3A; font-style: italic; margin: 1.5rem 0; }
        .prose a { color: #8B1A1A; text-decoration: underline; text-underline-offset: 2px; }
      `}</style>
    </div>
  )
}
