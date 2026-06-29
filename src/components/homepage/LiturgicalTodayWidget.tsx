import Link from 'next/link'
import { getLiturgicalDates, getWeeklyTone, toJulianDate } from '@/lib/utils'
import { isApostlesFast, FIXED_FASTS } from '@/lib/constants/oldCalendarFeasts'

const MONTH_NAMES_RO = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie',
]

function getFastInfo(now: Date): string | null {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dates = getLiturgicalDates(year)
  const target = new Date(now); target.setHours(0, 0, 0, 0)
  const lentStart = new Date(dates.greatLentStart); lentStart.setHours(0, 0, 0, 0)
  const easterDay = new Date(dates.easter); easterDay.setHours(0, 0, 0, 0)

  if (target >= lentStart && target < easterDay) return 'Postul Mare'
  if (isApostlesFast(day, month, year, dates.allSaintsDay)) return 'Postul Sfinților Apostoli'
  for (const fast of FIXED_FASTS) {
    if (fast.inFast(day, month, year)) return fast.nameKey === 'dormitionFast' ? 'Postul Adormirii' : 'Postul Crăciunului'
  }
  return null
}

export default function LiturgicalTodayWidget() {
  const now = new Date()
  const year = now.getFullYear()
  const julianDate = toJulianDate(now)
  const tone = getWeeklyTone(now, year)
  const fastInfo = getFastInfo(now)

  const gregorianStr = now.toLocaleDateString('ro-MD', { day: 'numeric', month: 'long', year: 'numeric' })
  const julianStr = `${julianDate.day} ${MONTH_NAMES_RO[julianDate.month - 1]}`

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/calendar?zi=${now.getDate()}&luna=${now.getMonth() + 1}&an=${year}`}
        className="block rounded-2xl p-6 sm:p-8 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', textDecoration: 'none' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Left: dates */}
          <div>
            <p className="font-body text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#8A7050' }}>
              Astăzi în calendar
            </p>
            <p className="font-heading text-xl mb-0.5" style={{ color: '#1C1B3A' }}>
              {gregorianStr}
            </p>
            <p className="font-body text-sm" style={{ color: '#9B8050' }}>
              Stil vechi (iulian): <span style={{ color: '#8B1A1A' }}>{julianStr}</span>
            </p>
          </div>

          {/* Right: tone + fast */}
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
            >
              <span style={{ fontSize: '0.9rem' }}>☦</span>
              <span className="font-body text-sm">Glasul {tone}</span>
            </div>
            {fastInfo ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: '#4A6A2A', color: '#F2EBD9' }}
              >
                <span style={{ fontSize: '0.9rem' }}>🍃</span>
                <span className="font-body text-sm">{fastInfo}</span>
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: '#F2EBD9', border: '1px solid #D4C8A0', color: '#8A7050' }}
              >
                <span className="font-body text-sm">Zi obișnuită</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #E8DFC8' }}>
          <span className="font-body text-xs" style={{ color: '#B0A080' }}>
            Calendar Ortodox Stil Vechi (Julian) · Algoritmul Gauss
          </span>
          <span className="font-body text-xs" style={{ color: '#C9A84C' }}>
            Deschide calendarul →
          </span>
        </div>
      </Link>
    </section>
  )
}
