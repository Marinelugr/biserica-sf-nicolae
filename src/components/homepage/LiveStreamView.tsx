import type { Translations } from '@/lib/i18n/ro'
import FeedCard from '@/components/shell/FeedCard'

/** Transmisiunea live, ca prima postare din flux — prezentare pură (identitatea `video`). */
export default function LiveStreamView({ videoId, t }: { videoId: string; t: Translations }) {
  return (
    <FeedCard kind="video" sec="video" kicker={t.shell.kindVideo} flush>
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
