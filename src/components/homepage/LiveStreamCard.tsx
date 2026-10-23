import { getServerT } from '@/lib/i18n/server'
import { getCombinedLiveStatus } from '@/lib/live-stream'
import LiveStreamView from './LiveStreamView'

/** Prima postare din flux când parohia transmite live (aceeași logică de detectare). */
export default async function LiveStreamCard() {
  const t = await getServerT()
  const { isLive, videoId } = await getCombinedLiveStatus()

  if (!isLive || !videoId) return null

  return <LiveStreamView videoId={videoId} t={t} />
}
