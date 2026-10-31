/**
 * Validarea Bibliei extrase, înainte de import. Funcții pure, fără React/Next și
 * fără `@/`. Blocantele opresc importul; avertismentele se listează pentru
 * verificare manuală — nimic nu se „corectează" automat.
 */
import { BIBLE_BOOKS, NT_CHAPTER_COUNTS } from './books'
import type { ParsedBook } from './parse'

export type IssueCode =
  | 'missing-book' | 'unknown-book' | 'duplicate-book' | 'no-chapters'
  | 'chapters-not-consecutive' | 'verses-not-consecutive' | 'empty-chapter'
  | 'empty-verse' | 'duplicate-verse' | 'bad-char' | 'mojibake' | 'cedilla'
  | 'leading-digit' | 'nt-chapter-count'
  // avertismente
  | 'many-verses' | 'long-verse' | 'same-as-previous' | 'total-verses' | 'vt-chapter-count'

export interface Issue {
  code: IssueCode
  severity: 'blocking' | 'warning'
  slug?: string
  chapter?: number
  verse?: number
  detail: string
  /** Acceptat explicit de Marin în bible-data/_exceptii.json. */
  accepted?: string
}

/** O excepție scrisă de Marin: aceeași carte/capitol/verset și același cod. */
export interface ExceptionEntry {
  code: IssueCode
  slug?: string
  chapter?: number
  verse?: number
  motiv: string
}

/**
 * Numărul obișnuit de capitole din Vechiul Testament (ediția sinodală română).
 * Doar pentru AVERTISMENTE: edițiile diferă (ex. Psalmii 150/151), deci nu blochează.
 */
export const USUAL_VT_CHAPTERS: Readonly<Record<string, number>> = {
  'facerea': 50, 'iesirea': 40, 'leviticul': 27, 'numerii': 36, 'deuteronomul': 34,
  'iosua-navi': 24, 'judecatorii': 21, 'rut': 4, '1-regi': 31, '2-regi': 24, '3-regi': 22,
  '4-regi': 25, '1-paralipomena': 29, '2-paralipomena': 36, '1-ezdra': 10, 'neemia': 13,
  '3-ezdra': 9, 'tobit': 14, 'iudita': 16, 'estera': 10, 'iov': 42, 'psalmi': 151,
  'pilde': 31, 'eclesiastul': 12, 'cantarea-cantarilor': 8, 'intelepciunea-lui-solomon': 19,
  'sirah': 51, 'isaia': 66, 'ieremia': 52, 'plangerile': 5, 'baruh': 5,
  'epistola-lui-ieremia': 1, 'iezechiel': 48, 'daniel': 12, 'cei-trei-tineri': 1,
  'susana': 1, 'balaur': 1, 'osea': 14, 'ioil': 3, 'amos': 9, 'avdie': 1, 'iona': 4,
  'miheia': 7, 'naum': 3, 'avacum': 3, 'sofonie': 3, 'agheu': 2, 'zaharia': 14,
  'maleahi': 4, '1-macabei': 16, '2-macabei': 15, '3-macabei': 7, 'rugaciunea-manase': 1,
}

export const LIMITS = { versesPerChapter: 180, verseChars: 4000, totalMin: 30_000, totalMax: 40_000 }

export const BAD_CHAR_RE = /[�\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/
export const MOJIBAKE_RE = /[ÃÂ][\u0080-¿ -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Ä[ƒ‚]|Å[Ÿ£¢ž]|È[™›š˜]/
const CEDILLA_RE = /[şţŞŢ]/

function block(code: IssueCode, detail: string, at: Partial<Issue> = {}): Issue {
  return { code, severity: 'blocking', detail, ...at }
}
function warn(code: IssueCode, detail: string, at: Partial<Issue> = {}): Issue {
  return { code, severity: 'warning', detail, ...at }
}

function consecutive(nums: number[], start: number): boolean {
  return nums.every((n, i) => n === start + i)
}

export interface BookStats { slug: string; chapters: number; verses: number; warnings: number }

export interface PsalmsInfo {
  psalms: number
  /** Psalmi care încep cu versetul 0 (titlul numerotat 0). */
  withVerseZero: number
}

export interface ValidationResult {
  issues: Issue[]
  blocking: Issue[]
  warnings: Issue[]
  books: BookStats[]
  totalChapters: number
  totalVerses: number
  psalms: PsalmsInfo | null
}

/** Verifică textul unui verset; întoarce problemele găsite (blocante). */
export function checkVerseText(text: string, at: Partial<Issue>): Issue[] {
  const out: Issue[] = []
  if (!text.trim()) out.push(block('empty-verse', 'verset gol', at))
  if (BAD_CHAR_RE.test(text)) out.push(block('bad-char', 'caracter de înlocuire (�) sau de control', at))
  if (MOJIBAKE_RE.test(text)) out.push(block('mojibake', 'codare greșită (ex. „Ã" + simbol)', at))
  if (CEDILLA_RE.test(text)) out.push(block('cedilla', 'literă cu sedilă rămasă după normalizare', at))
  if (/^\s*\d/.test(text)) out.push(block('leading-digit', 'textul începe cu o cifră (numerotare rămasă în text?)', at))
  return out
}

/** Validează setul complet de cărți extrase. */
export function validateBible(input: ParsedBook[], exceptions: ExceptionEntry[] = []): ValidationResult {
  const issues: Issue[] = []
  const known = new Set(BIBLE_BOOKS.map(b => b.slug))
  const seen = new Map<string, number>()
  for (const b of input) seen.set(b.slug, (seen.get(b.slug) ?? 0) + 1)

  for (const b of BIBLE_BOOKS) if (!seen.has(b.slug)) issues.push(block('missing-book', 'cartea lipsește', { slug: b.slug }))
  for (const [slug, n] of seen) {
    if (!known.has(slug)) issues.push(block('unknown-book', 'carte necunoscută (nu e în books.ts)', { slug }))
    if (n > 1) issues.push(block('duplicate-book', `apare de ${n} ori`, { slug }))
  }

  const books: BookStats[] = []
  let totalChapters = 0, totalVerses = 0
  let psalms: PsalmsInfo | null = null

  for (const b of input) {
    const before = issues.length
    const chNums = b.chapters.map(c => c.n)
    if (!b.chapters.length) issues.push(block('no-chapters', 'fără capitole', { slug: b.slug }))
    else if (!consecutive(chNums, 1)) issues.push(block('chapters-not-consecutive', `capitolele nu sunt 1..${b.chapters.length} la rând (${chNums.slice(0, 12).join(', ')}${chNums.length > 12 ? '…' : ''})`, { slug: b.slug }))

    const ntCount = NT_CHAPTER_COUNTS[b.slug]
    if (ntCount !== undefined && b.chapters.length !== ntCount) issues.push(block('nt-chapter-count', `${b.chapters.length} capitole, Noul Testament are ${ntCount}`, { slug: b.slug }))
    const vtCount = USUAL_VT_CHAPTERS[b.slug]
    if (vtCount !== undefined && b.chapters.length !== vtCount) issues.push(warn('vt-chapter-count', `${b.chapters.length} capitole (de obicei ${vtCount}) — de verificat manual`, { slug: b.slug }))

    let verses = 0
    for (const ch of b.chapters) {
      const vNums = ch.verses.map(v => v.n)
      const start = b.slug === 'psalmi' && vNums[0] === 0 ? 0 : 1
      if (!ch.verses.length) issues.push(block('empty-chapter', 'capitol fără versete', { slug: b.slug, chapter: ch.n }))
      if (new Set(vNums).size !== vNums.length) issues.push(block('duplicate-verse', 'versete cu același număr', { slug: b.slug, chapter: ch.n }))
      else if (ch.verses.length && !consecutive(vNums, start)) issues.push(block('verses-not-consecutive', `versetele nu sunt ${start}..${start + vNums.length - 1} la rând`, { slug: b.slug, chapter: ch.n }))
      if (ch.verses.length > LIMITS.versesPerChapter) issues.push(warn('many-verses', `${ch.verses.length} versete (> ${LIMITS.versesPerChapter})`, { slug: b.slug, chapter: ch.n }))
      let prev = ''
      for (const v of ch.verses) {
        const at = { slug: b.slug, chapter: ch.n, verse: v.n }
        issues.push(...checkVerseText(v.text, at))
        if (v.text.length > LIMITS.verseChars) issues.push(warn('long-verse', `${v.text.length} caractere`, at))
        if (prev && v.text === prev) issues.push(warn('same-as-previous', 'identic cu versetul anterior', at))
        prev = v.text
      }
      verses += ch.verses.length
    }
    if (b.slug === 'psalmi') psalms = { psalms: b.chapters.length, withVerseZero: b.chapters.filter(c => c.verses[0]?.n === 0).length }
    totalChapters += b.chapters.length
    totalVerses += verses
    books.push({ slug: b.slug, chapters: b.chapters.length, verses, warnings: issues.slice(before).filter(i => i.severity === 'warning').length })
  }

  if (input.length && (totalVerses < LIMITS.totalMin || totalVerses > LIMITS.totalMax)) {
    issues.push(warn('total-verses', `${totalVerses} versete în total (de obicei ${LIMITS.totalMin}–${LIMITS.totalMax})`))
  }

  for (const i of issues) {
    const e = exceptions.find(x => x.code === i.code && x.slug === i.slug && x.chapter === i.chapter && x.verse === i.verse)
    if (e) i.accepted = e.motiv
  }
  const open = issues.filter(i => !i.accepted)
  const order = new Map(BIBLE_BOOKS.map(b => [b.slug, b.orderNum]))
  books.sort((x, y) => (order.get(x.slug) ?? 999) - (order.get(y.slug) ?? 999))
  return {
    issues,
    blocking: open.filter(i => i.severity === 'blocking'),
    warnings: open.filter(i => i.severity === 'warning'),
    books, totalChapters, totalVerses, psalms,
  }
}

/** Citește conținutul lui _exceptii.json (scris de Marin). Format greșit → eroare clară. */
export function parseExceptions(json: unknown): ExceptionEntry[] {
  const list = (json as { exceptii?: unknown })?.exceptii
  if (!Array.isArray(list)) throw new Error('_exceptii.json: lipsește lista „exceptii": [ … ]')
  return list.map((e, i) => {
    const x = e as Partial<ExceptionEntry>
    if (!x || typeof x.code !== 'string' || typeof x.motiv !== 'string' || !x.motiv.trim()) {
      throw new Error(`_exceptii.json: intrarea ${i + 1} trebuie să aibă „code" și „motiv"`)
    }
    return { code: x.code as IssueCode, slug: x.slug, chapter: x.chapter, verse: x.verse, motiv: x.motiv }
  })
}

export function formatIssue(i: Issue): string {
  const at = `${i.slug ?? ''}${i.chapter !== undefined ? ` ${i.chapter}` : ''}${i.verse !== undefined ? `:${i.verse}` : ''}`
  return `${i.severity === 'blocking' ? 'BLOCANT' : 'avertisment'} [${i.code}] ${at || '(total)'} — ${i.detail}${i.accepted ? ` · ACCEPTAT: ${i.accepted}` : ''}`
}
