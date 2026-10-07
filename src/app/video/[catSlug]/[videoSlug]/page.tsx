import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'
import ShareButtons from '@/components/shared/ShareButtons'
import ViewBadge from '@/components/ViewBadge'
import ViewTracker from '@/components/ViewTracker'
import { SITE_URL } from '@/lib/site'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import VideoTile from '@/components/shell/VideoTile'

export const dynamic = 'force-dynamic'

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
    <PageShell aside="compact">
      <ViewTracker type="video" id={video.id} />
      <article className="flex flex-col gap-5">
        <PageHead
          size="m"
          crumbs={[{ href: '/', label: t.nav.home }, { href: '/video', label: t.nav.video }, { href: `/video/${category.slug}`, label: category.name }, { label: video.title }]}
          title={video.title}
        >
          <p className="date">
            <time dateTime={video.createdAt.toISOString()}>{formatDate(video.createdAt, localeToIntl(locale))}</time>
            {' · '}
            <span className="mute"><ViewBadge value={video.views} locale={locale} /></span>
          </p>
        </PageHead>

        {embedUrl ? (
          <div className="card flush" style={{ borderRadius: 22 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
              <iframe
                src={embedUrl}
                title={video.title}
                allow="accelerometer; fullscreen; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        ) : (
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="card ph flex-col gap-4 py-16 text-center" style={{ borderRadius: 22 }}>
            <span className="play" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="gold">▶ Vizionează pe {video.platform === 'youtube' ? 'YouTube' : 'Vimeo'}</span>
          </a>
        )}

        {video.description && (
          <div className="card"><p className="reading" style={{ whiteSpace: 'pre-line' }}>{video.description}</p></div>
        )}

        <div className="card flex flex-wrap items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
          <Link href={`/video/${category.slug}`} className="link-gold text-[17px]">← {t.common.backTo} {category.name}</Link>
          <ShareButtons url={shareUrl} title={video.title} />
        </div>
      </article>

      {similar.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="video-similare">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <h2 id="video-similare" className="h-m">Video-uri similare</h2>
          </div>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-4">
            {similar.map(v => (
              <VideoTile key={v.id} href={`/video/${category.slug}/${v.slug}`} title={v.title} thumb={getThumbnail(v.platform, v.videoId)} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
