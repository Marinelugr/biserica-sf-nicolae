import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'

interface Article {
  slug: string
  title: string
  imageUrl: string | null
  publishedAt: Date | null
  category: string | null
  excerpt: string
}

interface LibraryItem {
  slug: string
  title: string
  type: string
}

interface NewsAndLibraryProps {
  articles: Article[]
  libraryBooks: LibraryItem[]
  showNews: boolean
  showLibrary: boolean
}

/** Știrile recente (rânduri cu poză) și Biblioteca (rânduri text) ca postări în flux. */
export default async function NewsAndLibrary({ articles, libraryBooks, showNews, showLibrary }: NewsAndLibraryProps) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const typeLabels: Record<string, string> = t.books.categories

  if (!showNews && !showLibrary) return null

  return (
    <>
      {showNews && (
        <>
          <div className="sec-head" style={{ marginTop: 18, marginBottom: 2 }} data-kind="parohie">
            <div>
              <p className="eyebrow">{t.home.ourParish}</p>
              <h2 className="h-m">{t.home.latestNews}</h2>
            </div>
            <Link href="/stiri" className="link-gold text-[17px]">{t.home.viewAllLink}</Link>
          </div>
          {articles.length === 0 ? (
            <p className="mute italic" data-kind="parohie">{t.home.noNews}</p>
          ) : (
            articles.map((article, i) => (
              <Link key={article.slug} href={`/stiri/${article.slug}`} className="card news-row" data-kind="parohie" data-reveal>
                <div className="thumb">
                  {article.imageUrl ? (
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 760px) 100vw, 180px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="ph w-full h-full" aria-hidden="true"><span style={{ fontSize: 28 }}>☦</span></div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="kicker">{article.category || t.shell.kindParish}</span>
                  <h3 className="h-s line-clamp-3">{article.title}</h3>
                  {i === 0 && article.excerpt && (
                    <p className="mute text-[17px] leading-snug line-clamp-2">{article.excerpt}…</p>
                  )}
                  <span className="flex flex-wrap items-center gap-x-3 text-[16px]">
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt.toISOString()} className="date">
                        {formatDate(article.publishedAt, localeToIntl(locale))}
                      </time>
                    )}
                    <span className="gold">Citește mai mult →</span>
                  </span>
                </div>
              </Link>
            ))
          )}
        </>
      )}

      {showLibrary && (
        <>
          <div className="sec-head" style={{ marginTop: 18, marginBottom: 2 }} data-kind="biblioteca">
            <div>
              <p className="eyebrow">{t.home.sacredTexts}</p>
              <h2 className="h-m">{t.home.libraryLabel}</h2>
            </div>
            <Link href="/carti" className="link-gold text-[17px]">{t.home.viewAllLink}</Link>
          </div>
          {libraryBooks.length === 0 ? (
            <p className="mute italic" data-kind="biblioteca">{t.home.libraryInProgress}</p>
          ) : (
            libraryBooks.map(book => (
              <Link
                key={book.slug}
                href={`/carti/${book.slug}`}
                className="card flex items-center justify-between gap-4"
                style={{ padding: '18px 24px' }}
                data-kind="biblioteca"
                data-reveal
              >
                <span className="min-w-0">
                  <span className="kicker blue block">{typeLabels[book.type] || book.type}</span>
                  <span className="h-s block">{book.title}</span>
                </span>
                <span className="gold shrink-0 text-[17px]">{t.shell.read}</span>
              </Link>
            ))
          )}
        </>
      )}
    </>
  )
}
