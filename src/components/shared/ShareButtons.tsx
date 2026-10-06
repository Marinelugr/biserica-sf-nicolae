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
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="chip">
        WhatsApp
      </a>
      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="chip">
        Facebook
      </a>
      <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="chip">
        Telegram
      </a>
      <div className="relative inline-block">
        <button type="button" onClick={handleCopy} className="chip">
          {copied ? '✓ Link copiat' : 'Copiază link'}
        </button>
      </div>
    </div>
  )
}
