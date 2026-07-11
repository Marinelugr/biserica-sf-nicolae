import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'
import ShareButtons from '@/components/shared/ShareButtons'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://biserica-sf-nicolae.org'

type Props = { params: Promise<{ catSlug: string; videoSlug: string }> }

function getThumbnail(platform: string, videoId: string): string | null {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  if (platform === 'vimeo') return `https://vumbnail.com/${videoId}.jpg`
  return null
}

function getMaxResThumbnail(platform: string, videoId: string): string | null {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  return getThumbnail(platform, videoId)
}

function getEmbedUrl(platform: string, videoId: string, startTime: number | null): string | null {
  if (platform === 'youtube') return `https://www.youtube.com/embed/${videoId}${startTime ? `?start=${startTime}` : ''}`
  if (platform === 'vimeo') return `https://player.vimeo.com/video/${videoId}`
  return null
}

async function getData(catSlug: string, videoSlug: string) {
  const category = await prisma.videoCategory.findUnique({ where: { slug: catSlug } })
  if (!category) return null
  const video = await prisma.video.findUnique({ where: { slug: videoSlug } })
  if (!video || video.categoryId !== category.id) return null
  const similar = await prisma.video.findMany({
    where: { categoryId: category.id, id: { not: video.id } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  })
  return { category, video, similar }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catSlug, videoSlug } = await params
  const data = await getData(catSlug, videoSlug)
  if (!data) return {}
  const { video } = data
  const title = video.title
  const description = video.description || `Vizionează ${video.title} pe site-ul Parohiei Sfântul Ierarh Nicolae.`
  const path = `/video/${catSlug}/${videoSlug}`
  const image = getMaxResThumbnail(video.platform, video.videoId)
  const embedUrl = getEmbedUrl(video.platform, video.videoId, video.startTime)

  return {
    title,
    description,
    alternates: buildAlternates(path),
    openGraph: {
      title,
      description,
      type: 'video.other',
      url: `${SITE_URL}${path}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: image ? [{ url: image, width: 1280, height: 720, alt: title }] : [],
      videos: embedUrl ? [{ url: embedUrl, width: 1280, height: 720 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function VideoDetailPage({ params }: Props) {
  const { catSlug, videoSlug } = await params
  const [data, t, locale] = await Promise.all([getData(catSlug, videoSlug), getServerT(), getServerLocale()])
  if (!data) notFound()
  const { category, video, similar } = data

  const embedUrl = getEmbedUrl(video.platform, video.videoId, video.startTime)
  const shareUrl = `${SITE_URL}/video/${catSlug}/${videoSlug}`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 font-body text-sm flex-wrap" style={{ color: '#8A7050' }}>
        <Link href="/" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.nav.home}</Link>
        <span aria-hidden="true">›</span>
        <Link href="/video" className="hover:underline underline-offset-2" style={{ textDecorationColor: '#C9A84C' }}>{t.nav.video}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/video/${category.slug}`} className="hover:underline underline-offset-2 truncate max-w-[160px]" style={{ textDecorationColor: '#C9A84C' }}>{category.name}</Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[180px]">{video.title}</span>
      </nav>

      {/* Titlu */}
      <h1 className="font-heading leading-tight mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(24px, 4vw, 38px)' }}>
        {video.title}
      </h1>

      {/* Dată */}
      <time className="font-body text-sm block mb-8" style={{ color: '#8A7050' }}>
        {formatDate(video.createdAt, localeToIntl(locale))}
      </time>

      {/* Embed responsive */}
      {embedUrl ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E8E5E0', backgroundColor: '#1C1B3A' }}>
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; fullscreen; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      ) : (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg text-center py-16 font-body"
          style={{ backgroundColor: '#1C1B3A', color: '#C9A84C', border: '1px solid #E8E5E0' }}
        >
          ▶ Vizionează pe {video.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
        </a>
      )}

      {/* Descriere */}
      {video.description && (
        <p className="font-body mt-8 leading-relaxed" style={{ color: '#2A1A0A' }}>
          {video.description}
        </p>
      )}

      {/* Share */}
      <div className="mt-8 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <ShareButtons url={shareUrl} title={video.title} />
      </div>

      {/* Video-uri similare */}
      {similar.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Video-uri similare</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map(v => {
              const thumb = getThumbnail(v.platform, v.videoId)
              return (
                <Link
                  key={v.id}
                  href={`/video/${category.slug}/${v.slug}`}
                  className="group rounded-lg overflow-hidden transition-shadow hover:shadow-md block"
                  style={{ border: '1px solid #E8E5E0' }}
                >
                  <div
                    className="w-full flex items-center justify-center bg-cover bg-center"
                    style={{ aspectRatio: '16/9', backgroundColor: '#1C1B3A', backgroundImage: thumb ? `url(${thumb})` : undefined, position: 'relative' }}
                  >
                    <span
                      className="flex items-center justify-center rounded-full"
                      style={{ color: '#C9A84C', fontSize: '20px', width: '40px', height: '40px', backgroundColor: 'rgba(13,9,5,0.55)' }}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                  </div>
                  <div className="p-3" style={{ backgroundColor: '#FAFAF8' }}>
                    <p className="font-body text-sm leading-snug group-hover:underline" style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}>
                      {v.title}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-14 pt-8" style={{ borderTop: '1px solid #E8E5E0' }}>
        <Link
          href={`/video/${category.slug}`}
          className="font-body text-sm inline-flex items-center gap-1 hover:underline underline-offset-2"
          style={{ color: '#8A7050', textDecorationColor: '#C9A84C' }}
        >
          ← {t.common.backTo} {category.name}
        </Link>
      </div>
    </div>
  )
}
