// Ajutoare comune pentru scripturile Bibliei (rulate cu ts-node, CommonJS — fără `@/`).
import fs from 'node:fs'
import path from 'node:path'
import type { ParsedBook } from '../../src/lib/bible/parse'

export const ROOT = process.cwd()

function dirArg(name: string, fallback: string): string {
  const a = process.argv.find(x => x.startsWith(`--${name}=`))
  return a ? path.resolve(a.slice(name.length + 3)) : path.join(ROOT, fallback)
}
/** bible-source/ (sau --source=<folder>, pentru teste cu date de probă). */
export const SOURCE_DIR = dirArg('source', 'bible-source')
/** bible-data/ (sau --data=<folder>). */
export const DATA_DIR = dirArg('data', 'bible-data')

export function args(): Map<string, string | true> {
  const out = new Map<string, string | true>()
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) out.set(m[1], m[2] ?? true)
  }
  return out
}

/** Toate bible-data/<slug>.json (fără fișierele care încep cu „_"). */
export function loadBooks(dir = DATA_DIR): ParsedBook[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as ParsedBook)
}

export function writeReport(name: string, text: string): string {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const p = path.join(DATA_DIR, name)
  fs.writeFileSync(p, text)
  return path.relative(ROOT, p)
}

export function missingSourceHelp(): string {
  return [
    'Nu am găsit fișierele Word ale Bibliei.',
    'Pune fișierele .docx în folderul:',
    `  ${SOURCE_DIR}`,
    '(un fișier pentru toată Biblia sau câte unul pe carte; .doc/.rtf → deschide-le în Word și „Salvează ca” .docx)',
    'apoi rulează din nou:  npm run bible:extract',
  ].join('\n')
}
