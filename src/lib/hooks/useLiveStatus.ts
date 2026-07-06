'use client'

import { useEffect, useState } from 'react'
import type { LiveStatus } from '@/lib/live-stream'

const POLL_INTERVAL_MS = 120_000

export function useLiveStatus(initialStatus?: LiveStatus | null) {
  const [status, setStatus] = useState<LiveStatus | null>(initialStatus ?? null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/live-status')
        const data: LiveStatus = await res.json()
        if (!cancelled) setStatus(data)
      } catch {
        /* keep last known status on network error */
      }
    }

    if (!initialStatus) poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}
