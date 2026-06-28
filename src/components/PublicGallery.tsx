'use client'

import { useState } from 'react'

interface GalleryItem {
  id: string
  url: string
  caption: string | null
}

interface Props {
  items: GalleryItem[]
}

export default function PublicGallery({ items }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (!items.length) return null

  function prev() { setLightbox(i => (i != null ? (i - 1 + items.length) % items.length : null)) }
  function next() { setLightbox(i => (i != null ? (i + 1) % items.length : null)) }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.875rem',
      }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            onClick={() => setLightbox(i)}
            style={{ cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A1A0A', backgroundColor: '#1A1008' }}
          >
            <div style={{ position: 'relative', aspectRatio: '4/3' }}>
              <img
                src={item.url}
                alt={item.caption || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s', }}
                onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)' }}
                onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
              />
            </div>
            {item.caption && (
              <div style={{ padding: '0.5rem 0.75rem', color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.78rem', lineHeight: 1.4 }}>
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox !== null && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #3A2A0A', color: '#C9A84C', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={items[lightbox].url}
              alt={items[lightbox].caption || ''}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }}
            />
            {items[lightbox].caption && (
              <p style={{ color: '#D4C4A0', fontFamily: 'Georgia, serif', fontSize: '0.9rem', textAlign: 'center' }}>
                {items[lightbox].caption}
              </p>
            )}
            <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
              {lightbox + 1} / {items.length}
            </span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); next() }}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #3A2A0A', color: '#C9A84C', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>

          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #3A2A0A', color: '#F2EBD9', borderRadius: '4px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}
          >✕ Închide</button>
        </div>
      )}
    </>
  )
}
