'use client'

import { useSyncExternalStore } from 'react'

export type TextSize = 's' | 'm' | 'l'
const SIZES: TextSize[] = ['s', 'm', 'l']
const KEY = 'bible-text-size'
const EVENT = 'bible-text-size'

// Rezervă în memorie când localStorage e blocat (fereastră privată, setări stricte).
let memory: TextSize = 's'

function read(): TextSize {
  try {
    const v = localStorage.getItem(KEY)
    if (v && (SIZES as string[]).includes(v)) return v as TextSize
  } catch { /* localStorage blocat */ }
  return memory
}

function write(size: TextSize) {
  memory = size
  try { localStorage.setItem(KEY, size) } catch { /* localStorage blocat: rămâne doar în memorie */ }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb) }
}

interface Props {
  label: string
  /** Etichetele celor trei trepte: 22, 26, 30 px. */
  sizeLabels: [string, string, string]
  children: React.ReactNode
}

/** Trei trepte de mărime a textului; păstrată în localStorage. Fără JS: mărimea implicită (22 px). */
export default function ReaderControls({ label, sizeLabels, children }: Props) {
  const size = useSyncExternalStore(subscribe, read, () => 's')
  return (
    <div className="reader" data-size={size}>
      <div className="reader-controls" role="group" aria-label={label}>
        <span className="mute text-[16px]" aria-hidden="true">{label}</span>
        {SIZES.map((s, i) => (
          <button key={s} type="button" className={`size-btn size-${s}`} aria-pressed={size === s} onClick={() => write(s)} aria-label={sizeLabels[i]}>
            A
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
