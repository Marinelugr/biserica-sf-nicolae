import { getServerT } from '@/lib/i18n/server'
import { getCombinedLiveStatus } from '@/lib/live-stream'
import FeedCard from '@/components/shell/FeedCard'

/** Prima postare din flux când parohia transmite live (aceeași logică de detectare). */
export default async function LiveStreamCard() {
  const t = await getServerT()
  const { isLive, videoId } = await getCombinedLiveStatus()

  if (!isLive || !videoId) return null

  return (
    <FeedCard kind="video" kicker={t.shell.kindVideo} author={t.shell.brand} flush>
      <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: '0 24px 16px' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="live-pill" style={{ minHeight: 32 }}>
            <span className="live-dot" aria-hidden="true">●</span>
            {t.home.liveNow}
          </span>
          <h2 className="h-s">{t.home.watchLiveService}</h2>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-gold text-[17px]"
        >
          {t.home.openOnYoutube}
        </a>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={t.home.liveStreamTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
      <p className="mute text-[16px]" style={{ padding: '14px 24px 18px' }}>{t.home.liveFooterNote}</p>
    </FeedCard>
  )
}
