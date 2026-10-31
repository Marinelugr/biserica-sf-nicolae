'use client'

import { useState, useTransition } from 'react'
import { createVerseAction, saveVerseAction, setVerseReviewedAction } from '@/app/admin/biblia/actions'
import { ui } from './ui'

const rowsFor = (text: string) => Math.max(2, Math.ceil(text.length / 55) + 1)

interface Status { kind: 'ok' | 'error'; message: string }

function StatusLine({ status, id }: { status: Status | null; id: string }) {
  return (
    <p id={id} role="status" style={{ ...(status?.kind === 'error' ? ui.error : ui.ok), margin: 0, minHeight: '1.3em' }}>
      {status?.message}
    </p>
  )
}

export interface EditorVerse { id: string; n: number; text: string; reviewed: boolean; editedAt: string | null }

export function VerseEditor({ verse }: { verse: EditorVerse }) {
  const [text, setText] = useState(verse.text)
  const [saved, setSaved] = useState(verse.text)
  const [seen, setSeen] = useState(verse.editedAt)
  const [reviewed, setReviewed] = useState(verse.reviewed)
  const [status, setStatus] = useState<Status | null>(null)
  const [conflict, setConflict] = useState<{ text: string; editedAt: string | null } | null>(null)
  const [pending, start] = useTransition()
  const dirty = text !== saved
  const field = `verset-${verse.n}`

  function fail(message: string, current?: { text: string; editedAt: string | null }) {
    setStatus({ kind: 'error', message })
    setConflict(current ?? null)
  }

  function save() {
    start(async () => {
      const r = await saveVerseAction({ verseId: verse.id, text, seenEditedAt: seen })
      if (!r.ok) { fail(r.error, r.conflict); return }
      setText(r.text); setSaved(r.text); setSeen(r.editedAt); setConflict(null)
      setStatus({ kind: 'ok', message: r.status === 'saved' ? 'Salvat.' : 'Textul nu s-a schimbat.' })
    })
  }

  function toggleReviewed(next: boolean) {
    const previous = reviewed
    setReviewed(next)
    start(async () => {
      const r = await setVerseReviewedAction({ verseId: verse.id, reviewed: next, seenEditedAt: seen })
      if (!r.ok) { setReviewed(previous); fail(r.error, r.conflict); return }
      setStatus({ kind: 'ok', message: next ? 'Marcat revizuit.' : 'Bifa „Revizuit” a fost scoasă.' })
    })
  }

  function takeCurrent() {
    if (!conflict) return
    setText(conflict.text); setSaved(conflict.text); setSeen(conflict.editedAt); setConflict(null); setStatus(null)
  }

  return (
    <section id={`v${verse.n}`} style={{ ...ui.card, scrollMarginTop: '1rem' }}>
      <label htmlFor={field} style={{ ...ui.label, color: '#C9A84C', fontSize: '1rem' }}>
        Versetul {verse.n}{dirty ? ' · nesalvat' : ''}
      </label>
      <textarea id={field} value={text} rows={rowsFor(text)} onChange={e => setText(e.target.value)} style={ui.verseInput} aria-describedby={`${field}-stare`} />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <button type="button" onClick={save} disabled={pending} style={{ ...ui.button, opacity: pending ? 0.6 : 1 }}>
          {pending ? 'Se salvează…' : 'Salvează'}
        </button>
        <label style={{ ...ui.text, display: 'inline-flex', gap: '0.5rem', alignItems: 'center', minHeight: '44px', cursor: 'pointer' }}>
          <input type="checkbox" checked={reviewed} disabled={pending} onChange={e => toggleReviewed(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem' }} />
          Revizuit
        </label>
        <StatusLine status={status} id={`${field}-stare`} />
      </div>
      {conflict && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #2A1A0A', paddingTop: '0.75rem' }}>
          <p style={{ ...ui.muted, margin: '0 0 0.25rem' }}>Versiunea actuală din bază:</p>
          <p style={{ ...ui.text, margin: '0 0 0.5rem' }}>{conflict.text}</p>
          <button type="button" onClick={takeCurrent} style={ui.ghost}>Folosește versiunea actuală</button>
        </div>
      )}
    </section>
  )
}

/** Un verset lipsă: câmpul se deschide la apăsarea butonului. */
export function AddVerse({ slug, chapter, n, gap }: { slug: string; chapter: number; n: number; gap: boolean }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [pending, start] = useTransition()
  const field = `adauga-${n}`

  function create() {
    start(async () => {
      const r = await createVerseAction({ slug, chapter, verseNum: n, text })
      // la reușită, pagina se reîncarcă din server și versetul apare în editor
      if (!r.ok) setStatus({ kind: 'error', message: r.error })
    })
  }

  return (
    <section style={{ ...ui.card, borderColor: gap ? '#E8B04A' : '#2A1A0A', borderStyle: 'dashed' }}>
      {gap && <p style={{ ...ui.warn, margin: '0 0 0.5rem' }}>Lipsește versetul {n}.</p>}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={ui.ghost}>Adaugă versetul {n}</button>
      ) : (
        <>
          <label htmlFor={field} style={ui.label}>Textul versetului {n}</label>
          <textarea id={field} value={text} rows={rowsFor(text)} onChange={e => setText(e.target.value)} style={ui.verseInput} autoFocus />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button type="button" onClick={create} disabled={pending} style={{ ...ui.button, opacity: pending ? 0.6 : 1 }}>
              {pending ? 'Se creează…' : `Creează versetul ${n}`}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={pending} style={ui.ghost}>Renunță</button>
            <StatusLine status={status} id={`${field}-stare`} />
          </div>
        </>
      )}
    </section>
  )
}
