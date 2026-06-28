'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { optimizeImage, blobToFile, formatBytes } from '@/lib/imageOptimizer'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  caption: string | null
  order: number
}

interface Props {
  entityType: string
  entityId: string
  maxPhotos?: number
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.7rem', color: '#F2EBD9', fontSize: '0.82rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #3A2A0A', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

async function uploadFile(file: File, isThumbnail = false): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  if (isThumbnail) fd.append('thumbnail', 'true')
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Eroare upload')
  return data.url
}

export default function MediaGallery({ entityType, entityId, maxPhotos = 50 }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/media?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => { load() }, [load])

  async function handleFiles(files: FileList) {
    if (!files.length) return
    const remaining = maxPhotos - items.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (!toUpload.length) { setError(`Limita de ${maxPhotos} poze atinsă.`); return }

    setUploading(true)
    setUploadProgress(0)
    setUploadTotal(toUpload.length)
    setError('')
    setUploadStatus('')

    let done = 0
    const newItems: MediaItem[] = []

    for (const file of toUpload) {
      try {
        setUploadStatus(`Se optimizează ${file.name}...`)

        // Optimize + thumbnail in parallel
        const { blob, thumbnailBlob, originalSize, optimizedSize } = await optimizeImage(file)
        const optimizedFile = blobToFile(blob, file.name)
        const thumbFile = blobToFile(thumbnailBlob, `thumb_${file.name}`)

        const reduction = Math.round((1 - optimizedSize / originalSize) * 100)
        setUploadStatus(`${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (−${reduction}%) · Se încarcă...`)

        // Upload main + thumbnail in parallel
        const [url, thumbnailUrl] = await Promise.all([
          uploadFile(optimizedFile),
          uploadFile(thumbFile, true),
        ])

        const nextOrder = items.length + newItems.length
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, thumbnailUrl, entityType, entityId, order: nextOrder }),
        })
        if (res.ok) newItems.push(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare upload')
      }
      done++
      setUploadProgress(done)
    }

    setItems(prev => [...prev, ...newItems])
    setUploading(false)
    setUploadStatus('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    next.forEach((item, i) => { item.order = i })
    setItems(next)
  }

  function updateCaption(id: string, caption: string) {
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
          {items.length} din {maxPhotos} poze
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {items.length > 0 && (
            <button
              onClick={saveOrder}
              disabled={saving}
              style={{ backgroundColor: saving ? '#1A1008' : '#1E1208', color: '#C9A84C', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.4rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Se salvează...' : '💾 Salvează ordine & captions'}
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || items.length >= maxPhotos}
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.4rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: (uploading || items.length >= maxPhotos) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: items.length >= maxPhotos ? 0.5 : 1 }}
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

      {items.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ padding: '3rem 1rem', textAlign: 'center', color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px', cursor: 'pointer' }}
        >
          Nicio imagine. Click pentru a adăuga poze.<br />
          <span style={{ fontSize: '0.75rem', color: '#2A1A0A', marginTop: '0.4rem', display: 'block' }}>
            JPG, PNG, WebP, HEIC — compresie automată WebP
          </span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ backgroundColor: '#0A0704', border: '1px solid #2A1A0A', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                <img
                  src={(item as MediaItem & { thumbnailUrl?: string }).thumbnailUrl || item.url}
                  alt={item.caption || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    if (el.src !== item.url) el.src = item.url
                  }}
                />
                <button
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
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    style={{ backgroundColor: 'transparent', color: i === 0 ? '#2A1A0A' : '#9B8050', border: '1px solid #2A1A0A', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: i === 0 ? 'default' : 'pointer' }}
                  >↑ Sus</button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    style={{ backgroundColor: 'transparent', color: i === items.length - 1 ? '#2A1A0A' : '#9B8050', border: '1px solid #2A1A0A', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: i === items.length - 1 ? 'default' : 'pointer' }}
                  >↓ Jos</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
