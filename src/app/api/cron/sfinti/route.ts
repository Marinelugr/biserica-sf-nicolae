import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { preiaZi, slugSfant } from '@/lib/sfinti-scraper'
import { translateToAllLanguages } from '@/lib/deepl'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  let adaugati = 0, deja = 0
  const azi = new Date()

  // azi + 3 zile în avans, acoperă orice întârziere de rulare
  for (let offset = 0; offset < 4; offset++) {
    const d = new Date(azi)
    d.setDate(d.getDate() + offset)
    const zi = d.getDate(), luna = d.getMonth() + 1, an = d.getFullYear()

    const sfinti = await preiaZi(zi, luna, an)
    for (const s of sfinti) {
      const slug = slugSfant(s.text, luna, zi)
      const existent = await prisma.saint.findUnique({ where: { slug } })
      if (existent) { deja++; continue }

      let nameRu: string | null = null, nameEn: string | null = null
      try {
        const t = await translateToAllLanguages(s.text)
        nameRu = t.ru; nameEn = t.en
      } catch { /* traducerea e opțională, nu blochează sincronizarea */ }

      await prisma.saint.create({
        data: { month: luna, day: zi, nameRo: s.text, nameRu, nameEn, slug, feastType: s.praznic ? 'praznic' : null },
      })
      adaugati++
    }
  }
  return NextResponse.json({ success: true, adaugati, deja })
}
