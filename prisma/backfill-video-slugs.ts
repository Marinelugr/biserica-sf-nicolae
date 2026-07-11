import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { slugify } from '../src/lib/utils'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>) {
  let slug = base || 'video'
  let n = 2
  while (await isTaken(slug)) {
    slug = `${base}-${n}`
    n++
  }
  return slug
}

async function backfillCategories() {
  const categories = (await prisma.videoCategory.findMany()).filter(c => !c.slug)
  for (const cat of categories) {
    const slug = await uniqueSlug(slugify(cat.name), async s => {
      const existing = await prisma.videoCategory.findUnique({ where: { slug: s } })
      return !!existing && existing.id !== cat.id
    })
    await prisma.videoCategory.update({ where: { id: cat.id }, data: { slug } })
    console.log(`VideoCategory ${cat.id}: ${cat.name} -> ${slug}`)
  }
}

async function backfillVideos() {
  const videos = (await prisma.video.findMany()).filter(v => !v.slug)
  for (const video of videos) {
    const slug = await uniqueSlug(slugify(video.title), async s => {
      const existing = await prisma.video.findUnique({ where: { slug: s } })
      return !!existing && existing.id !== video.id
    })
    await prisma.video.update({ where: { id: video.id }, data: { slug } })
    console.log(`Video ${video.id}: ${video.title} -> ${slug}`)
  }
}

async function main() {
  await backfillCategories()
  await backfillVideos()
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => pool.end())
