'use client'
import { useEffect, useState } from 'react'

export default function LoadingV2({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1200)
    const t2 = setTimeout(() => setPhase('out'), 2200)
    const t3 = setTimeout(onDone, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const particles = Array.from({ length: 8 }, (_, i) => i)

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
        @keyframes orbit {
          from { transform: rotate(var(--start)) translateX(90px) rotate(calc(-1 * var(--start))); }
          to   { transform: rotate(calc(var(--start) + 360deg)) translateX(90px) rotate(calc(-1 * (var(--start) + 360deg))); }
        }
        @keyframes particle-pulse {
          0%, 100% { transform: rotate(var(--start)) translateX(90px) rotate(calc(-1 * var(--start))) scale(1); }
          50%       { transform: rotate(calc(var(--start) + 180deg)) translateX(90px) rotate(calc(-1 * (var(--start) + 180deg))) scale(1.8); }
        }
        @keyframes icon-stamp {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          80%  { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes text-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {particles.map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 2 === 0 ? 6 : 4,
            height: i % 2 === 0 ? 6 : 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#C9A96E' : '#8a6020',
            top: '50%', left: '50%',
            marginTop: i % 2 === 0 ? -3 : -2,
            marginLeft: i % 2 === 0 ? -3 : -2,
            ['--start' as any]: `${i * 45}deg`,
            animation: `orbit ${2.5 + i * 0.1}s linear ${i * 0.1}s infinite`,
          }}/>
        ))}

        <img
          src="/Sf_Nicolae.jpg"
          alt="Sfântul Ierarh Nicolae"
          style={{
            width: 130, height: 130,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',
            border: '2px solid #C9A96E',
            animation: 'icon-stamp 1s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        />
      </div>

      <p style={{
        marginTop: 16,
        fontFamily: 'Georgia, serif',
        fontSize: 13, color: '#C9A96E',
        letterSpacing: '0.25em',
        animation: 'text-rise 0.8s ease-out 0.8s both',
      }}>
        Sfântul Ierarh Nicolae
      </p>
      <p style={{
        marginTop: 4, fontSize: 10, color: '#6a5020',
        letterSpacing: '0.2em',
        animation: 'text-rise 0.8s ease-out 1.1s both',
      }}>
        Arhiepiscopul Mirelor Lichiei
      </p>
    </div>
  )
}
