'use client'

import { useState } from 'react'
import { SITE_URL } from '@/lib/site'

const SHARE_URL = `${SITE_URL}/live`

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
        type="button"
        onClick={handleShare}
        className="btn sm"
      >
        ↗ Distribuie
      </button>
      {copied && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-9 text-[14px] px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: 'rgba(8, 14, 36, 0.98)', color: 'var(--gold)', border: '1px solid var(--gold-d)' }}
          role="status"
        >
          Link copiat!
        </span>
      )}
    </div>
  )
}
