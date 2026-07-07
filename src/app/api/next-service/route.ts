import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  try {
    const candidates = await prisma.serviceSchedule.findMany({
      where: {
        OR: [
          { year: { gt: year } },
          { year, month: { gt: month } },
          { year, month, day: { gte: day } },
        ],
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { time: 'asc' }],
      take: 20,
    })

    const upcoming = candidates
      .map(s => {
        const [h, m] = s.time.split(':').map(Number)
        const date = new Date(s.year, s.month - 1, s.day, h || 0, m || 0, 0, 0)
        return { titlu: s.serviceRo, time: s.time, date }
      })
      .filter(s => s.date.getTime() > now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const next = upcoming[0]
    if (!next) return NextResponse.json({ found: false })

    return NextResponse.json({
      found: true,
      titlu: next.titlu,
      data: next.date.toISOString(),
      ora: next.time,
    })
  } catch {
    return NextResponse.json({ found: false, error: 'DB error' })
  }
}
