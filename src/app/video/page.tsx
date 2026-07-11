import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Video Ortodox',
  description: 'Filme ortodoxe, acatiste video, conferințe, predici și rugăciuni. Colecția video a Parohiei Sfântul Ierarh Nicolae.',
  alternates: buildAlternates('/video'),
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
  const external = !catSlug

  const content = (
    <>
      <div
        className="w-full flex items-center justify-center bg-cover bg-center"
        style={{
          aspectRatio: '16/9',
          backgroundColor: '#1C1B3A',
          backgroundImage: thumb ? `url(${thumb})` : undefined,
          position: 'relative',
        }}
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
    </>
  )

  const className = 'group rounded-lg overflow-hidden transition-shadow hover:shadow-md block'
  const style = { border: '1px solid #E8E5E0' }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  )
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
    <div>
      {/* Hero dark */}
      <div
        className="py-16 px-4 text-center"
        style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}
      >
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          {t.priest.badge}
        </p>
        <h1
          className="font-heading italic leading-tight mb-5"
          style={{ color: '#C9A84C', fontSize: 'clamp(44px, 7vw, 70px)', fontWeight: 400 }}
        >
          {t.video.title}
        </h1>
        <p className="font-body" style={{ color: '#6A5030', fontSize: '16px' }}>
          {t.video.subtitle}
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!hasVideos && (
          <div
            className="mb-12 p-5 rounded-lg text-center"
            style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}
          >
            <span style={{ color: '#C9A84C', fontSize: '24px' }} aria-hidden="true">☦</span>
            <p className="font-body text-sm mt-3" style={{ color: '#6A5030' }}>
              {t.video.comingSoon}
            </p>
          </div>
        )}

        {/* Categorii video */}
        <div className="space-y-14">
          {sections.map(section => (
            <section key={section.key}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl" aria-hidden="true">🎬</span>
                {section.slug ? (
                  <Link href={`/video/${section.slug}`} className="hover:underline underline-offset-4" style={{ textDecorationColor: '#C9A84C' }}>
                    <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>
                      {section.name}
                    </h2>
                  </Link>
                ) : (
                  <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>
                    {section.name}
                  </h2>
                )}
                <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {section.videos.map(video => (
                  <VideoCard key={video.id} video={video} catSlug={section.slug} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
