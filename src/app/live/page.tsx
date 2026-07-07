import type { Metadata } from 'next'
import { getCombinedLiveStatus, getLastArchivedLive } from '@/lib/live-stream'
import LiveView from '@/components/live/LiveView'
import { buildAlternates } from '@/lib/i18n/alternates'

export const dynamic = 'force-dynamic'

const DEFAULT_TITLE = 'Transmisiuni Live | Sf. Nicolae Hîrtopul Mic'
const DEFAULT_DESCRIPTION = 'Urmăriți Sfânta Liturghie în direct pe website-ul oficial al Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, Moldova.'

export async function generateMetadata(): Promise<Metadata> {
  const status = await getCombinedLiveStatus()

  const title = status.isLive && status.title ? status.title : DEFAULT_TITLE
  const description = status.isLive
    ? 'Urmăriți Sfânta Liturghie în direct chiar acum.'
    : DEFAULT_DESCRIPTION
  const image = status.isLive && status.thumbnail ? status.thumbnail : 'https://biserica-sf-nicolae.org/live/opengraph-image'

  return {
    title,
    description,
    alternates: buildAlternates('/live'),
    openGraph: {
      title,
      description,
      url: 'https://biserica-sf-nicolae.org/live',
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      type: 'website',
      locale: 'ro_RO',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function LivePage() {
  const status = await getCombinedLiveStatus()
  const lastArchived = status.isLive ? null : await getLastArchivedLive()
  const channelId = process.env.YOUTUBE_CHANNEL_ID
  const subscribeUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`
    : 'https://www.youtube.com'

  return (
    <div style={{ backgroundColor: '#0D0905', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="py-16 px-4 text-center"
        style={{ borderBottom: '1px solid #1E1208' }}
      >
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Parohia Sfântul Ierarh Nicolae
        </p>
        <h1
          className="font-heading italic leading-tight mb-5"
          style={{ color: '#C9A84C', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 400 }}
        >
          Transmisiune în direct
        </h1>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LiveView initialStatus={status} lastArchived={lastArchived} subscribeUrl={subscribeUrl} />
      </div>
    </div>
  )
}
