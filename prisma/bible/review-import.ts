/**
 * npm run bible:review-import -- --file backups/biblia-erori/de-verificat.csv
 *
 * Implicit doar PLANUL (dry-run), fără nicio scriere. Opțiuni:
 *   --offline                                 doar formatul fișierului, fără conexiune
 *   --apply                                   scrie
 *   --allow-remote --yes-host=<gazda exactă>  obligatorii pentru o bază care nu e pe localhost, chiar și în dry-run
 * Idempotent. Nu afișează text din versete: doar cifre, numere de rând și referințe.
 */
import fs from 'node:fs'
import path from 'node:path'
import { checkWriteAllowed, hostOf } from '../../src/lib/bible/importer'
import { applyImportPlan, loadImportPlan, parseAuditCsv, ReviewCsvError, type AuditRow, type ReviewImportDb } from '../../src/lib/bible/reviewCore'
import { args } from './_shared'

const SHOWN = 20

/** Acceptă și `--file cale`, nu doar `--file=cale`. */
function fileArg(): string | null {
  const a = args().get('file')
  if (typeof a === 'string') return a
  const i = process.argv.indexOf('--file')
  return i !== -1 ? process.argv[i + 1] ?? null : null
}

function summarize(rows: AuditRow[]) {
  const tally = (key: (r: AuditRow) => string) => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
    return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([k, n]) => `${k}=${n}`).join(' ')
  }
  console.log(`Rânduri valide: ${rows.length}`)
  console.log(`  detectoare: ${tally(r => r.detector)}`)
  console.log(`  încredere: ${tally(r => r.confidence)}`)
  console.log(`  cu propunere: ${rows.filter(r => r.suggestion).length}`)
}

function missingDatabase(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 'P2021'
}

async function main() {
  const a = args()
  const file = fileArg()
  if (!file) { console.error('Lipsește --file <fișier.csv>.'); process.exit(2) }
  const resolved = path.resolve(file)
  if (!fs.existsSync(resolved)) { console.error(`Fișierul nu există: ${file}`); process.exit(2) }

  const { rows, errors } = parseAuditCsv(fs.readFileSync(resolved, 'utf8'))
  summarize(rows)
  if (errors.length) {
    console.error(`Rânduri nevalide: ${errors.length}; importul refuzat. Primele:`)
    for (const e of errors.slice(0, SHOWN)) console.error(`  rândul ${e.line}: ${e.error}`)
    process.exitCode = 1
    return
  }
  if (a.has('offline')) { console.log('Fără conexiune: doar formatul a fost verificat.'); return }

  // Se decide înainte de orice conexiune: nici măcar citirile nu ajung singure la o bază la distanță.
  await import('dotenv/config')
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) { console.error('Lipsesc DIRECT_URL și DATABASE_URL. Pentru verificarea formatului: --offline.'); process.exitCode = 1; return }
  const host = hostOf(url)
  const guard = checkWriteAllowed(host, { allowRemote: a.has('allow-remote'), yesHost: typeof a.get('yes-host') === 'string' ? String(a.get('yes-host')) : undefined })
  if (!guard.ok) { console.error(guard.reason); process.exitCode = 1; return }

  const { connect } = await import('./_db')
  const { prisma } = connect()
  try {
    console.log(`Baza: gazda ${host}`)
    const db = prisma as unknown as ReviewImportDb
    const plan = await loadImportPlan(db, rows)
    console.log(`Plan: ${plan.create.length} de creat (${plan.createdStale} deja învechite) · ${plan.already} există deja · ${plan.duplicates} dublate în fișier · ${plan.staleIds.length} existente devin învechite · ${plan.missing.length} fără verset în bază`)
    for (const m of plan.missing.slice(0, SHOWN)) console.log(`  fără verset: ${m.ref} (rândul ${m.line})`)
    if (!a.has('apply')) { console.log('\nDRY-RUN: nimic nu s-a scris. Pentru scriere adaugă --apply.'); return }
    const { created, staled } = await applyImportPlan(db, plan)
    console.log(`Import încheiat: ${created} create, ${staled} marcate învechite.`)
  } catch (err) {
    if (missingDatabase(err)) { console.error('Tabelele cozii nu există; aplică întâi SQL-ul schemei.'); process.exitCode = 1; return }
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  if (err instanceof ReviewCsvError) { console.error(err.message); process.exit(1) }
  // doar ultima linie și fără conținut de rând: mesajele Prisma pot conține text
  console.error(err instanceof Error ? err.name : 'Eroare necunoscută')
  process.exit(1)
})
