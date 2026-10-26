/**
 * npm run bible:wipe — șterge DOAR rândurile din BibleBook / BibleChapter / BibleVerse (rollback).
 * Fără --apply doar arată ce ar șterge. Aceeași gardă de gazdă ca la import
 * (--allow-remote --yes-host=<gazda>) și confirmare tastată: STERGE BIBLIA
 */
import readline from 'node:readline/promises'
import { checkWriteAllowed, wipeBible } from '../../src/lib/bible/importer'
import { args } from './_shared'
import { connect, describeDb, printDb } from './_db'

export const CONFIRM_TEXT = 'STERGE BIBLIA'

async function main() {
  const a = args()
  const { prisma, db, host, source } = connect()
  try {
    printDb(host, source, await describeDb(prisma))
    if (!a.has('apply')) { console.log('DRY-RUN: nimic nu s-a șters. Pentru ștergere: --apply'); return }
    const guard = checkWriteAllowed(host, { allowRemote: a.has('allow-remote'), yesHost: typeof a.get('yes-host') === 'string' ? String(a.get('yes-host')) : undefined })
    if (!guard.ok) { console.error(guard.reason); process.exitCode = 1; return }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const typed = (await rl.question(`Se șterge TOATĂ Biblia din baza de pe ${host}. Tastează „${CONFIRM_TEXT}" ca să continui: `)).trim()
    rl.close()
    if (typed !== CONFIRM_TEXT) { console.error('Confirmare greșită — nimic nu s-a șters.'); process.exitCode = 1; return }
    const r = await wipeBible(db)
    console.log(`Șters: ${r.books} cărți, ${r.chapters} capitole, ${r.verses} versete. Restul bazei e neatins.`)
    printDb(host, source, await describeDb(prisma))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => { console.error((err instanceof Error ? err.message : String(err)).split('\n').filter(Boolean).pop()); process.exit(1) })
