import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sfinții',
  description: 'Calendarul sfinților ortodocși prăznuiți de-a lungul anului. Vieți de sfinți, icoane și date de prăznuire — Parohia Sfântul Ierarh Nicolae.',
  alternates: buildAlternates('/sfintii'),
}

const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const FEAST_COLORS: Record<string, string> = { MARE: '#8B1A1A', MIJLOCIE: '#8B6014', MIC: '#5A4020' }

type Props = { searchParams: Promise<{ q?: string; luna?: string }> }

async function getSaints(q: string | undefined, month: number | undefined) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const where: Record<string, unknown> = {}
    if (month) where.month = month
    if (q) {
      where.OR = [
        { nameRo: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ]
    }
    return await prisma.saint.findMany({
      where,
      select: { slug: true, nameRo: true, nameRu: true, nameEn: true, month: true, day: true, feastType: true, iconUrl: true },
      orderBy: [{ month: 'asc' }, { day: 'asc' }],
    })
  } catch {
    return []
  }
}

export default async function SfintiiPage({ searchParams }: Props) {
  const [{ q, luna }, t, locale] = await Promise.all([searchParams, getServerT(), getServerLocale()])
  const month = luna ? parseInt(luna) : undefined
  const saints = await getSaints(q, month)

  const grouped = new Map<number, typeof saints>()
  for (const s of saints) {
    if (!grouped.has(s.month)) grouped.set(s.month, [])
    grouped.get(s.month)!.push(s)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.saints.subtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-5" style={{ color: '#1C1B3A' }}>
          {t.saints.title}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>

        <form className="flex gap-0 max-w-xl mx-auto rounded-md overflow-hidden shadow-sm" action="/sfintii" method="get">
          <label htmlFor="saints-search" className="sr-only">{t.saints.searchPlaceholder}</label>
          <input
            id="saints-search"
            type="search"
            name="q"
            defaultValue={q || ''}
            placeholder={t.saints.searchPlaceholder}
            className="flex-1 px-4 py-3 text-sm font-body outline-none"
            style={{ border: '1px solid #E8E5E0', borderRight: 'none', color: '#3A1A1A', backgroundColor: '#FAFAF8' }}
          />
          <button type="submit" className="px-6 py-3 font-body text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}>
            {t.saints.searchBtn}
          </button>
        </form>

        {/* Month filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Link
            href="/sfintii"
            className="font-body text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: !month ? '#8B1A1A' : '#F8F7F5',
              color: !month ? '#F2EBD9' : '#8A7050',
              border: '1px solid #E8E5E0',
            }}
          >
            {t.common.allCategories.replace(' →', '')}
          </Link>
          {MONTHS_FULL.map((m, i) => (
            <Link
              key={m}
              href={`/sfintii?luna=${i + 1}`}
              className="font-body text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: month === i + 1 ? '#8B1A1A' : '#F8F7F5',
                color: month === i + 1 ? '#F2EBD9' : '#8A7050',
                border: '1px solid #E8E5E0',
              }}
            >
              {m}
            </Link>
          ))}
        </div>
      </div>

      {saints.length === 0 ? (
        <div className="text-center py-16">
          <span style={{ color: '#D4C8A0', fontSize: '56px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4 text-lg" style={{ color: '#8A7050' }}>
            {q || month ? t.saints.noSaintsInMonth : t.saints.inProgress}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([m, monthSaints]) => (
            <section key={m}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-heading text-xl shrink-0" style={{ color: '#1C1B3A' }}>
                  {MONTHS_FULL[m - 1]}
                </h2>
                <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ backgroundColor: '#E8E5E0' }}>
                {monthSaints.map(s => (
                  <li key={s.slug} style={{ backgroundColor: '#FFFFFF' }}>
                    <Link
                      href={`/sfintii/${s.slug}`}
                      className="flex items-center gap-3 p-4 group transition-colors hover:bg-amber-50"
                    >
                      <span
                        className="font-heading text-sm font-semibold shrink-0"
                        style={{ color: '#8B1A1A', minWidth: '2rem' }}
                      >
                        {s.day}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-body text-sm block group-hover:underline underline-offset-2 line-clamp-1"
                          style={{ color: '#3A1A1A', textDecorationColor: '#C9A84C' }}
                        >
                          {pick(locale, s.nameRo, s.nameRu, s.nameEn)}
                        </span>
                        {s.feastType && (
                          <span className="font-body text-xs" style={{ color: FEAST_COLORS[s.feastType] || '#8A7050' }}>
                            {t.saints.feastTypes[s.feastType as 'MARE' | 'MIJLOCIE' | 'MIC'] || s.feastType}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#C9A84C' }} aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
