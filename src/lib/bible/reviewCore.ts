/**
 * Regulile cozii de revizuire: funcții pure, fără bază de date, fără React/Next, fără `@/`
 * (le folosește și scriptul `bible:review-import`, rulat cu ts-node).
 */
import { MAX_BULK_VERSES, type MarkedPart } from './adminCore'
import { getBook } from './books'
import { normalizeVerseText } from './text'

export const REVIEW_STATUSES = ['PENDING', 'APPLIED', 'EDITED', 'IGNORED', 'STALE'] as const
export type ReviewStatus = typeof REVIEW_STATUSES[number]
export const STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: 'În așteptare', APPLIED: 'Aplicate', EDITED: 'Editate', IGNORED: 'Ignorate', STALE: 'Învechite',
}
export const DETECTOR_LABELS: Record<string, string> = {
  A: 'A. Litere străine', B: 'B. Simboluri și cifre', C: 'C. Majuscule', D: 'D. Punctuație și spații',
  E: 'E. Diacritice ambigue', F: 'F. Cuvinte rare', G: 'G. Duplicări', H: 'H. Ghilimele', R: 'R. Cititor',
}
export const REPORT_DETECTOR = 'R'
/** Limita pentru „Ignoră toate”: aceeași ca la găsește și înlocuiește. */
export const MAX_IGNORE_ALL = MAX_BULK_VERSES
const MAX_FRAGMENT_LENGTH = 500

// ─── Fragmentul ────────────────────────────────────────────────────────────

export interface ParsedFragment { left: string; target: string; right: string; context: string }

const MARKED_RE = /^([^]*?)\[\[([^]*?)\]\]([^]*)$/

/** „stânga[[țintă]]dreapta”. Fără marcaje, tot fragmentul e ținta. */
export function parseFragment(raw: string): ParsedFragment {
  const m = raw.match(MARKED_RE)
  if (!m) return { left: '', target: raw, right: '', context: raw }
  return { left: m[1], target: m[2], right: m[3], context: m[1] + m[2] + m[3] }
}

/** De câte ori apare contextul fragmentului în verset, inclusiv suprapus. */
export function countOccurrences(text: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) n++
  return n
}

/** Raportările de cititor (fragment gol) nu se învechesc niciodată. */
export function isStale(text: string, fragment: string): boolean {
  return fragment !== '' && countOccurrences(text, parseFragment(fragment).context) === 0
}

/** Versetul împărțit pentru afișare, cu ținta marcată. */
export function highlightFragment(text: string, fragment: string): MarkedPart[] {
  const { left, target, context } = parseFragment(fragment)
  const at = context ? text.indexOf(context) : -1
  if (at === -1) return [{ text, hit: false }]
  const start = at + left.length
  const end = start + target.length
  return [{ text: text.slice(0, start), hit: false }, { text: text.slice(start, end), hit: true }, { text: text.slice(end), hit: false }].filter(p => p.text)
}

/** Audit: propunerile cu variante au forma „a | b”. Spațiile de la capete fac parte din propunere („: ”). */
export function suggestionOptions(suggestion: string | null | undefined): string[] {
  return suggestion ? suggestion.split(' | ') : []
}

export type ApplyPlan =
  | { kind: 'ok'; text: string }
  | { kind: 'stale' }
  | { kind: 'ambiguous'; count: number }
  | { kind: 'no-suggestion' }

/** Înlocuiește ținta exact o dată; refuză dacă fragmentul apare de 0 sau de mai multe ori. */
export function planApply(text: string, fragment: string, suggestion: string | null | undefined, option = 0): ApplyPlan {
  const replacement = suggestionOptions(suggestion)[option]
  if (replacement === undefined || !fragment) return { kind: 'no-suggestion' }
  const { left, right, context } = parseFragment(fragment)
  const count = countOccurrences(text, context)
  if (count === 0) return { kind: 'stale' }
  if (count > 1) return { kind: 'ambiguous', count }
  const at = text.indexOf(context)
  return { kind: 'ok', text: text.slice(0, at) + left + replacement + right + text.slice(at + context.length) }
}

/** Ce are în comun „Ignoră toate”: aceeași țintă, marcată exact. Raportările de cititor nu intră. */
export function ignoreAllMarker(fragment: string): string | null {
  if (!fragment) return null
  const { target } = parseFragment(fragment)
  return target ? `[[${target}]]` : null
}

/** Câte se ignoră într-o operație și câte rămân pentru următoarea. */
export function ignoreAllBatch(total: number): { now: number; remaining: number } {
  const now = Math.min(total, MAX_IGNORE_ALL)
  return { now, remaining: total - now }
}

// ─── Fișierul auditului ────────────────────────────────────────────────────

const REQUIRED_COLUMNS = ['carte', 'capitol', 'verset', 'fragment', 'propunere', 'motiv'] as const

export interface CsvRow { line: number; cells: string[] }

export class ReviewCsvError extends Error {}

/** RFC 4180: virgule și ghilimele dublate între ghilimele, rânduri noi în câmp, CRLF, BOM. */
export function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^﻿/, '')
  const rows: CsvRow[] = []
  let cells: string[] = [], cell = '', quoted = false, line = 1, rowLine = 1
  const endCell = () => { cells.push(cell); cell = '' }
  const endRow = () => {
    endCell()
    if (cells.length > 1 || cells[0] !== '') rows.push({ line: rowLine, cells })
    cells = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else { if (c === '\n') line++; cell += c }
    } else if (c === '"' && cell === '') quoted = true
    else if (c === ',') endCell()
    else if (c === '\n') { endRow(); rowLine = ++line }
    else if (c === '\r' && text[i + 1] === '\n') continue
    else cell += c
  }
  if (quoted) throw new ReviewCsvError(`Ghilimele neînchise în rândul ${rowLine}.`)
  if (cell !== '' || cells.length) endRow()
  return rows
}

export interface AuditRow {
  line: number; bookSlug: string; chapterNum: number; verseNum: number
  detector: string; fragment: string; suggestion: string | null; reason: string | null; confidence: 'medie' | 'mica'
}
/** Fără conținutul rândului: mesajele ajung în loguri. */
export interface AuditRowError { line: number; error: string }

/** Păstrează spațiile de la capete, care contează într-o propunere ca „: ”. */
function normalizeKeepingEdges(s: string): string {
  return normalizeVerseText(`x${s}x`).slice(1, -1)
}

const intCell = (s: string, min: number) => (/^\d+$/.test(s) && Number(s) >= min ? Number(s) : null)

/**
 * Fișierul real are detectorul și încrederea în coloana `motiv`:
 * „D | mica | tip | detaliu”. Coloanele lipsă opresc tot importul.
 */
export function parseAuditCsv(input: string): { rows: AuditRow[]; errors: AuditRowError[] } {
  const [head, ...body] = parseCsv(input)
  if (!head) throw new ReviewCsvError('Fișierul e gol.')
  const columns = head.cells.map(c => c.trim().toLowerCase())
  const missing = REQUIRED_COLUMNS.filter(c => !columns.includes(c))
  if (missing.length) throw new ReviewCsvError(`Lipsesc coloanele: ${missing.join(', ')}. Sunt necesare: ${REQUIRED_COLUMNS.join(', ')}.`)
  const at = (cells: string[], name: typeof REQUIRED_COLUMNS[number]) => cells[columns.indexOf(name)] ?? ''

  const rows: AuditRow[] = []
  const errors: AuditRowError[] = []
  for (const { line, cells } of body) {
    const fail = (error: string) => { errors.push({ line, error }) }
    if (cells.length !== columns.length) { fail(`are ${cells.length} coloane în loc de ${columns.length}`); continue }
    const bookSlug = at(cells, 'carte').trim()
    if (!getBook(bookSlug)) { fail('carte necunoscută'); continue }
    const chapterNum = intCell(at(cells, 'capitol').trim(), 1)
    const verseNum = intCell(at(cells, 'verset').trim(), 0) // versetul 0 există la Psalmi
    if (chapterNum === null || verseNum === null) { fail('capitol sau verset nevalid'); continue }
    const fragment = normalizeVerseText(at(cells, 'fragment'))
    if (!fragment) { fail('fragment gol'); continue }
    if (fragment.length > MAX_FRAGMENT_LENGTH) { fail(`fragment mai lung de ${MAX_FRAGMENT_LENGTH} de caractere`); continue }
    if ((fragment.match(/\[\[/g) ?? []).length !== (fragment.match(/\]\]/g) ?? []).length || (fragment.match(/\[\[/g) ?? []).length > 1) { fail('marcaje [[ ]] nevalide în fragment'); continue }
    const [detector, confidenceRaw, ...why] = at(cells, 'motiv').split(' | ')
    if (!/^[A-H]$/.test(detector ?? '')) { fail('detector nevalid în motiv'); continue }
    const confidence = confidenceRaw?.replace('ă', 'a')
    if (confidence !== 'medie' && confidence !== 'mica') { fail('încredere nevalidă în motiv'); continue }
    const suggestion = at(cells, 'propunere')
    rows.push({
      line, bookSlug, chapterNum, verseNum, detector, fragment, confidence,
      suggestion: suggestion ? normalizeKeepingEdges(suggestion) : null,
      reason: why.join(' — ').trim() || null,
    })
  }
  return { rows, errors }
}

// ─── Planul importului ─────────────────────────────────────────────────────

export interface ImportVerse { id: string; bookSlug: string; chapterNum: number; verseNum: number; textRo: string }
export interface ExistingItem { id: string; verseId: string; detector: string; fragment: string; status: string }
export interface NewItem extends Omit<AuditRow, 'line'> { verseId: string; source: 'audit'; status: 'PENDING' | 'STALE' }
export interface ImportPlan {
  create: NewItem[]
  /** Dintre cele de creat, câte au deja fragmentul schimbat în verset. */
  createdStale: number
  /** Elemente existente, în așteptare, al căror fragment nu mai apare. */
  staleIds: string[]
  already: number
  duplicates: number
  missing: { line: number; ref: string }[]
}

const verseKey = (slug: string, chapter: number, verse: number) => `${slug}|${chapter}|${verse}`
const itemKey = (verseId: string, detector: string, fragment: string) => `${verseId}\u0000${detector}\u0000${fragment}`

/** Idempotent: un rând deja importat nu se recreează, oricare ar fi starea lui. */
export function planImport(rows: AuditRow[], verses: ImportVerse[], existing: ExistingItem[]): ImportPlan {
  const byRef = new Map(verses.map(v => [verseKey(v.bookSlug, v.chapterNum, v.verseNum), v]))
  const textOf = new Map(verses.map(v => [v.id, v.textRo]))
  const seen = new Set(existing.map(e => itemKey(e.verseId, e.detector, e.fragment)))
  const plan: ImportPlan = { create: [], createdStale: 0, staleIds: [], already: 0, duplicates: 0, missing: [] }
  const inFile = new Set<string>()

  for (const { line, ...row } of rows) {
    const verse = byRef.get(verseKey(row.bookSlug, row.chapterNum, row.verseNum))
    if (!verse) { plan.missing.push({ line, ref: `${row.bookSlug} ${row.chapterNum}:${row.verseNum}` }); continue }
    const key = itemKey(verse.id, row.detector, row.fragment)
    if (inFile.has(key)) { plan.duplicates++; continue }
    inFile.add(key)
    if (seen.has(key)) { plan.already++; continue }
    const stale = isStale(verse.textRo, row.fragment)
    if (stale) plan.createdStale++
    plan.create.push({ ...row, verseId: verse.id, source: 'audit', status: stale ? 'STALE' : 'PENDING' })
  }
  for (const e of existing) {
    const text = textOf.get(e.verseId)
    if (e.status === 'PENDING' && text !== undefined && isStale(text, e.fragment)) plan.staleIds.push(e.id)
  }
  return plan
}

export interface ReviewImportDb {
  bibleVerse: {
    findMany(args: { select: { id: true; verseNum: true; textRo: true; chapter: { select: { chapterNum: true; book: { select: { slug: true } } } } } }):
      Promise<{ id: string; verseNum: number; textRo: string; chapter: { chapterNum: number; book: { slug: string } } }[]>
  }
  bibleReviewItem: {
    findMany(args: { where: { source: 'audit' }; select: { id: true; verseId: true; detector: true; fragment: true; status: true } }): Promise<ExistingItem[]>
    createMany(args: { data: NewItem[]; skipDuplicates: true }): Promise<{ count: number }>
    updateMany(args: { where: { id: { in: string[] }; status: 'PENDING' }; data: { status: 'STALE'; resolvedBy: string; resolvedAt: Date } }): Promise<{ count: number }>
  }
  $transaction<T>(fn: (tx: Pick<ReviewImportDb, 'bibleReviewItem'>) => Promise<T>, opts: { timeout: number; maxWait: number }): Promise<T>
}

const IMPORT_CHUNK = 1000

export async function loadImportPlan(db: ReviewImportDb, rows: AuditRow[]): Promise<ImportPlan> {
  const [verses, existing] = await Promise.all([
    db.bibleVerse.findMany({ select: { id: true, verseNum: true, textRo: true, chapter: { select: { chapterNum: true, book: { select: { slug: true } } } } } }),
    db.bibleReviewItem.findMany({ where: { source: 'audit' }, select: { id: true, verseId: true, detector: true, fragment: true, status: true } }),
  ])
  return planImport(rows, verses.map(v => ({ id: v.id, bookSlug: v.chapter.book.slug, chapterNum: v.chapter.chapterNum, verseNum: v.verseNum, textRo: v.textRo })), existing)
}

/** Totul într-o tranzacție; `skipDuplicates` acoperă și o rulare simultană. */
export async function applyImportPlan(db: ReviewImportDb, plan: ImportPlan): Promise<{ created: number; staled: number }> {
  return db.$transaction(async tx => {
    let created = 0, staled = 0
    for (let i = 0; i < plan.create.length; i += IMPORT_CHUNK) {
      created += (await tx.bibleReviewItem.createMany({ data: plan.create.slice(i, i + IMPORT_CHUNK), skipDuplicates: true })).count
    }
    for (let i = 0; i < plan.staleIds.length; i += IMPORT_CHUNK) {
      staled += (await tx.bibleReviewItem.updateMany({
        where: { id: { in: plan.staleIds.slice(i, i + IMPORT_CHUNK) }, status: 'PENDING' },
        data: { status: 'STALE', resolvedBy: 'import', resolvedAt: new Date() },
      })).count
    }
    return { created, staled }
  }, { timeout: 300_000, maxWait: 10_000 })
}
