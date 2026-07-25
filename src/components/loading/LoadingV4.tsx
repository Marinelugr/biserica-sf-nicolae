'use client'
import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; opacity: number
  decay: number; color: string
}

export default function LoadingV4({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const animRef = useRef<number>(0)
  const [phase, setPhase] = useState<'approach' | 'explode' | 'done'>('approach')
  const [imgScale, setImgScale] = useState(0.08)
  const [imgOpacity, setImgOpacity] = useState(0)
  const [imgBlur, setImgBlur] = useState(20)
  const doneRef = useRef(false)

  const callDone = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    const safetyTimer = setTimeout(callDone, 4000) // forțează onDone după 4s maxim, indiferent de starea particulelor
    return () => clearTimeout(safetyTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const start = Date.now()
    let frame: number

    function animateApproach() {
      const elapsed = (Date.now() - start) / 1000

      if (elapsed < 0.6) {
        // Faza 1: apare din depărtare
        const t = elapsed / 0.6
        const ease = 1 - Math.pow(1 - t, 3)
        setImgScale(0.08 + ease * 0.92)
        setImgOpacity(ease)
        setImgBlur(20 * (1 - ease))
        frame = requestAnimationFrame(animateApproach)
      } else if (elapsed < 1.8) {
        // Faza 2: se apropie spre vizitator
        const t = (elapsed - 0.6) / 1.2
        const ease = t * t * (3 - 2 * t) // smoothstep
        setImgScale(1 + ease * 1.8)
        setImgOpacity(1)
        setImgBlur(0)
        frame = requestAnimationFrame(animateApproach)
      } else {
        // Faza 3: evaporare
        setPhase('explode')
        setImgOpacity(0)
        cancelAnimationFrame(frame)
      }
    }

    frame = requestAnimationFrame(animateApproach)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (phase !== 'explode') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const colors = ['#C9A96E', '#FFD700', '#F5C842', '#E8B84B', '#FFF8DC', '#D4A847']

    // Generează particule
    const particles: Particle[] = Array.from({ length: 80 }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2)
      const speed = 2 + Math.random() * 8
      const size = i < 20 ? 4 + Math.random() * 6 : 1 + Math.random() * 3
      return {
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        size,
        opacity: 0.8 + Math.random() * 0.2,
        decay: 0.012 + Math.random() * 0.018,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    })

    let alive = true

    function drawParticles() {
      if (!alive) return
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      let allDead = true
      for (const p of particles) {
        if (p.opacity <= 0) continue
        allDead = false

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08 // gravitate ușoară
        p.vx *= 0.98 // frecare
        p.opacity = Math.max(0, p.opacity - p.decay)
        p.size *= 0.995

        // Glow effect
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0, p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0'))
        grad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFDE7'
        ctx.globalAlpha = p.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (allDead || particles.every(p => p.opacity <= 0)) {
        alive = false
        cancelAnimationFrame(animRef.current)
        setPhase('done')
        callDone()
        return
      }

      animRef.current = requestAnimationFrame(drawParticles)
    }

    drawParticles()
    return () => { alive = false; cancelAnimationFrame(animRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  if (phase === 'done') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D0905',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Canvas pentru particule */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          display: phase === 'explode' ? 'block' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Icoana */}
      {phase === 'approach' && (
        <div style={{
          position: 'relative',
          transform: `scale(${imgScale})`,
          opacity: imgOpacity,
          filter: `blur(${imgBlur}px)`,
          transition: 'none',
          willChange: 'transform, opacity, filter',
        }}>
          {/* Aureolă subtilă */}
          <div style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,169,110,0.3) 0%, transparent 70%)',
          }}/>
          <img
            ref={imgRef}
            src="/Sf_Nicolae.jpg"
            alt="Sfântul Ierarh Nicolae"
            style={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'center top',
              border: '3px solid #C9A96E',
              display: 'block',
            }}
          />
          {/* Text sub icoană */}
          <p style={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            color: '#C9A96E',
            letterSpacing: '0.15em',
            opacity: imgOpacity > 0.8 ? (imgScale > 2.3 ? 0 : 1) : 0,
            transition: 'opacity 0.3s',
          }}>
            Sfântul Ierarh Nicolae
          </p>
        </div>
      )}
    </div>
  )
}
