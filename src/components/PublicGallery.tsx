'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GalleryItem {
  id: string
  url: string
  thumbnailUrl?: string | null
  caption: string | null
}

interface Props {
  items: GalleryItem[]
}

export default function PublicGallery({ items }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [fade, setFade] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const hintShown = useRef(false)

  const open = useCallback((i: number) => {
    setLightbox(i)
    setFade(true)
    if (!hintShown.current) {
      setShowHint(true)
      hintShown.current = true
      setTimeout(() => setShowHint(false), 2500)
    }
  }, [])

  const close = useCallback(() => setLightbox(null), [])

  const go = useCallback((dir: 1 | -1) => {
    setFade(false)
    setTimeout(() => {
      setLightbox(i => i != null ? (i + dir + items.length) % items.length : null)
      setFade(true)
    }, 120)
  }, [items.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, go, close])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  if (!items.length) return null

  return (
    <>
      <div className="pg-grid">
        {items.map((item, i) => (
          <button
            type="button"
            key={item.id}
            className="pg-item"
            onClick={() => open(i)}
            aria-label={item.caption || `Fotografia ${i + 1}`}
            style={{ cursor: 'pointer', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--line)', backgroundColor: 'rgba(10, 18, 44, 0.7)', display: 'block', width: '100%', padding: 0, textAlign: 'left' }}
          >
            <img
              src={item.thumbnailUrl || item.url}
              alt={item.caption || ''}
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.25s' }}
              onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
              onError={e => { const el = e.target as HTMLImageElement; if (item.thumbnailUrl && el.src !== item.url) el.src = item.url }}
            />
            {item.caption && (
              <span style={{ display: 'block', padding: '0.55rem 0.8rem', color: 'var(--mute)', fontSize: '15px', lineHeight: 1.4 }}>
                {item.caption}
              </span>
            )}
          </button>
        ))}
      </div>
      <style>{`
        .pg-grid { columns: 3; column-gap: 0.875rem; }
        .pg-item { break-inside: avoid; margin-bottom: 0.875rem; }
        .pg-item:hover { border-color: var(--gold-d) !important; }
        @media (max-width: 640px)  { .pg-grid { columns: 2; } }
        @media (max-width: 420px)  { .pg-grid { columns: 1; } }
      `}</style>

      {lightbox !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 6, 16, 0.96)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={close}
          // Touch swipe handlers
          onTouchStart={e => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={e => {
            const dx = touchStartX.current - e.changedTouches[0].clientX
            const dy = touchStartY.current - e.changedTouches[0].clientY
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              go(dx > 0 ? 1 : -1)
            }
          }}
        >
          {/* Prev button */}
          <button
            onClick={e => { e.stopPropagation(); go(-1) }}
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(5,10,26,0.7)', border: '1px solid var(--gold-d)', color: 'var(--gold)', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
            aria-label="Fotografie anterioară"
          >‹</button>

          {/* Image area */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', transition: 'opacity 0.12s', opacity: fade ? 1 : 0 }}
          >
            <img
              src={items[lightbox].url}
              alt={items[lightbox].caption || ''}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '14px', display: 'block' }}
            />
            {items[lightbox].caption && (
              <p style={{ color: 'var(--ink)', fontSize: '17px', textAlign: 'center', maxWidth: '600px', lineHeight: 1.5 }}>
                {items[lightbox].caption}
              </p>
            )}
            {/* Counter */}
            <span style={{ color: 'var(--mute)', fontSize: '15px' }}>
              {lightbox + 1} / {items.length}
            </span>
          </div>

          {/* Next button */}
          <button
            onClick={e => { e.stopPropagation(); go(1) }}
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(5,10,26,0.7)', border: '1px solid var(--gold-d)', color: 'var(--gold)', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
            aria-label="Fotografie următoare"
          >›</button>

          {/* Close button */}
          <button
            onClick={close}
            style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid var(--gold-d)', color: 'var(--ink)', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', fontSize: '1.1rem', zIndex: 10 }}
            aria-label="Închide"
          >✕</button>

          {/* Keyboard hint (desktop, first open only) */}
          {showHint && (
            <div style={{ position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid var(--line)', color: 'var(--mute)', borderRadius: '999px', padding: '0.45rem 1rem', fontSize: '15px', whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadein 0.3s ease' }}>
              ← → taste · swipe pe mobil · ESC pentru închidere
              <style>{`@keyframes fadein { from { opacity: 0; transform: translateX(-50%) translateY(6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
            </div>
          )}
        </div>
      )}
    </>
  )
}
