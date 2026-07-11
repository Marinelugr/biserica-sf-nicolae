import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getContactInfo, SETTING_KEYS, type ContactField } from '@/lib/contact-info'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const info = await getContactInfo()
  return NextResponse.json(info)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const body = await req.json()
  const fields = Object.keys(SETTING_KEYS) as ContactField[]

  await Promise.all(
    fields
      .filter(field => typeof body[field] === 'string')
      .map(field =>
        prisma.setting.upsert({
          where: { key: SETTING_KEYS[field] },
          update: { value: body[field] },
          create: { key: SETTING_KEYS[field], value: body[field] },
        })
      )
  )

  const info = await getContactInfo()
  return NextResponse.json(info)
}
