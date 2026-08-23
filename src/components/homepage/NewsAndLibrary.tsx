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
    <section className="py-16" style={{ position: 'relative', zIndex: 2 }}>
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
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#828EA8' }}>
                  {t.home.ourParish}
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#E9EFFA' }}>
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
            <div className="h-px mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

            {articles.length === 0 ? (
              <p className="font-body italic" style={{ color: '#828EA8' }}>
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
                      style={{ aspectRatio: '16/10', backgroundColor: 'rgba(255,255,255,0.05)' }}
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
                          <span style={{ color: '#828EA8', fontSize: '36px' }} aria-hidden="true">☦</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {featured.category && (
                        <span className="font-body text-xs tracking-wide uppercase mb-1" style={{ color: '#C06050' }}>
                          {featured.category}
                        </span>
                      )}
                      <h3
                        className="font-heading leading-snug group-hover:underline underline-offset-2 line-clamp-3"
                        style={{ color: '#E9EFFA', textDecorationColor: '#C9A84C', fontSize: 'clamp(22px, 2.6vw, 28px)' }}
                      >
                        {featured.title}
                      </h3>
                      {featured.excerpt && (
                        <p className="font-body text-sm leading-relaxed mt-2 line-clamp-3" style={{ color: '#A8B4CC' }}>
                          {featured.excerpt}…
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        {featured.publishedAt && (
                          <time
                            dateTime={featured.publishedAt.toISOString()}
                            className="font-body text-xs"
                            style={{ color: '#828EA8' }}
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
                            style={{ aspectRatio: '16/10', backgroundColor: 'rgba(255,255,255,0.05)' }}
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
                                <span style={{ color: '#828EA8', fontSize: '20px' }} aria-hidden="true">☦</span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="font-heading text-sm leading-snug group-hover:underline underline-offset-2 line-clamp-2"
                            style={{ color: '#E9EFFA', textDecorationColor: '#C9A84C' }}
                          >
                            {article.title}
                          </h3>
                          {article.publishedAt && (
                            <time
                              dateTime={article.publishedAt.toISOString()}
                              className="font-body text-xs mt-1 block"
                              style={{ color: '#828EA8' }}
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
            <div className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
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
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#828EA8' }}>
                  {t.home.sacredTexts}
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#E9EFFA' }}>
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

            {/* Card sticlă — listă bibliotecă */}
            <div className="glass-cobalt p-6">
              {libraryBooks.length === 0 ? (
                <p className="font-body italic" style={{ color: '#828EA8' }}>
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
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <span
                            className="font-body text-xs font-medium tracking-widest uppercase block mb-0.5"
                            style={{ color: '#C06050' }}
                          >
                            {typeLabels[book.type] || book.type}
                          </span>
                          <span
                            className="font-body text-sm leading-snug group-hover:underline underline-offset-2 line-clamp-2"
                            style={{ color: '#E9EFFA', textDecorationColor: '#C9A84C' }}
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
            </div>
          </div>
          )}
        </div>

        {/* ─── Căutare în Sfânta Scriptură — bară lată, centrată ─── */}
        {showLibrary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="glass-cobalt mt-14 p-6 sm:p-8 max-w-2xl mx-auto text-center"
          >
            <p className="font-body text-sm mb-4" style={{ color: '#E9EFFA' }}>
              {t.home.searchInScripture}
            </p>
            <form
              action="/biblie"
              method="get"
              className="flex gap-0 max-w-lg mx-auto overflow-hidden rounded-lg"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <label htmlFor="scripture-search" className="sr-only">{t.bible.searchPlaceholder}</label>
              <input
                id="scripture-search"
                type="search"
                name="q"
                placeholder={t.bible.searchPlaceholder}
                className="flex-1 px-4 py-3 text-sm font-body outline-none bg-transparent"
                style={{ color: '#E9EFFA' }}
              />
              <button
                type="submit"
                className="px-5 py-3 text-sm font-body font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#5A8FE8', color: '#04080F' }}
              >
                {t.bible.searchBtn}
              </button>
            </form>
            <Link
              href="/biblie"
              className="font-body text-xs mt-4 inline-flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: '#C9A84C' }}
            >
              {t.home.orthodoxBibleBtn}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
