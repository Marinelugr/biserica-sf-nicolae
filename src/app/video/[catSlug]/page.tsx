import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ catSlug: string }> }

async function getCategory(slug: string) {
  return prisma.videoCategory.findUnique({
    where: { slug },
    include: { videos: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] } },
  })
}

function getThumbnail(platform: string, videoId: string): string | null {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  if (platform === 'vimeo') return `https://vumbnail.com/${videoId}.jpg`
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug } = await params
  const category = await getCategory(catSlug)
  if (!category) return {}
  const title = category.name
  const description = `${category.videos.length} video-uri în categoria ${category.name}. Colecția video a Parohiei Sfântul Ierarh Nicolae.`
  return {
    title,
    description,
    alternates: buildAlternates(`/video/${catSlug}`),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/video/${catSlug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: category.videos[0] ? [{ url: `https://img.youtube.com/vi/${category.videos[0].videoId}/maxresdefault.jpg`, width: 1280, height: 720, alt: title }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function VideoCategoryPage({ params }: Props) {
  const { catSlug } = await params
  const [category, t] = await Promise.all([getCategory(catSlug), getServerT()])
  if (!category) notFound()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 font-body text-sm" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.nav.home}</Link>
        <span aria-hidden="true">›</span>
        <Link href="/video" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.nav.video}</Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[180px]">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <span className="text-2xl" aria-hidden="true">🎬</span>
        <h1 className="font-heading text-3xl" style={{ color: '#1C1B3A' }}>{category.name}</h1>
        <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
      </div>

      {category.videos.length === 0 ? (
        <p className="font-body text-sm" style={{ color: '#8A7050' }}>{t.video.comingSoon}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {category.videos.map(video => {
            const thumb = getThumbnail(video.platform, video.videoId)
            return (
              <Link
                key={video.id}
                href={`/video/${category.slug}/${video.slug}`}
                className="group rounded-lg overflow-hidden transition-shadow hover:shadow-md block"
                style={{ border: '1px solid #E8E5E0' }}
              >
                <div
                  className="w-full flex items-center justify-center bg-cover bg-center"
                  style={{ aspectRatio: '16/9', backgroundColor: '#1C1B3A', backgroundImage: thumb ? `url(${thumb})` : undefined, position: 'relative' }}
                >
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{ color: '#C9A84C', fontSize: '22px', width: '48px', height: '48px', backgroundColor: 'rgba(13,9,5,0.55)' }}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </div>
                <div className="p-3" style={{ backgroundColor: '#FAFAF8' }}>
                  <p className="font-body text-sm leading-snug group-hover:underline" style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}>
                    {video.title}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-14 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href="/video"
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← {t.common.backTo} {t.nav.video}
        </Link>
      </div>
    </div>
  )
}
