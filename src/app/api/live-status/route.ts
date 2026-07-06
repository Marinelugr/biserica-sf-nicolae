import { NextResponse } from 'next/server'
import { getCombinedLiveStatus } from '@/lib/live-stream'

export async function GET() {
  const status = await getCombinedLiveStatus()
  return NextResponse.json(status)
}
