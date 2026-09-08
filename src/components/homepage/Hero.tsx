'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/context'
import CandleParticles from '@/components/CandleParticles'

// Easing-uri (cubic-bezier)
type Bezier = [number, number, number, number]
const EASE_SOFT: Bezier = [0.2, 0.8, 0.2, 1]
const EASE_BOUNCE: Bezier = [0.34, 1.56, 0.64, 1] // elastic/bounce pentru stemă

export default function Hero() {
  const { t } = useI18n()
  const heroRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const titleWords = t.home.heroTitle.split(' ')

  // Secvența de intrare (CSS-like reveal, dar prin framer-motion care e deja în
  // proiect — vezi raport). Fiecare etapă pornește după ce precedenta s-a așezat.
  // Delay-urile sunt calculate dinamic din numărul de cuvinte (RO 4 / RU 3 / EN 5).
  const crestDelay = 0.2                                   // stema: bounce 1.0s, „așezată" vizual ~0.7s
  const titleStart = 0.9
  const titleWordStep = 0.12
  const titleWordDelay = (i: number) => titleStart + i * titleWordStep
  const titleDone = titleWordDelay(titleWords.length - 1) + 0.5
  const separatorDelay = titleDone                          // linia decorativă „se trage"
  const subtitle1Delay = separatorDelay + 0.28
  const subtitle2Delay = subtitle1Delay + 0.15
  const buttonsDelay = subtitle2Delay + 0.3

  // helper: dezactivează complet animația când utilizatorul cere reduced motion
  const rm = !!prefersReducedMotion
  const anim = (
    initial: Record<string, number>,
    animate: Record<string, number>,
    delay: number,
    duration: number,
    ease: Bezier = EASE_SOFT,
  ) => ({
    initial: rm ? (false as const) : initial,
    animate,
    transition: rm ? { duration: 0 } : { duration, delay, ease },
  })

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
        {/* Stema — apare cu bounce, deasupra titlului */}
        <motion.img
          src="/logo-emblema.png"
          alt={t.home.heroTitle}
          width={560}
          height={804}
          {...anim(
            { opacity: 0, scale: 0.6, y: -20 },
            { opacity: 1, scale: 1, y: 0 },
            crestDelay,
            1.0,
            EASE_BOUNCE,
          )}
          className="mx-auto mb-5"
          style={{
            width: 'clamp(128px, 20vw, 170px)',
            height: 'auto',
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
          }}
        />

        <h1
          className="font-heading italic leading-tight mb-5 hero-title"
          style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 400 }}
        >
          {titleWords.map((word, i) => (
            // spatiul e text node INTRE span-uri (nu in interiorul inline-block),
            // altfel titlul nu are unde sa se rupa -> overflow pe mobil
            <span key={i}>
              <motion.span
                initial={rm ? false : { opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={rm ? { duration: 0 } : { duration: 0.6, delay: titleWordDelay(i), ease: EASE_SOFT }}
                style={{ display: 'inline-block' }}
              >
                {word}
              </motion.span>
              {i < titleWords.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>

        {/* Linie decorativă sub titlu — „se trage" din centru spre exterior */}
        <motion.div
          {...anim({ opacity: 0 }, { opacity: 1 }, separatorDelay, 0.4)}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <motion.span
            className="h-px block"
            style={{ backgroundColor: '#5A4020', width: '64px', transformOrigin: 'right center' }}
            {...anim({ scaleX: 0 }, { scaleX: 1 }, separatorDelay, 0.7)}
          />
          <motion.span
            style={{ color: '#C9A84C', fontSize: '18px' }}
            aria-hidden="true"
            {...anim({ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1 }, separatorDelay + 0.1, 0.5, EASE_BOUNCE)}
          >
            ☦
          </motion.span>
          <motion.span
            className="h-px block"
            style={{ backgroundColor: '#5A4020', width: '64px', transformOrigin: 'left center' }}
            {...anim({ scaleX: 0 }, { scaleX: 1 }, separatorDelay, 0.7)}
          />
        </motion.div>

        <motion.p
          {...anim({ opacity: 0, y: 14 }, { opacity: 1, y: 0 }, subtitle1Delay, 0.6)}
          className="font-body mb-2"
          style={{ color: '#F5EFD8', fontSize: '20px', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {t.home.heroSubtitle}
        </motion.p>

        <motion.p
          {...anim({ opacity: 0, y: 14 }, { opacity: 1, y: 0 }, subtitle2Delay, 0.6)}
          className="font-body mb-10"
          style={{ color: '#E4D9B8', fontSize: '20px', fontWeight: 500, textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {t.home.heroMitropolia}
        </motion.p>

        <motion.div
          {...anim({ opacity: 0, y: 18 }, { opacity: 1, y: 0 }, buttonsDelay, 0.6)}
          className="flex justify-center gap-6"
          style={{ paddingBottom: '40px' }}
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
        </motion.div>
      </div>
    </section>
  )
}
