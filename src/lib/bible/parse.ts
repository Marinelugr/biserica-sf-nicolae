/**
 * Extragerea Bibliei din textul fișierelor Word (după mammoth.extractRawText).
 * Funcții pure, fără React/Next și fără `@/`. Formatul real al fișierelor lui
 * Marin nu era disponibil când s-a scris codul: `detectFormat` măsoară tiparele
 * găsite, iar `parseBookText` primește tiparele alese, ca să poată fi ajustat
 * la formatul real fără a rescrie restul. Testat doar pe text de probă.
 */
import { findBookByName } from './reference'

export interface ParsedVerse { n: number; text: string }
export interface ParsedChapter { n: number; verses: ParsedVerse[] }
export interface ParsedBook { slug: string; chapters: ParsedChapter[] }

export type VerseStyle = 'paragraph' | 'inline' | 'bracket'

export interface ParseOptions {
  /** Cum apare numărul versetului. */
  verseStyle: VerseStyle
  /** Un paragraf care e doar un număr („5") înseamnă capitol nou (când nu există „Capitolul 5"). */
  bareNumberChapters: boolean
  /** Paragraful fără număr, mai scurt de atât și fără punct final, e titlu/pericopă (nu face parte din verset). */
  headingMaxLength: number
}

export const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  verseStyle: 'paragraph',
  bareNumberChapters: false,
  headingMaxLength: 120,
}

export interface ParseIssue {
  kind: 'verse-order' | 'chapter-order' | 'text-before-chapter' | 'text-before-verse'
  chapter?: number
  verse?: number
  detail: string
}

export interface ParseResult {
  book: ParsedBook
  /** Titluri/pericope lăsate deoparte. */
  headings: number
  /** Note de subsol / referințe lăsate deoparte. */
  notes: number
  /** Paragrafe lipite la versetul anterior (verset pe mai multe paragrafe). */
  joined: number
  /** Ce nu s-a reparat automat (numerotare lipsă sau în afara ordinii). */
  issues: ParseIssue[]
}

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }

export function romanToInt(s: string): number | null {
  const r = s.toUpperCase()
  if (!/^[IVXLC]+$/.test(r)) return null
  let total = 0
  for (let i = 0; i < r.length; i++) {
    const v = ROMAN_VALUES[r[i]]
    const next = ROMAN_VALUES[r[i + 1]] ?? 0
    total += v < next ? -v : v
  }
  return total > 0 ? total : null
}

const CHAPTER_RE = /^(?:capitolul|capitol|cap\.?|psalmul|psalm)\s+(\d{1,3}|[ivxlc]+)\.?\s*$/i
const BARE_NUMBER_RE = /^(\d{1,3})\.?$/
const NOTE_RE = /^\s*(?:[*†‡]|\[[a-z]{1,2}\]\s|nota\b|notă\b)/i

/** Numărul capitolului dintr-un antet („Capitolul 3", „Cap. III", „Psalmul 50"), sau null. */
export function chapterHeader(line: string, opts: Pick<ParseOptions, 'bareNumberChapters'> = DEFAULT_PARSE_OPTIONS): number | null {
  const t = line.trim()
  const m = t.match(CHAPTER_RE)
  if (m) return /^\d+$/.test(m[1]) ? Number(m[1]) : romanToInt(m[1])
  if (opts.bareNumberChapters) {
    const b = t.match(BARE_NUMBER_RE)
    if (b) return Number(b[1])
  }
  return null
}

/** Cartea al cărei titlu este paragraful (sau ce e între paranteze în el), ori null. */
export function bookTitle(line: string): string | null {
  const t = line.trim()
  if (!t || t.length > 140 || /\d{1,3}\s*[:.,]\s*\d/.test(t)) return null
  const direct = findBookByName(t)
  if (direct) return direct.slug
  const paren = t.match(/\(([^)]+)\)/)
  if (paren) {
    const inner = findBookByName(paren[1])
    if (inner) return inner.slug
  }
  return null
}

export function isNote(line: string): boolean {
  return NOTE_RE.test(line)
}

/** Împarte un paragraf în versete după stil; `lead` = textul dinaintea primului număr. */
export function splitVerses(paragraph: string, style: VerseStyle): { lead: string; verses: ParsedVerse[] } {
  const p = paragraph.trim()
  if (style === 'paragraph') {
    const m = p.match(/^(\d{1,3})[.)]?\s+(\S[\s\S]*)$/)
    return m ? { lead: '', verses: [{ n: Number(m[1]), text: m[2] }] } : { lead: p, verses: [] }
  }
  const re = style === 'bracket'
    ? /\[(\d{1,3})\]\s*/g
    : /(?:^|\s)(\d{1,3})[.)]?\s+(?=[\p{L}„"«(])/gu
  const marks: { n: number; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(p))) marks.push({ n: Number(m[1]), start: m.index, end: m.index + m[0].length })
  if (!marks.length) return { lead: p, verses: [] }
  const verses = marks.map((mk, i) => ({ n: mk.n, text: p.slice(mk.end, marks[i + 1]?.start ?? p.length).trim() }))
  return { lead: p.slice(0, marks[0].start).trim(), verses }
}

function looksLikeHeading(text: string, max: number): boolean {
  return text.length <= max && !/[.;:!?»”"]$/.test(text.trim())
}

/**
 * Textul unei singure cărți (paragrafe despărțite de linii goale) → capitole și versete.
 * Numerele lipsă sau în afara ordinii NU se repară: se raportează în `issues`.
 */
export function parseBookText(slug: string, raw: string, options: Partial<ParseOptions> = {}): ParseResult {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options }
  const paragraphs = raw.replace(/\r\n?/g, '\n').split(/\n\s*\n|\n/).map(s => s.trim()).filter(Boolean)
  const chapters: ParsedChapter[] = []
  const issues: ParseIssue[] = []
  let current: ParsedChapter | null = null
  let headings = 0, notes = 0, joined = 0

  for (const para of paragraphs) {
    const ch = chapterHeader(para, opts)
    if (ch !== null) {
      const expected = (chapters[chapters.length - 1]?.n ?? 0) + 1
      if (ch !== expected) issues.push({ kind: 'chapter-order', chapter: ch, detail: `capitolul ${ch} după ${expected - 1}` })
      current = { n: ch, verses: [] }
      chapters.push(current)
      continue
    }
    if (isNote(para)) { notes++; continue }
    if (bookTitle(para) === slug && !current) { headings++; continue }

    const { lead, verses } = splitVerses(para, opts.verseStyle)
    if (!current) {
      if (verses.length || lead) {
        if (verses.length) issues.push({ kind: 'text-before-chapter', detail: 'versete înainte de primul capitol' })
        else headings++
      }
      continue
    }
    if (lead) {
      const last = current.verses[current.verses.length - 1]
      if (!verses.length && looksLikeHeading(lead, opts.headingMaxLength)) headings++
      else if (last) { last.text = `${last.text} ${lead}`; joined++ }
      else if (looksLikeHeading(lead, opts.headingMaxLength)) headings++
      else issues.push({ kind: 'text-before-verse', chapter: current.n, detail: 'text fără număr de verset la începutul capitolului' })
    }
    for (const v of verses) {
      const expected = (current.verses[current.verses.length - 1]?.n ?? (slug === 'psalmi' && v.n === 0 ? -1 : 0)) + 1
      if (v.n !== expected) issues.push({ kind: 'verse-order', chapter: current.n, verse: v.n, detail: `versetul ${v.n} după ${expected - 1}` })
      current.verses.push(v)
    }
  }
  return { book: { slug, chapters }, headings, notes, joined, issues }
}

export interface Section { slug: string | null; title: string; text: string }

/**
 * Un document cu toată Biblia → secțiuni pe cărți, după paragrafele-titlu.
 * Textul de dinaintea primei cărți (pagina de titlu, prefața) e secțiunea cu slug null.
 */
export function splitByBooks(raw: string): Section[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  const sections: Section[] = [{ slug: null, title: '', text: '' }]
  for (const line of lines) {
    const slug = bookTitle(line)
    const cur = sections[sections.length - 1]
    // un titlu repetat imediat (ex. titlu lung + titlu scurt) nu deschide o secțiune nouă
    if (slug && !(cur.slug === slug && !cur.text.trim())) {
      sections.push({ slug, title: line.trim(), text: '' })
    } else {
      cur.text += line + '\n'
    }
  }
  return sections.filter(s => s.slug !== null || s.text.trim())
}

export interface FormatStats {
  paragraphs: number
  chapterHeaders: number
  bareNumbers: number
  versesAtStart: number
  bracketVerses: number
  inlineVerses: number
  bookTitles: number
  notes: number
}

/** Numără tiparele dintr-un text, ca să se aleagă opțiunile parserului (doar cifre, fără text). */
export function detectFormat(raw: string): FormatStats {
  const paras = raw.replace(/\r\n?/g, '\n').split('\n').map(s => s.trim()).filter(Boolean)
  const stats: FormatStats = { paragraphs: paras.length, chapterHeaders: 0, bareNumbers: 0, versesAtStart: 0, bracketVerses: 0, inlineVerses: 0, bookTitles: 0, notes: 0 }
  for (const p of paras) {
    if (CHAPTER_RE.test(p)) stats.chapterHeaders++
    else if (BARE_NUMBER_RE.test(p)) stats.bareNumbers++
    if (/^\d{1,3}[.)]?\s+\S/.test(p)) stats.versesAtStart++
    stats.bracketVerses += (p.match(/\[\d{1,3}\]/g) || []).length
    stats.inlineVerses += Math.max(0, (p.match(/(?:^|\s)\d{1,3}[.)]?\s+(?=[\p{L}„"«(])/gu) || []).length - 1)
    if (bookTitle(p)) stats.bookTitles++
    if (NOTE_RE.test(p)) stats.notes++
  }
  return stats
}

/** Opțiunile propuse din statistici; `confident: false` = formatul trebuie verificat de om. */
export function suggestOptions(s: FormatStats): { options: ParseOptions; confident: boolean; reason: string } {
  const bracket = s.bracketVerses > s.versesAtStart && s.bracketVerses > s.inlineVerses
  const inline = !bracket && s.inlineVerses > s.versesAtStart
  const verseStyle: VerseStyle = bracket ? 'bracket' : inline ? 'inline' : 'paragraph'
  const bareNumberChapters = s.chapterHeaders === 0 && s.bareNumbers > 0
  const verseMarks = bracket ? s.bracketVerses : inline ? s.inlineVerses : s.versesAtStart
  const confident = (s.chapterHeaders > 0 || s.bareNumbers > 0) && verseMarks > 0
  return {
    options: { ...DEFAULT_PARSE_OPTIONS, verseStyle, bareNumberChapters },
    confident,
    reason: `versete: ${verseStyle} (${verseMarks}), capitole: ${bareNumberChapters ? 'număr singur' : 'antet'} (${s.chapterHeaders || s.bareNumbers})`,
  }
}
