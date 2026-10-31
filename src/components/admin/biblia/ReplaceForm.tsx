'use client'

import { useState, useTransition } from 'react'
import { applyReplaceAction, previewReplaceAction, type PreviewResult } from '@/app/admin/biblia/actions'
import type { MarkedPart } from '@/lib/bible/adminCore'
import { ui } from './ui'

type Preview = Extract<PreviewResult, { ok: true }>

function Marked({ parts }: { parts: MarkedPart[] }) {
  return <>{parts.map((p, i) => (p.hit ? <mark key={i} style={ui.mark}>{p.text}</mark> : <span key={i}>{p.text}</span>))}</>
}

export default function ReplaceForm({ books }: { books: { slug: string; label: string }[] }) {
  const [slug, setSlug] = useState('')
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [wholeWord, setWholeWord] = useState(true)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [pending, start] = useTransition()

  /** Orice schimbare în formular anulează previzualizarea: se confirmă doar ce s-a văzut. */
  function changed<T>(set: (v: T) => void) {
    return (v: T) => { set(v); setPreview(null); setConfirmed(false); setError(''); setDone('') }
  }

  function runPreview() {
    setError(''); setDone(''); setConfirmed(false)
    start(async () => {
      const r = await previewReplaceAction({ slug, find, replace, wholeWord })
      if (r.ok) setPreview(r)
      else { setPreview(null); setError(r.error) }
    })
  }

  function apply() {
    if (!preview) return
    start(async () => {
      const r = await applyReplaceAction({ slug, find, replace, wholeWord, token: preview.token, confirmed })
      setPreview(null); setConfirmed(false)
      if (!r.ok) { setError(r.error); return }
      setDone(`Am schimbat ${r.changed} versete.${r.remaining ? ` Au rămas ${r.remaining}: previzualizează din nou pentru următoarele.` : ''}`)
    })
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label htmlFor="carte" style={ui.label}>Cartea</label>
          <select id="carte" value={slug} onChange={e => changed(setSlug)(e.target.value)} style={ui.input}>
            <option value="">Alege cartea…</option>
            {books.map(b => <option key={b.slug} value={b.slug}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gaseste" style={ui.label}>Textul căutat (exact, cu majuscule și diacritice)</label>
          <input id="gaseste" value={find} onChange={e => changed(setFind)(e.target.value)} style={ui.input} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="inlocuieste" style={ui.label}>Textul nou (gol = se șterge)</label>
          <input id="inlocuieste" value={replace} onChange={e => changed(setReplace)(e.target.value)} style={ui.input} autoComplete="off" />
        </div>
        <label style={{ ...ui.text, display: 'inline-flex', gap: '0.5rem', alignItems: 'center', minHeight: '44px', cursor: 'pointer' }}>
          <input type="checkbox" checked={wholeWord} onChange={e => changed(setWholeWord)(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem' }} />
          Doar cuvinte întregi („intru” nu schimbă „dintru”)
        </label>
        <div>
          <button type="button" onClick={runPreview} disabled={pending} style={{ ...ui.button, opacity: pending ? 0.6 : 1 }}>
            {pending ? 'Se lucrează…' : 'Previzualizează'}
          </button>
        </div>
      </div>

      <div role="status">
        {error && <p style={ui.error}>{error}</p>}
        {done && <p style={ui.ok}>{done}</p>}
      </div>

      {preview && (
        <section aria-label="Previzualizare" style={{ marginTop: '1.5rem' }}>
          <p style={{ ...ui.text, fontSize: '1.1rem' }}>
            {preview.total === 0
              ? 'Niciun verset nu s-ar schimba.'
              : `Versete afectate: ${preview.total}. Primele ${preview.samples.length}, înainte și după:`}
          </p>
          {preview.total > preview.applicable + preview.invalid.length && (
            <p style={ui.warn}>Limita este de 500 de versete pe operație: acum se schimbă primele {preview.applicable}, în ordinea cărții. Pentru restul, previzualizează din nou după aplicare.</p>
          )}
          {preview.invalid.length > 0 && (
            <div style={{ ...ui.card, borderColor: '#F08A8A', marginBottom: '1rem' }}>
              <p style={{ ...ui.error, marginTop: 0 }}>Operația e blocată: rezultatul nu trece validarea la aceste versete.</p>
              <ul style={{ ...ui.muted, margin: 0, paddingLeft: '1.25rem' }}>
                {preview.invalid.map(i => <li key={`${i.chapterNum}:${i.verseNum}`}>{i.chapterNum}:{i.verseNum} — {i.error}</li>)}
              </ul>
            </div>
          )}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {preview.samples.map(s => (
              <article key={`${s.chapterNum}:${s.verseNum}`} style={ui.card}>
                <h3 style={{ ...ui.label, color: '#C9A84C', margin: '0 0 0.5rem', fontWeight: 400 }}>{s.chapterNum}:{s.verseNum}</h3>
                <p style={{ ...ui.text, margin: '0 0 0.5rem' }}><strong style={ui.muted}>Înainte: </strong><Marked parts={s.before} /></p>
                <p style={{ ...ui.text, margin: 0 }}><strong style={ui.muted}>După: </strong><Marked parts={s.after} /></p>
              </article>
            ))}
          </div>
          {preview.applicable > 0 && preview.invalid.length === 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ ...ui.text, display: 'flex', gap: '0.5rem', alignItems: 'center', minHeight: '44px', cursor: 'pointer' }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                Am verificat și confirm schimbarea a {preview.applicable} versete.
              </label>
              <button type="button" onClick={apply} disabled={!confirmed || pending} style={{ ...ui.button, marginTop: '0.5rem', opacity: !confirmed || pending ? 0.6 : 1 }}>
                {pending ? 'Se aplică…' : `Aplică la ${preview.applicable} versete`}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
