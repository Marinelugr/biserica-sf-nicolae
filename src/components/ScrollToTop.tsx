'use client'

import { useState, useEffect } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: '32px', right: '32px',
        width: '44px', height: '44px',
        background: 'rgba(201, 169, 110, 0.9)',
        border: 'none', borderRadius: '50%',
        cursor: 'pointer', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', color: '#0D0905',
        boxShadow: '0 4px 20px rgba(201, 169, 110, 0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
      aria-label="Înapoi sus"
    >
      ✝
    </button>
  )
}
