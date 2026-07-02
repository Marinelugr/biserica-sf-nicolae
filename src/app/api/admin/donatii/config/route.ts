import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DONATII_DEFAULTS } from '@/lib/donatii-defaults'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const config = await prisma.donationConfig.findFirst()
  if (!config) return NextResponse.json(DONATII_DEFAULTS)
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const data = await req.json()
  const {
    localAccounts, ibanAccounts, paypalEmail, paypalLink,
    contactName, contactNameRu, contactNameEn, contactPhone,
    facebookUrl, tiktokUrl, instagramUrl,
    safetyNote, safetyNoteRu, safetyNoteEn, videoLinks,
  } = data

  const payload = {
    localAccounts: localAccounts ?? [],
    ibanAccounts: ibanAccounts ?? [],
    paypalEmail: paypalEmail || null,
    paypalLink: paypalLink || null,
    contactName: contactName || null,
    contactNameRu: contactNameRu || null,
    contactNameEn: contactNameEn || null,
    contactPhone: contactPhone || null,
    facebookUrl: facebookUrl || null,
    tiktokUrl: tiktokUrl || null,
    instagramUrl: instagramUrl || null,
    safetyNote: safetyNote || null,
    safetyNoteRu: safetyNoteRu || null,
    safetyNoteEn: safetyNoteEn || null,
    videoLinks: videoLinks ?? [],
  }

  const existing = await prisma.donationConfig.findFirst()
  const config = existing
    ? await prisma.donationConfig.update({ where: { id: existing.id }, data: payload })
    : await prisma.donationConfig.create({ data: payload })

  return NextResponse.json(config)
}
