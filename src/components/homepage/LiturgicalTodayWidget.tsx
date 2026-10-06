import Link from 'next/link'
import { getLiturgicalDates, toJulianDate } from '@/lib/utils'
import { isApostlesFast, FIXED_FASTS, getSingleDayFast, getFixedFeasts } from '@/lib/constants/oldCalendarFeasts'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import type { Translations } from '@/lib/i18n/ro'
import { getActiveAnunt } from '@/lib/anunturi.server'
import AnnouncementCard from './AnnouncementCard'
import FeedCard from '@/components/shell/FeedCard'

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
  const shortDate = now.toLocaleDateString(intl, { day: 'numeric', month: 'long' })
  const jd = toJulianDate(now)
  const julianLabel = new Date(jd.year, jd.month - 1, jd.day).toLocaleDateString(intl, { day: 'numeric', month: 'long' })
  const feast = getFixedFeasts(now.getDate(), now.getMonth() + 1)[0]
  const feastName = feast ? t.calendar.feastNames[feast.nameKey] : saint || null
  const calendarHref = `/calendar?zi=${now.getDate()}&luna=${now.getMonth() + 1}&an=${year}`

  return (
    <>
      <FeedCard kind="parohie" kicker={t.calendar.todayWidget} author={t.shell.brand}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="eyebrow">{t.shell.today} · {shortDate}</span>
            <span className="mute italic text-[17px]">{julianLabel}, {t.shell.oldStyle}</span>
          </div>
          <h2 className="h-s">
            <Link href={calendarHref} className="hover:text-gold transition-colors">{feastName || dateLabel}</Link>
          </h2>
          {feastName && <p className="mute text-[17px]">{dateLabel}</p>}
          {fastInfo && (
            <p className="text-[17px]" style={{ color: 'var(--gold)' }}>
              🕯 {fastInfo}
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-[17px]">
            <Link href={calendarHref} className="link-gold">{t.home.saintsToday} →</Link>
            <Link href={prayerHref} className="link-blue">{t.home.prayerToday} →</Link>
            <Link href={calendarHref} className="mute hover:text-gold transition-colors">{t.home.openCalendarLink}</Link>
          </div>
        </div>
      </FeedCard>
      {anunt && (
        <AnnouncementCard
          titlu={anunt.titlu}
          mesaj={anunt.mesaj}
          linkArticol={anunt.linkArticol}
          author={t.shell.brand}
          kicker={t.shell.kindAnnouncement}
        />
      )}
    </>
  )
}
