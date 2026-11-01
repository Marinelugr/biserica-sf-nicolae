'use client'

import { useI18n } from '@/lib/i18n/context'

interface Props {
  /** Lipsește când există doar capitole sau cărți citite recent. */
  primary?: { href: string; text: string }
  recent: { key: string; href: string; label: string }[]
  onClear: () => void
}

/** Cardul „Continuă lectura", comun pentru Biblie și Bibliotecă. Prezentare pură. */
export default function ContinueCard({ primary, recent, onClear }: Props) {
  const r = useI18n().t.bible.reader
  return (
    <section className="card continue-card" aria-label={r.continueTitle}>
      {primary && <a href={primary.href} className="btn gold continue-link">{primary.text}</a>}
      {recent.length > 0 && (
        <div className="continue-recent">
          <h2 className="eyebrow" style={{ fontSize: 14 }}>{r.recentlyRead}</h2>
          <ul>
            {recent.map(item => (
              <li key={item.key}><a href={item.href}>{item.label}</a></li>
            ))}
          </ul>
        </div>
      )}
      <div className="continue-foot">
        <p className="mute text-[15px]">{r.positionLocalNote}</p>
        <button type="button" className="btn sm" onClick={onClear}>{r.clearHistory}</button>
      </div>
    </section>
  )
}
