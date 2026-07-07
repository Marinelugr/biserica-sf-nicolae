'use client'

import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1800)
    const timer2 = setTimeout(() => setVisible(false), 2300)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0D0905',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        transition: 'opacity 0.5s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      <svg
        width="80" height="100" viewBox="0 0 80 100"
        style={{ animation: 'crossReveal 1.2s ease-out forwards' }}
      >
        <style>{`
          @keyframes crossReveal {
            0%   { opacity: 0; transform: scale(0.3) rotate(-10deg); filter: blur(8px); }
            60%  { opacity: 1; transform: scale(1.1) rotate(2deg); filter: blur(0); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
          }
          @keyframes goldenPulse {
            0%, 100% { filter: drop-shadow(0 0 8px #C9A96E); }
            50%       { filter: drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #C9A96E); }
          }
        `}</style>
        <g style={{ animation: 'goldenPulse 2s ease-in-out infinite' }}>
          {/* Cruce ortodoxă cu 3 bare */}
          <rect x="35" y="5" width="10" height="90" fill="#C9A96E" rx="2" />
          <rect x="15" y="25" width="50" height="10" fill="#C9A96E" rx="2" />
          <rect x="20" y="60" width="40" height="8" fill="#C9A96E" rx="2"
            transform="rotate(-15 40 64)" />
        </g>
      </svg>
      <div style={{
        marginTop: '24px',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '16px',
        color: '#C9A96E',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        animation: 'crossReveal 1.5s ease-out 0.3s both',
      }}>
        Sfântul Ierarh Nicolae
      </div>
    </div>
  )
}
