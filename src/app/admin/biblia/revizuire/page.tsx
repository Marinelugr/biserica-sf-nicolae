import Link from 'next/link'
import { BIBLE_BOOKS } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { DETECTOR_LABELS, highlightFragment, REVIEW_STATUSES, STATUS_LABELS, suggestionOptions } from '@/lib/bible/reviewCore'
import {
  filtersQuery, isMissingTable, loadQueuePosition, neighborVerses, parseFilters, reviewCounts, reviewFacets,
  type ReviewCounts, type ReviewFilters,
} from '@/lib/bible/reviewQueries'
import { BibliaHeader, pageParam, ui } from '@/components/admin/biblia/ui'
import ReviewQueue, { type ReviewCardData } from '@/components/admin/biblia/ReviewQueue'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const crumbs = [{ href: '/admin/biblia', label: 'Biblia' }, { label: 'Revizuire' }]
const SOURCE_LABELS: Record<string, string> = { audit: 'Audit', cititor: 'Cititori' }
const CONFIDENCE_LABELS: Record<string, string> = { cititor: 'Cititor', medie: 'Medie', mica: 'Mică' }
const chip = { ...ui.muted, border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' } as const

function Counters({ counts }: { counts: ReviewCounts }) {
  return (
    <section aria-label="Contoare" style={{ ...ui.card, marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }} data-testid="contoare">
        {REVIEW_STATUSES.map(s => (
          <span key={s} style={ui.text} data-status={s}>{STATUS_LABELS[s]}: <strong>{counts.byStatus[s]}</strong></span>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {counts.bySource.map(s => <span key={s.source} style={chip}>{SOURCE_LABELS[s.source] ?? s.source}: {s.pending} / {s.total}</span>)}
        {counts.byDetector.map(d => <span key={d.detector} style={chip} title={DETECTOR_LABELS[d.detector]}>{d.detector}: {d.pending} / {d.total}</span>)}
      </div>
      <p style={{ ...ui.muted, margin: 0 }}>Pe surse și detectoare: în așteptare / total.</p>
    </section>
  )
}

function Filters({ filters, books }: { filters: ReviewFilters; books: Map<string, number> }) {
  const field = { flex: '1 1 140px', minWidth: 0 }
  return (
    <form method="get" aria-label="Filtre" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
      <div style={field}>
        <label htmlFor="stare" style={ui.label}>Stare</label>
        <select id="stare" name="stare" defaultValue={filters.status} style={ui.input}>
          {REVIEW_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="sursa" style={ui.label}>Sursă</label>
        <select id="sursa" name="sursa" defaultValue={filters.source ?? ''} style={ui.input}>
          <option value="">Toate</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="detector" style={ui.label}>Detector</label>
        <select id="detector" name="detector" defaultValue={filters.detector ?? ''} style={ui.input}>
          <option value="">Toate</option>
          {Object.entries(DETECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="incredere" style={ui.label}>Încredere</label>
        <select id="incredere" name="incredere" defaultValue={filters.confidence ?? ''} style={ui.input}>
          <option value="">Toate</option>
          {Object.entries(CONFIDENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="carte" style={ui.label}>Carte</label>
        <select id="carte" name="carte" defaultValue={filters.book ?? ''} style={ui.input}>
          <option value="">Toate</option>
          {BIBLE_BOOKS.filter(b => books.has(b.slug) || b.slug === filters.book).map(b => (
            <option key={b.slug} value={b.slug}>{b.aliases[0] ?? b.labelRo} ({books.get(b.slug) ?? 0})</option>
          ))}
        </select>
      </div>
      <button type="submit" style={ui.ghost}>Filtrează</button>
    </form>
  )
}

/** Null dacă tabelele nu există încă (deploy ajuns înaintea schemei). */
async function loadQueue(filters: ReviewFilters, requested: number) {
  try {
    const queue = await loadQueuePosition(filters, requested)
    const [counts, books] = await Promise.all([reviewCounts(), reviewFacets()])
    const { item } = queue
    let card: ReviewCardData | null = null
    if (item) {
      const near = await neighborVerses(item.verse.chapterId, item.verseNum)
      card = {
        id: item.id,
        slug: item.bookSlug,
        reference: `${BIBLE_BOOKS.find(b => b.slug === item.bookSlug)?.aliases[0] ?? item.bookSlug} ${item.chapterNum}:${item.verseNum}`,
        chapterNum: item.chapterNum,
        verseNum: item.verseNum,
        parts: highlightFragment(item.verse.textRo, item.fragment),
        text: item.verse.textRo,
        editedAt: item.verse.editedAt?.toISOString() ?? null,
        prev: near.prev,
        next: near.next,
        reason: item.reason,
        options: suggestionOptions(item.suggestion),
        message: item.message,
        source: item.source,
        status: item.status,
        statusLabel: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] ?? item.status,
        detectorLabel: DETECTOR_LABELS[item.detector] ?? item.detector,
        confidenceLabel: CONFIDENCE_LABELS[item.confidence] ?? item.confidence,
        canIgnoreAll: item.source === 'audit' && item.fragment !== '',
      }
    }
    return { queue, counts, books, card }
  } catch (err) {
    if (isMissingTable(err)) return null
    throw err
  }
}

export default async function AdminBibliaRevizuirePage({ searchParams }: { searchParams: SearchParams }) {
  await requireBibleAdminPage()
  const raw = await searchParams
  const filters = parseFilters(raw)
  const data = await loadQueue(filters, raw.i === undefined ? 0 : pageParam(raw.i))

  return (
    <>
      <BibliaHeader crumbs={crumbs} />
      <h1 style={ui.h1}>Coada de revizuire</h1>
      {!data && <p style={ui.warn}>Tabelele cozii nu există încă în această bază: aplică întâi SQL-ul schemei (vezi docs/BIBLIA-REVIZUIRE.md).</p>}
      {data && (
        <>
          <Counters counts={data.counts} />
          <Filters filters={filters} books={data.books} />
          {data.queue.staleSkipped > 0 && <p style={ui.warn} data-testid="sarite">{data.queue.staleSkipped} elemente au devenit învechite (versetul s-a schimbat) și au fost sărite.</p>}
          {data.card
            ? <ReviewQueue
                card={data.card}
                position={data.queue.position}
                total={data.queue.total}
                prevHref={data.queue.position > 0 ? `/admin/biblia/revizuire${filtersQuery(filters, data.queue.position - 1)}` : null}
                nextHref={`/admin/biblia/revizuire${filtersQuery(filters, data.queue.position + 1)}`}
                hasNext={data.queue.position + 1 < data.queue.total}
              />
            : (
              <div style={ui.card}>
                <p style={{ ...ui.text, marginTop: 0 }}>{data.queue.total === 0 ? 'Niciun element pentru aceste filtre.' : 'Ai ajuns la capăt; elementele sărite rămân în așteptare.'}</p>
                {data.queue.total > 0 && <Link href={`/admin/biblia/revizuire${filtersQuery(filters)}`} style={ui.ghost}>Înapoi la început</Link>}
              </div>
            )}
        </>
      )}
    </>
  )
}
