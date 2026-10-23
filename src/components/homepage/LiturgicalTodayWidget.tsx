import { getLiturgicalDates, toJulianDate } from '@/lib/utils'
import { isApostlesFast, FIXED_FASTS, getSingleDayFast, getFixedFeasts } from '@/lib/constants/oldCalendarFeasts'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import type { Translations } from '@/lib/i18n/ro'
import { getActiveAnunt } from '@/lib/anunturi.server'
import AnnouncementCard from './AnnouncementCard'
import LiturgicalTodayView from './LiturgicalTodayView'

function getFastInfo(now: Date, t: Translations): string | null {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dates = getLiturgicalDates(year)
  const target = new Date(now); target.setHours(0, 0, 0, 0)
  const lentStart = new Date(dates.greatLentStart); lentStart.setHours(0, 0, 0, 0)
  const easterDay = new Date(dates.easter); easterDay.setHours(0, 0, 0, 0)

  const singleDayFast = getSingleDayFast(day, month)
  if (singleDayFast) return t.calendar.fastNames[singleDayFast.nameKey]

  if (target >= lentStart && target < easterDay) return t.calendar.fastNames.greatLent
  if (isApostlesFast(day, month, year, dates.allSaintsDay)) return t.calendar.fastNames.apostlesFast
  for (const fast of FIXED_FASTS) {
    if (fast.inFast(day, month, year)) return fast.nameKey === 'dormitionFast' ? t.calendar.fastNames.dormitionFast : t.calendar.fastNames.christmasFast
  }
  return null
}

interface Props {
  /** Primul sfânt al zilei (din datele deja încărcate de homepage), dacă nu e praznic fix. */
  saint?: string | null
  /** Linkul „Rugăciunea zilei" (cartea zilei din bibliotecă). */
  prayerHref: string
}

/** Postarea „Astăzi" (dată, stil vechi, sărbătoarea) + anunțul programabil activ, dacă există. */
export default async function LiturgicalTodayWidget({ saint, prayerHref }: Props) {
  const [t, locale, anunt] = await Promise.all([getServerT(), getServerLocale(), getActiveAnunt()])
  const now = new Date()
  const year = now.getFullYear()
  const fastInfo = getFastInfo(now, t)
  const intl = localeToIntl(locale)

  const dateStr = now.toLocaleDateString(intl, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateLabel = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const jd = toJulianDate(now)
  const julianLabel = new Date(jd.year, jd.month - 1, jd.day).toLocaleDateString(intl, { day: 'numeric', month: 'long' })
  const feast = getFixedFeasts(now.getDate(), now.getMonth() + 1)[0]
  const feastName = feast ? t.calendar.feastNames[feast.nameKey] : saint || null
  const calendarHref = `/calendar?zi=${now.getDate()}&luna=${now.getMonth() + 1}&an=${year}`

  return (
    <>
      <LiturgicalTodayView
        t={t}
        data={{
          day: now.getDate(),
          month: now.toLocaleDateString(intl, { month: 'long' }),
          julianLabel,
          dateLabel,
          feastName,
          fastInfo,
          calendarHref,
          prayerHref,
        }}
      />
      {anunt && (
        <AnnouncementCard
          titlu={anunt.titlu}
          mesaj={anunt.mesaj}
          linkArticol={anunt.linkArticol}
          author={t.shell.brand}
          kicker={t.shell.kindAnnouncement}
          moreLabel={t.shell.readAnnouncement}
        />
      )}
    </>
  )
}
