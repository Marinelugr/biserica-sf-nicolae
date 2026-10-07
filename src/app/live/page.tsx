import type { Metadata } from 'next'
import { getCombinedLiveStatus, getLastArchivedLive } from '@/lib/live-stream'
import LiveView from '@/components/live/LiveView'
import { buildAlternates } from '@/lib/i18n/alternates'
import { SITE_URL } from '@/lib/site'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

const DEFAULT_TITLE = 'Transmisiuni Live | Sf. Nicolae Hîrtopul Mic'
const DEFAULT_DESCRIPTION = 'Urmăriți Sfânta Liturghie în direct pe website-ul oficial al Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, Moldova.'

export async function generateMetadata(): Promise<Metadata> {
  const status = await getCombinedLiveStatus()

  const title = status.isLive && status.title ? status.title : DEFAULT_TITLE
  const description = status.isLive
    ? 'Urmăriți Sfânta Liturghie în direct chiar acum.'
    : DEFAULT_DESCRIPTION
  const image = status.isLive && status.thumbnail ? status.thumbnail : `${SITE_URL}/live/opengraph-image`

  return {
    title,
    description,
    alternates: buildAlternates('/live'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/live`,
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
    <PageShell aside="none">
      <PageHead eyebrow="Parohia Sfântul Ierarh Nicolae" title="Transmisiune în direct" />
      <LiveView initialStatus={status} lastArchived={lastArchived} subscribeUrl={subscribeUrl} />
    </PageShell>
  )
}
