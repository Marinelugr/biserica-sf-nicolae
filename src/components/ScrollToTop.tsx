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
        position: 'fixed', bottom: '24px', right: '20px',
        width: '44px', height: '44px',
        background: 'var(--gold)',
        border: 'none', borderRadius: '50%',
        cursor: 'pointer', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', color: '#0a1330',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
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
