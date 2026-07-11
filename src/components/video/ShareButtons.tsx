'use client'

import { useState } from 'react'

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  const btn: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: '0.85rem', color: '#8A7050',
    border: '1px solid #E8E5E0', borderRadius: '6px', padding: '0.5rem 1rem',
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none',
    backgroundColor: 'transparent', cursor: 'pointer',
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={btn}>
        WhatsApp
      </a>
      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={btn}>
        Facebook
      </a>
      <div className="relative inline-block">
        <button onClick={handleCopy} style={btn}>
          {copied ? '✓ Link copiat' : 'Copiază link'}
        </button>
      </div>
    </div>
  )
}
