'use client'

import type { LiveStatus, ArchivedLive } from '@/lib/live-stream'
import { useLiveStatus } from '@/lib/hooks/useLiveStatus'
import ShareButton from './ShareButton'

export default function LiveView({
  initialStatus,
  lastArchived,
  subscribeUrl,
}: {
  initialStatus: LiveStatus
  lastArchived: ArchivedLive | null
  subscribeUrl: string
}) {
  const status = useLiveStatus(initialStatus) ?? initialStatus

  if (status.isLive && status.videoId) {
    return (
      <>
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
              {status.title || 'Urmărește slujba în direct'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://www.youtube.com/watch?v=${status.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm"
              style={{ color: '#9B8050', borderBottom: '1px solid #3A2010', textDecoration: 'none', paddingBottom: '1px' }}
            >
              Deschide pe YouTube ↗
            </a>
            <ShareButton isLive liveTitle={status.title} />
          </div>
        </div>

        <div style={{
          position: 'relative', width: '100%', paddingTop: '56.25%',
          borderRadius: '10px', overflow: 'hidden',
          border: '1px solid #2A1A0A',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.08)',
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${status.videoId}?autoplay=1`}
            title="Transmisiune live — Parohia Sfântul Ierarh Nicolae"
            allow="autoplay; accelerometer; fullscreen; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        <p className="font-body text-sm text-center mt-4" style={{ color: '#5A4020' }}>
          ☦ Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic — transmisiune în direct
        </p>
      </>
    )
  }

  return (
    <div className="text-center py-16 px-6 rounded-xl" style={{ border: '1px solid #1E1208' }}>
      <span style={{ color: '#C9A84C', fontSize: '40px' }} aria-hidden="true">☦</span>
      <h2
        className="font-heading italic mt-6 mb-4"
        style={{ color: '#C9A84C', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 400 }}
      >
        Nu există transmisiune în direct în acest moment
      </h2>
      <p className="font-body" style={{ color: '#6A5030', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
        Slujbele sunt transmise în direct duminica de la ora 09:00, precum și de marile sărbători.
        Reveniți atunci sau urmăriți canalul nostru de YouTube.
      </p>

      <div className="flex items-center justify-center gap-3 mt-8 mb-8">
        <span className="h-px w-12 block" style={{ backgroundColor: '#3A2010' }} />
        <span style={{ color: '#3A2010', fontSize: '14px' }} aria-hidden="true">☦</span>
        <span className="h-px w-12 block" style={{ backgroundColor: '#3A2010' }} />
      </div>

      {/* Orarul slujbelor */}
      <div
        className="mx-auto mb-8 text-left"
        style={{ maxWidth: '360px', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.25rem 1.5rem' }}
      >
        <p className="font-body text-xs tracking-[0.2em] uppercase mb-3 text-center" style={{ color: '#8A7050' }}>
          Orarul slujbelor
        </p>
        <div className="flex items-center justify-between font-body text-sm py-1" style={{ color: '#C9A84C' }}>
          <span>Duminică</span>
          <span>09:00</span>
        </div>
        <div className="flex items-center justify-between font-body text-sm py-1" style={{ color: '#C9A84C' }}>
          <span>Sărbători</span>
          <span>conform calendarului</span>
        </div>
      </div>

      {/* Ultimul live înregistrat */}
      {lastArchived && (
        <a
          href={`https://www.youtube.com/watch?v=${lastArchived.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-auto mb-8 group"
          style={{ maxWidth: '480px' }}
        >
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#8A7050' }}>
            Ultima transmisiune înregistrată
          </p>
          <div style={{
            position: 'relative', width: '100%', paddingTop: '56.25%',
            borderRadius: '8px', overflow: 'hidden', border: '1px solid #2A1A0A',
          }}>
            <img
              src={`https://i.ytimg.com/vi/${lastArchived.videoId}/hqdefault.jpg`}
              alt={lastArchived.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(13,9,5,0.35)', transition: 'background-color 0.2s',
            }}>
              <span style={{ color: '#F2EBD9', fontSize: '36px' }} aria-hidden="true">▶</span>
            </div>
          </div>
          <p className="font-body text-sm mt-2 group-hover:underline" style={{ color: '#C9A84C' }}>
            {lastArchived.title}
          </p>
        </a>
      )}

      <a
        href={subscribeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-body px-5 py-2.5 rounded border transition-all duration-200 hover:bg-red-950"
        style={{ color: '#C06050', borderColor: '#6B1A1A', borderWidth: '1.5px', fontSize: '15px' }}
      >
        Abonează-te pe YouTube
      </a>

      <div className="mt-6">
        <ShareButton isLive={false} liveTitle={null} />
      </div>

      <p className="font-body text-xs mt-8 tracking-widest uppercase" style={{ color: '#3A2010' }}>
        Hîrtopul Mic · Raionul Criuleni · Moldova
      </p>
    </div>
  )
}
