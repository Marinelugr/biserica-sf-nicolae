import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import type { Translations } from '@/lib/i18n/ro'
import type { Locale } from '@/lib/i18n/pick'
import { localeToIntl } from '@/lib/i18n/pick'
import { isDisplayableImageUrl } from '@/lib/imageLoad'
import { shelfGroup } from '@/lib/sectionTheme'
import SectionPanel from '@/components/shell/SectionPanel'

export interface NewsArticle {
  slug: string
  title: string
  imageUrl: string | null
  publishedAt: Date | null
  category: string | null
  excerpt: string
}

export interface LibraryItem {
  slug: string
  title: string
  type: string
}

export interface NewsAndLibraryViewProps {
  articles: NewsArticle[]
  libraryBooks: LibraryItem[]
  showNews: boolean
  showLibrary: boolean
  t: Translations
  locale: Locale
}

function Thumb({ article, label, sizes }: { article: NewsArticle; label: string; sizes: string }) {
  return (
    <div className="thumb">
      {isDisplayableImageUrl(article.imageUrl) ? (
        <Image src={article.imageUrl} alt={article.title} fill sizes={sizes} style={{ objectFit: 'cover' }} />
      ) : (
        <div className="ph w-full h-full" aria-hidden="true"><span style={{ fontSize: 28 }}>☦</span></div>
      )}
      <span className="cat-tag">{label}</span>
    </div>
  )
}

/**
 * Știrile (panou de ziar: prima știre mare, apoi rânduri numerotate) și
 * Biblioteca (un singur raft, cotor colorat după tip) — prezentare pură.
 */
export default function NewsAndLibraryView({ articles, libraryBooks, showNews, showLibrary, t, locale }: NewsAndLibraryViewProps) {
  const typeLabels: Record<string, string> = t.books.categories
  const intl = localeToIntl(locale)
  const [lead, ...rest] = articles

  if (!showNews && !showLibrary) return null

  const date = (a: NewsArticle) => a.publishedAt && (
    <time dateTime={a.publishedAt.toISOString()} className="date">{formatDate(a.publishedAt, intl)}</time>
  )

  return (
    <>
      {showNews && (
        <SectionPanel
          sec="stiri"
          kind="parohie"
          headingId="sec-stiri"
          eyebrow={t.home.ourParish}
          title={t.home.latestNews}
          action={<Link href="/stiri" className="link-gold text-[17px]">{t.home.viewAllLink}</Link>}
        >
          {!lead ? (
            <p className="mute italic">{t.home.noNews}</p>
          ) : (
            <>
              <Link href={`/stiri/${lead.slug}`} className="news-lead group">
                <Thumb article={lead} label={lead.category || t.shell.kindParish} sizes="(max-width: 760px) 100vw, 400px" />
                <div className="flex flex-col gap-2 min-w-0">
                  <span className="news-no">01</span>
                  <h3 className="h-s line-clamp-3 group-hover:text-gold transition-colors">{lead.title}</h3>
                  {lead.excerpt && <p className="mute text-[17px] leading-snug line-clamp-3">{lead.excerpt}…</p>}
                  <span className="flex flex-wrap items-center gap-x-3 text-[16px]">
                    {date(lead)}
                    <span className="link-gold">Citește mai mult →</span>
                  </span>
                </div>
              </Link>
              {rest.map((article, i) => (
                <Link key={article.slug} href={`/stiri/${article.slug}`} className="sec-row">
                  <span className="row-no" aria-hidden="true">{String(i + 2).padStart(2, '0')}</span>
                  <Thumb article={article} label={article.category || t.shell.kindParish} sizes="148px" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="h-s line-clamp-3">{article.title}</h3>
                    <span className="text-[16px]">{date(article)}</span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </SectionPanel>
      )}

      {showLibrary && (
        <SectionPanel
          sec="biblioteca"
          kind="biblioteca"
          headingId="sec-biblioteca"
          eyebrow={t.home.sacredTexts}
          title={t.home.libraryLabel}
          action={<Link href="/carti" className="link-gold text-[17px]">{t.home.viewAllLink}</Link>}
        >
          {libraryBooks.length === 0 ? (
            <p className="mute italic">{t.home.libraryInProgress}</p>
          ) : (
            libraryBooks.map(book => (
              <Link key={book.slug} href={`/carti/${book.slug}`} className="sec-row shelf-row justify-between" data-shelf={shelfGroup(book.type)}>
                <span className="min-w-0">
                  <span className="kicker block">{typeLabels[book.type] || book.type}</span>
                  <span className="h-s block">{book.title}</span>
                </span>
                <span className="link-gold shrink-0 text-[17px]">{t.shell.read}</span>
              </Link>
            ))
          )}
        </SectionPanel>
      )}
    </>
  )
}
