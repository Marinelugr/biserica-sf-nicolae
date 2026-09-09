'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/context'
import CandleParticles from '@/components/CandleParticles'

// Easing-uri (cubic-bezier)
type Bezier = [number, number, number, number]
const EASE: Bezier = [0.25, 0.1, 0.25, 1]          // echiv. CSS `ease` (titlu/subtitlu/linie/butoane)
const EASE_BOUNCE: Bezier = [0.34, 1.56, 0.64, 1]  // elastic/bounce — stema + ☦

export default function Hero() {
  const { t } = useI18n()
  const heroRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const titleWords = t.home.heroTitle.split(' ')

  // Secvenţa de intrare (reveal „CSS-like", prin framer-motion care e deja în
  // proiect). Stema stă acum pe cusătura hero/conţinut (jos), deci NU mai
  // porneşte prima — titlul/subtitlurile/butoanele cascadează normal la
  // încărcare, iar stema animă ULTIMA, ca un sigiliu aplicat la final.
  // Delay-urile scalează cu numărul de cuvinte al titlului (RO 4 / RU 3 / EN 5).
  const titleStart = 0.15
  const titleStep = 0.13
  const wordDur = 0.6
  const titleWordDelay = (i: number) => titleStart + i * titleStep
  const lineDelay = titleWordDelay(titleWords.length - 1) + wordDur * 0.65
  const lineDur = 0.8
  const subDur = 0.7
  const subtitle1Delay = lineDelay + lineDur * 0.6
  const subtitle2Delay = subtitle1Delay + 0.14
  const buttonsDelay = subtitle2Delay + subDur * 0.6
  const emblemDelay = buttonsDelay + 0.6 * 0.7          // după ce butoanele s-au aşezat

  const rm = !!prefersReducedMotion
  const anim = (
    initial: Record<string, number>,
    animate: Record<string, number>,
    delay: number,
    duration: number,
    ease: Bezier = EASE,
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
    // Wrapper fără `overflow-hidden` — ţine stema care depăşeşte marginea de jos.
    // z-20: stema (jumătatea de jos) trece peste secţiunea navy de dedesubt.
    // pb-20: „zonă de aterizare" navy sub fotografie, ca jumătatea de jos a stemei
    // să nu cadă peste primul card din secţiunea următoare.
    <section className="relative z-20 pb-20">
      <div className="relative min-h-[78vh] flex items-center justify-center overflow-hidden">
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
            className="font-heading italic leading-tight mb-5 hero-title"
            style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 400 }}
          >
            {titleWords.map((word, i) => (
              // spaţiul e text node ÎNTRE span-uri (nu în interiorul inline-block),
              // altfel titlul nu are unde să se rupă → overflow pe mobil
              <span key={i}>
                <motion.span
                  initial={rm ? false : { opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={rm ? { duration: 0 } : { duration: wordDur, delay: titleWordDelay(i), ease: EASE }}
                  style={{ display: 'inline-block' }}
                >
                  {word}
                </motion.span>
                {i < titleWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>

          {/* Linie decorativă sub titlu — „se trage" din centru spre exterior (≈150px) */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.span
              className="h-px block"
              style={{ backgroundColor: '#5A4020', width: '70px', transformOrigin: 'right center' }}
              {...anim({ scaleX: 0 }, { scaleX: 1 }, lineDelay, lineDur)}
            />
            <motion.span
              style={{ color: '#C9A84C', fontSize: '18px' }}
              aria-hidden="true"
              {...anim({ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1 }, lineDelay + 0.1, 0.5, EASE_BOUNCE)}
            >
              ☦
            </motion.span>
            <motion.span
              className="h-px block"
              style={{ backgroundColor: '#5A4020', width: '70px', transformOrigin: 'left center' }}
              {...anim({ scaleX: 0 }, { scaleX: 1 }, lineDelay, lineDur)}
            />
          </div>

          <motion.p
            {...anim({ opacity: 0, y: -15 }, { opacity: 1, y: 0 }, subtitle1Delay, subDur)}
            className="font-body mb-2"
            style={{ color: '#F5EFD8', fontSize: '20px', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {t.home.heroSubtitle}
          </motion.p>

          <motion.p
            {...anim({ opacity: 0, y: -15 }, { opacity: 1, y: 0 }, subtitle2Delay, subDur)}
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
      </div>

      {/* Stema — medalion pe cusătura hero/conţinut: jumătate pe fotografie,
          jumătate pe fundalul navy (#04080F) al secţiunilor de dedesubt.
          Wrapper-ul face poziţionarea (transform static), motion.img face animaţia. */}
      <div
        className="absolute left-1/2 bottom-20 z-30 pointer-events-none"
        style={{ transform: 'translate(-50%, 50%)' }}
      >
        <motion.img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          width={400}
          height={824}
          {...anim(
            { opacity: 0, scale: 0.6, y: -20 },
            { opacity: 1, scale: 1, y: 0 },
            emblemDelay,
            1.0,
            EASE_BOUNCE,
          )}
          style={{
            display: 'block',
            height: 'clamp(150px, 24vw, 206px)',
            width: 'auto',
            // umbra contează doar pentru jumătatea de sus (pe fotografie): contur
            // întunecat de jur-împrejur + 2 umbre difuze pentru relief clar.
            filter:
              'drop-shadow(0 0 7px rgba(0,0,0,0.5)) drop-shadow(0 5px 13px rgba(0,0,0,0.55)) drop-shadow(0 16px 34px rgba(0,0,0,0.55))',
          }}
        />
      </div>
    </section>
  )
}
