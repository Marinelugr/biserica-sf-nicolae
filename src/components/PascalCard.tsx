'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { localeToIntl } from '@/lib/i18n/pick'
import { getPascalData } from '@/lib/pascal'

const YEARS_BACK = 2
const YEARS_FORWARD = 3

export default function PascalCard() {
  const { locale } = useI18n()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [baseYear, setBaseYear] = useState(currentYear)

  const data = getPascalData(selectedYear)
  const intlLocale = localeToIntl(locale)
  const fmt = (d: Date) => d.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' })

  const years = Array.from({ length: YEARS_BACK + YEARS_FORWARD + 1 }, (_, i) => baseYear - YEARS_BACK + i)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="eyebrow">☦ Calendarul Pascal</div>
      <div className="serif italic" style={{ fontSize: '28px', fontWeight: 500 }}>
        Sfintele Paști
      </div>
      <div className="serif" style={{ fontSize: '24px', color: 'var(--sec-accent-text, var(--blue))', fontWeight: 600 }}>
        {fmt(data.pasti)} {data.year}
      </div>
      <div className="mute" style={{ fontSize: '16px', marginBottom: '10px' }}>
        Floriile: {fmt(data.florii)}
      </div>

      {/* Selector an */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setBaseYear(y => y - 1)} aria-label="Anul anterior" className="pill-arrow">←</button>
        {years.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => setSelectedYear(y)}
            aria-pressed={y === selectedYear}
            className="pill"
          >
            {y}
          </button>
        ))}
        <button type="button" onClick={() => setBaseYear(y => y + 1)} aria-label="Anul următor" className="pill-arrow">→</button>
      </div>

      <Link href="/calendar-pascal" className="link-gold" style={{ fontSize: '17px' }}>
        Vezi calendarul pascal complet →
      </Link>
    </div>
  )
}
