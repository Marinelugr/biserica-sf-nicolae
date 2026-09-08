import { NextRequest, NextResponse } from 'next/server'
import { refreshAllFeeds } from '@/lib/externalFeeds'

export const dynamic = 'force-dynamic'

/**
 * Reîmprospătează cache-ul feed-urilor „Din viața Bisericii" (mitropolia.md +
 * protopopiatul-criuleni-dubasari.md). Programat zilnic în vercel.json (limita
 * planului Vercel Hobby — cron-urile pot rula cel mult o dată pe zi), după
 * modelul /api/cron/sfinti. La eșecul unei surse cache-ul vechi rămâne neatins.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const result = await refreshAllFeeds()
  return NextResponse.json({ success: true, surse: result })
}
