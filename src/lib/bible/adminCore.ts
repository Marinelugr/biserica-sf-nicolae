/**
 * Regulile editării Bibliei din Admin: funcții pure, fără bază de date, fără React/Next.
 * Normalizarea și `textSearch` sunt aceleași ca la import.
 */
import { createHash } from 'node:crypto'
import type { ParsedBook } from './parse'
import { normalizeForSearch } from './search'
import { normalizeVerseText } from './text'
import { BAD_CHAR_RE, MOJIBAKE_RE } from './validate'

export const MAX_VERSE_LENGTH = 5000
export const MAX_BULK_VERSES = 500
export const PREVIEW_SAMPLES = 20
const MAX_VERSE_NUMBER = 999
const MIN_FIND_LENGTH = 2

export type PreparedVerse = { ok: true; text: string; textSearch: string } | { ok: false; error: string }

/** Normalizează și validează; aceleași reguli ca `bible:validate`, ca exportul să poată fi reimportat. */
export function prepareVerseText(raw: string): PreparedVerse {
  const text = normalizeVerseText(raw)
  if (!text) return { ok: false, error: 'Versetul nu poate fi gol.' }
  if (text.length > MAX_VERSE_LENGTH) return { ok: false, error: `Textul depășește ${MAX_VERSE_LENGTH} de caractere.` }
  if (BAD_CHAR_RE.test(text)) return { ok: false, error: 'Textul conține caractere de control sau „�”.' }
  if (MOJIBAKE_RE.test(text)) return { ok: false, error: 'Textul pare să aibă o codare greșită (de ex. „Ã” + simbol).' }
  if (/^\d/.test(text)) return { ok: false, error: 'Textul începe cu o cifră; numărul versetului nu se scrie în text.' }
  const textSearch = normalizeForSearch(text)
  // cititorul evidențiază rezultatele după poziții: lungimile trebuie să fie egale
  if (textSearch.length !== text.length) return { ok: false, error: 'Textul conține caractere care nu pot fi indexate pentru căutare.' }
  return { ok: true, text, textSearch }
}

/** Număr valid pentru un verset NOU. Versetul 0 existent la Psalmi rămâne editabil, dar nu se creează din Admin. */
export function isValidNewVerseNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= MAX_VERSE_NUMBER
}

/** Numerele lipsă din secvența 1..max (versetul 0 nu contează). */
export function missingVerseNumbers(numbers: number[]): number[] {
  const have = new Set(numbers.filter(n => n > 0))
  const max = have.size ? Math.max(...have) : 0
  const missing: number[] = []
  for (let n = 1; n <= max; n++) if (!have.has(n)) missing.push(n)
  return missing
}

/** Câte goluri are un capitol, din numărul de versete > 0 și cel mai mare număr. */
export function gapCount(positiveVerses: number, maxVerse: number | null | undefined): number {
  return maxVerse ? Math.max(0, maxVerse - positiveVerses) : 0
}

export function gapLabel(n: number): string {
  return n === 1 ? '1 gol' : `${n} goluri`
}

// ─── Găsește și înlocuiește ────────────────────────────────────────────────

export interface ReplaceInput { find: string; replace: string; wholeWord: boolean }

export type ReplaceCheck = { ok: true; input: ReplaceInput } | { ok: false; error: string }

/** Curăță căutarea și înlocuirea cu aceeași normalizare ca textul. Înlocuirea poate fi goală (ștergere). */
export function checkReplaceInput(input: ReplaceInput): ReplaceCheck {
  const find = normalizeVerseText(input.find)
  const replace = normalizeVerseText(input.replace)
  if (find.length < MIN_FIND_LENGTH) return { ok: false, error: `Textul căutat trebuie să aibă cel puțin ${MIN_FIND_LENGTH} caractere.` }
  if (find === replace) return { ok: false, error: 'Textul căutat și cel nou sunt identice.' }
  if (BAD_CHAR_RE.test(find) || BAD_CHAR_RE.test(replace)) return { ok: false, error: 'Textul conține caractere de control sau „�”.' }
  return { ok: true, input: { find, replace, wholeWord: input.wholeWord } }
}

function findRegex({ find, wholeWord }: Pick<ReplaceInput, 'find' | 'wholeWord'>): RegExp {
  const escaped = find.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')
  // Cuvânt întreg, cu litere românești: „intru” nu trebuie să se potrivească în „dintru”.
  return new RegExp(wholeWord ? `(?<![\\p{L}\\p{M}\\p{N}])${escaped}(?![\\p{L}\\p{M}\\p{N}])` : escaped, 'gu')
}

export interface ReplaceRow { id: string; chapterNum: number; verseNum: number; textRo: string; editedAt: Date | null }
export interface ReplaceChange extends ReplaceRow { newText: string; textSearch: string }
export interface MarkedPart { text: string; hit: boolean }
export interface ReplaceSample { chapterNum: number; verseNum: number; before: MarkedPart[]; after: MarkedPart[] }

export interface ReplacePlan {
  /** Toate versetele care s-ar schimba. */
  total: number
  /** Versetele acestei operații: primele 500, în ordinea cărții. */
  changes: ReplaceChange[]
  samples: ReplaceSample[]
  /** Versete al căror rezultat nu trece validarea: operația e blocată. */
  invalid: { chapterNum: number; verseNum: number; error: string }[]
  token: string
}

/** Bucăți marcate pentru previzualizare: fragmentele `term` din `text`. */
export function markParts(text: string, term: string, wholeWord: boolean): MarkedPart[] {
  if (!term) return [{ text, hit: false }]
  const parts: MarkedPart[] = []
  let pos = 0
  for (const m of text.matchAll(findRegex({ find: term, wholeWord }))) {
    if (m.index > pos) parts.push({ text: text.slice(pos, m.index), hit: false })
    parts.push({ text: m[0], hit: true })
    pos = m.index + m[0].length
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), hit: false })
  return parts
}

/** Ce s-ar schimba: exact, cu majuscule. Rândurile trebuie să fie în ordinea cărții. */
export function planReplace(slug: string, rows: ReplaceRow[], input: ReplaceInput): ReplacePlan {
  const regex = findRegex(input)
  const all: ReplaceChange[] = []
  const invalid: ReplacePlan['invalid'] = []
  for (const row of rows) {
    // funcție, nu șir: „$&” din textul nou nu e un tipar
    const replaced = row.textRo.replace(regex, () => input.replace)
    if (replaced === row.textRo) continue
    const prepared = prepareVerseText(replaced)
    if (!prepared.ok) { invalid.push({ chapterNum: row.chapterNum, verseNum: row.verseNum, error: prepared.error }); continue }
    if (prepared.text === row.textRo) continue
    all.push({ ...row, newText: prepared.text, textSearch: prepared.textSearch })
  }
  const changes = all.slice(0, MAX_BULK_VERSES)
  return {
    total: all.length + invalid.length,
    changes,
    invalid,
    samples: changes.slice(0, PREVIEW_SAMPLES).map(c => ({
      chapterNum: c.chapterNum,
      verseNum: c.verseNum,
      before: markParts(c.textRo, input.find, input.wholeWord),
      after: markParts(c.newText, input.replace, input.wholeWord),
    })),
    token: replaceToken(slug, input, changes),
  }
}

/** Amprenta previzualizării. Dacă versetele se schimbă până la confirmare, amprenta nu mai corespunde. */
function replaceToken(slug: string, input: ReplaceInput, changes: ReplaceChange[]): string {
  const payload = [slug, input.find, input.replace, input.wholeWord, changes.map(c => [c.id, c.editedAt?.toISOString() ?? null, c.textRo])]
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

// ─── Export ────────────────────────────────────────────────────────────────

export interface ExportRow { chapterNum: number; verseNum: number; textRo: string }

/** Formatul din bible-data/<slug>.json. Capitolele fără versete nu apar. */
export function buildBookExport(slug: string, rows: ExportRow[]): ParsedBook {
  const chapters = new Map<number, { n: number; text: string }[]>()
  for (const r of rows) {
    const verses = chapters.get(r.chapterNum) ?? []
    verses.push({ n: r.verseNum, text: r.textRo })
    chapters.set(r.chapterNum, verses)
  }
  return {
    slug,
    chapters: [...chapters.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([n, verses]) => ({ n, verses: verses.sort((a, b) => a.n - b.n) })),
  }
}

/** Prisma: `contains` tratează `%` și `_` drept tipare. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&')
}
