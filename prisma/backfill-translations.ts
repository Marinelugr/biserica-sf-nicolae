import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { translateText } from '../src/lib/deepl'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DELAY_MS = 300
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fillPair(ro: string | null | undefined, ru: string | null | undefined, en: string | null | undefined) {
  const out: { ru?: string; en?: string } = {}
  if (ro && ro.trim() && !ru) {
    out.ru = await translateText(ro, 'RU')
    await sleep(DELAY_MS)
  }
  if (ro && ro.trim() && !en) {
    out.en = await translateText(ro, 'EN-GB')
    await sleep(DELAY_MS)
  }
  return out
}

async function backfillLibraryBooks() {
  const books = await prisma.libraryBook.findMany({
    where: { OR: [{ titleRu: null }, { titleEn: null }, { contentRu: null }, { contentEn: null }] },
  })
  for (const b of books) {
    const title = await fillPair(b.titleRo, b.titleRu, b.titleEn)
    const content = await fillPair(b.contentRo, b.contentRu, b.contentEn)
    if (Object.keys(title).length || Object.keys(content).length) {
      await prisma.libraryBook.update({
        where: { id: b.id },
        data: {
          ...(title.ru && { titleRu: title.ru }), ...(title.en && { titleEn: title.en }),
          ...(content.ru && { contentRu: content.ru }), ...(content.en && { contentEn: content.en }),
        },
      })
      console.log(`  ✓ LibraryBook: ${b.titleRo}`)
    }
  }
}

async function backfillArticles() {
  const articles = await prisma.article.findMany({
    where: { OR: [{ titleRu: null }, { titleEn: null }, { contentRu: null }, { contentEn: null }] },
  })
  for (const a of articles) {
    const title = await fillPair(a.titleRo, a.titleRu, a.titleEn)
    const content = await fillPair(a.contentRo, a.contentRu, a.contentEn)
    if (Object.keys(title).length || Object.keys(content).length) {
      await prisma.article.update({
        where: { id: a.id },
        data: {
          ...(title.ru && { titleRu: title.ru }), ...(title.en && { titleEn: title.en }),
          ...(content.ru && { contentRu: content.ru }), ...(content.en && { contentEn: content.en }),
        },
      })
      console.log(`  ✓ Article: ${a.titleRo}`)
    }
  }
}

async function backfillSaints() {
  const saints = await prisma.saint.findMany({
    where: { OR: [{ nameRu: null }, { nameEn: null }, { AND: [{ lifeRo: { not: null } }, { OR: [{ lifeRu: null }, { lifeEn: null }] }] }] },
  })
  for (const s of saints) {
    const name = await fillPair(s.nameRo, s.nameRu, s.nameEn)
    const life = await fillPair(s.lifeRo, s.lifeRu, s.lifeEn)
    if (Object.keys(name).length || Object.keys(life).length) {
      await prisma.saint.update({
        where: { id: s.id },
        data: {
          ...(name.ru && { nameRu: name.ru }), ...(name.en && { nameEn: name.en }),
          ...(life.ru && { lifeRu: life.ru }), ...(life.en && { lifeEn: life.en }),
        },
      })
      console.log(`  ✓ Saint: ${s.nameRo}`)
    }
  }
}

async function backfillPriest() {
  const priest = await prisma.priest.findFirst()
  if (!priest) return
  const name = await fillPair(priest.nameRo, priest.nameRu, priest.nameEn)
  const title = await fillPair(priest.titleRo, priest.titleRu, priest.titleEn)
  const bio = await fillPair(priest.bioRo, priest.bioRu, priest.bioEn)
  const ordained = await fillPair(priest.ordained, priest.ordainedRu, priest.ordainedEn)
  const parish = await fillPair(priest.parish, priest.parishRu, priest.parishEn)
  const education = await fillPair(priest.education, priest.educationRu, priest.educationEn)
  const data = {
    ...(name.ru && { nameRu: name.ru }), ...(name.en && { nameEn: name.en }),
    ...(title.ru && { titleRu: title.ru }), ...(title.en && { titleEn: title.en }),
    ...(bio.ru && { bioRu: bio.ru }), ...(bio.en && { bioEn: bio.en }),
    ...(ordained.ru && { ordainedRu: ordained.ru }), ...(ordained.en && { ordainedEn: ordained.en }),
    ...(parish.ru && { parishRu: parish.ru }), ...(parish.en && { parishEn: parish.en }),
    ...(education.ru && { educationRu: education.ru }), ...(education.en && { educationEn: education.en }),
  }
  if (Object.keys(data).length) {
    await prisma.priest.update({ where: { id: priest.id }, data })
    console.log(`  ✓ Priest: ${priest.nameRo}`)
  }
}

async function backfillDonationProjects() {
  const projects = await prisma.donationProject.findMany({
    where: { OR: [{ titleRu: null }, { titleEn: null }, { descriptionRu: null }, { descriptionEn: null }] },
  })
  for (const p of projects) {
    const title = await fillPair(p.titleRo, p.titleRu, p.titleEn)
    const description = await fillPair(p.descriptionRo, p.descriptionRu, p.descriptionEn)
    if (Object.keys(title).length || Object.keys(description).length) {
      await prisma.donationProject.update({
        where: { id: p.id },
        data: {
          ...(title.ru && { titleRu: title.ru }), ...(title.en && { titleEn: title.en }),
          ...(description.ru && { descriptionRu: description.ru }), ...(description.en && { descriptionEn: description.en }),
        },
      })
      console.log(`  ✓ DonationProject: ${p.titleRo}`)
    }
  }
}

async function backfillDonationConfig() {
  const config = await prisma.donationConfig.findFirst()
  if (!config) return
  const safetyNote = await fillPair(config.safetyNote, config.safetyNoteRu, config.safetyNoteEn)
  const contactName = await fillPair(config.contactName, config.contactNameRu, config.contactNameEn)
  const data = {
    ...(safetyNote.ru && { safetyNoteRu: safetyNote.ru }), ...(safetyNote.en && { safetyNoteEn: safetyNote.en }),
    ...(contactName.ru && { contactNameRu: contactName.ru }), ...(contactName.en && { contactNameEn: contactName.en }),
  }
  if (Object.keys(data).length) {
    await prisma.donationConfig.update({ where: { id: config.id }, data })
    console.log('  ✓ DonationConfig')
  }
}

async function backfillChurchHistorySetting() {
  const setting = await prisma.setting.findUnique({ where: { key: 'church_history_content' } })
  if (!setting) return
  const data = JSON.parse(setting.value)
  const contentRo: string = data.contentRo ?? data.content ?? ''
  const content = await fillPair(contentRo, data.contentRu, data.contentEn)
  if (Object.keys(content).length) {
    const updated = { ...data, contentRo, contentRu: data.contentRu ?? content.ru ?? null, contentEn: data.contentEn ?? content.en ?? null }
    await prisma.setting.update({ where: { key: 'church_history_content' }, data: { value: JSON.stringify(updated) } })
    console.log('  ✓ Setting: church_history_content')
  }
}

async function backfillSaintNicholasSetting() {
  const setting = await prisma.setting.findUnique({ where: { key: 'saint_nicholas_content' } })
  if (!setting) return
  const data = JSON.parse(setting.value)
  const fields: [string, string][] = [
    ['life', 'life'], ['tropar', 'tropar'], ['condac', 'condac'],
    ['feast1', 'feast1'], ['feast1Desc', 'feast1Desc'],
    ['feast2', 'feast2'], ['feast2Desc', 'feast2Desc'],
  ]
  const updated = { ...data }
  let changed = false
  for (const [baseKeyOld, baseKey] of fields) {
    const ro: string = data[`${baseKey}Ro`] ?? data[baseKeyOld] ?? ''
    const ru = data[`${baseKey}Ru`]
    const en = data[`${baseKey}En`]
    const result = await fillPair(ro, ru, en)
    if (result.ru || result.en) {
      updated[`${baseKey}Ro`] = ro
      if (result.ru) updated[`${baseKey}Ru`] = result.ru
      if (result.en) updated[`${baseKey}En`] = result.en
      changed = true
    }
  }
  if (changed) {
    await prisma.setting.update({ where: { key: 'saint_nicholas_content' }, data: { value: JSON.stringify(updated) } })
    console.log('  ✓ Setting: saint_nicholas_content')
  }
}

async function main() {
  console.log('🌐 Completare traduceri lipsă (RU/EN) via DeepL...\n')

  console.log('📖 Cărți...')
  await backfillLibraryBooks()

  console.log('📰 Articole...')
  await backfillArticles()

  console.log('👤 Sfinți...')
  await backfillSaints()

  console.log('⛪ Preot paroh...')
  await backfillPriest()

  console.log('💰 Proiecte de donații...')
  await backfillDonationProjects()

  console.log('💳 Configurare donații...')
  await backfillDonationConfig()

  console.log('🏛️ Istoria bisericii...')
  await backfillChurchHistorySetting()

  console.log('✦ Sfântul Nicolae...')
  await backfillSaintNicholasSetting()

  console.log('\n✅ Backfill complet!')
}

main()
  .catch(e => {
    console.error('❌ Eroare la backfill:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
