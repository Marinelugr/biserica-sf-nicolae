'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  life: number
  maxLife: number
  color: string
}

const CANDLE_SOURCES = [
  { x: 0.15, y: 0.85 },
  { x: 0.35, y: 0.90 },
  { x: 0.65, y: 0.88 },
  { x: 0.85, y: 0.85 },
  { x: 0.50, y: 0.92 },
]

const COLORS = ['#F5C842', '#F5A623', '#FF8C42', '#FFD700', '#FFF8DC']

export default function CandleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []

    function createParticle(sourceX: number, sourceY: number): Particle {
      const maxLife = 80 + Math.random() * 120
      return {
        x: sourceX * canvas!.width + (Math.random() - 0.5) * 20,
        y: sourceY * canvas!.height,
        size: 1.5 + Math.random() * 3,
        speedY: -(0.5 + Math.random() * 1.5),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: 0.6 + Math.random() * 0.4,
        life: 0,
        maxLife,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    let animFrame: number
    let frameCount = 0

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (frameCount % 3 === 0) {
        CANDLE_SOURCES.forEach(src => {
          if (Math.random() > 0.4) {
            particles.push(createParticle(src.x, src.y))
          }
        })
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.speedX + Math.sin(p.life * 0.1) * 0.3
        p.y += p.speedY
        p.size *= 0.99

        const progress = p.life / p.maxLife
        const alpha = p.opacity * (1 - progress) * (progress < 0.1 ? progress * 10 : 1)

        ctx.save()
        ctx.globalAlpha = alpha

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#FFFDE7'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        if (p.life >= p.maxLife || p.size < 0.3) {
          particles.splice(i, 1)
        }
      }

      frameCount++
      animFrame = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  )
}
