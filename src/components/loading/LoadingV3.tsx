'use client'
import { useEffect, useState } from 'react'

export default function LoadingV3({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1400)
    const t2 = setTimeout(() => setPhase('out'), 2300)
    const t3 = setTimeout(onDone, 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const rays = Array.from({ length: 12 }, (_, i) => i)

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
        @keyframes ray-extend {
          0%   { opacity: 0; transform: rotate(var(--angle)) scaleY(0); transform-origin: bottom center; }
          50%  { opacity: 0.8; transform: rotate(var(--angle)) scaleY(1); }
          100% { opacity: 0.4; transform: rotate(var(--angle)) scaleY(1); }
        }
        @keyframes halo-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes icon-stamp {
          0%   { transform: scale(0); opacity: 0; }
          65%  { transform: scale(1.06); opacity: 1; }
          80%  { transform: scale(0.98); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes text-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes quote-fade {
          from { opacity: 0; }
          to   { opacity: 0.7; }
        }
      `}</style>

      <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0,
          animation: 'halo-spin 12s linear infinite',
        }}>
          {rays.map(i => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 2,
              height: 60,
              marginLeft: -1,
              marginTop: -110,
              background: `linear-gradient(to top, #C9A96E, transparent)`,
              ['--angle' as any]: `${i * 30}deg`,
              transformOrigin: 'bottom center',
              transform: `rotate(${i * 30}deg)`,
              animation: `ray-extend 1.5s ease-out ${i * 0.08}s both`,
              opacity: i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0.5 : 0.3,
            }}/>
          ))}
        </div>

        <img
          src="/Sf_Nicolae.jpg"
          alt="Sfântul Ierarh Nicolae"
          style={{
            width: 140, height: 140,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',
            border: '3px solid #C9A96E',
            zIndex: 2,
            animation: 'icon-stamp 1.2s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          }}
        />
      </div>

      <p style={{
        marginTop: 16,
        fontFamily: 'Georgia, serif',
        fontSize: 13, color: '#C9A96E',
        letterSpacing: '0.25em',
        animation: 'text-rise 0.8s ease-out 1s both',
      }}>
        Sfântul Ierarh Nicolae
      </p>
      <p style={{
        marginTop: 4, fontSize: 10, color: '#6a5020',
        letterSpacing: '0.2em',
        animation: 'text-rise 0.8s ease-out 1.3s both',
      }}>
        Sfinte Ierarhe, roagă-te pentru noi
      </p>
    </div>
  )
}
