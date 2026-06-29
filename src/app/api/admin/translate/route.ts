import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { translateToAllLanguages } from '@/lib/deepl'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { text, field } = await req.json() as { text: string; field?: string }

  if (!text || text.trim() === '') {
    return NextResponse.json({ error: 'Textul nu poate fi gol' }, { status: 400 })
  }

  try {
    const translations = await translateToAllLanguages(text)
    return NextResponse.json({ success: true, translations, field })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare la traducere'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
