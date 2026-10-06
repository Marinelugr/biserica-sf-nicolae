import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, readingTime } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import ContentCoverImage from '@/components/shared/ContentCoverImage'
import PublicGallery from '@/components/PublicGallery'
import ShareButtons from '@/components/shared/ShareButtons'
import ViewBadge from '@/components/ViewBadge'
import ViewTracker from '@/components/ViewTracker'
import { scheduledGate } from '@/lib/articleVisibility'
import { SITE_URL } from '@/lib/site'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.article.findFirst({ where: { slug, published: true, ...scheduledGate } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return {}
  const title = article.titleRo
  const content = article.contentRo
  const plainText = content.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title,
    description: plainText,
    keywords: article.seoKeywords ? article.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
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

  const { prisma } = await import('@/lib/prisma')
  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'article', entityId: article.id },
    orderBy: { order: 'asc' },
  })

  const title = article.titleRo
  const content = article.contentRo

  return (
    <PageShell aside="compact">
      <ViewTracker type="articol" id={article.id} />
      <article className="flex flex-col gap-5">
        <PageHead
          size="m"
          crumbs={[{ href: '/', label: t.nav.home }, { href: '/stiri', label: t.newsPage.title }, { label: title }]}
          eyebrow={article.category ? <span className="kicker">{article.category}</span> : undefined}
          title={title}
        >
          <p className="date">
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDate(article.publishedAt, localeToIntl(locale))}
              </time>
            )}
            {article.publishedAt && ' · '}
            <span className="mute">
              ~{readingTime(content)} min citire
              {' · '}
              <ViewBadge value={article.views} locale={locale} />
            </span>
          </p>
        </PageHead>

        {article.imageUrl && (
          <ContentCoverImage
            src={article.imageUrl}
            alt={title}
            className="w-full overflow-hidden"
            sizes="(max-width: 1024px) 100vw, 760px"
            priority
          />
        )}

        <div className="card">
          <div className="rich reading" dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {gallery.length > 0 && (
          <section className="card" aria-labelledby="galerie-articol">
            <h2 id="galerie-articol" className="eyebrow mb-5">{t.common.gallery}</h2>
            <PublicGallery items={gallery} />
          </section>
        )}

        <div className="card flex flex-wrap items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
          <Link href="/stiri" className="link-gold text-[17px]">
            ← {t.common.backTo} {t.newsPage.title}
          </Link>
          <ShareButtons url={`${SITE_URL}/stiri/${slug}`} title={title} />
        </div>
      </article>
    </PageShell>
  )
}
