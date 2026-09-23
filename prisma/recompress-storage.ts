import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { processImageBuffer } from '../src/lib/imageProcessorServer'

// Recomprimă retroactiv pozele deja urcate în Storage, pentru galeriile de
// articole/sfinți (MediaItem) și cărți (LibraryBook.imageUrl/galleryUrls).
// Rulează prin ACEEAȘI funcție de procesare ca upload-urile noi
// (src/lib/imageProcessorServer.ts), deci "pragul" de recompresie e simplu:
// dacă reprocesarea dă un fișier mai mic, îl scrie; dacă nu, îl lasă (deja
// optimizat sau format needecodabil de sharp).
//
// Fișierul e suprascris LA ACELAȘI PATH din Storage (upsert), deci URL-urile
// din DB rămân identice — nu e nevoie de niciun UPDATE în baza de date.
//
// Utilizare:
//   npm run db:recompress-images -- --dry-run
//   npm run db:recompress-images -- --dry-run --entity-type=article --entity-id=cmua8bzru000004jp4lj4bq48
//   npm run db:recompress-images -- --entity-type=article --entity-id=cmua8bzru000004jp4lj4bq48
//   npm run db:recompress-images                                   # tot (articole + sfinți + cărți), scriere reală

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BUCKET = 'images'
const PUBLIC_PREFIX_RE = /^https:\/\/[^/]+\/storage\/v1\/object\/public\/images\//

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface Target {
  label: string
  url: string
}

interface Filter {
  entityType: string
  entityId: string
}

function pathFromUrl(url: string): string | null {
  const m = url.match(PUBLIC_PREFIX_RE)
  if (!m) return null
  return url.slice(m[0].length)
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif',
  }
  return map[ext || ''] || 'application/octet-stream'
}

async function collectTargets(filter?: Filter): Promise<Target[]> {
  const targets: Target[] = []

  if (!filter || filter.entityType === 'article' || filter.entityType === 'saint') {
    const where = filter
      ? { entityType: filter.entityType, entityId: filter.entityId }
      : { entityType: { in: ['article', 'saint'] } }
    const media = await prisma.mediaItem.findMany({ where, orderBy: { createdAt: 'asc' } })
    for (const m of media) {
      targets.push({ label: `MediaItem ${m.id} (${m.entityType}/${m.entityId}) imagine`, url: m.url })
      if (m.thumbnailUrl) targets.push({ label: `MediaItem ${m.id} (${m.entityType}/${m.entityId}) thumbnail`, url: m.thumbnailUrl })
    }
  }

  if (!filter || filter.entityType === 'book') {
    const where = filter && filter.entityType === 'book' ? { id: filter.entityId } : {}
    const books = await prisma.libraryBook.findMany({ where })
    for (const b of books) {
      if (b.imageUrl) targets.push({ label: `LibraryBook ${b.id} (${b.titleRo}) copertă`, url: b.imageUrl })
      b.galleryUrls.forEach((u, i) => {
        targets.push({ label: `LibraryBook ${b.id} (${b.titleRo}) galerie[${i}]`, url: u })
      })
    }
  }

  return targets
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const entityType = args.find(a => a.startsWith('--entity-type='))?.split('=')[1]
  const entityId = args.find(a => a.startsWith('--entity-id='))?.split('=')[1]
  const filter: Filter | undefined = entityType && entityId ? { entityType, entityId } : undefined

  if ((entityType && !entityId) || (!entityType && entityId)) {
    console.error('❌ --entity-type și --entity-id trebuie folosite împreună.')
    process.exit(1)
  }

  console.log(`\n🖼  Recompresie storage — mod: ${dryRun ? 'DRY-RUN (doar raport, nu scrie nimic)' : 'REAL (suprascrie în Storage)'}`)
  if (filter) console.log(`   filtrat pe: ${filter.entityType} / ${filter.entityId}`)
  console.log('')

  const targets = await collectTargets(filter)
  console.log(`Găsite ${targets.length} referințe de imagine de verificat.\n`)

  const seenPaths = new Set<string>()
  let scanned = 0, optimizedCount = 0, skippedAlready = 0, errors = 0, unresolvable = 0
  let totalBefore = 0, totalAfter = 0

  for (const t of targets) {
    const path = pathFromUrl(t.url)
    if (!path) {
      unresolvable++
      console.log(`⚠️  ${t.label}: URL neresolvabil (nu pare din bucket-ul 'images'), sar peste — ${t.url}`)
      continue
    }
    if (seenPaths.has(path)) continue // aceeași poză referențiată de mai multe ori (ex. copertă = prima poză din galerie)
    seenPaths.add(path)
    scanned++

    try {
      const { data: fileBlob, error: dlErr } = await supabase.storage.from(BUCKET).download(path)
      if (dlErr || !fileBlob) {
        errors++
        console.log(`❌ ${t.label}: eroare la descărcare (${dlErr?.message}) — ${path}`)
        continue
      }
      const inputBuffer = Buffer.from(await fileBlob.arrayBuffer())
      const contentType = fileBlob.type || guessContentType(path)

      const result = await processImageBuffer(inputBuffer, contentType)

      if (!result.wasOptimized) {
        skippedAlready++
        console.log(`✓  ${t.label}: deja optimizat (${formatBytes(inputBuffer.length)}) — ${path}`)
        continue
      }

      const pct = Math.round((1 - result.finalSize / result.originalSize) * 100)

      if (dryRun) {
        optimizedCount++
        totalBefore += result.originalSize
        totalAfter += result.finalSize
        console.log(`↓  ${t.label}: ${formatBytes(result.originalSize)} → ~${formatBytes(result.finalSize)} (−${pct}%) [DRY-RUN, neschimbat] — ${path}`)
      } else {
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, result.buffer, {
          contentType: result.contentType,
          upsert: true,
          cacheControl: '31536000',
        })
        if (upErr) {
          errors++
          console.log(`❌ ${t.label}: eroare la reupload (${upErr.message}) — ${path}`)
          continue
        }
        optimizedCount++
        totalBefore += result.originalSize
        totalAfter += result.finalSize
        console.log(`✅ ${t.label}: ${formatBytes(result.originalSize)} → ${formatBytes(result.finalSize)} (−${pct}%) — ${path}`)
      }
    } catch (e) {
      errors++
      console.log(`❌ ${t.label}: eroare neașteptată (${(e as Error).message}) — ${path}`)
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Scanate: ${scanned} fișiere unice (din ${targets.length} referințe în DB)`)
  console.log(`${dryRun ? 'Ar fi optimizate' : 'Optimizate'}: ${optimizedCount}`)
  console.log(`Deja optimizate (sărite): ${skippedAlready}`)
  console.log(`URL-uri neresolvabile: ${unresolvable}`)
  console.log(`Erori: ${errors}`)
  if (optimizedCount > 0) {
    console.log(`\nSpațiu ${dryRun ? 'ce ar fi ' : ''}recuperat: ${formatBytes(totalBefore - totalAfter)}  (${formatBytes(totalBefore)} → ${formatBytes(totalAfter)})`)
  }
  console.log('')
}

main()
  .catch(e => { console.error('❌ Eroare fatală:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
