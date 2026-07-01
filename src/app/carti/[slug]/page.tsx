import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import PublicGallery from '@/components/PublicGallery'

export const dynamic = 'force-dynamic'

const CATEGORY_META = [
  { key: 'ACATIST',   slug: 'acatist',   icon: '☦', color: '#8B1A1A', label: 'Acatiste' },
  { key: 'CANON',     slug: 'canon',     icon: '✝', color: '#8B6014', label: 'Canoane' },
  { key: 'RUGACIUNE', slug: 'rugaciune', icon: '🕯', color: '#6B4A2A', label: 'Rugăciuni' },
  { key: 'SLUJBA',    slug: 'slujba',    icon: '⛪', color: '#4A6A2A', label: 'Slujbe' },
  { key: 'VIATA',     slug: 'viata',     icon: '✦', color: '#1C4A6A', label: 'Vieți de Sfinți' },
  { key: 'PREDICA',   slug: 'predica',   icon: '📖', color: '#4A1A6A', label: 'Predici' },
  { key: 'ALTELE',    slug: 'altele',    icon: '◆', color: '#5A5050', label: 'Altele' },
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
      slug: true, titleRo: true, type: true,
      contentRo: true, author: true, source: true,
      imageUrl: true, galleryUrls: true, videoUrl: true, videoTitle: true,
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) return {}
  const plain = book.contentRo.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title: `${book.titleRo} | Bibliotecă Ortodoxă`,
    description: plain,
    alternates: { canonical: `/carti/${slug}` },
    openGraph: {
      title: book.titleRo, description: plain, type: 'article',
      url: `/carti/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: book.imageUrl ? [{ url: book.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: book.titleRo,
      description: plain,
      images: book.imageUrl ? [book.imageUrl] : undefined,
    },
  }
}

export default async function CartePage({ params }: Props) {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) notFound()

  const cat = CATEGORY_META.find(c => c.key === book.type) ?? CATEGORY_META[CATEGORY_META.length - 1]
  const ytId = book.videoUrl ? extractYouTubeId(book.videoUrl) : null
  const galleryItems = (book.galleryUrls || []).map((url, i) => ({
    id: String(i), url, thumbnailUrl: url, caption: null,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-10 font-body text-sm flex-wrap" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          Acasă
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/carti" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          Bibliotecă Ortodoxă
        </Link>
        <span aria-hidden="true">›</span>
        <Link href={`/carti/categorie/${cat.slug}`} className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>
          {cat.label}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[200px]">{book.titleRo}</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-4xl block mb-4" style={{ color: cat.color }} aria-hidden="true">
          {cat.icon}
        </span>
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {cat.label}
        </p>
        <h1 className="font-heading leading-tight mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(22px, 4vw, 36px)' }}>
          {book.titleRo}
        </h1>
        {(book.author || book.source) && (
          <p className="font-body text-sm" style={{ color: '#8A7050' }}>
            {book.author && <span>{book.author}</span>}
            {book.author && book.source && <span> · </span>}
            {book.source && <span>{book.source}</span>}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {/* Imagine principală (cover) */}
      {book.imageUrl && (
        <div className="w-full mb-10 rounded-xl overflow-hidden shadow-md" style={{ maxHeight: '70vh', display: 'flex', justifyContent: 'center', backgroundColor: '#F2EBD9' }}>
          <Image
            src={book.imageUrl}
            alt={book.titleRo}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 768px"
            style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
            priority
          />
        </div>
      )}

      {/* Video */}
      {ytId && (
        <div className="mb-10">
          {book.videoTitle && (
            <p className="font-body text-sm font-semibold mb-3" style={{ color: '#5A4A3A' }}>
              🎬 {book.videoTitle}
            </p>
          )}
          <div className="rounded-xl overflow-hidden shadow-md" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={book.videoTitle || book.titleRo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* Conținut */}
      <div
        className="font-body prose prose-lg max-w-none"
        style={{ color: '#2A1A0A', lineHeight: 1.9, fontSize: '1.05rem' }}
        dangerouslySetInnerHTML={{ __html: book.contentRo }}
      />

      {/* Galerie imagini */}
      {galleryItems.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <span className="font-body text-xs uppercase tracking-[0.3em]" style={{ color: '#8A7050' }}>Galerie foto</span>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <PublicGallery items={galleryItems} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href={`/carti/categorie/${cat.slug}`}
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← Înapoi la {cat.label}
        </Link>
        <Link
          href="/carti"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          Toate categoriile →
        </Link>
      </div>

      <style>{`
        .prose h2 { color: #1C1B3A; font-size: 1.3rem; margin: 2rem 0 0.75rem; font-family: 'Cormorant Garamond', Georgia, serif; }
        .prose h3 { color: #3A2A1A; font-size: 1.1rem; margin: 1.5rem 0 0.5rem; font-family: 'Cormorant Garamond', Georgia, serif; }
        .prose p { margin-bottom: 1.1rem; }
        .prose strong { color: #1C1B3A; }
        .prose em { color: #5A4A3A; }
        .prose ul, .prose ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose li { margin-bottom: 0.4rem; }
        .prose hr { border-color: #E8E5E0; margin: 2rem 0; }
        .prose blockquote { border-left: 3px solid #C9A84C; padding-left: 1rem; color: #5A4A3A; font-style: italic; margin: 1.5rem 0; }
        .prose a { color: #8B1A1A; text-decoration: underline; text-underline-offset: 2px; }
      `}</style>
    </div>
  )
}
