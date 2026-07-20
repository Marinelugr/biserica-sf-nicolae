'use client'

import { useEffect } from 'react'

type ViewType = 'articol' | 'video' | 'carte'

export default function ViewTracker({ type, id }: { type: ViewType; id: string }) {
  useEffect(() => {
    const key = `viewed:${type}:${id}`
    if (sessionStorage.getItem(key)) return

    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {})
  }, [type, id])

  return null
}
