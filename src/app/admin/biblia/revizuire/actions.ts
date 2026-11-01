'use server'

import { z } from 'zod'
import { requireBibleAdmin } from '@/lib/bible/adminAuth'
import { escapeLike, prepareVerseText } from '@/lib/bible/adminCore'
import { bumpReaderCache, logDbError, refreshReader, TX_SHORT, writeVerseEdit } from '@/lib/bible/adminWrite'
import { ignoreAllBatch, ignoreAllMarker, MAX_IGNORE_ALL, parseFragment, planApply } from '@/lib/bible/reviewCore'
import { prisma } from '@/lib/prisma'

export type ReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; stale?: boolean; conflict?: boolean }
export type IgnoreAllPreview = { ok: true; total: number; now: number; remaining: number; target: string } | { ok: false; error: string }
export type IgnoreAllResult = { ok: true; ignored: number; remaining: number } | { ok: false; error: string }

const UNAUTHORIZED = 'Nu ai acces la această acțiune.'
const BAD_INPUT = 'Date invalide.'
const DB_ERROR = 'Salvarea nu a reușit; încearcă din nou.'
const CONFLICT = 'Versetul a fost modificat de altcineva; verifică versiunea actuală.'
const STALE = 'Fragmentul nu mai apare în verset; elementul a fost marcat învechit.'
const RESOLVED = 'Elementul a fost deja rezolvat.'

/** Elementul s-a rezolvat între citire și scriere: anulează versetul scris în aceeași tranzacție. */
class AlreadyResolved extends Error {}

const idSchema = z.string().min(1).max(64)
const seenSchema = z.iso.datetime().nullable()
const applySchema = z.object({ itemId: idSchema, seenEditedAt: seenSchema, option: z.number().int().min(0).max(20) })
const editSchema = z.object({ itemId: idSchema, seenEditedAt: seenSchema, text: z.string().max(100_000) })
const itemSchema = z.object({ itemId: idSchema })
const ignoreAllSchema = itemSchema.extend({ confirmed: z.boolean() })

const seenDate = (seen: string | null) => (seen ? new Date(seen) : null)

const ITEM = {
  id: true, status: true, fragment: true, suggestion: true, chapterNum: true, verseNum: true, bookSlug: true,
  verse: { select: { id: true, textRo: true } },
} as const

function resolved(status: 'APPLIED' | 'EDITED' | 'IGNORED' | 'STALE', email: string) {
  return { status, resolvedBy: email, resolvedAt: new Date() }
}

export async function applyReviewItemAction(input: unknown): Promise<ReviewActionResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = applySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const { itemId, seenEditedAt, option } = parsed.data

  try {
    const outcome = await prisma.$transaction(async tx => {
      const item = await tx.bibleReviewItem.findUnique({ where: { id: itemId }, select: ITEM })
      if (!item) return { kind: 'error' as const, error: 'Elementul nu mai există.' }
      if (item.status !== 'PENDING') return { kind: 'error' as const, error: RESOLVED }
      const plan = planApply(item.verse.textRo, item.fragment, item.suggestion, option)
      if (plan.kind === 'no-suggestion') return { kind: 'error' as const, error: 'Elementul nu are această propunere.' }
      if (plan.kind === 'ambiguous') return { kind: 'error' as const, error: `Fragmentul apare de ${plan.count} ori în verset; folosește Editează.` }
      if (plan.kind === 'stale') {
        await tx.bibleReviewItem.updateMany({ where: { id: itemId, status: 'PENDING' }, data: resolved('STALE', 'automat') })
        return { kind: 'stale' as const }
      }
      const prepared = prepareVerseText(plan.text)
      if (!prepared.ok) return { kind: 'error' as const, error: prepared.error }
      const written = await writeVerseEdit(
        tx,
        { id: item.verse.id, textRo: item.verse.textRo, verseNum: item.verseNum, slug: item.bookSlug, chapterNum: item.chapterNum },
        prepared, seenDate(seenEditedAt), admin.email,
      )
      if (written.kind === 'conflict') return { kind: 'conflict' as const }
      const { count } = await tx.bibleReviewItem.updateMany({ where: { id: itemId, status: 'PENDING' }, data: resolved('APPLIED', admin.email) })
      if (count !== 1) throw new AlreadyResolved()
      await bumpReaderCache(tx)
      return { kind: 'done' as const, slug: item.bookSlug, chapter: item.chapterNum }
    }, TX_SHORT)

    switch (outcome.kind) {
      case 'error': return { ok: false, error: outcome.error }
      case 'stale': return { ok: false, error: STALE, stale: true }
      case 'conflict': return { ok: false, error: CONFLICT, conflict: true }
      case 'done':
        refreshReader(outcome.slug, [outcome.chapter])
        return { ok: true, message: 'Propunerea a fost aplicată.' }
    }
  } catch (err) {
    if (err instanceof AlreadyResolved) return { ok: false, error: RESOLVED }
    logDbError('revizuire-aplică', err)
    return { ok: false, error: DB_ERROR }
  }
}

export async function editReviewItemAction(input: unknown): Promise<ReviewActionResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = editSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const { itemId, seenEditedAt } = parsed.data
  const prepared = prepareVerseText(parsed.data.text)
  if (!prepared.ok) return { ok: false, error: prepared.error }

  try {
    const outcome = await prisma.$transaction(async tx => {
      const item = await tx.bibleReviewItem.findUnique({ where: { id: itemId }, select: ITEM })
      if (!item) return { kind: 'error' as const, error: 'Elementul nu mai există.' }
      if (item.status !== 'PENDING') return { kind: 'error' as const, error: RESOLVED }
      if (item.verse.textRo === prepared.text) return { kind: 'error' as const, error: 'Textul nu s-a schimbat; dacă e corect, folosește Ignoră.' }
      const written = await writeVerseEdit(
        tx,
        { id: item.verse.id, textRo: item.verse.textRo, verseNum: item.verseNum, slug: item.bookSlug, chapterNum: item.chapterNum },
        prepared, seenDate(seenEditedAt), admin.email,
      )
      if (written.kind === 'conflict') return { kind: 'conflict' as const }
      const { count } = await tx.bibleReviewItem.updateMany({ where: { id: itemId, status: 'PENDING' }, data: resolved('EDITED', admin.email) })
      if (count !== 1) throw new AlreadyResolved()
      await bumpReaderCache(tx)
      return { kind: 'done' as const, slug: item.bookSlug, chapter: item.chapterNum }
    }, TX_SHORT)

    switch (outcome.kind) {
      case 'error': return { ok: false, error: outcome.error }
      case 'conflict': return { ok: false, error: CONFLICT, conflict: true }
      case 'done':
        refreshReader(outcome.slug, [outcome.chapter])
        return { ok: true, message: 'Versetul a fost salvat.' }
    }
  } catch (err) {
    if (err instanceof AlreadyResolved) return { ok: false, error: RESOLVED }
    logDbError('revizuire-editează', err)
    return { ok: false, error: DB_ERROR }
  }
}

/** Nu atinge versetul, deci nici jurnalul sau cache-ul cititorului. */
export async function ignoreReviewItemAction(input: unknown): Promise<ReviewActionResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = itemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  try {
    const { count } = await prisma.bibleReviewItem.updateMany({ where: { id: parsed.data.itemId, status: 'PENDING' }, data: resolved('IGNORED', admin.email) })
    return count === 1 ? { ok: true, message: 'Ignorat.' } : { ok: false, error: RESOLVED }
  } catch (err) {
    logDbError('revizuire-ignoră', err)
    return { ok: false, error: DB_ERROR }
  }
}

/** Aceeași țintă, același detector, doar din audit și doar în așteptare. */
async function ignoreAllWhere(itemId: string) {
  const item = await prisma.bibleReviewItem.findUnique({ where: { id: itemId }, select: { fragment: true, detector: true } })
  if (!item) return null
  const marker = ignoreAllMarker(item.fragment)
  if (!marker) return null
  return {
    target: parseFragment(item.fragment).target,
    where: { status: 'PENDING', source: 'audit', detector: item.detector, fragment: { contains: escapeLike(marker) } },
  }
}

export async function previewIgnoreAllAction(input: unknown): Promise<IgnoreAllPreview> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = itemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  try {
    const found = await ignoreAllWhere(parsed.data.itemId)
    if (!found) return { ok: false, error: 'Elementul nu are un fragment de ignorat.' }
    const total = await prisma.bibleReviewItem.count({ where: found.where })
    return { ok: true, total, ...ignoreAllBatch(total), target: found.target }
  } catch (err) {
    logDbError('revizuire-numără', err)
    return { ok: false, error: 'Numărarea nu a reușit; încearcă din nou.' }
  }
}

export async function ignoreAllAction(input: unknown): Promise<IgnoreAllResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = ignoreAllSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  if (!parsed.data.confirmed) return { ok: false, error: 'Lipsește confirmarea.' }
  try {
    const found = await ignoreAllWhere(parsed.data.itemId)
    if (!found) return { ok: false, error: 'Elementul nu are un fragment de ignorat.' }
    const { where } = found
    return await prisma.$transaction(async tx => {
      const rows = await tx.bibleReviewItem.findMany({ where, select: { id: true }, orderBy: { id: 'asc' }, take: MAX_IGNORE_ALL })
      const { count } = await tx.bibleReviewItem.updateMany({ where: { id: { in: rows.map(r => r.id) }, status: 'PENDING' }, data: resolved('IGNORED', admin.email) })
      return { ok: true as const, ignored: count, remaining: await tx.bibleReviewItem.count({ where }) }
    }, TX_SHORT)
  } catch (err) {
    logDbError('revizuire-ignoră-toate', err)
    return { ok: false, error: DB_ERROR }
  }
}
