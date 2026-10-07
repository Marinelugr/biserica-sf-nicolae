import type { Metadata } from 'next'
import Link from 'next/link'
import { getLiturgicalDates, formatDate } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localeToIntl } from '@/lib/i18n/pick'
import { getFixedFeasts, FIXED_FASTS, isApostlesFast, getSingleDayFast } from '@/lib/constants/oldCalendarFeasts'
import { buildAlternates } from '@/lib/i18n/alternates'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.calendar.title,
    description: t.meta.calendar.description,
    alternates: buildAlternates('/calendar'),
  }
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

async function getSaintsForDay(day: number, month: number) {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.saint.findMany({
      where: { day, month },
      select: { nameRo: true },
      orderBy: { nameRo: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ zi?: string; luna?: string; an?: string }>
}) {
  const [params, t, locale] = await Promise.all([searchParams, getServerT(), getServerLocale()])

  const today = new Date()
  const selDay   = parseInt(params.zi   || String(today.getDate()), 10)
  const selMonth = parseInt(params.luna || String(today.getMonth() + 1), 10)
  const selYear  = parseInt(params.an   || String(today.getFullYear()), 10)

  const currentYear = today.getFullYear()
  const yearRange   = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i)
  const maxDay      = daysInMonth(selMonth, selYear)
  const safeDay     = Math.min(selDay, maxDay)

  const [saints, liturgicalDates] = await Promise.all([
    getSaintsForDay(safeDay, selMonth),
    Promise.resolve(getLiturgicalDates(selYear)),
  ])

  // ── Sărbători fixe stil vechi ──────────────────────────────────────────────
  const fixedFeasts = getFixedFeasts(safeDay, selMonth)

  // ── Sărbători schimbătoare (Paști și derivate) ────────────────────────────
  type MovableFeast = { label: string; color: string; special: boolean }
  const movableFeasts: MovableFeast[] = []

  const matchDate = (d: Date) => {
    const dd = new Date(d); dd.setHours(0,0,0,0)
    const tt = new Date(selYear, selMonth - 1, safeDay); tt.setHours(0,0,0,0)
    return dd.getTime() === tt.getTime()
  }

  if (matchDate(liturgicalDates.palmSunday))
    movableFeasts.push({ label: t.calendar.feastNames.palmSunday, color: '#4A6A2A', special: true })
  if (matchDate(liturgicalDates.holyThursday))
    movableFeasts.push({ label: t.calendar.feastNames.holyThursday, color: '#6B1A1A', special: true })
  if (matchDate(liturgicalDates.holyFriday))
    movableFeasts.push({ label: t.calendar.feastNames.holyFriday, color: '#4A0A0A', special: true })
  if (matchDate(liturgicalDates.easter))
    movableFeasts.push({ label: t.calendar.feastNames.easter, color: '#8B1A1A', special: true })
  if (matchDate(liturgicalDates.thomasSunday))
    movableFeasts.push({ label: t.calendar.feastNames.thomasSunday, color: '#8B6014', special: false })
  if (matchDate(liturgicalDates.ascension))
    movableFeasts.push({ label: t.calendar.feastNames.ascension, color: '#8B6014', special: true })
  if (matchDate(liturgicalDates.pentecost))
    movableFeasts.push({ label: t.calendar.feastNames.pentecost, color: '#1C1B3A', special: true })
  if (matchDate(liturgicalDates.allSaintsDay))
    movableFeasts.push({ label: t.calendar.feastNames.allSaints, color: '#6B4A2A', special: true })

  // ── Posturi ────────────────────────────────────────────────────────────────
  type FastInfo = { name: string; color: string }
  const activeFasts: FastInfo[] = []

  // Post Mare
  const lentStart = new Date(liturgicalDates.greatLentStart); lentStart.setHours(0,0,0,0)
  const easterDay = new Date(liturgicalDates.easter); easterDay.setHours(0,0,0,0)
  const targetDate = new Date(selYear, selMonth - 1, safeDay); targetDate.setHours(0,0,0,0)
  if (targetDate >= lentStart && targetDate < easterDay)
    activeFasts.push({ name: t.calendar.fastNames.greatLent, color: '#4A6A2A' })

  // Postul Apostolilor
  if (isApostlesFast(safeDay, selMonth, selYear, liturgicalDates.allSaintsDay))
    activeFasts.push({ name: t.calendar.fastNames.apostlesFast, color: '#4A6A2A' })

  // Posturi fixe (Adormirii + Crăciunului)
  for (const fast of FIXED_FASTS) {
    if (fast.inFast(safeDay, selMonth, selYear)) {
      activeFasts.push({ name: t.calendar.fastNames[fast.nameKey], color: fast.color })
    }
  }

  // Zile de post aspru cu dată fixă (Tăierea Capului Sf. Ioan, Înălțarea Crucii etc.)
  const singleDayFast = getSingleDayFast(safeDay, selMonth)
  if (singleDayFast) {
    activeFasts.push({ name: t.calendar.fastNames[singleDayFast.nameKey], color: singleDayFast.color })
  }

  const selectedDateStr = new Date(selYear, selMonth - 1, safeDay).toLocaleDateString(localeToIntl(locale), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Month navigation helpers
  const prevMonth = selMonth === 1 ? 12 : selMonth - 1
  const prevYear  = selMonth === 1 ? selYear - 1 : selYear
  const nextMonth = selMonth === 12 ? 1 : selMonth + 1
  const nextYear  = selMonth === 12 ? selYear + 1 : selYear
  const prevDay   = Math.min(safeDay, daysInMonth(prevMonth, prevYear))
  const nextDay   = Math.min(safeDay, daysInMonth(nextMonth, nextYear))

  // ── Ziua pică cu sărbătoare mare? ─────────────────────────────────────────
  const hasGreatFeast = fixedFeasts.some(f => f.type === 'GREAT') || movableFeasts.some(f => f.special)
  const isInFast = activeFasts.length > 0

  // ── Grila lunii (doar prezentare, din aceleași funcții de calendar) ─────────
  const intl = localeToIntl(locale)
  const firstWeekday = (new Date(selYear, selMonth - 1, 1).getDay() + 6) % 7 // luni = 0
  const monthDays = daysInMonth(selMonth, selYear)
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(intl, { weekday: 'short' }).replace('.', ''),
  )
  const movableDates = [
    liturgicalDates.palmSunday, liturgicalDates.easter, liturgicalDates.ascension,
    liturgicalDates.pentecost, liturgicalDates.thomasSunday, liturgicalDates.allSaintsDay,
  ].map(d => { const x = new Date(d); return x.getMonth() + 1 === selMonth && x.getFullYear() === selYear ? x.getDate() : -1 })
  const isToday = (d: number) => d === today.getDate() && selMonth === today.getMonth() + 1 && selYear === today.getFullYear()
  const isFeastDay = (d: number) => getFixedFeasts(d, selMonth).length > 0 || movableDates.includes(d)
  const isSunday = (d: number) => new Date(selYear, selMonth - 1, d).getDay() === 0
  const selectCls = 'field cursor-pointer'

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.calendar.subtitle} title={t.calendar.title}>
        <form method="get" className="flex flex-wrap items-end gap-3 mt-2">
          <div className="flex flex-col">
            <label htmlFor="cal-zi" className="label">{t.calendar.day}</label>
            <select id="cal-zi" name="zi" defaultValue={safeDay} className={selectCls} style={{ minWidth: 80 }}>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="cal-luna" className="label">{t.calendar.month}</label>
            <select id="cal-luna" name="luna" defaultValue={selMonth} className={selectCls} style={{ minWidth: 160 }}>
              {t.calendar.months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="cal-an" className="label">{t.calendar.year}</label>
            <select id="cal-an" name="an" defaultValue={selYear} className={selectCls} style={{ minWidth: 100 }}>
              {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="submit" className="btn red">{t.calendar.show}</button>
        </form>
      </PageHead>

      <section className="card" aria-label={`${t.calendar.months[selMonth - 1]} ${selYear}`}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <Link href={`/calendar?zi=${prevDay}&luna=${prevMonth}&an=${prevYear}`} className="chip" aria-label={t.calendar.months[prevMonth - 1]}>
            ← <span className="hidden sm:inline">{t.calendar.months[prevMonth - 1]}</span>
          </Link>
          <h2 className="h-m text-center">{t.calendar.months[selMonth - 1]} {selYear}</h2>
          <Link href={`/calendar?zi=${nextDay}&luna=${nextMonth}&an=${nextYear}`} className="chip" aria-label={t.calendar.months[nextMonth - 1]}>
            <span className="hidden sm:inline">{t.calendar.months[nextMonth - 1]}</span> →
          </Link>
        </div>
        <div className="cal-grid" role="grid">
          {weekdayNames.map(w => <div key={w} className="cal-h" role="columnheader">{w}</div>)}
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`e${i}`} className="cal-d empty" aria-hidden="true" />)}
          {Array.from({ length: monthDays }, (_, i) => i + 1).map(d => {
            const cls = ['cal-d', isSunday(d) && 'sun', isFeastDay(d) && 'feast', d === safeDay && 'sel', isToday(d) && 'today'].filter(Boolean).join(' ')
            return (
              <Link
                key={d}
                href={`/calendar?zi=${d}&luna=${selMonth}&an=${selYear}`}
                className={cls}
                aria-current={d === safeDay ? 'date' : undefined}
                aria-label={new Date(selYear, selMonth - 1, d).toLocaleDateString(intl, { day: 'numeric', month: 'long' })}
              >
                {d}
              </Link>
            )
          })}
        </div>
      </section>

      <div className={`card ${hasGreatFeast ? 'red-grad' : ''} text-center`}>
        <p className="h-m capitalize">{selectedDateStr}</p>
        {hasGreatFeast && (
          <span className="inline-block mt-3 text-[15px] px-3.5 py-1 rounded-full" style={{ backgroundColor: 'var(--red)', color: '#fff' }}>
            ☦ {t.calendar.feastTypes.great}
          </span>
        )}
        {!hasGreatFeast && isInFast && (
          <span className="inline-block mt-3 text-[15px] px-3.5 py-1 rounded-full" style={{ border: '1px solid var(--gold-d)', color: 'var(--gold)' }}>
            {t.calendar.feastTypes.fast}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="card" aria-labelledby="cal-sfinti">
          <h2 id="cal-sfinti" className="h-m mb-4">{t.calendar.saintsTitle}</h2>
          {saints.length === 0 ? (
            <div className="text-center py-4">
              <span className="gold" style={{ fontSize: '32px' }} aria-hidden="true">☦</span>
              <p className="mute mt-2">{t.calendar.noSaints}</p>
              <p className="mute text-[15px] mt-1">{t.calendar.dbInProgress}</p>
            </div>
          ) : (
            <ul>
              {saints.map((saint, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5" style={i < saints.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                  <span className="gold shrink-0" aria-hidden="true">☦</span>
                  <p>{saint.nameRo}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="cal-sarbatori">
          <h2 id="cal-sarbatori" className="h-m mb-4">{t.calendar.feastsTitle}</h2>
          {fixedFeasts.length === 0 && movableFeasts.length === 0 && activeFasts.length === 0 ? (
            <p className="mute">{t.calendar.noFeasts}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {fixedFeasts.map((feast, i) => (
                <li key={`fixed-${i}`} className="flex items-start gap-3 p-3.5 rounded-2xl"
                  style={feast.type === 'GREAT' ? { background: 'var(--red)' } : { border: '1px solid var(--gold-d)' }}>
                  <span className="shrink-0" style={{ color: feast.type === 'GREAT' ? '#fff' : 'var(--gold)' }} aria-hidden="true">☦</span>
                  <div>
                    <p className="h-s" style={{ fontSize: 20 }}>{t.calendar.feastNames[feast.nameKey]}</p>
                    <p className="text-[15px] mt-0.5" style={{ color: feast.type === 'GREAT' ? '#f4d6d6' : 'var(--mute)' }}>
                      {t.calendar.julianDate}: {feast.julianDate} {t.calendar.julianSuffix}
                    </p>
                  </div>
                </li>
              ))}
              {movableFeasts.map((feast, i) => (
                <li key={`movable-${i}`} className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={feast.special ? { background: 'var(--red)' } : { border: '1px solid var(--gold-d)' }}>
                  <span className="shrink-0" style={{ color: feast.special ? '#fff' : 'var(--gold)' }} aria-hidden="true">☦</span>
                  <p className="h-s" style={{ fontSize: 20 }}>{feast.label}</p>
                </li>
              ))}
              {activeFasts.map((fast, i) => (
                <li key={`fast-${i}`} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(143, 176, 255, 0.12)', border: '1px solid rgba(143,176,255,.35)' }}>
                  <span className="shrink-0" aria-hidden="true">🍃</span>
                  <p className="h-s" style={{ fontSize: 20 }}>{fast.name}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <p className="eyebrow mb-1">{t.calendar.easterLabel} {selYear}</p>
            <p className="h-s" style={{ color: 'var(--blue)' }}>{formatDate(liturgicalDates.easter, localeToIntl(locale))}</p>
            <p className="mute text-[15px] mt-0.5">{t.calendar.gaussFooter}</p>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
