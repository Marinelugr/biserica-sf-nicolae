'use client'

import { useEffect } from 'react'
import { createPositionSaver } from '@/lib/reading-position'
import { isSearchReferrer, readPosition, savePosition, topVerse, verseFromHash, waitsForScroll } from '@/lib/bible/readingPosition'

const HIGHLIGHT_MS = 2000
/** Cât trebuie să se miște pagina față de locul de sosire ca să conteze drept derulare. */
const SCROLL_THRESHOLD_PX = 48
/** Timp pentru derularea lină spre ancoră, care nu vine de la cititor. */
const SCROLL_SETTLE_MS = 1000
/** Un verset ascuns sub antet, sau din care se mai vede doar marginea, nu e locul de lectură. */
const TOP_MARGIN_PX = 24

function headerHeight(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 71
}

function redirectCount(): number {
  const [entry] = performance.getEntriesByType?.('navigation') ?? []
  return (entry as PerformanceNavigationTiming | undefined)?.redirectCount ?? 0
}

/** Evidențiază scurt versetul de reluare. Îl readuce în ecran doar dacă mărimea salvată a textului l-a împins afară. */
function highlightResumedVerse(verse: number): () => void {
  const el = document.getElementById(`v${verse}`)
  if (!el) return () => {}
  el.dataset.resume = 'on'
  const frame = requestAnimationFrame(() => {
    const { top, bottom } = el.getBoundingClientRect()
    if (bottom <= headerHeight() || top >= window.innerHeight) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  const timer = setTimeout(() => { el.dataset.resume = 'off' }, HIGHLIGHT_MS)
  return () => {
    cancelAnimationFrame(frame)
    clearTimeout(timer)
    delete el.dataset.resume
  }
}

/** Ține minte versetul de sus din ecran, în localStorage. Nu afișează nimic. */
export default function ReadingTracker({ carte, capitol }: { carte: string; capitol: number }) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-verse]'))
    if (!elements.length) return

    const { hash } = window.location
    const { referrer } = document
    const saved = readPosition()
    const hashVerse = verseFromHash(hash)
    const resumed = saved?.carte === carte && saved.capitol === capitol && saved.verset === hashVerse && !isSearchReferrer(referrer)
    const stopHighlight = resumed ? highlightResumedVerse(saved.verset) : () => {}

    const visible = new Set<number>()
    let current: number | null = null
    let lastSaved: number | null = null
    let reading = !waitsForScroll({ hash, referrer, redirectCount: redirectCount() })

    const saver = createPositionSaver(() => {
      if (!reading) return
      // antet înalt pe telefon: la plecare, încă niciun verset în ecran înseamnă începutul capitolului
      const verse = current ?? 1
      if (verse === lastSaved) return
      lastSaved = verse
      savePosition(carte, capitol, verse)
    })
    const schedule = () => { if (reading) saver.schedule() }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const n = Number((entry.target as HTMLElement).dataset.verse)
        if (entry.isIntersecting) visible.add(n)
        else visible.delete(n)
      }
      // niciun verset în ecran (subsolul paginii): rămâne ultimul citit
      current = topVerse(visible) ?? current
      schedule()
    }, { rootMargin: `-${headerHeight() + TOP_MARGIN_PX}px 0px 0px 0px` })
    elements.forEach(el => observer.observe(el))

    let baseline: number | null = null
    const onScroll = () => {
      if (reading || baseline === null || Math.abs(window.scrollY - baseline) < SCROLL_THRESHOLD_PX) return
      reading = true
      window.removeEventListener('scroll', onScroll)
      schedule()
    }
    const settleTimer = setTimeout(() => { baseline = window.scrollY }, SCROLL_SETTLE_MS)
    if (!reading) window.addEventListener('scroll', onScroll, { passive: true })

    schedule()

    return () => {
      // navigare în aplicație: nu se pierde ultimul loc citit
      if (current !== null) saver.flush()
      saver.dispose()
      observer.disconnect()
      clearTimeout(settleTimer)
      window.removeEventListener('scroll', onScroll)
      stopHighlight()
    }
  }, [carte, capitol])

  return null
}
