'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { useI18n } from '@/lib/i18n/context'

// Se descarcă doar la interacțiune; pagina cititorului nu ajunge la acțiunea de pe server sau la tabelele noi.
const VerseReportForm = dynamic(() => import('./VerseReportForm'), { ssr: false })

const NOTE_KEY = 'bible-report-note-closed'
const NOTE_EVENT = 'bible-report-note'
const HIDE_DELAY = 350

// Rezervă în memorie când localStorage e blocat.
let noteClosed = false

function readClosed(): boolean {
  try { if (localStorage.getItem(NOTE_KEY) === '1') return true } catch { /* localStorage blocat */ }
  return noteClosed
}

function closeNote() {
  noteClosed = true
  try { localStorage.setItem(NOTE_KEY, '1') } catch { /* localStorage blocat: rămâne doar în memorie */ }
  window.dispatchEvent(new Event(NOTE_EVENT))
}

function subscribeNote(cb: () => void) {
  window.addEventListener(NOTE_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(NOTE_EVENT, cb); window.removeEventListener('storage', cb) }
}

/** Nota de sus. Pe server nu se randează deloc: nu intră în conținutul indexabil. */
export function ReportNote() {
  const closed = useSyncExternalStore(subscribeNote, readClosed, () => true)
  const { t } = useI18n()
  const r = t.bible.reader.report
  if (closed) return null
  return (
    <aside className="report-note" data-testid="nota-raportare">
      <p>{r.note}</p>
      <button type="button" className="report-note-close" onClick={closeNote} aria-label={r.noteClose}>×</button>
    </aside>
  )
}

const numberOf = (el: Element) => Number(el.getAttribute('data-n'))
const vnumOf = (target: EventTarget | null) => (target instanceof Element ? target.closest('.vnum') : null)

interface Anchor { n: number; top: number; left: number }

/**
 * Peste versetele randate pe server: numerele devin butoane abia în browser, cu un singur ascultător
 * pe tot capitolul (un capitol are până la 176 de versete), iar HTML-ul de pe server rămâne neschimbat.
 */
export function VerseReportLayer({ slug, chapter, children }: { slug: string; chapter: number; children: React.ReactNode }) {
  const { t } = useI18n()
  const r = t.bible.reader.report
  const scope = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const origin = useRef<HTMLElement | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [form, setForm] = useState<number | null>(null)

  useEffect(() => {
    const root = scope.current
    if (!root) return
    root.classList.add('report-on')
    for (const el of root.querySelectorAll('.vnum')) {
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.setAttribute('aria-label', r.verseLabel.replace('{n}', el.getAttribute('data-n') ?? ''))
    }
  }, [r.verseLabel])

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = null
  }, [])
  const hideSoon = useCallback(() => {
    cancelHide()
    hideTimer.current = setTimeout(() => setAnchor(null), HIDE_DELAY)
  }, [cancelHide])
  useEffect(() => cancelHide, [cancelHide])

  const show = useCallback((el: Element) => {
    const root = scope.current
    if (!root) return
    cancelHide()
    origin.current = el as HTMLElement
    const box = el.getBoundingClientRect()
    const outer = root.getBoundingClientRect()
    setAnchor({ n: numberOf(el), top: box.bottom - outer.top + 6, left: Math.max(0, box.left - outer.left - 8) })
  }, [cancelHide])

  const openForm = useCallback((n: number) => {
    cancelHide()
    setAnchor(null)
    setForm(n)
  }, [cancelHide])

  const closeForm = useCallback(() => {
    setForm(null)
    origin.current?.focus({ preventScroll: true })
  }, [])

  // O atingere în afara numărului ascunde acțiunea.
  useEffect(() => {
    if (anchor === null) return
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el?.closest?.('.vnum, .report-action')) setAnchor(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [anchor])

  return (
    <div
      ref={scope}
      className="report-scope"
      onClick={e => { const el = vnumOf(e.target); if (el) show(el) }}
      onPointerOver={e => { const el = vnumOf(e.target); if (el && e.pointerType === 'mouse') show(el) }}
      onPointerOut={e => { if (vnumOf(e.target) && e.pointerType === 'mouse') hideSoon() }}
      onFocus={e => { const el = vnumOf(e.target); if (el?.matches(':focus-visible')) show(el) }}
      onBlur={e => { if (vnumOf(e.target)) hideSoon() }}
      onKeyDown={e => {
        const el = vnumOf(e.target)
        if (!el) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); origin.current = el as HTMLElement; openForm(numberOf(el)) }
        else if (e.key === 'Escape') setAnchor(null)
      }}
    >
      {children}
      {anchor && (
        // De la tastatură se deschide cu Enter pe număr; butonul e pentru mouse și atingere.
        <button
          type="button"
          tabIndex={-1}
          className="report-action"
          style={{ top: anchor.top, left: anchor.left }}
          onPointerEnter={cancelHide}
          onPointerLeave={e => { if (e.pointerType === 'mouse') hideSoon() }}
          onClick={() => openForm(anchor.n)}
        >
          {r.action}
        </button>
      )}
      {form !== null && <VerseReportForm slug={slug} chapter={chapter} verse={form} onClose={closeForm} />}
    </div>
  )
}
