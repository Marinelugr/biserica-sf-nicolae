'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { getBook } from './books'
import {
  checkReportMessage, clientAddress, isHoneypotFilled, REPORT_LIMIT_PER_HOUR, THROTTLE_KEEP_MS, THROTTLE_WINDOW_MS, throttleKey,
} from './reportCore'
import type { ReportResult } from './reportLimits'
import { REPORT_DETECTOR } from './reviewCore'

const schema = z.object({
  slug: z.string().max(64),
  chapter: z.number().int().positive().max(999),
  verse: z.number().int().min(0).max(999),
  // mai larg decât limita, ca textul lipit cu spații în plus să ajungă la curățare
  message: z.string().max(2000),
  website: z.string().max(500).optional(),
})

/** Formularul public: fără sesiune. Importat doar de formularul încărcat la interacțiune, niciodată de pagina cititorului. */
export async function submitVerseReport(input: unknown): Promise<ReportResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, code: 'invalid' }
  const { slug, chapter, verse, website } = parsed.data
  // Robotul primește același răspuns ca un om și nimic nu se scrie.
  if (isHoneypotFilled(website)) return { ok: true }
  if (!getBook(slug)) return { ok: false, code: 'invalid' }
  const checked = checkReportMessage(parsed.data.message)
  if (!checked.ok) return checked

  const salt = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!salt) return { ok: false, code: 'unavailable' }

  try {
    const h = await headers()
    const keyHash = throttleKey(clientAddress(h.get('x-forwarded-for'), h.get('x-real-ip')), h.get('user-agent'), salt)
    const code = await prisma.$transaction(async tx => {
      const since = new Date(Date.now() - THROTTLE_WINDOW_MS)
      if (await tx.bibleReportThrottle.count({ where: { keyHash, createdAt: { gte: since } } }) >= REPORT_LIMIT_PER_HOUR) return 'limit' as const
      const row = await tx.bibleVerse.findFirst({
        where: { verseNum: verse, chapter: { chapterNum: chapter, book: { slug } } },
        select: { id: true },
      })
      if (!row) return 'invalid' as const
      await tx.bibleReportThrottle.create({ data: { keyHash } })
      await tx.bibleReviewItem.create({
        data: {
          verseId: row.id, bookSlug: slug, chapterNum: chapter, verseNum: verse,
          detector: REPORT_DETECTOR, fragment: '', confidence: 'cititor', source: 'cititor', message: checked.message,
        },
      })
      return null
    }, { timeout: 15_000, maxWait: 10_000 })
    if (code) return { ok: false, code }
    // Curățare: o eroare aici nu afectează raportarea deja salvată.
    await prisma.bibleReportThrottle.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - THROTTLE_KEEP_MS) } } }).catch(() => {})
    return { ok: true }
  } catch (err) {
    // Tabelele pot lipsi dacă deploy-ul ajunge înaintea schemei; doar codul, fără conținut.
    const name = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.name : 'necunoscută'
    console.error(`[biblia-raportare] ${name}`)
    return { ok: false, code: 'unavailable' }
  }
}
