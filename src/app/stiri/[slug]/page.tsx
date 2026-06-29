import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.article.findUnique({ where: { slug, published: true } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return {}
  const plainText = article.contentRo.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title: article.titleRo,
    description: plainText,
    openGraph: {
      title: article.titleRo,
      description: plainText,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      images: article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630, alt: article.titleRo }] : [],
    },
  }
}

export default async function ArticolPage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 font-body text-sm" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>Acasă</Link>
        <span aria-hidden="true">›</span>
        <Link href="/stiri" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>Știri & Articole</Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[180px]">{article.titleRo}</span>
      </nav>

      {/* Categorie */}
      {article.category && (
        <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: '#8B1A1A' }}>
          {article.category}
        </p>
      )}

      {/* Titlu */}
      <h1 className="font-heading leading-tight mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(24px, 4vw, 38px)' }}>
        {article.titleRo}
      </h1>

      {/* Dată */}
      {article.publishedAt && (
        <time className="font-body text-sm block mb-8" style={{ color: '#8A7050' }}>
          {formatDate(article.publishedAt)}
        </time>
      )}

      {/* Separator */}
      <div className="flex items-center gap-3 mb-10">
        <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
        <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
        <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
      </div>

      {/* Imagine principală */}
      {article.imageUrl && (
        <div className="relative w-full mb-10 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <Image
            src={article.imageUrl}
            alt={article.titleRo}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Conținut */}
      <div
        className="font-body prose prose-lg max-w-none"
        style={{ color: '#2A1A0A', lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: article.contentRo }}
      />

      {/* Back */}
      <div className="mt-14 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href="/stiri"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← Înapoi la Știri & Articole
        </Link>
      </div>
    </div>
  )
}
