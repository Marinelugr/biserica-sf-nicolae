'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { localeToIntl } from '@/lib/i18n/pick'
import { getPascalData } from '@/lib/pascal'

const YEARS_BACK = 2
const YEARS_FORWARD = 3

const arrowStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#C9A96E', fontSize: '15px', cursor: 'pointer', padding: '4px 6px', lineHeight: 1,
}
const yearBtnStyle: React.CSSProperties = {
  border: 'none', borderRadius: '6px', fontSize: '12px', padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit',
}

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
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(201, 169, 110, 0.15), rgba(201, 169, 110, 0.05))',
        border: '1px solid rgba(201, 169, 110, 0.3)',
        borderRadius: '16px',
        padding: '24px 28px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '10px' }}>
        ☦ Calendarul Pascal
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '28px', color: '#1C1B3A', marginBottom: '2px' }}>
        Sfintele Paști
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', color: '#8B1A1A', marginBottom: '6px' }}>
        {fmt(data.pasti)} {data.year}
      </div>
      <div style={{ fontSize: '12px', color: '#8A7050', marginBottom: '18px' }}>
        Floriile: {fmt(data.florii)}
      </div>

      {/* Selector an */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button onClick={() => setBaseYear(y => y - 1)} aria-label="Anul anterior" style={arrowStyle}>←</button>
        {years.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            style={{
              ...yearBtnStyle,
              backgroundColor: y === selectedYear ? '#C9A96E' : 'transparent',
              color: y === selectedYear ? '#1C1B3A' : '#8A7050',
              fontWeight: y === selectedYear ? 700 : 400,
            }}
          >
            {y}
          </button>
        ))}
        <button onClick={() => setBaseYear(y => y + 1)} aria-label="Anul următor" style={arrowStyle}>→</button>
      </div>

      <Link href="/calendar-pascal" style={{ fontSize: '12px', color: '#C9A96E', textDecoration: 'none' }}>
        Vezi calendarul pascal complet →
      </Link>
    </div>
  )
}
