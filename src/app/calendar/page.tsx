import type { Metadata } from 'next'
import Link from 'next/link'
import { getLiturgicalDates, formatDate } from '@/lib/utils'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick, localeToIntl } from '@/lib/i18n/pick'
import { getFixedFeasts, FIXED_FASTS, isApostlesFast } from '@/lib/constants/oldCalendarFeasts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Calendarul Sfinților',
  description: 'Calendarul Sfinților Ortodocși cu stil vechi (Julian). Sărbători fixe și schimbătoare, posturi, sfinții zilei.',
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

async function getSaintsForDay(day: number, month: number) {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.saint.findMany({
      where: { day, month },
      select: { nameRo: true, nameRu: true, nameEn: true },
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

  let dayBgColor = '#F7F3EC'
  let dayBorderColor = '#E8DFC8'
  if (hasGreatFeast) { dayBgColor = '#FDF5F5'; dayBorderColor = '#F0C0C0' }
  else if (isInFast)  { dayBgColor = '#F5FAF0'; dayBorderColor = '#C8D8B8' }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.calendar.subtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-5" style={{ color: '#1C1B3A' }}>
          {t.calendar.title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {/* Selector dată */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 justify-center mb-10 p-6 rounded-xl"
        style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}
      >
        {/* Ziua */}
        <div className="flex flex-col gap-1">
          <label className="font-body text-xs uppercase tracking-widest" style={{ color: '#8A7050' }}>
            {t.calendar.day}
          </label>
          <select
            name="zi"
            defaultValue={safeDay}
            className="font-body px-3 py-2 rounded border outline-none appearance-none cursor-pointer"
            style={{ borderColor: '#D4C8A0', color: '#3A1A1A', backgroundColor: '#FFFFFF', fontSize: '16px', minWidth: '70px' }}
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Luna */}
        <div className="flex flex-col gap-1">
          <label className="font-body text-xs uppercase tracking-widest" style={{ color: '#8A7050' }}>
            {t.calendar.month}
          </label>
          <select
            name="luna"
            defaultValue={selMonth}
            className="font-body px-3 py-2 rounded border outline-none appearance-none cursor-pointer"
            style={{ borderColor: '#D4C8A0', color: '#3A1A1A', backgroundColor: '#FFFFFF', fontSize: '16px', minWidth: '150px' }}
          >
            {t.calendar.months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Anul */}
        <div className="flex flex-col gap-1">
          <label className="font-body text-xs uppercase tracking-widest" style={{ color: '#8A7050' }}>
            {t.calendar.year}
          </label>
          <select
            name="an"
            defaultValue={selYear}
            className="font-body px-3 py-2 rounded border outline-none appearance-none cursor-pointer"
            style={{ borderColor: '#D4C8A0', color: '#3A1A1A', backgroundColor: '#FFFFFF', fontSize: '16px', minWidth: '90px' }}
          >
            {yearRange.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="font-body px-6 py-2 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', fontSize: '16px' }}
        >
          {t.calendar.show}
        </button>
      </form>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/calendar?zi=${prevDay}&luna=${prevMonth}&an=${prevYear}`}
          className="font-body inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', color: '#8A7050', fontSize: '0.9rem' }}
        >
          ← {t.calendar.months[prevMonth - 1]}
        </Link>
        <span className="font-heading text-lg" style={{ color: '#1C1B3A' }}>
          {t.calendar.months[selMonth - 1]} {selYear}
        </span>
        <Link
          href={`/calendar?zi=${nextDay}&luna=${nextMonth}&an=${nextYear}`}
          className="font-body inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', color: '#8A7050', fontSize: '0.9rem' }}
        >
          {t.calendar.months[nextMonth - 1]} →
        </Link>
      </div>

      {/* Data selectată + indicatoare */}
      <div
        className="text-center mb-8 py-5 px-4 rounded-xl"
        style={{ backgroundColor: dayBgColor, border: `1px solid ${dayBorderColor}` }}
      >
        <p className="font-heading text-2xl capitalize mb-1" style={{ color: '#1C1B3A' }}>
          {selectedDateStr}
        </p>
        {hasGreatFeast && (
          <span className="font-body text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}>
            ☦ {t.calendar.feastTypes.great}
          </span>
        )}
        {!hasGreatFeast && isInFast && (
          <span className="font-body text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#4A6A2A', color: '#F2EBD9' }}>
            {t.calendar.feastTypes.fast}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Sfinții zilei ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#8B6014' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{t.calendar.saintsTitle}</h2>
          </div>
          <div className="h-px mb-5" style={{ backgroundColor: '#E8E5E0' }} />

          {saints.length === 0 ? (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
              <span style={{ color: '#D4C8A0', fontSize: '32px' }} aria-hidden="true">☦</span>
              <p className="font-body text-sm mt-3" style={{ color: '#8A7050' }}>{t.calendar.noSaints}</p>
              <p className="font-body text-xs mt-1" style={{ color: '#B0A080' }}>{t.calendar.dbInProgress}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {saints.map((saint, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
                  <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">☦</span>
                  <div>
                    <p className="font-heading text-base" style={{ color: '#3A1A1A' }}>{pick(locale, saint.nameRo, saint.nameRu, saint.nameEn)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Sărbători & Posturi ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#8B1A1A' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{t.calendar.feastsTitle}</h2>
          </div>
          <div className="h-px mb-5" style={{ backgroundColor: '#E8E5E0' }} />

          {fixedFeasts.length === 0 && movableFeasts.length === 0 && activeFasts.length === 0 ? (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
              <p className="font-body text-sm" style={{ color: '#8A7050' }}>{t.calendar.noFeasts}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {/* Sărbători fixe stil vechi */}
              {fixedFeasts.map((feast, i) => (
                <li key={`fixed-${i}`}
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: feast.type === 'GREAT' ? feast.color : '#F7F3EC', border: feast.type === 'GREAT' ? 'none' : '1px solid #E8DFC8' }}>
                  <span className="text-lg shrink-0" style={{ color: feast.type === 'GREAT' ? '#F2EBD9' : feast.color }} aria-hidden="true">☦</span>
                  <div>
                    <p className="font-heading text-base" style={{ color: feast.type === 'GREAT' ? '#F2EBD9' : '#3A1A1A' }}>
                      {t.calendar.feastNames[feast.nameKey]}
                    </p>
                    <p className="font-body text-xs mt-0.5" style={{ color: feast.type === 'GREAT' ? 'rgba(242,235,217,0.6)' : '#9B8050' }}>
                      {t.calendar.julianDate}: {feast.julianDate} {t.calendar.julianSuffix}
                    </p>
                  </div>
                </li>
              ))}

              {/* Sărbători schimbătoare */}
              {movableFeasts.map((feast, i) => (
                <li key={`movable-${i}`}
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: feast.special ? feast.color : '#F7F3EC', border: feast.special ? 'none' : '1px solid #E8DFC8' }}>
                  <span className="text-lg shrink-0" style={{ color: feast.special ? '#F2EBD9' : '#8B1A1A' }} aria-hidden="true">☦</span>
                  <p className="font-heading text-base" style={{ color: feast.special ? '#F2EBD9' : '#3A1A1A' }}>
                    {feast.label}
                  </p>
                </li>
              ))}

              {/* Posturi active */}
              {activeFasts.map((fast, i) => (
                <li key={`fast-${i}`}
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: fast.color, border: 'none' }}>
                  <span className="text-base shrink-0" style={{ color: '#F2EBD9' }} aria-hidden="true">🍃</span>
                  <p className="font-heading text-base" style={{ color: '#F2EBD9' }}>
                    {fast.name}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Data Paștelui pentru an selectat */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F2EBD9', border: '1px solid #D4C8A0' }}>
            <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: '#8A7050' }}>
              {t.calendar.easterLabel} {selYear}
            </p>
            <p className="font-heading text-lg" style={{ color: '#8B1A1A' }}>
              {formatDate(liturgicalDates.easter, localeToIntl(locale))}
            </p>
            <p className="font-body text-xs mt-0.5" style={{ color: '#9B8050' }}>
              {t.calendar.gaussFooter}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
