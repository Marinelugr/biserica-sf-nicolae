import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Transmisiune LIVE — Biserica Sfântul Ierarh Nicolae',
  description: 'Urmăriți Sfânta Liturghie în direct pe website-ul oficial al Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, Moldova.',
  openGraph: {
    title: 'Transmisiune LIVE — Biserica Sfântul Ierarh Nicolae',
    description: 'Urmăriți Sfânta Liturghie în direct. Hîrtopul Mic · Criuleni · Moldova',
    url: 'https://biserica-sf-nicolae.org/live',
    siteName: 'Biserica Sfântul Ierarh Nicolae',
    type: 'website',
    locale: 'ro_RO',
    images: [{
      url: 'https://biserica-sf-nicolae.org/live/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Transmisiune LIVE — Biserica Sfântul Ierarh Nicolae',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transmisiune LIVE — Biserica Sfântul Ierarh Nicolae',
    description: 'Urmăriți Sfânta Liturghie în direct · Hîrtopul Mic, Moldova',
    images: ['https://biserica-sf-nicolae.org/live/opengraph-image'],
  },
}

function extractYouTubeId(url: string): string | null {
  if (!url?.trim()) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  const m = url.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

async function getLiveStream(): Promise<{ isLive: boolean; videoId: string | null }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const [activeSetting, urlSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'live_stream_active' } }),
      prisma.setting.findUnique({ where: { key: 'live_stream_url' } }),
    ])
    return {
      isLive: activeSetting?.value === 'true',
      videoId: extractYouTubeId(urlSetting?.value || ''),
    }
  } catch {
    return { isLive: false, videoId: null }
  }
}

export default async function LivePage() {
  const { isLive, videoId } = await getLiveStream()

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
        {isLive && videoId ? (
          <>
            {/* Badge LIVE activ */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  backgroundColor: '#2A0505', border: '1px solid #5A1A1A',
                  borderRadius: '20px', padding: '0.35rem 0.875rem',
                }}>
                  <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.75rem' }}>●</span>
                  <span style={{
                    color: '#EF4444', fontFamily: 'Georgia, serif',
                    fontSize: '0.8rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>Live acum</span>
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

            {/* Embed YouTube */}
            <div style={{
              position: 'relative', width: '100%', paddingTop: '56.25%',
              borderRadius: '10px', overflow: 'hidden',
              border: '1px solid #2A1A0A',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.08)',
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Transmisiune live — Parohia Sfântul Ierarh Nicolae"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <p className="font-body text-sm text-center mt-4" style={{ color: '#5A4020' }}>
              ☦ Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic — transmisiune în direct
            </p>
          </>
        ) : (
          /* Mesaj când nu e live */
          <div
            className="text-center py-20 px-6 rounded-xl"
            style={{ border: '1px solid #1E1208' }}
          >
            <span style={{ color: '#C9A84C', fontSize: '40px' }} aria-hidden="true">☦</span>
            <h2
              className="font-heading italic mt-6 mb-4"
              style={{ color: '#C9A84C', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 400 }}
            >
              Nu există transmisiune activă în acest moment
            </h2>
            <p className="font-body" style={{ color: '#6A5030', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
              Slujbele sunt transmise în direct duminica de la ora 09:00.
              Reveniți atunci sau urmăriți canalul nostru de YouTube.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="h-px w-12 block" style={{ backgroundColor: '#3A2010' }} />
              <span style={{ color: '#3A2010', fontSize: '14px' }} aria-hidden="true">☦</span>
              <span className="h-px w-12 block" style={{ backgroundColor: '#3A2010' }} />
            </div>
            <p className="font-body text-xs mt-6 tracking-widest uppercase" style={{ color: '#3A2010' }}>
              Hîrtopul Mic · Raionul Criuleni · Moldova
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
