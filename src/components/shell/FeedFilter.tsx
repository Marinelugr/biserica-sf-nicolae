'use client'

import { useEffect, useState } from 'react'
import type { FeedKind } from './FeedCard'

interface Props {
  label: string
  emptyLabel: string
  options: { kind: FeedKind | 'all'; label: string }[]
}

/**
 * Chip-urile de filtrare a fluxului. Tot conținutul rămâne în HTML-ul randat
 * pe server; filtrarea doar ascunde elementele [data-kind] după hidratare.
 */
export default function FeedFilter({ label, emptyLabel, options }: Props) {
  const [active, setActive] = useState<FeedKind | 'all'>('all')
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('[data-feed] [data-kind]')
    let visible = 0
    items.forEach(el => {
      const show = active === 'all' || el.dataset.kind === active
      el.hidden = !show
      if (show) visible++
    })
    // sincronizare cu DOM-ul randat pe server (sistem extern React-ului)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmpty(visible === 0)
    window.dispatchEvent(new Event('feed:filter'))
  }, [active])

  return (
    <>
      <div className="flex flex-wrap gap-2.5" role="group" aria-label={label}>
        {options.map(o => (
          <button
            key={o.kind}
            type="button"
            className="chip"
            aria-pressed={active === o.kind}
            onClick={() => setActive(o.kind)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" className={empty ? 'card mute italic' : 'sr-only'} style={empty ? { padding: '22px 24px' } : undefined}>
        {empty ? emptyLabel : ''}
      </p>
    </>
  )
}
