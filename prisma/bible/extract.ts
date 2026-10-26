/**
 * npm run bible:extract — bible-source/*.docx → bible-data/<slug>.json + _raport-extragere.md
 *
 * Opțiuni (dacă formatul detectat nu e cel bun):
 *   --verse-style=paragraph|inline|bracket   cum apare numărul versetului
 *   --bare-number-chapters                    capitolul e un paragraf care conține doar numărul
 *   --force                                   scrie chiar dacă detectarea nu e sigură
 *
 * Niciun verset nu se tipărește aici; raportul conține doar cifre.
 */
import fs from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'
import { BIBLE_BOOKS } from '../../src/lib/bible/books'
import { findBookByName } from '../../src/lib/bible/reference'
import { detectFormat, parseBookText, splitByBooks, suggestOptions, type ParseOptions, type ParseResult, type VerseStyle } from '../../src/lib/bible/parse'
import { normalizeVerseText, countCedillas } from '../../src/lib/bible/text'
import { args, DATA_DIR, missingSourceHelp, SOURCE_DIR, writeReport } from './_shared'

const BIBLIO_RE = /(edi[țt]i[ae]|editura|tip[aă]rit|tipografia|institutul biblic|sfântul sinod|sinodul|aprobarea|binecuvântarea|cu aprobarea|isbn|\b(18|19|20)\d\d\b)/i

function listSources(): string[] {
  const dirs = [SOURCE_DIR, path.join(SOURCE_DIR, '_docx')]
  return dirs.filter(d => fs.existsSync(d)).flatMap(d =>
    fs.readdirSync(d).filter(f => /\.docx$/i.test(f) && !f.startsWith('~$')).map(f => path.join(d, f)))
}

function fileBook(file: string): string | null {
  const name = path.basename(file, path.extname(file)).replace(/^[\d\s._-]+(?=\p{L})/u, '').replace(/[_]+/g, ' ')
  return findBookByName(name)?.slug ?? null
}

function orthography(text: string) {
  const count = (re: RegExp) => (text.match(re) || []).length
  return {
    vechi: count(/\b(sînt|sînteți|sîntem|cînd|pămînt|pămîntul|mînă|mîna|cîte|cît)\b/gi),
    nou: count(/\b(sunt|sunteți|suntem|când|pământ|pământul|mână|mâna|câte|cât)\b/gi),
    aInterior: count(/\p{L}â\p{L}/gu),
    iInterior: count(/\p{L}î\p{L}/gu),
  }
}

async function main() {
  const a = args()
  const files = listSources()
  if (!files.length) {
    console.error(missingSourceHelp())
    process.exit(2)
  }
  const others = fs.existsSync(SOURCE_DIR) ? fs.readdirSync(SOURCE_DIR).filter(f => /\.(doc|rtf|pdf|odt|pages|txt)$/i.test(f)) : []

  // 1. text brut din fiecare fișier
  const sections: { slug: string | null; text: string; file: string }[] = []
  let frontMatter = ''
  for (const file of files) {
    const { value } = await mammoth.extractRawText({ path: file })
    const own = fileBook(file)
    if (own) { sections.push({ slug: own, text: value, file }); continue }
    for (const s of splitByBooks(value)) {
      if (s.slug === null) frontMatter += s.text + '\n'
      else sections.push({ slug: s.slug, text: s.text, file })
    }
  }

  // 2. formatul
  const stats = detectFormat(sections.map(s => s.text).join('\n'))
  const suggested = suggestOptions(stats)
  const style = a.get('verse-style')
  const options: ParseOptions = {
    ...suggested.options,
    ...(typeof style === 'string' ? { verseStyle: style as VerseStyle } : {}),
    ...(a.has('bare-number-chapters') ? { bareNumberChapters: true } : {}),
  }

  // 3. cărți: duble și lipsă
  const bySlug = new Map<string, typeof sections>()
  for (const s of sections) if (s.slug) bySlug.set(s.slug, [...(bySlug.get(s.slug) ?? []), s])
  const duplicates = [...bySlug].filter(([, v]) => v.length > 1).map(([k, v]) => `${k} (${v.map(x => path.basename(x.file)).join(', ')})`)
  const missing = BIBLE_BOOKS.filter(b => !bySlug.has(b.slug)).map(b => b.slug)

  const lines: string[] = [
    `# Raport de extragere — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    '',
    `Fișiere .docx: ${files.length}${others.length ? ` · alte fișiere neprocesate (.doc/.rtf/.pdf…): ${others.length} — salvează-le ca .docx` : ''}`,
    `Format detectat: ${suggested.reason}${suggested.confident ? '' : ' — **NESIGUR**'}`,
    `Opțiuni folosite: verseStyle=${options.verseStyle}, bareNumberChapters=${options.bareNumberChapters}`,
    `Tipare (paragrafe ${stats.paragraphs}): antete de capitol ${stats.chapterHeaders}, numere singure ${stats.bareNumbers}, versete la început de paragraf ${stats.versesAtStart}, versete [n] ${stats.bracketVerses}, versete în interior ${stats.inlineVerses}, titluri de carte ${stats.bookTitles}, note ${stats.notes}`,
    '',
  ]
  if (!suggested.confident && !a.has('force')) {
    lines.push('Formatul nu a putut fi stabilit sigur; nu s-a scris nimic. Verifică manual un fișier și rulează cu `--verse-style=…` / `--bare-number-chapters` / `--force`.')
    console.error(lines.join('\n'))
    console.error(`\nRaport: ${writeReport('_raport-extragere.md', lines.join('\n'))}`)
    process.exit(1)
  }

  // 4. parsare + normalizare
  fs.mkdirSync(DATA_DIR, { recursive: true })
  let cedillas = 0, totalVerses = 0
  const allText: string[] = []
  const rows: string[] = ['| Carte | Capitole | Versete | Titluri/pericope | Note | Paragrafe unite | Probleme |', '|---|---:|---:|---:|---:|---:|---:|']
  const problems: string[] = []
  for (const book of BIBLE_BOOKS) {
    const list = bySlug.get(book.slug)
    if (!list || list.length !== 1) continue
    const r: ParseResult = parseBookText(book.slug, list[0].text, options)
    for (const ch of r.book.chapters) for (const v of ch.verses) {
      cedillas += countCedillas(v.text)
      v.text = normalizeVerseText(v.text)
      allText.push(v.text)
      totalVerses++
    }
    fs.writeFileSync(path.join(DATA_DIR, `${book.slug}.json`), JSON.stringify(r.book))
    rows.push(`| ${book.slug} | ${r.book.chapters.length} | ${r.book.chapters.reduce((n, c) => n + c.verses.length, 0)} | ${r.headings} | ${r.notes} | ${r.joined} | ${r.issues.length} |`)
    for (const i of r.issues) problems.push(`- ${book.slug}${i.chapter ? ` ${i.chapter}` : ''}${i.verse !== undefined ? `:${i.verse}` : ''} — ${i.kind}: ${i.detail}`)
  }
  const ortho = orthography(allText.join(' '))
  const biblio = frontMatter.split('\n').map(l => l.trim()).filter(l => l && l.length <= 200 && BIBLIO_RE.test(l)).slice(0, 20)

  lines.push(
    '## Cărți', '', ...rows, '',
    `Total versete: ${totalVerses}. Cărți lipsă: ${missing.length ? missing.join(', ') : '—'}. Cărți duble (nescrise): ${duplicates.length ? duplicates.join('; ') : '—'}.`,
    '',
    '## Numerotare de verificat (nu s-a reparat nimic)', '', ...(problems.length ? problems : ['—']), '',
    '## Normalizare și ortografie', '',
    `- Litere cu sedilă transformate în litere cu virgulă (ş ţ → ș ț): ${cedillas}`,
    `- Ortografie veche (sînt, cînd, pămînt…): ${ortho.vechi} · nouă (sunt, când, pământ…): ${ortho.nou}`,
    `- „â” în interiorul cuvântului: ${ortho.aInterior} · „î” în interiorul cuvântului: ${ortho.iInterior}`,
    '- Ortografia NU a fost schimbată. Modernizarea ar fi o decizie a lui Marin, într-un PR separat.',
    '',
    '## Date bibliografice găsite la început (de confirmat de Marin)', '',
    ...(biblio.length ? biblio.map(l => `- ${l}`) : ['- Nimic găsit. Care este ediția? Marin trebuie să confirme înainte de publicare.']),
    '',
  )
  const report = writeReport('_raport-extragere.md', lines.join('\n'))
  console.log(`Extras: ${BIBLE_BOOKS.length - missing.length - duplicates.length} cărți, ${totalVerses} versete → ${path.relative(process.cwd(), DATA_DIR)}/`)
  console.log(`Raport: ${report}`)
  console.log('Pasul următor: npm run bible:validate')
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1) })
