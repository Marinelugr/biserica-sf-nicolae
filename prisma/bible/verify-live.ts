/**
 * npm run bible:verify-live — după deploy și import: descarcă prin HTTPS capitole de pe
 * site (primul din fiecare carte + 40 aleatoare, cel mult 130 de cereri, pauză 500 ms)
 * și compară numărul de versete cu bible-data/*.json, titlul și nota sursei.
 * Nu rulează automat nicăieri. --base=<adresă> pentru alt site (implicit https://parintelemarin.com).
 */
import { BIBLE_SOURCE_NOTE } from '../../src/lib/bible/source'
import { checkChapterHtml, pickTargets } from '../../src/lib/bible/verifyLive'
import { args, loadBooks, writeReport } from './_shared'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  const a = args()
  const base = String(typeof a.get('base') === 'string' ? a.get('base') : 'https://parintelemarin.com').replace(/\/$/, '')
  const books = loadBooks()
  if (!books.length) { console.error('Nu există bible-data/. Rulează întâi: npm run bible:extract'); process.exit(2) }
  const targets = pickTargets(books)
  const problems: string[] = []
  let i = 0
  for (const t of targets) {
    i++
    const url = `${base}/biblie/${t.slug}/${t.chapter}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'parintelemarin-bible-verify/1.0 (verificare dupa import)' }, redirect: 'manual' })
      if (res.status !== 200) problems.push(`${t.slug} ${t.chapter}: status ${res.status}`)
      else for (const p of checkChapterHtml(await res.text(), t, { titleIncludes: 'Biblia Ortodoxă', sourceNote: BIBLE_SOURCE_NOTE })) problems.push(`${t.slug} ${t.chapter}: ${p}`)
    } catch (err) {
      problems.push(`${t.slug} ${t.chapter}: ${err instanceof Error ? err.message : String(err)}`)
    }
    if (i % 10 === 0) console.log(`  ${i}/${targets.length}`)
    await sleep(500)
  }
  const report = writeReport('_raport-verificare-live.md', [
    `# Verificare live — ${base} — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, '',
    `${targets.length} capitole verificate, ${problems.length} probleme.`, '',
    ...(problems.length ? problems.map(p => `- ${p}`) : ['Totul în regulă.']), '',
  ].join('\n'))
  console.log(`${targets.length} capitole · ${problems.length} probleme · raport: ${report}`)
  if (problems.length) process.exit(1)
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1) })
