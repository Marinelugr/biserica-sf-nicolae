import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'images'
const MAX_SIZE_MB = 20 // client compresses before upload

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif', 'image/svg+xml', 'image/avif',
  'image/heic', 'image/heif',
]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey || serviceKey.startsWith('ADAUGA_')) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nu este configurat în .env' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const isThumbnail = formData.get('thumbnail') === 'true'
  if (!file) return NextResponse.json({ error: 'Niciun fișier trimis' }, { status: 400 })

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Fișierul depășește ${MAX_SIZE_MB}MB` }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tip fișier neacceptat. Folosiți JPG, PNG, WebP, HEIC, AVIF sau GIF.' }, { status: 400 })
  }

  const ext = file.type === 'image/webp' ? 'webp'
    : file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
  const basePath = isThumbnail
    ? `thumbnails/${Date.now()}-${safeName}.${ext}`
    : `admin/${Date.now()}-${safeName}.${ext}`

  const supabase = createClient(supabaseUrl, serviceKey)
  const bytes = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(basePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: '31536000',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return NextResponse.json({ url: publicUrl })
}
