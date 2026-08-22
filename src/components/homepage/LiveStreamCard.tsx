import { getServerT } from '@/lib/i18n/server'
import { getCombinedLiveStatus } from '@/lib/live-stream'

export default async function LiveStreamCard() {
  const t = await getServerT()
  const { isLive, videoId } = await getCombinedLiveStatus()

  if (!isLive || !videoId) return null

  return (
    <section style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(4,8,15,0.7)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Clopote animate */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="bell-icon" style={{ fontSize: '22px' }}>🔔</span>
              <span className="bell-icon" style={{ fontSize: '18px', animationDelay: '0.2s', marginLeft: '2px' }}>🔔</span>
            </div>
            {/* Pulsing LIVE badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(139,38,53,0.2)', border: '1px solid rgba(139,38,53,0.4)', borderRadius: '20px', padding: '0.35rem 0.875rem' }}>
              <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.75rem' }}>●</span>
              <span style={{ color: '#EF4444', fontFamily: 'Georgia, serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.home.liveNow}</span>
            </div>
            <h2
              className="font-heading"
              style={{ color: '#F2EBD9', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 400, margin: 0 }}
            >
              {t.home.watchLiveService}
            </h2>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm"
            style={{ color: '#828EA8', borderBottom: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', paddingBottom: '1px' }}
          >
            {t.home.openOnYoutube}
          </a>
        </div>

        {/* Embed */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.08)',
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={t.home.liveStreamTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        {/* Footer note */}
        <p
          className="font-body text-sm text-center mt-4"
          style={{ color: '#828EA8' }}
        >
          {t.home.liveFooterNote}
        </p>
      </div>
    </section>
  )
}
