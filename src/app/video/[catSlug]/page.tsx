import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { prisma } from '@/lib/prisma'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import VideoTile from '@/components/shell/VideoTile'

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
    <PageShell aside="compact">
      <PageHead crumbs={[{ href: '/', label: t.nav.home }, { href: '/video', label: t.nav.video }, { label: category.name }]} title={category.name} />

      {category.videos.length === 0 ? (
        <div className="card"><p className="mute">{t.video.comingSoon}</p></div>
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-4">
          {category.videos.map(video => (
            <VideoTile
              key={video.id}
              href={`/video/${category.slug}/${video.slug}`}
              title={video.title}
              thumb={getThumbnail(video.platform, video.videoId)}
            />
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '20px 24px' }}>
        <Link href="/video" className="link-gold text-[17px]">← {t.common.backTo} {t.nav.video}</Link>
      </div>
    </PageShell>
  )
}
