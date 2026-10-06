import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, readingTime } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { publicArticleWhere } from '@/lib/articleVisibility'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.stiri.title,
    description: t.meta.stiri.description,
    alternates: buildAlternates('/stiri'),
  }
}

async function getArticles() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.article.findMany({
      where: publicArticleWhere,
      select: { slug: true, titleRo: true, imageUrl: true, publishedAt: true, category: true, contentRo: true },
      orderBy: { publishedAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function StiriPage() {
  const [articles, t, locale] = await Promise.all([getArticles(), getServerT(), getServerLocale()])

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.newsPage.badge} title={t.newsPage.title} />

      {articles.length === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '40px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3">{t.newsPage.noArticles}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {articles.map(article => (
            <article key={article.slug} className="news group relative" data-reveal>
              <div className="media">
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.titleRo}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="ph w-full h-full" aria-hidden="true"><span style={{ fontSize: 44 }}>☦</span></div>
                )}
              </div>
              <div className="body">
                {article.category && <span className="kicker">{article.category}</span>}
                <h2 className="h-s">
                  <Link href={`/stiri/${article.slug}`} className="after:absolute after:inset-0 group-hover:text-gold transition-colors">
                    {article.titleRo}
                  </Link>
                </h2>
                <p className="date">
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt.toISOString()}>
                      {formatDate(article.publishedAt, localeToIntl(locale))}
                    </time>
                  )}
                  {article.publishedAt && ' · '}
                  <span className="mute">~{readingTime(article.contentRo)} min citire</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  )
}
