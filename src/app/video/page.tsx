import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import VideoTile from '@/components/shell/VideoTile'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.video.title,
    description: t.meta.video.description,
    alternates: buildAlternates('/video'),
  }
}

type VideoItem = {
  id: string
  title: string
  slug: string
  platform: string
  videoId: string
  startTime: number | null
}

function getThumbnail(platform: string, videoId: string): string | null {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  if (platform === 'vimeo') return `https://vumbnail.com/${videoId}.jpg`
  return null
}

function getWatchUrl(platform: string, videoId: string, startTime: number | null): string {
  if (platform === 'youtube') return `https://www.youtube.com/watch?v=${videoId}${startTime ? `&t=${startTime}s` : ''}`
  if (platform === 'vimeo') return `https://vimeo.com/${videoId}`
  return '#'
}

function VideoCard({ video, catSlug }: { video: VideoItem; catSlug: string | null }) {
  const thumb = getThumbnail(video.platform, video.videoId)
  const href = catSlug ? `/video/${catSlug}/${video.slug}` : getWatchUrl(video.platform, video.videoId, video.startTime)
  return <VideoTile href={href} title={video.title} thumb={thumb} external={!catSlug} />
}

export default async function VideoPage() {
  const t = await getServerT()

  const [categories, uncategorized] = await Promise.all([
    prisma.videoCategory.findMany({
      orderBy: { order: 'asc' },
      include: { videos: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] } },
    }),
    prisma.video.findMany({
      where: { categoryId: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
  ])

  const sections = [
    ...categories
      .filter(cat => cat.videos.length > 0)
      .map(cat => ({ key: cat.id, name: cat.name, slug: cat.slug as string | null, videos: cat.videos })),
    ...(uncategorized.length > 0
      ? [{ key: 'uncategorized', name: t.nav.video, slug: null, videos: uncategorized }]
      : []),
  ]

  const hasVideos = sections.length > 0

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.priest.badge} title={t.video.title} lead={t.video.subtitle} />

      {!hasVideos && (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '24px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3">{t.video.comingSoon}</p>
        </div>
      )}

      {sections.map(section => (
        <section key={section.key} className="flex flex-col gap-4" aria-label={section.name}>
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <h2 className="h-m">
              {section.slug ? (
                <Link href={`/video/${section.slug}`} className="hover:text-gold transition-colors">{section.name}</Link>
              ) : (
                section.name
              )}
            </h2>
            {section.slug && <Link href={`/video/${section.slug}`} className="link-gold text-[17px]">{t.home.viewAllLink}</Link>}
          </div>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-4">
            {section.videos.map(video => (
              <VideoCard key={video.id} video={video} catSlug={section.slug} />
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  )
}
