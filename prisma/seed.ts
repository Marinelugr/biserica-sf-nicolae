import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Rugăciuni ────────────────────────────────────────────────────────────────
  await prisma.prayer.upsert({
    where: { slug: 'rugaciunea-diminetii' },
    update: {},
    create: {
      slug: 'rugaciunea-diminetii',
      titleRo: 'Rugăciunea dimineții',
      type: 'RUGACIUNE_ZILEI',
      textRo: `Doamne Iisuse Hristoase, Fiul lui Dumnezeu, miluiește-mă pe mine păcătosul.

Sculându-mă din somn, aduc Ție, Treime Sfântă, cântare de mulțumire: că m-ai învrednicit a mă scula din somnul cel de moarte; iar acum, văzând lumina cea simțită, doresc a vedea și lumina cea duhovnicească, a feței Tale.

Miluiește-mă pe mine, Cel ce ești mare și fără de păcate, lumina ochilor mei, și dă-mi, Doamne, harul Tău!`,
      author: 'Tradiție ortodoxă',
    },
  })

  await prisma.prayer.upsert({
    where: { slug: 'acatistul-sfantului-nicolae' },
    update: {},
    create: {
      slug: 'acatistul-sfantului-nicolae',
      titleRo: 'Acatistul Sfântului Ierarh Nicolae',
      type: 'ACATIST',
      textRo: `Condacul 1

Apărătorule cel ales al lui Hristos și mijlocitorule prea minunat, cel ce izvorăști daruri și minuni lumii, laudă îți aducem ție, sfinte Nicolae, că de greutăți și nevoi ne izbăvești pe noi, cei ce cu dragoste strigăm: Bucură-te, Sfinte Nicolae, mare făcătorule de minuni!

Icosul 1

Înger în trup ai arătat viața ta pe pământ, Sfinte Ierarhe Nicolae, că depărtând de la tine toate patimile trupului, prin fapte bune te-ai împodobit, îmbrăcându-te în armele dreptății. De aceea îți strigăm:

Bucură-te, mlădița cea prea roditoare a raiului!
Bucură-te, floarea cea cu bun miros a Mirelor Lichiei!
Bucură-te, că din pântecele maicii tale te-ai sfințit!
Bucură-te, că din botez plin de har te-ai arătat!`,
      author: 'Tradiție ortodoxă',
    },
  })

  await prisma.prayer.upsert({
    where: { slug: 'rugaciunea-seara' },
    update: {},
    create: {
      slug: 'rugaciunea-seara',
      titleRo: 'Rugăciunea de seară',
      type: 'RUGACIUNE',
      textRo: `Doamne, Dumnezeul nostru, Care ai iertat pe Petru și pe desfrânată, numai prin lacrimile lor, și ai primit mărturisirea vameșului, numai cu suspine, primește și mărturisirea mea: ca un iubitor de oameni, nu-mi lua nădejdea de mântuire, că mare este mulțimea păcatelor mele.

Miluiește-mă pe mine, Dumnezeule, după mare mila Ta, și după mulțimea îndurărilor Tale, șterge fărădelegea mea.`,
      author: 'Tradiție ortodoxă',
    },
  })

  // ─── Cărți ───────────────────────────────────────────────────────────────────
  await prisma.libraryBook.upsert({
    where: { slug: 'acatistul-sfantului-nicolae-mare' },
    update: {},
    create: {
      slug: 'acatistul-sfantului-nicolae-mare',
      titleRo: 'Acatistul Sfântului Ierarh Nicolae cel Mare',
      type: 'ACATIST',
      contentRo: `Acatistul Sfântului Ierarh Nicolae cel Mare, Arhiepiscopul Mirelor Lichiei, Făcătorul de Minuni se citește pe 19 decembrie (stil vechi) și pe 22 mai (transferarea moaștelor).

[Text complet disponibil în curând]`,
      author: 'Tradiție ortodoxă',
      source: 'Mineiul pe Decembrie',
    },
  })

  await prisma.libraryBook.upsert({
    where: { slug: 'canonul-de-pocainta' },
    update: {},
    create: {
      slug: 'canonul-de-pocainta',
      titleRo: 'Canonul de pocăință al Domnului Iisus Hristos',
      type: 'CANON',
      contentRo: `Canonul de pocăință se citește în cadrul Paraclisului sau dimineața înainte de Sfânta Liturghie.

Peasna 1, glasul al 6-lea: Irmos — Ca pe uscat umblând Israel...

[Text complet disponibil în curând]`,
      author: 'Tradiție ortodoxă',
    },
  })

  await prisma.libraryBook.upsert({
    where: { slug: 'rugaciunile-diminetii-complete' },
    update: {},
    create: {
      slug: 'rugaciunile-diminetii-complete',
      titleRo: 'Rugăciunile dimineții (Ceaslov)',
      type: 'RUGACIUNE',
      contentRo: `Rugăciunile dimineții se citesc imediat după sculare, înainte de a mânca sau bea orice.

În numele Tatălui și al Fiului și al Sfântului Duh. Amin.
Slavă Ție, Dumnezeul nostru, slavă Ție!

Împărate ceresc, Mângâietorule, Duhul adevărului, Care pretutindeni ești și toate le plinești, Vistierul bunătăților și Dătătorule de viață, vino și Te sălășluiește întru noi, și ne curățește pe noi de toată întinăciunea și mântuiește, Bunule, sufletele noastre.

[Text complet disponibil în curând]`,
      author: 'Tradiție ortodoxă',
      source: 'Ceaslov',
    },
  })

  // ─── Articole ────────────────────────────────────────────────────────────────
  await prisma.article.upsert({
    where: { slug: 'sfantul-ierarh-nicolae-viata-si-minuni' },
    update: {},
    create: {
      slug: 'sfantul-ierarh-nicolae-viata-si-minuni',
      titleRo: 'Sfântul Ierarh Nicolae — Viața și minunile ocrotitorului nostru',
      contentRo: `Sfântul Ierarh Nicolae, Arhiepiscopul Mirelor Lichiei, s-a născut în orașul Patara din Licia (Asia Mică) în jurul anului 270 d.Hr. Părinții lui, Teofan și Nona, erau oameni credincioși și cu stare materială bună.

De mic copil, Sfântul Nicolae a arătat o evlavie deosebită față de Dumnezeu. Se povestește că în primele zile după naștere, el stătea singur în cadă, în picioare, timp de trei ore, în cinstea Sfintei Treimi.

**Episcop al Mirelor**

La vârsta maturității, Sfântul Nicolae a fost ales episcop al orașului Mire din Licia, unde a păstorit cu multă dragoste și înțelepciune. El este cunoscut ca apărătorul celor nedreptățiți, ajutătorul celor săraci și protectorul copiilor.

**Minunile Sfântului Nicolae**

Printre cele mai cunoscute minuni ale sale se numără:
- Salvarea a trei fecioare sărace de la robie, prin dăruirea în taină a trei pungi cu aur
- Liniștirea furtunii pe mare și salvarea corăbierilor
- Învierea unui tânăr mort
- Salvarea a trei generali nevinovați de la execuție

Sfântul Nicolae a adormit întru Domnul la 19 decembrie 342 d.Hr. Moaștele sale se găsesc în prezent la Bari, Italia, unde au fost aduse în 1087.`,
      category: 'Sfinți',
      published: true,
      publishedAt: new Date('2024-12-19'),
      metaDescRo: 'Viața și minunile Sfântului Ierarh Nicolae, ocrotitorul Parohiei din Hîrtopul Mic.',
    },
  })

  await prisma.article.upsert({
    where: { slug: 'sarbatoarea-sfantului-nicolae-2024' },
    update: {},
    create: {
      slug: 'sarbatoarea-sfantului-nicolae-2024',
      titleRo: 'Hramul Parohiei — Sfântul Ierarh Nicolae 2024',
      contentRo: `Cu bucurie duhovnicească, comunitatea parohiei noastre a sărbătorit și în acest an Hramul Sfântul Ierarh Nicolae.

Sfânta Liturghie a fost săvârșită cu solemnitate, iar credincioșii din sat și din împrejurimi s-au adunat cu evlavie să cinstească memoria marelui făcător de minuni.

Mulțumim tuturor celor care au contribuit la frumusețea acestei sărbători și ne rugăm ca Sfântul Nicolae să fie mijlocitor pentru noi toți înaintea lui Dumnezeu!`,
      category: 'Evenimente',
      published: true,
      publishedAt: new Date('2024-12-19'),
      metaDescRo: 'Hramul Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, 2024.',
    },
  })

  await prisma.article.upsert({
    where: { slug: 'postul-craciunului-2024' },
    update: {},
    create: {
      slug: 'postul-craciunului-2024',
      titleRo: 'Postul Crăciunului — Sfaturi duhovnicești',
      contentRo: `Postul Nașterii Domnului (Crăciunului) începe pe 15 noiembrie și durează 40 de zile, până pe 25 decembrie.

**Ce înseamnă postul?**

Postul nu înseamnă doar abținerea de la anumite alimente, ci în primul rând o intensificare a vieții duhovnicești: rugăciune mai deasă, citire din Sfânta Scriptură și din cărțile sfinților, spovedanie și Sfânta Împărtășanie.

**Cum ne pregătim?**

- Citim în fiecare zi câteva pagini din Biblie sau din viețile sfinților
- Mergem la slujbele de miercuri și vineri
- Ne spovedim și ne împărtășim cel puțin o dată în post
- Ajutăm pe cei nevoiași din jurul nostru
- Evităm certurile, vorbele de prisos și petrecerile zgomotoase

Dumnezeu să ne ajute să petrecem acest post cu folos duhovnicesc!`,
      category: 'Duhovnicesc',
      published: true,
      publishedAt: new Date('2024-11-15'),
      metaDescRo: 'Sfaturi duhovnicești pentru Postul Crăciunului 2024.',
    },
  })

  // ─── Sfinți (câțiva pentru demo) ────────────────────────────────────────────
  const todaySaints = [
    { month: 12, day: 19, nameRo: 'Sfântul Ierarh Nicolae, Arhiepiscopul Mirelor Lichiei', slug: 'sf-nicolae-mirele-lichiei', feastType: 'MARE' },
    { month: 12, day: 19, nameRo: 'Sfântul Mucenic Bonifatie', slug: 'sf-mc-bonifatie', feastType: 'MIC' },
    { month: 6, day: 26, nameRo: 'Sfântul Mucenic Ioan cel Nou de la Suceava', slug: 'sf-mc-ioan-cel-nou', feastType: 'MARE' },
    { month: 6, day: 26, nameRo: 'Sfânta Muceniță Hristina', slug: 'sf-mc-hristina', feastType: 'MIC' },
  ]

  for (const saint of todaySaints) {
    await prisma.saint.upsert({
      where: { slug: saint.slug },
      update: {},
      create: saint,
    })
  }

  // ─── Proiecte de donație ─────────────────────────────────────────────────────
  const donationProjectsCount = await prisma.donationProject.count()
  if (donationProjectsCount === 0) {
    await prisma.donationProject.createMany({
      data: [
        {
          titleRo: 'Renovarea acoperișului',
          descriptionRo: 'Înlocuirea completă a acoperișului bisericii cu materiale durabile, pentru protejarea lăcașului sfânt.',
          progress: 35,
          target: '150,000 MDL',
          order: 0,
        },
        {
          titleRo: 'Renovarea turnului clopotniță',
          descriptionRo: 'Restaurarea și consolidarea turnului clopotniță, element central al arhitecturii parohiei.',
          progress: 20,
          target: '80,000 MDL',
          order: 1,
        },
        {
          titleRo: 'Pictarea interiorului',
          descriptionRo: 'Realizarea picturii murale ortodoxe în interiorul bisericii, conform canoanelor bizantine.',
          progress: 10,
          target: '300,000 MDL',
          order: 2,
        },
        {
          titleRo: 'Lucrări electrice',
          descriptionRo: 'Modernizarea instalației electrice și iluminatul arhitectural al iconostasului și naosului.',
          progress: 60,
          target: '45,000 MDL',
          order: 3,
        },
        {
          titleRo: 'Automatizarea clopotelor',
          descriptionRo: 'Sistem electronic de automatizare a clopotelor pentru chemarea credincioșilor la slujbe. (planificat)',
          progress: 0,
          target: '25,000 MDL',
          order: 4,
        },
      ],
    })
  }

  // ─── Settings ────────────────────────────────────────────────────────────────
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'Biserica Sfântul Ierarh Nicolae' },
  })

  await prisma.setting.upsert({
    where: { key: 'parish_address' },
    update: {},
    create: { key: 'parish_address', value: 'Hîrtopul Mic, Raionul Criuleni, Moldova' },
  })

  await prisma.setting.upsert({
    where: { key: 'parish_email' },
    update: {},
    create: { key: 'parish_email', value: 'inimaortodoxiei@gmail.com' },
  })

  console.log('✅ Seed completat cu succes!')
  console.log('   - 3 rugăciuni')
  console.log('   - 3 cărți')
  console.log('   - 3 articole')
  console.log('   - 4 sfinți')
  console.log('   - 3 setări')
  console.log('   - 5 proiecte de donație')
}

main()
  .catch(e => {
    console.error('❌ Eroare la seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
