/**
 * npm run bible:validate — verifică bible-data/*.json înainte de import.
 * Raport: bible-data/_raport-validare.md (doar cifre și locuri, fără versete).
 * Cele 6 versete de control se tipăresc DOAR în terminal, pentru comparație cu Biblia tipărită.
 * Cod de ieșire ≠ 0 dacă există probleme blocante.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getBook } from '../../src/lib/bible/books'
import type { ParsedBook } from '../../src/lib/bible/parse'
import { formatIssue, parseExceptions, validateBible, type ExceptionEntry, type ValidationResult } from '../../src/lib/bible/validate'
import { DATA_DIR, loadBooks, writeReport } from './_shared'

export const CONTROL_VERSES: [string, number, number][] = [
  ['facerea', 1, 1], ['psalmi', 1, 1], ['matei', 5, 3], ['ioan', 3, 16], ['romani', 8, 1], ['apocalipsa', 22, 21],
]

export function loadExceptions(dir = DATA_DIR): ExceptionEntry[] {
  const p = path.join(dir, '_exceptii.json')
  return fs.existsSync(p) ? parseExceptions(JSON.parse(fs.readFileSync(p, 'utf8'))) : []
}

export function reportMarkdown(r: ValidationResult, exceptions: ExceptionEntry[]): string {
  const lines = [
    `# Raport de validare — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    '',
    `**${r.blocking.length} blocante**, ${r.warnings.length} avertismente, ${r.issues.filter(i => i.accepted).length} acceptate în _exceptii.json (${exceptions.length} intrări).`,
    `Total: ${r.books.length} cărți, ${r.totalChapters} capitole, ${r.totalVerses} versete.`,
    r.psalms ? `Psalmii: ${r.psalms.psalms} psalmi; ${r.psalms.withVerseZero} încep cu versetul 0 (titlul numerotat 0)${r.psalms.withVerseZero ? '' : '; titlurile sunt nenumerotate sau incluse în versetul 1'}.` : 'Psalmii: lipsesc.',
    '',
    '| # | Carte | Capitole | Versete | Avertismente |',
    '|---:|---|---:|---:|---:|',
    ...r.books.map(b => `| ${getBook(b.slug)?.orderNum ?? '?'} | ${b.slug} | ${b.chapters} | ${b.verses} | ${b.warnings} |`),
    '',
    '## Blocante', '', ...(r.blocking.length ? r.blocking.map(i => `- ${formatIssue(i)}`) : ['—']), '',
    '## Avertismente (de verificat manual, nimic nu s-a corectat)', '', ...(r.warnings.length ? r.warnings.map(i => `- ${formatIssue(i)}`) : ['—']), '',
    '## Acceptate de Marin (_exceptii.json)', '', ...(r.issues.filter(i => i.accepted).map(i => `- ${formatIssue(i)}`)), '',
  ]
  return lines.join('\n')
}

function controlVerse(books: ParsedBook[], slug: string, ch: number, v: number): string {
  const verse = books.find(b => b.slug === slug)?.chapters.find(c => c.n === ch)?.verses.find(x => x.n === v)
  return verse ? verse.text : '(lipsește)'
}

export function runValidation(dir = DATA_DIR) {
  const books = loadBooks(dir)
  const exceptions = loadExceptions(dir)
  return { books, exceptions, result: validateBible(books, exceptions) }
}

function main() {
  const { books, exceptions, result } = runValidation()
  if (!books.length) {
    console.error(`Nu există date în ${path.relative(process.cwd(), DATA_DIR) || DATA_DIR}/. Rulează întâi: npm run bible:extract`)
    process.exit(2)
  }
  const report = writeReport('_raport-validare.md', reportMarkdown(result, exceptions))
  for (const e of exceptions) console.log(`Excepție acceptată: [${e.code}] ${e.slug ?? ''} ${e.chapter ?? ''}${e.verse !== undefined ? `:${e.verse}` : ''} — ${e.motiv}`)
  console.log(`\n${result.books.length} cărți · ${result.totalChapters} capitole · ${result.totalVerses} versete`)
  console.log(`${result.blocking.length} blocante · ${result.warnings.length} avertismente`)
  for (const i of result.blocking.slice(0, 30)) console.log('  ' + formatIssue(i))
  if (result.blocking.length > 30) console.log(`  … încă ${result.blocking.length - 30} (vezi raportul)`)
  console.log('\nVersete de control — compară-le cu Biblia tipărită:')
  for (const [slug, ch, v] of CONTROL_VERSES) console.log(`  ${slug} ${ch}:${v} — ${controlVerse(books, slug, ch, v)}`)
  console.log(`\nRaport: ${report}`)
  if (result.blocking.length) {
    console.log('\nImportul NU poate continua până nu se rezolvă blocantele (sau Marin le acceptă în _exceptii.json).')
    process.exit(1)
  }
  console.log('\nPasul următor: npm run bible:import  (implicit doar planul, fără scriere)')
}

if (require.main === module) main()
