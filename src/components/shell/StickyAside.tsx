'use client'

import { useEffect, useRef } from 'react'

/**
 * Coloana din stânga, sticky sub header pe desktop (≥1024px).
 * Dacă e mai înaltă decât fereastra, se lipește cu marginea de jos
 * (top negativ calculat), ca toate cardurile să rămână accesibile la scroll.
 * Fără JS rămâne sticky simplu (CSS), cu top = înălțimea header-ului.
 */
export default function StickyAside({
  children,
  className = '',
  label,
}: {
  children: React.ReactNode
  className?: string
  label: string
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 71
      const gap = 20
      const top = Math.min(header + gap, window.innerHeight - el.offsetHeight - gap)
      el.style.setProperty('--aside-top', `${Math.round(top)}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <aside ref={ref} className={`shell-aside is-sticky ${className}`} aria-label={label} data-aside>
      {children}
    </aside>
  )
}
