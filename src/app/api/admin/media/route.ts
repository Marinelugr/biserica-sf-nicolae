import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType și entityId sunt obligatorii' }, { status: 400 })
  }

  const items = await prisma.mediaItem.findMany({
    where: { entityType, entityId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(items)
}

// Valorile folosite azi de MediaGallery (admin) și de paginile publice.
const ENTITY_TYPES = new Set(['article', 'saint', 'priest', 'history', 'donatii'])
const MAX_ITEMS = 100

interface AttachItem { url?: unknown; thumbnailUrl?: unknown; caption?: unknown }

// Legare în bloc a pozelor „în așteptare” (formular nou, salvat abia acum).
// Adresele trebuie să fie din Storage-ul nostru, ca să nu poată fi legate imagini străine.
async function attachMany(body: { items: unknown; entityType?: unknown; entityId?: unknown }) {
  const { items, entityType, entityId } = body
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `items trebuie să conțină între 1 și ${MAX_ITEMS} poze` }, { status: 400 })
  }
  if (typeof entityType !== 'string' || !ENTITY_TYPES.has(entityType)) {
    return NextResponse.json({ error: 'entityType necunoscut' }, { status: 400 })
  }
  if (typeof entityId !== 'string' || !entityId.trim()) {
    return NextResponse.json({ error: 'entityId este obligatoriu' }, { status: 400 })
  }
  const supabaseUrl = process.env.SUPABASE_URL
  if (!supabaseUrl) return NextResponse.json({ error: 'SUPABASE_URL nu este configurat' }, { status: 500 })
  const prefix = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/`
  const isOurs = (v: unknown): v is string => typeof v === 'string' && v.startsWith(prefix) && !v.includes('..')

  const data = []
  for (const [i, item] of (items as AttachItem[]).entries()) {
    if (!item || !isOurs(item.url) || (item.thumbnailUrl != null && !isOurs(item.thumbnailUrl))) {
      return NextResponse.json({ error: `Adresă de imagine nepermisă (poza ${i + 1})` }, { status: 400 })
    }
    data.push({
      url: item.url,
      thumbnailUrl: (item.thumbnailUrl as string | undefined) || null,
      caption: typeof item.caption === 'string' && item.caption.trim() ? item.caption.trim() : null,
      order: i,
      entityType,
      entityId,
    })
  }

  const { count } = await prisma.mediaItem.createMany({ data })
  return NextResponse.json({ count }, { status: 201 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const body = await req.json()
  if (body && 'items' in body) return attachMany(body)

  const { url, thumbnailUrl, caption, order, entityType, entityId } = body
  if (!url || !entityType || !entityId) {
    return NextResponse.json({ error: 'url, entityType și entityId sunt obligatorii' }, { status: 400 })
  }

  const item = await prisma.mediaItem.create({
    data: { url, thumbnailUrl: thumbnailUrl || null, caption: caption || null, order: order ?? 0, entityType, entityId },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items trebuie să fie un array' }, { status: 400 })
  }

  await Promise.all(
    items.map((item: { id: string; caption?: string; order: number }) =>
      prisma.mediaItem.update({
        where: { id: item.id },
        data: { caption: item.caption ?? null, order: item.order },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
