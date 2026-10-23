'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { optimizeImage, blobToFile, formatBytes } from '@/lib/imageOptimizer'
import { uploadImage, attachMedia } from '@/lib/mediaUpload'
import { isHeic, convertHeicToJpeg } from '@/lib/heic'
import { movePending, removePending, setPendingCaption, type PendingMedia } from '@/lib/pendingMedia'
import { describeLoadFailure } from '@/lib/imageLoad'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  caption: string | null
  order: number
}

interface Props {
  entityType: string
  /** null = formular nou, nesalvat: pozele rămân „în așteptare” la părinte până la salvare. */
  entityId: string | null
  maxPhotos?: number
  pending?: PendingMedia[]
  onPendingChange?: (items: PendingMedia[]) => void
  /** Textul afișat în modul „în așteptare”, în locul butonului de salvare. */
  pendingNote?: string
  /** Anunță părintele cât timp se încarcă poze (ex. ca să nu se salveze formularul între timp). */
  onUploadingChange?: (uploading: boolean) => void
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.7rem', color: '#F2EBD9', fontSize: '0.82rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #3A2A0A', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

interface UploadSummary {
  ok: number
  total: number
  failures: { name: string; reason: string }[]
  skipped: number
}

const NO_PENDING: PendingMedia[] = []

// Miniatura, apoi poza principală; dacă nici aceasta nu se încarcă (ex. .heic în Chrome),
// un chenar cu motivul, în loc de o imagine de înălțime zero.
function GalleryImage({ item, onBroken }: { item: MediaItem; onBroken: (id: string) => void }) {
  const [src, setSrc] = useState(item.thumbnailUrl || item.url)
  const [broken, setBroken] = useState(false)
  const [contentType, setContentType] = useState<string | null>(null)

  function handleError() {
    if (src !== item.url) { setSrc(item.url); return }
    setBroken(true)
    onBroken(item.id)
    fetch(item.url, { method: 'HEAD' })
      .then(res => { if (res.ok) setContentType(res.headers.get('content-type')) })
      .catch(() => {})
  }

  if (broken) {
    const { detail } = describeLoadFailure(item.url, contentType)
    return (
      <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', margin: '0.35rem', padding: '0.75rem 0.5rem', border: '1px dashed #6A2020', borderRadius: '4px', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
        <span style={{ color: '#CA4A4A', fontSize: '0.8rem' }}>Poza nu se poate afișa</span>
        {detail && <span style={{ color: '#8B6014', fontSize: '0.72rem' }}>{detail}</span>}
      </div>
    )
  }

  return <img src={src} alt={item.caption || ''} style={{ width: '100%', height: 'auto', display: 'block' }} onError={handleError} />
}

function newTempId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function MediaGallery({ entityType, entityId, maxPhotos = 50, pending = NO_PENDING, onPendingChange, pendingNote = 'Ordinea și descrierile se salvează odată cu știrea.', onUploadingChange }: Props) {
  const isPending = entityId === null
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(!isPending)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [saving, setSaving] = useState(false)
  // Pozele care nu se încarcă în browser (stare de eroare din GalleryImage, nu după extensie).
  const [broken, setBroken] = useState<Set<string>>(() => new Set())
  const [cleaning, setCleaning] = useState<{ done: number; total: number } | null>(null)
  const [cleanResult, setCleanResult] = useState<{ text: string; failed: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ultima listă în așteptare, citită în bucla de încărcare (props-ul se schimbă între poze).
  const pendingRef = useRef(pending)
  useEffect(() => { pendingRef.current = pending }, [pending])

  const shown: MediaItem[] = isPending
    ? pending.map(p => ({ id: p.tempId, url: p.url, thumbnailUrl: p.thumbnailUrl, caption: p.caption, order: p.order }))
    : items

  const brokenShown = shown.filter(i => broken.has(i.id))

  const markBroken = useCallback((id: string) => {
    setBroken(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  function setPending(next: PendingMedia[]) {
    pendingRef.current = next
    onPendingChange?.(next)
  }

  const load = useCallback(async () => {
    if (entityId === null) return
    try {
      const res = await fetch(`/api/admin/media?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    onUploadingChange?.(uploading)
    // Dacă galeria dispare în timpul încărcării, părintele nu rămâne blocat.
    return () => { if (uploading) onUploadingChange?.(false) }
  }, [uploading, onUploadingChange])

  // Avertisment dacă pagina e închisă în timpul încărcării.
  useEffect(() => {
    if (!uploading) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  // Principala, apoi miniatura: una după alta, ca serverul să ruleze un singur
  // proces sharp odată. HEIC se convertește întâi în JPEG (altfel poza e refuzată).
  // Dacă optimizarea în browser eșuează, se trimite fișierul fără miniatură; serverul îl comprimă oricum.
  async function uploadOne(original: File): Promise<{ url: string; thumbnailUrl?: string }> {
    let file = original
    if (isHeic(original)) {
      setUploadStatus(`Se convertește ${original.name} din HEIC...`)
      file = await convertHeicToJpeg(original)
    }
    let mainFile = file
    let thumbFile: File | null = null
    try {
      setUploadStatus(`Se optimizează ${file.name}...`)
      const { blob, thumbnailBlob, originalSize, optimizedSize } = await optimizeImage(file)
      mainFile = blobToFile(blob, file.name)
      thumbFile = blobToFile(thumbnailBlob, `thumb_${file.name}`)
      const reduction = Math.round((1 - optimizedSize / originalSize) * 100)
      setUploadStatus(`${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (−${reduction}%) · Se încarcă...`)
    } catch {
      setUploadStatus(`${file.name} (${formatBytes(file.size)}) · Se încarcă...`)
    }

    const url = await uploadImage(mainFile)
    // Miniatura e opțională: fără ea, galeria afișează poza principală.
    const thumbnailUrl = thumbFile ? await uploadImage(thumbFile, { thumbnail: true }).catch(() => undefined) : undefined
    return { url, thumbnailUrl }
  }

  async function handleFiles(files: FileList) {
    if (!files.length) return
    const all = Array.from(files)
    const remaining = maxPhotos - shown.length
    const toUpload = all.slice(0, Math.max(remaining, 0))
    if (!toUpload.length) { setError(`Limita de ${maxPhotos} poze atinsă.`); return }

    setUploading(true)
    setUploadProgress(0)
    setUploadTotal(toUpload.length)
    setError('')
    setSummary(null)
    setUploadStatus('')

    const failures: UploadSummary['failures'] = []
    let ok = 0
    const baseOrder = shown.length

    for (const [i, file] of toUpload.entries()) {
      try {
        const { url, thumbnailUrl } = await uploadOne(file)
        if (entityId === null) {
          const current = pendingRef.current
          setPending([...current, { tempId: newTempId(), url, thumbnailUrl, caption: '', order: current.length }])
        } else {
          const item = await attachMedia<MediaItem>({ url, thumbnailUrl, entityType, entityId, order: baseOrder + ok })
          setItems(prev => [...prev, item])
        }
        ok++
      } catch (err) {
        const reason = err instanceof Error ? err.message.replace(`${file.name}: `, '') : 'Eroare necunoscută'
        failures.push({ name: file.name, reason })
      }
      setUploadProgress(i + 1)
    }

    setSummary({ ok, total: toUpload.length, failures, skipped: all.length - toUpload.length })
    setUploading(false)
    setUploadStatus('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (isPending) { setPending(removePending(pending, id)); return }
    await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // Șterge doar înregistrările din galerie; fișierele din Storage rămân (se curăță separat).
  async function deleteBroken() {
    const targets = brokenShown
    const total = targets.length
    if (!total) return
    if (!confirm(`Se vor șterge ${total} ${total === 1 ? 'poză care nu se poate afișa' : 'poze care nu se pot afișa'}. Pozele care se văd rămân. Continui?`)) return
    setCleanResult(null)

    if (isPending) {
      setPending(targets.reduce((list, t) => removePending(list, t.id), pendingRef.current))
      setCleanResult({ text: `Am scos ${total} ${total === 1 ? 'poză' : 'poze'} din listă.`, failed: false })
      return
    }

    let failed = 0
    for (const [i, t] of targets.entries()) {
      setCleaning({ done: i + 1, total })
      try {
        const res = await fetch(`/api/admin/media/${t.id}`, { method: 'DELETE' })
        if (!res.ok) failed++
      } catch {
        failed++
      }
    }
    setCleaning(null)
    await load()
    setCleanResult(failed
      ? { text: `${failed} din ${total} poze nu au putut fi șterse. Încearcă din nou.`, failed: true }
      : { text: `Am șters ${total} ${total === 1 ? 'poză' : 'poze'}.`, failed: false })
  }

  function move(index: number, dir: -1 | 1) {
    if (isPending) { setPending(movePending(pending, index, dir)); return }
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    next.forEach((item, i) => { item.order = i })
    setItems(next)
  }

  function updateCaption(id: string, caption: string) {
    if (isPending) { setPending(setPendingCaption(pending, id, caption)); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, caption } : i))
  }

  async function saveOrder() {
    setSaving(true)
    try {
      await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, caption, order }) => ({ id, caption, order })) }),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>Se încarcă galeria...</div>

  return (
    <div>
      {/* Counter + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
          {shown.length} din {maxPhotos} poze
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isPending ? (
            <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.78rem', alignSelf: 'center' }}>
              {pendingNote}
            </span>
          ) : shown.length > 0 && (
            <button type="button"
              onClick={saveOrder}
              disabled={saving}
              style={{ backgroundColor: saving ? '#1A1008' : '#1E1208', color: '#C9A84C', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.4rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Se salvează...' : '💾 Salvează ordine & captions'}
            </button>
          )}
          <button type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || shown.length >= maxPhotos}
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.4rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: (uploading || shown.length >= maxPhotos) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: shown.length >= maxPhotos ? 0.5 : 1 }}
          >
            {uploading ? <><Spinner /> Se optimizează...</> : '📎 Adaugă poze'}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {/* Progress */}
      {uploading && (
        <div style={{ marginBottom: '1rem' }}>
          {uploadTotal > 1 && (
            <div style={{ marginBottom: '0.4rem' }}>
              <div style={{ backgroundColor: '#1A1008', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#C9A84C', height: '100%', width: `${(uploadProgress / uploadTotal) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>
                {uploadProgress} / {uploadTotal} poze
              </span>
            </div>
          )}
          {uploadStatus && (
            <div style={{ color: '#8B6014', fontFamily: 'Georgia, serif', fontSize: '0.78rem', padding: '0.5rem 0.75rem', backgroundColor: '#0A0704', borderRadius: '4px', border: '1px solid #1A1008' }}>
              ⚡ {uploadStatus}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: '#CA4A4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.75rem' }}>✗ {error}</div>
      )}

      {summary && (
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#0A0704', borderRadius: '4px', border: `1px solid ${summary.failures.length ? '#3A1010' : '#1A1008'}` }}>
          <div style={{ color: summary.failures.length ? '#CA4A4A' : '#7A9A50' }}>
            {summary.failures.length ? '✗' : '✓'} {summary.ok} din {summary.total} {summary.total === 1 ? 'poză încărcată' : 'poze încărcate'}.
          </div>
          {summary.failures.length > 0 && (
            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: '#C06050' }}>
              {summary.failures.map((f, i) => <li key={i}><strong>{f.name}</strong>: {f.reason}</li>)}
            </ul>
          )}
          {summary.skipped > 0 && (
            <div style={{ color: '#8B6014', marginTop: '0.35rem' }}>
              {summary.skipped} {summary.skipped === 1 ? 'poză nu a fost adăugată' : 'poze nu au fost adăugate'}: limita este de {maxPhotos} poze.
            </div>
          )}
        </div>
      )}

      {(brokenShown.length > 0 || cleaning) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#1A0606', borderRadius: '4px', border: '1px solid #6A2020', color: '#E06A5A' }}>
          <span>
            {cleaning
              ? `Se șterg ${cleaning.done} din ${cleaning.total}…`
              : brokenShown.length === 1
                ? '✗ 1 poză nu se poate afișa. Șterge-o (✕) și încarc-o din nou ca JPG.'
                : `✗ ${brokenShown.length} poze nu se pot afișa. Șterge-le (✕) și încarcă-le din nou ca JPG.`}
          </span>
          <button type="button"
            onClick={deleteBroken}
            disabled={!!cleaning || uploading}
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.35rem 0.75rem', fontFamily: 'Georgia, serif', fontSize: '0.78rem', cursor: (cleaning || uploading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {cleaning ? <><Spinner /> Se șterg...</> : '🗑 Șterge pozele nefuncționale'}
          </button>
        </div>
      )}

      {cleanResult && !cleaning && (
        <div style={{ color: cleanResult.failed ? '#CA4A4A' : '#7A9A50', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {cleanResult.failed ? '✗' : '✓'} {cleanResult.text}
        </div>
      )}

      {shown.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ padding: '3rem 1rem', textAlign: 'center', color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px', cursor: 'pointer' }}
        >
          Nicio imagine. Click pentru a adăuga poze.<br />
          <span style={{ fontSize: '0.75rem', color: '#2A1A0A', marginTop: '0.4rem', display: 'block' }}>
            JPG, PNG, WebP, HEIC — compresie automată WebP
          </span>
          <span style={{ fontSize: '0.75rem', color: '#5A4020', marginTop: '0.25rem', display: 'block' }}>
            Poți alege mai multe poze deodată.
          </span>
        </div>
      ) : (
        <div className="mg-grid">
          {shown.map((item, i) => (
            <div key={item.id} className="mg-item" style={{ backgroundColor: '#0A0704', border: '1px solid #2A1A0A', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <GalleryImage item={item} onBroken={markBroken} />
                <button type="button"
                  onClick={() => handleDelete(item.id)}
                  style={{ position: 'absolute', top: '0.35rem', right: '0.35rem', backgroundColor: 'rgba(90,10,10,0.9)', border: 'none', borderRadius: '3px', color: '#F2EBD9', cursor: 'pointer', padding: '0.15rem 0.4rem', fontSize: '0.75rem', lineHeight: 1.4 }}
                >✕</button>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <input
                  value={item.caption || ''}
                  onChange={e => updateCaption(item.id, e.target.value)}
                  placeholder="Caption..."
                  style={inp}
                />
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
                  <button type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    style={{ backgroundColor: 'transparent', color: i === 0 ? '#2A1A0A' : '#9B8050', border: '1px solid #2A1A0A', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: i === 0 ? 'default' : 'pointer' }}
                  >↑ Sus</button>
                  <button type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === shown.length - 1}
                    style={{ backgroundColor: 'transparent', color: i === shown.length - 1 ? '#2A1A0A' : '#9B8050', border: '1px solid #2A1A0A', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: i === shown.length - 1 ? 'default' : 'pointer' }}
                  >↓ Jos</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .mg-grid { columns: 5; column-gap: 0.875rem; }
        .mg-item { break-inside: avoid; margin-bottom: 0.875rem; }
        @media (max-width: 1200px) { .mg-grid { columns: 4; } }
        @media (max-width: 900px)  { .mg-grid { columns: 3; } }
        @media (max-width: 600px)  { .mg-grid { columns: 2; } }
      `}</style>
    </div>
  )
}
