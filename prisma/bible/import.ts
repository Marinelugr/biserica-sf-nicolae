/**
 * npm run bible:import — bible-data/*.json → baza de date.
 *
 * Implicit doar PLANUL (dry-run), fără nicio scriere. Opțiuni:
 *   --apply                       scrie
 *   --allow-remote --yes-host=<gazda exactă>   obligatorii pentru o bază care nu e pe localhost
 *   --only=<slug,slug>            doar aceste cărți
 *   --replace-book=<slug>         șterge și reimportă o carte care există deja (refuză dacă are modificări din Admin)
 *   --force-overwrite-edits       permite --replace-book peste modificările din Admin (după export în bible-data/)
 *   --offline                     doar planul, fără conexiune (ca și cum baza ar fi goală)
 * Rulează validatorul întâi și refuză dacă sunt probleme blocante.
 */
import { applyPlan, checkWriteAllowed, existingChapters, planImport, replaceRefusal, type ImportPlan } from '../../src/lib/bible/importer'
import { formatIssue } from '../../src/lib/bible/validate'
import { args } from './_shared'
import { runValidation } from './validate'

function printPlan(plan: ImportPlan) {
  for (const i of plan.items) {
    const mark = i.action === 'create' ? '+ nouă   ' : i.action === 'replace' ? '↻ înlocuit' : '= omisă  '
    console.log(`  ${mark} ${i.slug.padEnd(28)} ${String(i.chapters).padStart(3)} capitole ${String(i.verses).padStart(5)} versete${i.existing ? ` (în bază: ${i.existing} capitole)` : ''}`)
  }
  console.log(`Plan: ${plan.create} cărți noi, ${plan.replace} înlocuite, ${plan.skip} omise · de creat ${plan.chapters} capitole și ${plan.verses} versete`)
}

async function main() {
  const a = args()
  const only = typeof a.get('only') === 'string' ? String(a.get('only')).split(',').map(s => s.trim()).filter(Boolean) : undefined
  const replaceBook = typeof a.get('replace-book') === 'string' ? String(a.get('replace-book')) : undefined
  const forceOverwriteEdits = a.has('force-overwrite-edits')

  const { books, result } = runValidation()
  if (!books.length) { console.error('Nu există date în bible-data/. Rulează întâi: npm run bible:extract'); process.exit(2) }
  if (result.blocking.length) {
    console.error(`Validarea are ${result.blocking.length} probleme blocante — importul refuzat:`)
    for (const i of result.blocking.slice(0, 20)) console.error('  ' + formatIssue(i))
    console.error('Detalii: npm run bible:validate')
    process.exit(1)
  }
  if (replaceBook && !books.some(b => b.slug === replaceBook)) { console.error(`--replace-book: „${replaceBook}" nu e în bible-data/`); process.exit(1) }

  if (a.has('offline')) {
    console.log('Fără conexiune: plan față de o bază goală.')
    printPlan(planImport(books, new Map(), { only, replaceBook }))
    return
  }

  const { connect, describeDb, printDb } = await import('./_db')
  const { prisma, db, host, source } = connect()
  try {
    printDb(host, source, await describeDb(prisma))
    const plan = planImport(books, await existingChapters(db), { only, replaceBook })
    printPlan(plan)
    if (replaceBook) {
      const refusal = await replaceRefusal(db, replaceBook, forceOverwriteEdits)
      if (refusal) { console.error(refusal); process.exitCode = 1; return }
    }
    if (!a.has('apply')) { console.log('\nDRY-RUN: nimic nu s-a scris. Pentru scriere adaugă --apply.'); return }

    const guard = checkWriteAllowed(host, { allowRemote: a.has('allow-remote'), yesHost: typeof a.get('yes-host') === 'string' ? String(a.get('yes-host')) : undefined })
    if (!guard.ok) { console.error(guard.reason); process.exitCode = 1; return }

    const errors = await applyPlan(db, books, plan, line => console.log('  ' + line), undefined, { forceOverwriteEdits })
    if (errors.length) { for (const e of errors) console.error('EROARE: ' + e); process.exitCode = 1; return }
    printDb(host, source, await describeDb(prisma))
    console.log('Import încheiat și verificat (capitole și versete = JSON).')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => { console.error((err instanceof Error ? err.message : String(err)).split('\n').filter(Boolean).pop()); process.exit(1) })
