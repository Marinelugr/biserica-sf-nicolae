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
      <div className="card flush" style={{ borderRadius: 22 }}>
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ padding: '18px 24px' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="live-pill">
              <span className="live-dot" aria-hidden="true">●</span>
              Live acum
            </span>
            <h2 className="h-s">{status.title || 'Urmărește slujba în direct'}</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a href={`https://www.youtube.com/watch?v=${status.videoId}`} target="_blank" rel="noopener noreferrer" className="link-gold text-[17px]">
              Deschide pe YouTube ↗
            </a>
            <ShareButton isLive liveTitle={status.title} />
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${status.videoId}?autoplay=1`}
            title="Transmisiune live — Parohia Sfântul Ierarh Nicolae"
            allow="autoplay; accelerometer; fullscreen; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        <p className="mute text-[16px] text-center" style={{ padding: '14px 24px 18px' }}>
          ☦ Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic — transmisiune în direct
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
      <div className="card flex flex-col gap-4">
        <span className="gold" style={{ fontSize: 36 }} aria-hidden="true">☦</span>
        <h2 className="h-m">Nu există transmisiune în direct în acest moment</h2>
        <p className="reading mute">
          Slujbele sunt transmise în direct duminica de la ora 09:00, precum și de marile sărbători.
          Reveniți atunci sau urmăriți canalul nostru de YouTube.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="btn red">
            Abonează-te pe YouTube
          </a>
          <ShareButton isLive={false} liveTitle={null} />
        </div>
        <p className="mute text-[14px] tracking-[.18em] uppercase mt-4">Hîrtopul Mic · Raionul Criuleni · Moldova</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card" style={{ padding: '22px 26px' }}>
          <p className="eyebrow mb-2">Orarul slujbelor</p>
          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--line)' }}>
            <span>Duminică</span>
            <span className="gold">09:00</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Sărbători</span>
            <span className="gold">conform calendarului</span>
          </div>
        </div>

        {lastArchived && (
          <a href={`https://www.youtube.com/watch?v=${lastArchived.videoId}`} target="_blank" rel="noopener noreferrer" className="news group">
            <p className="eyebrow" style={{ padding: '16px 20px 12px' }}>Ultima transmisiune înregistrată</p>
            <div className="media" style={{ aspectRatio: '16 / 9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatură YouTube (gazdă externă) */}
              <img
                src={`https://i.ytimg.com/vi/${lastArchived.videoId}/hqdefault.jpg`}
                alt={lastArchived.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="play sm" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
            </div>
            <p className="body text-[17px] group-hover:text-gold transition-colors">{lastArchived.title}</p>
          </a>
        )}
      </div>
    </div>
  )
}
