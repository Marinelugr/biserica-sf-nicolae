import Link from 'next/link'
import { getLiturgicalDates } from '@/lib/utils'
import { isApostlesFast, FIXED_FASTS } from '@/lib/constants/oldCalendarFeasts'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import type { Translations } from '@/lib/i18n/ro'

function getFastInfo(now: Date, t: Translations): string | null {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dates = getLiturgicalDates(year)
  const target = new Date(now); target.setHours(0, 0, 0, 0)
  const lentStart = new Date(dates.greatLentStart); lentStart.setHours(0, 0, 0, 0)
  const easterDay = new Date(dates.easter); easterDay.setHours(0, 0, 0, 0)

  if (target >= lentStart && target < easterDay) return t.calendar.fastNames.greatLent
  if (isApostlesFast(day, month, year, dates.allSaintsDay)) return t.calendar.fastNames.apostlesFast
  for (const fast of FIXED_FASTS) {
    if (fast.inFast(day, month, year)) return fast.nameKey === 'dormitionFast' ? t.calendar.fastNames.dormitionFast : t.calendar.fastNames.christmasFast
  }
  return null
}

export default async function LiturgicalTodayWidget() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const now = new Date()
  const year = now.getFullYear()
  const fastInfo = getFastInfo(now, t)

  const dateStr = now.toLocaleDateString(localeToIntl(locale), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateLabel = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/calendar?zi=${now.getDate()}&luna=${now.getMonth() + 1}&an=${year}`}
        className="block rounded-2xl p-6 sm:p-8 text-center transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', textDecoration: 'none' }}
      >
        <p className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: '#1C1B3A' }}>
          {dateLabel}
        </p>
        {fastInfo && (
          <p className="font-body text-sm mb-3" style={{ color: '#4A6A2A' }}>
            🌿 {fastInfo}
          </p>
        )}
        <span className="font-body text-xs" style={{ color: '#C9A84C' }}>
          {t.home.openCalendarLink}
        </span>
      </Link>
    </section>
  )
}
