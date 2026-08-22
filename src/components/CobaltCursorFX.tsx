'use client'

import { useEffect } from 'react'

export default function CobaltCursorFX() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    function handleMouseMove(e: MouseEvent) {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--my', `${e.clientY}px`)

      const target = e.target as HTMLElement | null
      const glass = target?.closest<HTMLElement>('.glass-cobalt')
      if (glass) {
        const rect = glass.getBoundingClientRect()
        glass.style.setProperty('--x', `${e.clientX - rect.left}px`)
        glass.style.setProperty('--y', `${e.clientY - rect.top}px`)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return <div className="cobalt-spotlight" aria-hidden="true" />
}
