'use client'

import { useState } from 'react'

const SHARE_URL = 'https://biserica-sf-nicolae.org/live'

export default function ShareButton({ isLive, liveTitle }: { isLive: boolean; liveTitle: string | null }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const title = isLive ? liveTitle || 'Live | Biserica Sf. Nicolae' : 'Live | Biserica Sf. Nicolae'
    const text = isLive
      ? `Urmărește slujba în direct: ${liveTitle}`
      : 'Urmărește slujbele în direct pe site-ul parohiei'

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: SHARE_URL })
      } catch {
        /* user cancelled share sheet */
      }
      return
    }

    await navigator.clipboard.writeText(SHARE_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="font-body text-sm px-4 py-2 rounded border transition-colors duration-200 hover:bg-stone-900"
        style={{ color: '#9B8050', borderColor: '#3A2010', borderWidth: '1.5px' }}
      >
        ↗ Distribuie
      </button>
      {copied && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-9 font-body text-xs px-3 py-1.5 rounded whitespace-nowrap"
          style={{ backgroundColor: '#1C1B0A', color: '#C9A84C', border: '1px solid #3A2010' }}
          role="status"
        >
          Link copiat!
        </span>
      )}
    </div>
  )
}
