'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
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

export default function NewsAndLibrary({ articles, libraryBooks, showNews, showLibrary }: NewsAndLibraryProps) {
  const { t, locale } = useI18n()
  const typeLabels: Record<string, string> = t.books.categories
  const [featured, ...restArticles] = articles

  if (!showNews && !showLibrary) return null

  return (
    <section style={{ backgroundColor: '#FFFFFF' }} className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ─── Ultimele Știri ─── */}
          {showNews && (
          <div className={showLibrary ? 'lg:col-span-3' : 'lg:col-span-5'}>
            <motion.div
              className="flex items-end justify-between mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div>
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#8A7050' }}>
                  {t.home.ourParish}
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#1C1B3A' }}>
                  {t.home.latestNews}
                </h2>
              </div>
              <Link
                href="/stiri"
                className="font-body text-sm transition-colors hover:opacity-70"
                style={{ color: '#C9A84C' }}
              >
                {t.home.viewAllLink}
              </Link>
            </motion.div>

            {/* Divider */}
            <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

            {articles.length === 0 ? (
              <p className="font-body italic" style={{ color: '#8A7050' }}>
                {t.home.noNews}
              </p>
            ) : (
              <>
                {/* Featured — prima știre */}
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="mb-10 group"
                >
                  <Link href={`/stiri/${featured.slug}`} className="flex flex-col sm:flex-row gap-5">
                    <div
                      className="relative shrink-0 overflow-hidden rounded-lg sm:w-3/5"
                      style={{ aspectRatio: '16/10', backgroundColor: '#F2EBD9' }}
                    >
                      {featured.imageUrl ? (
                        <Image
                          src={featured.imageUrl}
                          alt={featured.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 40vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span style={{ color: '#D4C8A0', fontSize: '36px' }} aria-hidden="true">☦</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {featured.category && (
                        <span className="font-body text-xs tracking-wide uppercase mb-1" style={{ color: '#8B1A1A' }}>
                          {featured.category}
                        </span>
                      )}
                      <h3
                        className="font-heading leading-snug group-hover:underline underline-offset-2 line-clamp-3"
                        style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C', fontSize: 'clamp(22px, 2.6vw, 28px)' }}
                      >
                        {featured.title}
                      </h3>
                      {featured.excerpt && (
                        <p className="font-body text-sm leading-relaxed mt-2 line-clamp-3" style={{ color: '#5A4020' }}>
                          {featured.excerpt}…
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        {featured.publishedAt && (
                          <time
                            dateTime={featured.publishedAt.toISOString()}
                            className="font-body text-xs"
                            style={{ color: '#8A7050' }}
                          >
                            {formatDate(featured.publishedAt, localeToIntl(locale))}
                          </time>
                        )}
                        <span className="font-body text-xs" style={{ color: '#C9A84C' }}>
                          Citește mai mult →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>

                {/* Restul știrilor — grid compact */}
                {restArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {restArticles.map((article, i) => (
                      <motion.article
                        key={article.slug}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="group"
                      >
                        <Link href={`/stiri/${article.slug}`}>
                          <div
                            className="relative overflow-hidden rounded mb-2"
                            style={{ aspectRatio: '16/10', backgroundColor: '#F2EBD9' }}
                          >
                            {article.imageUrl ? (
                              <Image
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 20vw"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span style={{ color: '#D4C8A0', fontSize: '20px' }} aria-hidden="true">☦</span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="font-heading text-sm leading-snug group-hover:underline underline-offset-2 line-clamp-2"
                            style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}
                          >
                            {article.title}
                          </h3>
                          {article.publishedAt && (
                            <time
                              dateTime={article.publishedAt.toISOString()}
                              className="font-body text-xs mt-1 block"
                              style={{ color: '#8A7050' }}
                            >
                              {formatDate(article.publishedAt, localeToIntl(locale))}
                            </time>
                          )}
                        </Link>
                      </motion.article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {/* ─── Divider vertical ─── */}
          {showNews && showLibrary && (
          <div className="hidden lg:flex justify-center">
            <div className="w-px" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          )}

          {/* ─── Biblioteca Ortodoxă ─── */}
          {showLibrary && (
          <div className={showNews ? 'lg:col-span-1' : 'lg:col-span-5'}>
            <motion.div
              className="flex items-end justify-between mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div>
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#8A7050' }}>
                  {t.home.sacredTexts}
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#1C1B3A' }}>
                  {t.home.libraryLabel}
                </h2>
              </div>
              <Link
                href="/carti"
                className="font-body text-sm transition-colors hover:opacity-70"
                style={{ color: '#C9A84C' }}
              >
                {t.home.viewAllLink}
              </Link>
            </motion.div>

            {/* Divider */}
            <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

            {libraryBooks.length === 0 ? (
              <p className="font-body italic" style={{ color: '#8A7050' }}>
                {t.home.libraryInProgress}
              </p>
            ) : (
              <ul className="space-y-0">
                {libraryBooks.map((book, i) => (
                  <motion.li
                    key={book.slug}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      href={`/carti/${book.slug}`}
                      className="flex items-center justify-between py-3.5 group border-b"
                      style={{ borderColor: '#E8E5E0' }}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <span
                          className="font-body text-xs font-medium tracking-widest uppercase block mb-0.5"
                          style={{ color: '#8B1A1A' }}
                        >
                          {typeLabels[book.type] || book.type}
                        </span>
                        <span
                          className="font-body text-sm leading-snug group-hover:underline underline-offset-2 line-clamp-2"
                          style={{ color: '#3A1A1A', textDecorationColor: '#C9A84C' }}
                        >
                          {book.title}
                        </span>
                      </div>
                      <span
                        className="shrink-0 transition-transform group-hover:translate-x-1"
                        style={{ color: '#C9A84C' }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Call to action */}
            <div className="mt-8 p-4 rounded-md" style={{ backgroundColor: '#F2EBD9', border: '1px solid #D4C8A0' }}>
              <p className="font-body text-sm mb-3" style={{ color: '#3A1A1A' }}>
                {t.home.searchInScripture}
              </p>
              <Link
                href="/biblie"
                className="font-body text-sm inline-flex items-center gap-2 px-4 py-2 rounded transition-all hover:opacity-90"
                style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
              >
                {t.home.orthodoxBibleBtn}
              </Link>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
