import type { Metadata } from 'next'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getPascalData } from '@/lib/pascal'
import { getServerT } from '@/lib/i18n/server'

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
    <div>
      {/* Hero dark */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Parohia Sfântul Ierarh Nicolae
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(44px, 7vw, 70px)', fontWeight: 400 }}>
          Calendarul Pascal Ortodox
        </h1>
        <p className="font-body" style={{ color: '#6A5030', fontSize: '16px' }}>
          Sărbătorile pascale calculate după calendarul iulian (stil vechi), {START_YEAR}–{END_YEAR}
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #E8E5E0' }}>
          <table className="w-full font-body text-sm" style={{ borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1C1B3A' }}>
                {['An', 'Florii', 'Paști', 'Duminica Tomii', 'Înălțarea', 'Rusaliile', 'Postul Apostolilor'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs uppercase tracking-wide" style={{ color: '#C9A84C' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isCurrent = row.year === currentYear
                return (
                  <tr
                    key={row.year}
                    style={{
                      backgroundColor: isCurrent ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                      borderBottom: '1px solid #E8E5E0',
                    }}
                  >
                    <td className="px-4 py-3 font-heading" style={{ color: isCurrent ? '#8B1A1A' : '#1C1B3A', fontWeight: isCurrent ? 700 : 400 }}>
                      {row.year}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#3A1A1A' }}>{fmt(row.florii)}</td>
                    <td className="px-4 py-3" style={{ color: '#8B1A1A', fontWeight: 600 }}>{fmt(row.pasti)}</td>
                    <td className="px-4 py-3" style={{ color: '#3A1A1A' }}>{fmt(row.tomii)}</td>
                    <td className="px-4 py-3" style={{ color: '#3A1A1A' }}>{fmt(row.inaltarea)}</td>
                    <td className="px-4 py-3" style={{ color: '#3A1A1A' }}>{fmt(row.rusalii)}</td>
                    <td className="px-4 py-3" style={{ color: '#3A1A1A' }}>{fmt(row.apostoli)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
