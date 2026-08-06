import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { preiaZi, slugSfant } from '../src/lib/sfinti-scraper'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const an = new Date().getFullYear()
  const start = new Date(an, 0, 1)
  const zileInAn = (an % 4 === 0 && (an % 100 !== 0 || an % 400 === 0)) ? 366 : 365

  let create = 0, skip = 0
  for (let i = 0; i < zileInAn; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const zi = d.getDate(), luna = d.getMonth() + 1

    const sfinti = await preiaZi(zi, luna, an)
    for (const s of sfinti) {
      const slug = slugSfant(s.text, luna, zi)
      if (await prisma.saint.findUnique({ where: { slug } })) { skip++; continue }
      await prisma.saint.create({
        data: { month: luna, day: zi, nameRo: s.text, slug, feastType: s.praznic ? 'praznic' : null },
      })
      create++
    }
    console.log(`${luna}/${zi}: ${sfinti.length} sfinți (${i + 1}/${zileInAn})`)
    await new Promise(r => setTimeout(r, 400)) // pauză politicoasă
  }
  console.log(`\nGata: ${create} adăugați, ${skip} deja existenți.`)
}

main()
  .catch(e => {
    console.error('❌ Eroare la backfill:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
