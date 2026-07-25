'use client'
import { useEffect, useState } from 'react'

export default function LoadingV1({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1400)
    const t2 = setTimeout(() => setPhase('out'), 2200)
    const t3 = setTimeout(onDone, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D0905',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'out' ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes aura-draw {
          from { stroke-dashoffset: 408; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes icon-reveal {
          from { opacity: 0; filter: blur(16px) brightness(0.3); }
          to   { opacity: 1; filter: blur(0px) brightness(1); }
        }
        @keyframes text-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes inner-ring {
          from { stroke-dashoffset: 320; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <svg style={{ position: 'absolute', inset: 0, width: 180, height: 180 }}
             viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="65"
            fill="none" stroke="#3a2510" strokeWidth="1"/>
          <circle cx="90" cy="90" r="65"
            fill="none" stroke="#C9A96E" strokeWidth="1"
            strokeDasharray="408"
            style={{ animation: 'inner-ring 2s ease-out forwards', animationDelay: '0.3s', strokeDashoffset: 408 }}/>
          <circle cx="90" cy="90" r="84"
            fill="none" stroke="#C9A96E" strokeWidth="2"
            strokeDasharray="528"
            style={{ animation: 'aura-draw 1.8s ease-out forwards, aura-pulse 2s ease-in-out 1.8s infinite', strokeDashoffset: 528 }}/>
          <circle cx="90" cy="90" r="76"
            fill="none" stroke="#8a6020" strokeWidth="0.5" opacity="0.4"/>
        </svg>

        <img
          src="/Sf_Nicolae.jpg"
          alt="Sfântul Ierarh Nicolae"
          style={{
            position: 'absolute',
            top: 22, left: 22,
            width: 136, height: 136,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',
            animation: 'icon-reveal 1.5s ease-out forwards',
          }}
        />
      </div>

      <p style={{
        marginTop: 20,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: '#C9A96E',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        animation: 'text-rise 0.8s ease-out 1.2s both',
      }}>
        Sfântul Ierarh Nicolae
      </p>
      <p style={{
        marginTop: 4,
        fontSize: 10,
        color: '#6a5020',
        letterSpacing: '0.2em',
        animation: 'text-rise 0.8s ease-out 1.5s both',
      }}>
        Arhiepiscopul Mirelor Lichiei
      </p>
    </div>
  )
}
