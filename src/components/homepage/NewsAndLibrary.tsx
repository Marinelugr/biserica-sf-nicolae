'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

interface Article {
  slug: string
  titleRo: string
  imageUrl: string | null
  publishedAt: Date | null
  category: string | null
}

interface LibraryItem {
  slug: string
  titleRo: string
  type: string
}

interface NewsAndLibraryProps {
  articles: Article[]
  libraryBooks: LibraryItem[]
}

const typeLabels: Record<string, string> = {
  ACATIST: 'Acatist',
  CANON: 'Canon',
  BIBLIE: 'Biblie',
  RUGACIUNE: 'Rugăciune',
  VIATA: 'Viața Sfântului',
  SLUJBA: 'Slujbă',
}

export default function NewsAndLibrary({ articles, libraryBooks }: NewsAndLibraryProps) {
  return (
    <section style={{ backgroundColor: '#FFFFFF' }} className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ─── Ultimele Știri (3 coloane) ─── */}
          <div className="lg:col-span-3">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#8A7050' }}>
                  Parohia noastră
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#1C1B3A' }}>
                  Ultimele Știri
                </h2>
              </div>
              <Link
                href="/stiri"
                className="font-body text-sm transition-colors hover:opacity-70"
                style={{ color: '#C9A84C' }}
              >
                Toate →
              </Link>
            </div>

            {/* Divider */}
            <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

            {articles.length === 0 ? (
              <p className="font-body italic" style={{ color: '#8A7050' }}>
                Nu există știri publicate momentan.
              </p>
            ) : (
              <div className="space-y-6">
                {articles.map((article, i) => (
                  <motion.article
                    key={article.slug}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-4 group"
                  >
                    {/* Thumbnail */}
                    <div
                      className="shrink-0 overflow-hidden rounded flex items-center justify-center"
                      style={{ width: '90px', height: '68px', backgroundColor: '#F2EBD9' }}
                    >
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.titleRo}
                          width={90}
                          height={68}
                          sizes="90px"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span style={{ color: '#D4C8A0', fontSize: '24px' }} aria-hidden="true">☦</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      {article.category && (
                        <span
                          className="font-body text-xs tracking-wide uppercase"
                          style={{ color: '#8B1A1A' }}
                        >
                          {article.category}
                        </span>
                      )}
                      <Link href={`/stiri/${article.slug}`}>
                        <h3
                          className="font-heading text-lg leading-snug mt-0.5 group-hover:underline underline-offset-2 line-clamp-2"
                          style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}
                        >
                          {article.titleRo}
                        </h3>
                      </Link>
                      {article.publishedAt && (
                        <time
                          dateTime={article.publishedAt.toISOString()}
                          className="font-body text-xs mt-1 block"
                          style={{ color: '#8A7050' }}
                        >
                          {formatDate(article.publishedAt)}
                        </time>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>

          {/* ─── Divider vertical ─── */}
          <div className="hidden lg:flex justify-center">
            <div className="w-px" style={{ backgroundColor: '#E8E5E0' }} />
          </div>

          {/* ─── Biblioteca Ortodoxă (2 coloane) ─── */}
          <div className="lg:col-span-1">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-body text-xs tracking-widest uppercase mb-1" style={{ color: '#8A7050' }}>
                  Texte sacre
                </p>
                <h2 className="font-heading text-3xl" style={{ color: '#1C1B3A' }}>
                  Bibliotecă
                </h2>
              </div>
              <Link
                href="/carti"
                className="font-body text-sm transition-colors hover:opacity-70"
                style={{ color: '#C9A84C' }}
              >
                Toate →
              </Link>
            </div>

            {/* Divider */}
            <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

            {libraryBooks.length === 0 ? (
              <p className="font-body italic" style={{ color: '#8A7050' }}>
                Biblioteca este în curs de completare.
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
                          {book.titleRo}
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
                Caută în Sfânta Scriptură
              </p>
              <Link
                href="/biblie"
                className="font-body text-sm inline-flex items-center gap-2 px-4 py-2 rounded transition-all hover:opacity-90"
                style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
              >
                ☦ Biblia Ortodoxă
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
