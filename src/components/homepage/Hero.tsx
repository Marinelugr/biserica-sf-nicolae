'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/context'
import CandleParticles from '@/components/CandleParticles'

// helper: setează variabila CSS `--d` (animation-delay) inline per element
const d = (seconds: number): CSSProperties => ({ ['--d' as string]: `${seconds.toFixed(2)}s` } as CSSProperties)

export default function Hero() {
  const { t } = useI18n()
  const heroRef = useRef<HTMLDivElement>(null)
  const titleWords = t.home.heroTitle.split(' ')

  // Secvenţa de intrare (pur CSS keyframes — vezi globals.css). Titlul e primul
  // element care animă; fiecare etapă porneşte după ce precedenta s-a aşezat.
  // Delay-urile scalează cu numărul de cuvinte (RO 4 / RU 3 / EN 5).
  const STEP = 0.14
  const wordDelay = (i: number) => i * STEP
  const lastWord = (titleWords.length - 1) * STEP
  const separatorDelay = lastWord + 0.5
  const subtitle1Delay = separatorDelay + 0.5
  const subtitle2Delay = subtitle1Delay + 0.18
  const buttonsDelay = subtitle2Delay + 0.55

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      const scrolled = window.scrollY
      heroRef.current.style.transform = `translateY(${scrolled * 0.4}px)`
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div
        ref={heroRef}
        className="absolute inset-x-0"
        style={{ top: '-50%', height: '150%', willChange: 'transform' }}
      >
        <Image
          src="/images/12.jpg"
          alt={t.home.heroImageAlt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          quality={100}
        />
      </div>
      <div className="absolute inset-0 hero-overlay" />
      <CandleParticles />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="font-heading hero-title-bold leading-tight mb-5"
          style={{ fontSize: 'clamp(36px, 6vw, 56px)' }}
        >
          {titleWords.map((word, i) => (
            // wrapper inline (nu inline-block) ca spaţiul dintre cuvinte să rămână
            // punct valid de rupere pe mobil
            <span key={i}>
              <span
                className={`hero-word ${i % 2 === 0 ? 'hero-word--gold' : 'hero-word--white'}`}
                style={d(wordDelay(i))}
              >
                {word}
              </span>
              {i < titleWords.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>

        <div
          className="hero-anim-fade flex items-center justify-center gap-3 mb-6"
          style={d(separatorDelay)}
        >
          <span className="h-px w-16 block" style={{ backgroundColor: '#5A4020' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#5A4020' }} />
        </div>

        <p
          className="hero-anim-rise font-body mb-2"
          style={{ ...d(subtitle1Delay), color: '#F5EFD8', fontSize: '20px', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {t.home.heroSubtitle}
        </p>

        <p
          className="hero-anim-rise font-body mb-10"
          style={{ ...d(subtitle2Delay), color: '#E4D9B8', fontSize: '20px', fontWeight: 500, textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {t.home.heroMitropolia}
        </p>

        <div
          className="hero-anim-rise flex justify-center gap-6"
          style={{ ...d(buttonsDelay), paddingBottom: '40px' }}
        >
          <a
            href="/despre"
            className="font-body text-sm px-6 py-2.5 rounded border transition-all hover:bg-white/5"
            style={{ color: '#C9A84C', borderColor: '#5A4020' }}
          >
            {t.home.aboutBtn}
          </a>
          <a
            href="/donatii"
            className="font-body text-sm px-6 py-2.5 rounded transition-all hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
          >
            {t.home.donateBtn}
          </a>
        </div>
      </div>
    </section>
  )
}
