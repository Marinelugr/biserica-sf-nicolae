'use client'

import { useRef, useState, useEffect } from 'react'
import { optimizeImage, blobToFile, formatBytes } from '@/lib/imageOptimizer'
import { uploadImage } from '@/lib/mediaUpload'

// Vector/animat: compresia prin canvas le-ar strica (SVG rasterizat, GIF fără animație).
const KEEP_AS_IS = new Set(['image/svg+xml', 'image/gif'])

const fmt = (bytes: number) => formatBytes(bytes).replace('.', ',')

// Poza de telefon (4–10 MB) se micșorează în browser înainte de trimitere.
// Dacă nu se poate (ex. HEIC în Chrome), se trimite originalul; serverul o comprimă oricum.
async function compress(file: File): Promise<File> {
  if (KEEP_AS_IS.has(file.type)) return file
  try {
    const { blob } = await optimizeImage(file)
    return blob.size < file.size ? blobToFile(blob, file.name) : file
  } catch {
    return file
  }
}

interface Props {
  onUpload: (url: string) => void
  label?: string
  accept?: string
  style?: React.CSSProperties
}

export default function ImageUploadButton({ onUpload, label = 'Încarcă imagine', accept = 'image/*', style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [sizeNote, setSizeNote] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setUploading(true)
    setError('')
    setSizeNote('')
    try {
      const toSend = await compress(file)
      if (signal.aborted) return
      setSizeNote(toSend === file ? fmt(file.size) : `${fmt(file.size)} → ${fmt(toSend.size)}`)
      onUpload(await uploadImage(toSend, { signal }))
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Eroare la upload')
    } finally {
      setUploading(false)
      setSizeNote('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem', ...style }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => { setError(''); inputRef.current?.click() }}
        disabled={uploading}
        style={{
          backgroundColor: uploading ? '#1A1008' : '#1E1208',
          color: uploading ? '#5A4020' : '#C9A84C',
          border: '1px solid #2A1A0A',
          borderRadius: '4px',
          padding: '0.55rem 0.875rem',
          fontFamily: 'Georgia, serif',
          fontSize: '0.825rem',
          cursor: uploading ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'all 0.15s',
        }}
      >
        {uploading
          ? <><Spinner /> Se încarcă...{sizeNote && <span style={{ color: '#5A4020', fontSize: '0.75rem' }}>({sizeNote})</span>}</>
          : <>📎 {label}</>}
      </button>
      {error && (
        <span style={{ color: '#CA4A4A', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>
          ✗ {error}
        </span>
      )}
    </span>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #3A2A0A', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
