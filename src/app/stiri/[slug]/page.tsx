import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatDate, readingTime } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick, localeToIntl } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import ShareButtons from '@/components/shared/ShareButtons'
import ViewBadge from '@/components/ViewBadge'
import ViewTracker from '@/components/ViewTracker'

const SITE_URL = 'https://biserica-sf-nicolae.org'

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
  const locale = await getServerLocale()
  const title = pick(locale, article.titleRo, article.titleRu, article.titleEn)
  const content = pick(locale, article.contentRo, article.contentRu, article.contentEn)
  const plainText = content.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title,
    description: plainText,
    alternates: buildAlternates(`/stiri/${slug}`),
    openGraph: {
      title,
      description: plainText,
      type: 'article',
      url: `/stiri/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      publishedTime: article.publishedAt?.toISOString(),
      images: article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: plainText,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  }
}

export default async function ArticolPage({ params }: Props) {
  const { slug } = await params
  const [article, t, locale] = await Promise.all([getArticle(slug), getServerT(), getServerLocale()])
  if (!article) notFound()

  const title = pick(locale, article.titleRo, article.titleRu, article.titleEn)
  const content = pick(locale, article.contentRo, article.contentRu, article.contentEn)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <ViewTracker type="articol" id={article.id} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 font-body text-sm" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.nav.home}</Link>
        <span aria-hidden="true">›</span>
        <Link href="/stiri" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.newsPage.title}</Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[180px]">{title}</span>
      </nav>

      {/* Categorie */}
      {article.category && (
        <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: '#8B1A1A' }}>
          {article.category}
        </p>
      )}

      {/* Titlu */}
      <h1 className="font-heading leading-tight mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(24px, 4vw, 38px)' }}>
        {title}
      </h1>

      {/* Dată · timp de citire */}
      <p className="font-body text-sm mb-8" style={{ color: '#8A7050' }}>
        {article.publishedAt && (
          <time dateTime={article.publishedAt.toISOString()}>
            {formatDate(article.publishedAt, localeToIntl(locale))}
          </time>
        )}
        {article.publishedAt && ' · '}
        ~{readingTime(content)} min citire
        {' · '}
        <ViewBadge value={article.views} locale={locale} />
      </p>

      {/* Separator */}
      <div className="flex items-center gap-3 mb-10">
        <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
        <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
        <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
      </div>

      {/* Imagine principală */}
      {article.imageUrl && (
        <div className="w-full mb-10 rounded-lg overflow-hidden" style={{ maxHeight: '70vh', display: 'flex', justifyContent: 'center', backgroundColor: '#F2EBD9' }}>
          <Image
            src={article.imageUrl}
            alt={title}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 768px"
            style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
            priority
          />
        </div>
      )}

      {/* Conținut */}
      <div
        className="font-body prose prose-lg max-w-none"
        style={{ color: '#2A1A0A', lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Share */}
      <div className="mt-10 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <ShareButtons url={`${SITE_URL}/stiri/${slug}`} title={title} />
      </div>

      {/* Back */}
      <div className="mt-8 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href="/stiri"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← {t.common.backTo} {t.newsPage.title}
        </Link>
      </div>
    </div>
  )
}
