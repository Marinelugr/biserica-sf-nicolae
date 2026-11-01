'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { createPositionSaver } from '@/lib/reading-position'
import {
  MIN_PERCENT, findSections, forgetBookLocation, isResumeHash, percentRead, placeLabel, saveBookLocation, savedLocation, touchBook,
  type BookLocation, type BookPosition, type BookSection,
} from '@/lib/carti/readingPosition'

/** Cât trebuie să se miște pagina ca să conteze drept lectură, nu deschidere. */
const SCROLL_THRESHOLD_PX = 48
/** Timp pentru derularea la reluare și pentru imaginea de copertă, care nu vin de la cititor. */
const SCROLL_SETTLE_MS = 1000
/** Linia de lectură, în procente din ecran: sub antet și sub titlul unei secțiuni oprite la reluare. */
const READING_LINE_PERCENT = 15

const contentElement = () => document.querySelector<HTMLElement>('.rich.reading')
const readingLine = () => window.innerHeight * READING_LINE_PERCENT / 100

function scrollToLocation(location: BookLocation, sections: BookSection[]) {
  if ('ancora' in location) {
    sections.find(s => s.anchor === location.ancora)?.element.scrollIntoView({ behavior: 'instant', block: 'start' })
    return
  }
  const content = contentElement()
  if (!content) return
  const { top, height } = content.getBoundingClientRect()
  window.scrollTo({ top: window.scrollY + top + height * location.procent / 100 - readingLine(), behavior: 'instant' })
}

/** Salvează locul din carte și arată „Continuă de la…" când există un loc salvat pentru această carte. */
export default function BookReading({ id }: { id: string }) {
  const { t } = useI18n()
  const [resume, setResume] = useState<BookPosition | null>(null)
  const sectionsRef = useRef<BookSection[]>([])

  useEffect(() => {
    const content = contentElement()
    if (!content) return

    const sections = findSections(content)
    sectionsRef.current = sections
    sections.forEach(s => { s.element.id = s.anchor; s.element.classList.add('reading-section') })

    // textul s-a schimbat de la salvare: ancora nu mai indică aceeași secțiune
    let saved = savedLocation(id)
    if (saved && 'ancora' in saved) {
      const { anchor, title } = sections.find(s => s.anchor === (saved as { ancora: string }).ancora) ?? {}
      if (!anchor || title !== saved.sectiune) { forgetBookLocation(id); saved = null }
    }

    // Reluarea vine doar dintr-un link explicit; ancora dispare, ca să nu se repete la reîncărcare.
    const { hash, pathname, search } = window.location
    const resumedFromLink = isResumeHash(hash)
    // imaginea de copertă se încarcă după derulare și mută textul: locul se reface cât se așază pagina
    let settling: ResizeObserver | undefined
    if (resumedFromLink) {
      if (saved) {
        const target = saved
        scrollToLocation(target, sections)
        settling = new ResizeObserver(() => scrollToLocation(target, sections))
        settling.observe(document.body)
      }
      window.history.replaceState(window.history.state, '', pathname + search)
    }
    // Citit din DOM și din localStorage, deci cunoscut abia după montare; pe server nu există.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResume(resumedFromLink ? null : saved)

    let passed = -1
    let touched = false
    let moved = false
    let last: string | null = null

    const saver = createPositionSaver(() => {
      if (!touched) { touched = true; touchBook(id) }
      if (!moved) return
      const { top, bottom, height } = content.getBoundingClientRect()
      if (bottom <= window.innerHeight) {
        if (last !== 'gata') forgetBookLocation(id)
        last = 'gata'
        return
      }
      const percent = percentRead(top, height, readingLine())
      if (percent < MIN_PERCENT) return
      const section = sections[passed]
      if (sections.length && !section) return
      const location: BookLocation = sections.length ? { sectiune: section.title, ancora: section.anchor } : { procent: percent }
      const key = placeLabel(location)
      if (key === last) return
      last = key
      saveBookLocation(id, location)
    })

    // Zona observată ține de la începutul paginii până la linia de lectură: un titlu din ea a fost depășit.
    // Așa, secțiunea rămâne cunoscută și când titlul ei a ieșit de mult din ecran.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const index = sections.findIndex(s => s.element === entry.target)
        if (entry.isIntersecting) passed = Math.max(passed, index)
        else if (index <= passed) passed = index - 1
      }
      saver.schedule()
    }, { rootMargin: `1000000px 0px -${100 - READING_LINE_PERCENT}% 0px` })
    sections.forEach(s => observer.observe(s.element))

    let baseline: number | null = null
    const onScroll = () => {
      if (baseline !== null && Math.abs(window.scrollY - baseline) >= SCROLL_THRESHOLD_PX) moved = true
      saver.schedule()
    }
    const settleTimer = setTimeout(() => { settling?.disconnect(); baseline = window.scrollY }, SCROLL_SETTLE_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    saver.schedule()

    return () => {
      // navigare în aplicație („Toate categoriile"): pagehide nu se declanșează
      saver.flush()
      saver.dispose()
      observer.disconnect()
      clearTimeout(settleTimer)
      settling?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [id])

  if (!resume) return null

  return (
    <button
      type="button"
      className="btn gold continue-from"
      onClick={() => { scrollToLocation(resume, sectionsRef.current); setResume(null) }}
    >
      {t.books.continueFrom.replace('{place}', placeLabel(resume))}
    </button>
  )
}
