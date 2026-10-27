// Conexiunea scripturilor Bibliei: DIRECT_URL (sesiune, nu pooler) sau DATABASE_URL, din .env prin dotenv.
// Se afișează DOAR numele gazdei și cifre — niciodată URL-ul sau parola.
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hostOf, type BibleDb } from '../../src/lib/bible/importer'

export function connect() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) throw new Error('Lipsesc DIRECT_URL și DATABASE_URL.')
  const pool = new Pool({ connectionString: url, max: 2 })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  return { prisma, db: prisma as unknown as BibleDb, host: hostOf(url), source: process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL' }
}

/** Doar interogări de citire, doar cifre: ce bază e (ca dovadă că e baza reală a site-ului). */
export async function describeDb(prisma: PrismaClient) {
  const [books, chapters, verses, articles, videos, settings, size] = await Promise.all([
    prisma.bibleBook.count(), prisma.bibleChapter.count(), prisma.bibleVerse.count(),
    prisma.article.count(), prisma.video.count(), prisma.setting.count(),
    prisma.$queryRaw<{ mb: number }[]>`SELECT round(pg_database_size(current_database()) / 1048576.0)::int AS mb`,
  ])
  return { books, chapters, verses, articles, videos, settings, mb: size[0]?.mb ?? 0 }
}

export function printDb(host: string, source: string, d: Awaited<ReturnType<typeof describeDb>>) {
  console.log(`Baza: gazda ${host} (din ${source}), ${d.mb} MB`)
  console.log(`  Biblia: ${d.books} cărți, ${d.chapters} capitole, ${d.verses} versete`)
  console.log(`  Restul site-ului: ${d.articles} articole, ${d.videos} video, ${d.settings} setări`)
}
