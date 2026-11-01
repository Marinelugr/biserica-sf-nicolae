'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { submitVerseReport } from '@/lib/bible/reportAction'
import { MAX_REPORT_MESSAGE, type ReportErrorCode } from '@/lib/bible/reportLimits'

/** Mini-formularul de raportare, într-un <dialog>. Încărcat doar când cititorul îl deschide. */
export default function VerseReportForm({ slug, chapter, verse, onClose }: { slug: string; chapter: number; verse: number; onClose: () => void }) {
  const { t } = useI18n()
  const r = t.bible.reader.report
  const dialog = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<ReportErrorCode | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    const el = dialog.current
    if (el && !el.open) el.showModal()
  }, [])

  const errors: Record<ReportErrorCode, string> = {
    invalid: r.errorInvalid, 'too-long': r.errorTooLong, url: r.errorUrl, limit: r.errorLimit, unavailable: r.errorUnavailable,
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const result = await submitVerseReport({ slug, chapter, verse, message, website })
        if (result.ok) setSent(true)
        else setError(result.code)
      } catch {
        // rețea sau server: pagina rămâne întreagă
        setError('unavailable')
      }
    })
  }

  return (
    <dialog ref={dialog} className="report-dialog" data-sec="evanghelie" onClose={onClose} aria-labelledby="raportare-titlu">
      <h2 id="raportare-titlu" className="report-title">{r.title.replace('{n}', String(verse))}</h2>
      {sent ? (
        <>
          <p role="status" className="report-thanks">{r.thanks}</p>
          <div className="report-actions">
            <button type="button" className="btn" onClick={() => dialog.current?.close()} autoFocus>{r.close}</button>
          </div>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="raportare-mesaj" className="report-label">{r.question}</label>
          <textarea
            id="raportare-mesaj"
            className="report-input"
            rows={3}
            maxLength={MAX_REPORT_MESSAGE}
            value={message}
            onChange={e => setMessage(e.target.value)}
            autoFocus
          />
          <p className="report-count" aria-hidden="true">{message.length} / {MAX_REPORT_MESSAGE}</p>
          {/* capcană pentru roboți: un om nu vede câmpul și nu ajunge la el cu Tab */}
          <div className="report-trap" aria-hidden="true">
            <label>Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label>
          </div>
          {error && <p role="alert" className="report-error">{errors[error]}</p>}
          <div className="report-actions">
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>{r.cancel}</button>
            <button type="submit" className="btn" disabled={pending}>{pending ? r.sending : r.submit}</button>
          </div>
        </form>
      )}
    </dialog>
  )
}
