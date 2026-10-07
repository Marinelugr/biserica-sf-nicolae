import type { Metadata } from 'next'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getPascalData } from '@/lib/pascal'
import { getServerT } from '@/lib/i18n/server'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.calendarPascal.title,
    description: t.meta.calendarPascal.description,
    alternates: buildAlternates('/calendar-pascal'),
  }
}

const START_YEAR = 2024
const END_YEAR = 2034

const fmt = (d: Date) => d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })

export default function CalendarPascalPage() {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
  const rows = years.map(getPascalData)

  return (
    <PageShell aside="compact">
      <PageHead eyebrow="Parohia Sfântul Ierarh Nicolae" title="Calendarul Pascal Ortodox">
        <p className="mute text-[18px]">
          Sărbătorile pascale calculate după calendarul iulian (stil vechi), {START_YEAR}–{END_YEAR}
        </p>
      </PageHead>

      <div className="card flush">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Calendarul Pascal Ortodox">
          <table className="w-full text-[17px]" style={{ borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gold-d)' }}>
                {['An', 'Florii', 'Paști', 'Duminica Tomii', 'Înălțarea', 'Rusaliile', 'Postul Apostolilor'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-3.5 eyebrow" style={{ fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isCurrent = row.year === currentYear
                return (
                  <tr key={row.year} style={{ backgroundColor: isCurrent ? 'rgba(224, 184, 74, 0.12)' : 'transparent', borderBottom: '1px solid var(--line)' }}>
                    <th scope="row" className="text-left px-4 py-3 serif" style={{ color: isCurrent ? 'var(--gold)' : 'var(--ink)', fontWeight: isCurrent ? 700 : 500, fontSize: 20 }}>
                      {row.year}
                    </th>
                    <td className="px-4 py-3">{fmt(row.florii)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--rose)', fontWeight: 600 }}>{fmt(row.pasti)}</td>
                    <td className="px-4 py-3">{fmt(row.tomii)}</td>
                    <td className="px-4 py-3">{fmt(row.inaltarea)}</td>
                    <td className="px-4 py-3">{fmt(row.rusalii)}</td>
                    <td className="px-4 py-3">{fmt(row.apostoli)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
