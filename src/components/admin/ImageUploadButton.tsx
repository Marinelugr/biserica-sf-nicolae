'use client'

import { useRef, useState } from 'react'

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

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eroare la upload')
      onUpload(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la upload')
    } finally {
      setUploading(false)
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
          ? <><Spinner /> Se încarcă...</>
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
