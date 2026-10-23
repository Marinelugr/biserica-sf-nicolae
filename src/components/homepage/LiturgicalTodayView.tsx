import Link from 'next/link'
import type { Translations } from '@/lib/i18n/ro'
import FeedCard from '@/components/shell/FeedCard'
import SectionIcon from '@/components/shell/SectionIcon'

export interface LiturgicalTodayData {
  /** Ziua lunii (stil nou), ex. 23. */
  day: number
  /** Luna, ex. „octombrie". */
  month: string
  /** Data pe stil vechi, ex. „10 octombrie". */
  julianLabel: string
  /** Data completă, ex. „Vineri, 23 octombrie 2026". */
  dateLabel: string
  feastName: string | null
  fastInfo: string | null
  calendarHref: string
  prayerHref: string
}

/** „Astăzi în calendar" — prezentare pură: bloc de dată în stânga, sărbătoarea și postul în dreapta. */
export default function LiturgicalTodayView({ data, t }: { data: LiturgicalTodayData; t: Translations }) {
  const { day, month, julianLabel, dateLabel, feastName, fastInfo, calendarHref, prayerHref } = data
  return (
    <FeedCard kind="parohie" sec="astazi" kicker={t.calendar.todayWidget}>
      <div className="today">
        <div className="today-date">
          <span className="today-day">{day}</span>
          <span className="today-month">{month}</span>
          <span className="today-old">{julianLabel}<br />{t.shell.oldStyle}</span>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="h-s" style={{ fontSize: 26 }}>
            <Link href={calendarHref} className="hover:text-gold transition-colors">{feastName || dateLabel}</Link>
          </h2>
          {feastName && <p className="mute text-[17px]">{dateLabel}</p>}
          {fastInfo && (
            <p className="flex items-center gap-2 text-[17px]" style={{ color: 'var(--sec-accent-text)' }}>
              <SectionIcon name="candle" size={18} />
              {fastInfo}
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-[17px]">
            <Link href={calendarHref} className="link-gold">{t.home.saintsToday} →</Link>
            <Link href={prayerHref} className="link-gold">{t.home.prayerToday} →</Link>
            <Link href={calendarHref} className="mute hover:text-gold transition-colors">{t.home.openCalendarLink}</Link>
          </div>
        </div>
      </div>
    </FeedCard>
  )
}
