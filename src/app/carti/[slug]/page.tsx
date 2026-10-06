import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ContentCoverImage from '@/components/shared/ContentCoverImage'
import PublicGallery from '@/components/PublicGallery'
import ViewBadge from '@/components/ViewBadge'
import ViewTracker from '@/components/ViewTracker'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

const CATEGORY_META = [
  { key: 'ACATIST',   slug: 'acatist',   icon: '☦' },
  { key: 'CANON',     slug: 'canon',     icon: '✝' },
  { key: 'RUGACIUNE', slug: 'rugaciune', icon: '🕯' },
  { key: 'SLUJBA',    slug: 'slujba',    icon: '⛪' },
  { key: 'VIATA',     slug: 'viata',     icon: '✦' },
  { key: 'PREDICA',   slug: 'predica',   icon: '📖' },
  { key: 'ALTELE',    slug: 'altele',    icon: '◆' },
] as const

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

type Props = { params: Promise<{ slug: string }> }

async function getBook(slug: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.libraryBook.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, titleRo: true, type: true,
      contentRo: true, author: true, source: true,
      imageUrl: true, galleryUrls: true, videoUrl: true, videoTitle: true, views: true,
      seoKeywords: true,
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) return {}
  const title = book.titleRo
  const content = book.contentRo
  const plain = content.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title: `${title} | Bibliotecă Ortodoxă`,
    description: plain,
    keywords: book.seoKeywords ? book.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
    alternates: buildAlternates(`/carti/${slug}`),
    openGraph: {
      title, description: plain, type: 'article',
      url: `/carti/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: book.imageUrl ? [{ url: book.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: plain,
      images: book.imageUrl ? [book.imageUrl] : undefined,
    },
  }
}

export default async function CartePage({ params }: Props) {
  const { slug } = await params
  const [book, t, locale] = await Promise.all([getBook(slug), getServerT(), getServerLocale()])
  if (!book) notFound()

  const cat = CATEGORY_META.find(c => c.key === book.type) ?? CATEGORY_META[CATEGORY_META.length - 1]
  const ytId = book.videoUrl ? extractYouTubeId(book.videoUrl) : null
  const galleryItems = (book.galleryUrls || []).map((url, i) => ({
    id: String(i), url, thumbnailUrl: url, caption: null,
  }))
  const title = book.titleRo
  const content = book.contentRo
  const categoryLabel = t.books.categories[cat.key]

  return (
    <PageShell aside="compact">
      <ViewTracker type="carte" id={book.id} />
      <article className="flex flex-col gap-5">
        <PageHead
          size="m"
          crumbs={[{ href: '/', label: t.nav.home }, { href: '/carti', label: t.books.title }, { href: `/carti/categorie/${cat.slug}`, label: categoryLabel }, { label: title }]}
          eyebrow={<><span aria-hidden="true">{cat.icon}</span> {categoryLabel}</>}
          title={title}
        >
          <p className="mute text-[16px]">
            {book.author && <span>{book.author}</span>}
            {book.author && <span> · </span>}
            {book.source && <span>{book.source}</span>}
            {book.source && <span> · </span>}
            <ViewBadge value={book.views} locale={locale} />
          </p>
        </PageHead>

        {book.imageUrl && (
          <ContentCoverImage src={book.imageUrl} alt={title} className="w-full overflow-hidden" sizes="(max-width: 1024px) 100vw, 760px" priority />
        )}

        {ytId && (
          <div className="card flush">
            {book.videoTitle && <p className="h-s" style={{ padding: '16px 24px' }}>🎬 {book.videoTitle}</p>}
            <div style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={book.videoTitle || title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          </div>
        )}

        <div className="card">
          <div className="rich reading" dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {galleryItems.length > 0 && (
          <section className="card" aria-labelledby="galerie-carte">
            <h2 id="galerie-carte" className="eyebrow mb-5">{t.common.gallery}</h2>
            <PublicGallery items={galleryItems} />
          </section>
        )}

        <div className="card flex flex-wrap items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
          <Link href={`/carti/categorie/${cat.slug}`} className="link-gold text-[17px]">← {t.common.backTo} {categoryLabel}</Link>
          <Link href="/carti" className="link-gold text-[17px]">{t.common.allCategories}</Link>
        </div>
      </article>
    </PageShell>
  )
}
