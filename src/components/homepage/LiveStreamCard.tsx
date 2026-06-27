import { prisma } from '@/lib/prisma'

function extractYouTubeId(url: string): string | null {
  if (!url?.trim()) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  const m = url.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default async function LiveStreamCard() {
  let isLive = false
  let videoId: string | null = null

  try {
    const [activeSetting, urlSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'live_stream_active' } }),
      prisma.setting.findUnique({ where: { key: 'live_stream_url' } }),
    ])
    isLive = activeSetting?.value === 'true'
    videoId = extractYouTubeId(urlSetting?.value || '')
  } catch { /* DB unavailable — hide card */ }

  if (!isLive || !videoId) return null

  return (
    <section style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Pulsing LIVE badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#2A0505', border: '1px solid #5A1A1A', borderRadius: '20px', padding: '0.35rem 0.875rem' }}>
              <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.75rem' }}>●</span>
              <span style={{ color: '#EF4444', fontFamily: 'Georgia, serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live acum</span>
            </div>
            <h2
              className="font-heading"
              style={{ color: '#F2EBD9', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 400, margin: 0 }}
            >
              Urmărește slujba în direct
            </h2>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm"
            style={{ color: '#9B8050', borderBottom: '1px solid #3A2010', textDecoration: 'none', paddingBottom: '1px' }}
          >
            Deschide pe YouTube ↗
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
            border: '1px solid #2A1A0A',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.08)',
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title="Transmisiune live — Parohia Sfântul Ierarh Nicolae"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        {/* Footer note */}
        <p
          className="font-body text-sm text-center mt-4"
          style={{ color: '#5A4020' }}
        >
          ☦ Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic — transmisiune în direct
        </p>
      </div>
    </section>
  )
}
