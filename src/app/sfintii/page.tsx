import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { buildWordWhere } from '@/lib/search'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.sfintii.title,
    description: t.meta.sfintii.description,
    alternates: buildAlternates('/sfintii'),
  }
}

const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const FEAST_COLORS: Record<string, string> = { MARE: 'var(--rose)', MIJLOCIE: 'var(--gold)', MIC: 'var(--mute)' }

type Props = { searchParams: Promise<{ q?: string; luna?: string }> }

async function getSaints(q: string | undefined, month: number | undefined) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const where: Record<string, unknown> = {}
    if (month) where.month = month
    const wordWhere = q ? buildWordWhere(q, ['nameRo', 'lifeRo']) : undefined
    if (wordWhere) where.AND = wordWhere.AND
    return await prisma.saint.findMany({
      where,
      select: { slug: true, nameRo: true, month: true, day: true, feastType: true, iconUrl: true },
      orderBy: [{ month: 'asc' }, { day: 'asc' }],
    })
  } catch {
    return []
  }
}

export default async function SfintiiPage({ searchParams }: Props) {
  const [{ q, luna }, t] = await Promise.all([searchParams, getServerT()])
  const month = luna ? parseInt(luna) : undefined
  const saints = await getSaints(q, month)

  const grouped = new Map<number, typeof saints>()
  for (const s of saints) {
    if (!grouped.has(s.month)) grouped.set(s.month, [])
    grouped.get(s.month)!.push(s)
  }

  const chip = (active: boolean): React.CSSProperties => (active ? { borderColor: 'var(--gold-d)', color: 'var(--gold)' } : {})

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.saints.subtitle} title={t.saints.title}>
        <div className="mt-2">
          <SearchForm action="/sfintii" id="saints-search" placeholder={t.saints.searchPlaceholder} button={t.saints.searchBtn} defaultValue={q || ''} />
        </div>
        <nav className="flex flex-wrap gap-2 mt-2" aria-label={t.saints.title}>
          <Link href="/sfintii" className="chip" style={chip(!month)} aria-current={!month ? 'page' : undefined}>
            {t.common.allCategories.replace(' →', '')}
          </Link>
          {MONTHS_FULL.map((m, i) => (
            <Link key={m} href={`/sfintii?luna=${i + 1}`} className="chip" style={chip(month === i + 1)} aria-current={month === i + 1 ? 'page' : undefined}>
              {m}
            </Link>
          ))}
        </nav>
      </PageHead>

      {saints.length === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3 text-[19px]">
            {q || month ? t.saints.noSaintsInMonth : t.saints.inProgress}
          </p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([m, monthSaints]) => (
          <section key={m} className="card" style={{ padding: '22px 24px' }} data-reveal>
            <div className="sec-head" style={{ marginBottom: 8 }}>
              <h2 className="h-m">{MONTHS_FULL[m - 1]}</h2>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {monthSaints.map(s => (
                <li key={s.slug} style={{ borderBottom: '1px solid var(--line)' }}>
                  <Link href={`/sfintii/${s.slug}`} className="flex items-center gap-3 py-3 group">
                    <span className="serif text-[22px] font-semibold shrink-0 text-sky" style={{ minWidth: '2rem' }}>
                      {s.day}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block line-clamp-1 group-hover:text-gold transition-colors">{s.nameRo}</span>
                      {s.feastType && (
                        <span className="text-[15px]" style={{ color: FEAST_COLORS[s.feastType] || 'var(--mute)' }}>
                          {t.saints.feastTypes[s.feastType as 'MARE' | 'MIJLOCIE' | 'MIC'] || s.feastType}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 gold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </PageShell>
  )
}
