'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  applyReviewItemAction, editReviewItemAction, ignoreAllAction, ignoreReviewItemAction, previewIgnoreAllAction,
  type IgnoreAllPreview,
} from '@/app/admin/biblia/revizuire/actions'
import { ui } from './ui'

export interface ReviewCardData {
  id: string
  slug: string
  reference: string
  chapterNum: number
  verseNum: number
  parts: { text: string; hit: boolean }[]
  text: string
  editedAt: string | null
  prev: { verseNum: number; textRo: string } | null
  next: { verseNum: number; textRo: string } | null
  reason: string | null
  options: string[]
  message: string | null
  source: string
  status: string
  statusLabel: string
  detectorLabel: string
  confidenceLabel: string
  canIgnoreAll: boolean
}

interface Status { kind: 'ok' | 'error'; message: string }
const rowsFor = (text: string) => Math.max(3, Math.ceil(text.length / 55) + 1)
/** Spațiile de la capătul unei propuneri (ex. „: ”) trebuie să se vadă. */
const shown = (s: string) => s.replace(/^ | $/g, '␠')

function Card({ card, onStatus, onSkip, onPrev, hasPrev, hasNext }: {
  card: ReviewCardData; onStatus: (s: Status) => void; onSkip: () => void; onPrev: () => void; hasPrev: boolean; hasNext: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.text)
  const [preview, setPreview] = useState<Extract<IgnoreAllPreview, { ok: true }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const open = card.status === 'PENDING'
  const single = card.options.length === 1

  const fail = useCallback((message: string, refresh = false) => {
    setError(message)
    if (refresh) router.refresh()
  }, [router])

  const done = useCallback((message: string) => {
    onStatus({ kind: 'ok', message })
    router.refresh()
  }, [onStatus, router])

  const apply = useCallback((option: number) => {
    setError(null)
    start(async () => {
      const r = await applyReviewItemAction({ itemId: card.id, seenEditedAt: card.editedAt, option })
      if (r.ok) done(r.message)
      else if (r.stale) { onStatus({ kind: 'error', message: r.error }); router.refresh() }
      else fail(r.error, r.conflict)
    })
  }, [card.editedAt, card.id, done, fail, onStatus, router])

  const ignore = useCallback(() => {
    setError(null)
    start(async () => {
      const r = await ignoreReviewItemAction({ itemId: card.id })
      if (r.ok) done(r.message)
      else fail(r.error)
    })
  }, [card.id, done, fail])

  function saveEdit() {
    setError(null)
    start(async () => {
      const r = await editReviewItemAction({ itemId: card.id, seenEditedAt: card.editedAt, text: draft })
      if (r.ok) done(r.message)
      else fail(r.error, r.conflict)
    })
  }

  function askIgnoreAll() {
    setError(null)
    start(async () => {
      const r = await previewIgnoreAllAction({ itemId: card.id })
      if (r.ok) setPreview(r)
      else fail(r.error)
    })
  }

  function confirmIgnoreAll() {
    start(async () => {
      const r = await ignoreAllAction({ itemId: card.id, confirmed: true })
      if (!r.ok) { fail(r.error); return }
      done(`Ignorate: ${r.ignored}.${r.remaining ? ` Mai rămân ${r.remaining}; repetă operația.` : ''}`)
    })
  }

  // Referințe, ca ascultătorul să nu se reatașeze la fiecare randare.
  const keys = useRef({ apply, ignore, onSkip, onPrev, open, editing, pending, single, hasPrev })
  useEffect(() => { keys.current = { apply, ignore, onSkip, onPrev, open, editing, pending, single, hasPrev } })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = keys.current
      if (e.ctrlKey || e.metaKey || e.altKey || k.pending || k.editing) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
      const key = e.key.toLowerCase()
      if (key === 'arrowright' || (key === 's' && k.open)) { e.preventDefault(); k.onSkip() }
      else if (key === 'arrowleft') { if (k.hasPrev) { e.preventDefault(); k.onPrev() } }
      else if (!k.open) return
      else if (key === 'a' && k.single) { e.preventDefault(); k.apply(0) }
      else if (key === 'e') { e.preventDefault(); setEditing(true) }
      else if (key === 'i') { e.preventDefault(); k.ignore() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dim = { ...ui.muted, opacity: 0.75, margin: '0 0 0.5rem' }
  return (
    <article style={{ ...ui.card, display: 'grid', gap: '0.75rem' }} data-testid="element" data-source={card.source}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <strong style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>{card.reference}</strong>
        <span style={ui.muted}>{card.detectorLabel} · încredere: {card.confidenceLabel} · {card.source === 'cititor' ? 'cititor' : 'audit'}{open ? '' : ` · ${card.statusLabel}`}</span>
      </header>

      <div lang="ro">
        {card.prev && <p style={dim}><sup>{card.prev.verseNum}</sup> {card.prev.textRo}</p>}
        <p data-testid="verset" style={{ ...ui.text, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
          <sup>{card.verseNum}</sup>{' '}
          {card.parts.map((p, i) => (p.hit ? <mark key={i} style={ui.mark}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
        </p>
        {card.next && <p style={dim}><sup>{card.next.verseNum}</sup> {card.next.textRo}</p>}
      </div>

      {card.message && <p style={{ ...ui.text, margin: 0 }}><span style={ui.muted}>Mesajul cititorului: </span>{card.message}</p>}
      {card.source === 'cititor' && !card.message && <p style={{ ...ui.muted, margin: 0 }}>Cititorul nu a scris un mesaj.</p>}
      {card.reason && <p style={{ ...ui.muted, margin: 0 }}>Motiv: {card.reason}</p>}
      {card.options.length > 0 && (
        <p style={{ ...ui.text, margin: 0 }}><span style={ui.muted}>Propunere: </span>{card.options.map(shown).join(' sau ')}</p>
      )}

      {editing && (
        <div>
          <label htmlFor="revizuire-text" style={ui.label}>Tot versetul</label>
          <textarea id="revizuire-text" autoFocus value={draft} rows={rowsFor(draft)} onChange={e => setDraft(e.target.value)} style={ui.verseInput} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button type="button" onClick={saveEdit} disabled={pending} style={{ ...ui.button, opacity: pending ? 0.6 : 1 }}>Salvează</button>
            <button type="button" onClick={() => { setEditing(false); setDraft(card.text) }} disabled={pending} style={ui.ghost}>Renunță</button>
          </div>
        </div>
      )}

      {preview && (
        <div role="group" aria-label="Confirmare" style={{ borderTop: '1px solid #2A1A0A', paddingTop: '0.75rem' }}>
          <p style={{ ...ui.text, margin: '0 0 0.5rem' }}>
            Ignori {preview.now} {preview.now === 1 ? 'element' : 'elemente'} cu „{preview.target}” de la același detector?
            {preview.remaining > 0 && ` Limita e 500 pe operație; rămân ${preview.remaining}.`}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={confirmIgnoreAll} disabled={pending} style={ui.button}>Confirmă</button>
            <button type="button" onClick={() => setPreview(null)} disabled={pending} style={ui.ghost}>Renunță</button>
          </div>
        </div>
      )}

      {error && <p role="alert" style={{ ...ui.error, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {open && card.options.map((o, i) => (
          <button key={i} type="button" onClick={() => apply(i)} disabled={pending} style={{ ...ui.button, opacity: pending ? 0.6 : 1 }}>
            {single ? <>Aplică propunerea <kbd>A</kbd></> : <>Aplică: {shown(o)}</>}
          </button>
        ))}
        {open && !editing && <button type="button" onClick={() => setEditing(true)} disabled={pending} style={ui.ghost}>Editează <kbd>&nbsp;E</kbd></button>}
        {open && <button type="button" onClick={ignore} disabled={pending} style={ui.ghost}>Ignoră <kbd>&nbsp;I</kbd></button>}
        {open && <button type="button" onClick={onSkip} disabled={pending || !hasNext} style={{ ...ui.ghost, opacity: hasNext ? 1 : 0.5 }}>Sari <kbd>&nbsp;S</kbd></button>}
        {open && card.canIgnoreAll && <button type="button" onClick={askIgnoreAll} disabled={pending} style={ui.ghost}>Ignoră toate pentru acest fragment</button>}
        <Link href={`/admin/biblia/${card.slug}/${card.chapterNum}#v${card.verseNum}`} style={ui.ghost}>Deschide în editor</Link>
      </div>
    </article>
  )
}

export default function ReviewQueue({ card, position, total, prevHref, nextHref, hasNext }: {
  card: ReviewCardData; position: number; total: number; prevHref: string | null; nextHref: string; hasNext: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const top = useRef<HTMLDivElement>(null)
  // Pe telefon, contoarele și filtrele ocupă primul ecran: elementul nou trebuie să se vadă fără derulare.
  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) top.current?.scrollIntoView({ block: 'start' })
  }, [card.id])
  const skip = useCallback(() => { setStatus(null); router.push(nextHref) }, [nextHref, router])
  const back = useCallback(() => { if (prevHref) { setStatus(null); router.push(prevHref) } }, [prevHref, router])

  return (
    <div ref={top} style={{ maxWidth: '860px', display: 'grid', gap: '0.5rem', scrollMarginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={ui.muted} data-testid="pozitie">Elementul {position + 1} din {total}</span>
        <span style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={back} disabled={!prevHref} aria-label="Elementul anterior" style={{ ...ui.ghost, opacity: prevHref ? 1 : 0.5 }}>←</button>
          <button type="button" onClick={skip} disabled={!hasNext} aria-label="Elementul următor" style={{ ...ui.ghost, opacity: hasNext ? 1 : 0.5 }}>→</button>
        </span>
      </div>
      <p role="status" data-testid="stare" style={{ ...(status?.kind === 'error' ? ui.error : ui.ok), margin: 0, minHeight: '1.3em' }}>{status?.message}</p>
      <Card key={card.id} card={card} onStatus={setStatus} onSkip={skip} onPrev={back} hasPrev={!!prevHref} hasNext={hasNext} />
    </div>
  )
}
