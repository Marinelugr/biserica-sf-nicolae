'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getBook } from '@/lib/bible/books'
import { requireBibleAdmin } from '@/lib/bible/adminAuth'
import { checkReplaceInput, isValidNewVerseNumber, planReplace, prepareVerseText, type ReplaceInput, type ReplaceSample } from '@/lib/bible/adminCore'
import { loadReplaceRows } from '@/lib/bible/adminQueries'
import { invalidateChapterCache, READER_CACHE_VERSION_KEY } from '@/lib/bible/queries'
import { prisma } from '@/lib/prisma'

export type SaveResult =
  | { ok: true; status: 'saved' | 'unchanged'; text: string; editedAt: string | null }
  | { ok: false; error: string; conflict?: { text: string; editedAt: string | null } }

export type ReviewResult = { ok: true } | { ok: false; error: string; conflict?: { text: string; editedAt: string | null } }
export type CreateResult = { ok: true } | { ok: false; error: string }

export type PreviewResult =
  | { ok: true; total: number; applicable: number; samples: ReplaceSample[]; invalid: { chapterNum: number; verseNum: number; error: string }[]; token: string }
  | { ok: false; error: string }
export type ApplyResult = { ok: true; changed: number; remaining: number } | { ok: false; error: string }

const UNAUTHORIZED = 'Nu ai acces la această acțiune.'
const CONFLICT = 'Versetul a fost modificat de altcineva.'
const BAD_INPUT = 'Date invalide.'
const DB_ERROR = 'Salvarea nu a reușit; încearcă din nou.'
const TX_SHORT = { timeout: 15_000, maxWait: 10_000 }
const TX_BULK = { timeout: 120_000, maxWait: 10_000 }
const PREVIEW_INVALID = 20

/** Un verset s-a schimbat în timpul înlocuirii: anulează toată tranzacția. */
class StaleReplace extends Error {}

const idSchema = z.string().min(1).max(64)
const seenSchema = z.iso.datetime().nullable()
const saveSchema = z.object({ verseId: idSchema, text: z.string().max(100_000), seenEditedAt: seenSchema })
const reviewSchema = z.object({ verseId: idSchema, reviewed: z.boolean(), seenEditedAt: seenSchema })
const createSchema = z.object({ slug: z.string().max(64), chapter: z.number().int().positive(), verseNum: z.number(), text: z.string().max(100_000) })
const replaceSchema = z.object({ slug: z.string().max(64), find: z.string().max(500), replace: z.string().max(5000), wholeWord: z.boolean() })
const applySchema = replaceSchema.extend({ token: z.string().length(64), confirmed: z.boolean() })

const seenDate = (seen: string | null) => (seen ? new Date(seen) : null)
const iso = (d: Date | null) => d?.toISOString() ?? null

/** Se scrie în aceeași tranzacție și ultima, ca rândul să rămână blocat cât mai puțin. */
function bumpReaderCache(tx: Prisma.TransactionClient) {
  const value = randomUUID()
  return tx.setting.upsert({ where: { key: READER_CACHE_VERSION_KEY }, update: { value }, create: { key: READER_CACHE_VERSION_KEY, value } })
}

function refreshReader(slug: string, chapters: Iterable<number>) {
  for (const chapter of new Set(chapters)) {
    invalidateChapterCache(slug, chapter)
    revalidatePath(`/biblie/${slug}/${chapter}`)
  }
}

/** Doar codul erorii: mesajele Prisma pot conține textul versetului. */
function logDbError(where: string, err: unknown) {
  const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.name : 'necunoscută'
  console.error(`[biblia-admin] ${where}: ${code}`)
}

export async function saveVerseAction(input: unknown): Promise<SaveResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = saveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const { verseId, seenEditedAt } = parsed.data
  const prepared = prepareVerseText(parsed.data.text)
  if (!prepared.ok) return { ok: false, error: prepared.error }
  const seen = seenDate(seenEditedAt)

  try {
    const outcome = await prisma.$transaction(async tx => {
      const verse = await tx.bibleVerse.findUnique({
        where: { id: verseId },
        select: { textRo: true, editedAt: true, verseNum: true, chapter: { select: { chapterNum: true, book: { select: { slug: true } } } } },
      })
      if (!verse) return { kind: 'missing' as const }
      if (verse.textRo === prepared.text) return { kind: 'unchanged' as const, editedAt: verse.editedAt }

      const now = new Date()
      // Comparare atomică: două salvări simultane nu pot trece amândouă.
      const { count } = await tx.bibleVerse.updateMany({
        where: { id: verseId, editedAt: seen },
        data: { textRo: prepared.text, textSearch: prepared.textSearch, editedAt: now },
      })
      if (count !== 1) {
        const current = await tx.bibleVerse.findUnique({ where: { id: verseId }, select: { textRo: true, editedAt: true } })
        return { kind: 'conflict' as const, text: current?.textRo ?? verse.textRo, editedAt: current?.editedAt ?? verse.editedAt }
      }
      await tx.bibleEdit.create({
        data: {
          verseId,
          bookSlug: verse.chapter.book.slug,
          chapterNum: verse.chapter.chapterNum,
          verseNum: verse.verseNum,
          action: 'EDIT',
          oldText: verse.textRo,
          newText: prepared.text,
          editor: admin.email,
        },
      })
      await bumpReaderCache(tx)
      return { kind: 'saved' as const, editedAt: now, slug: verse.chapter.book.slug, chapter: verse.chapter.chapterNum }
    }, TX_SHORT)

    switch (outcome.kind) {
      case 'missing': return { ok: false, error: 'Versetul nu mai există.' }
      case 'unchanged': return { ok: true, status: 'unchanged', text: prepared.text, editedAt: iso(outcome.editedAt) }
      case 'conflict': return { ok: false, error: CONFLICT, conflict: { text: outcome.text, editedAt: iso(outcome.editedAt) } }
      case 'saved':
        refreshReader(outcome.slug, [outcome.chapter])
        return { ok: true, status: 'saved', text: prepared.text, editedAt: iso(outcome.editedAt) }
    }
  } catch (err) {
    logDbError('salvare', err)
    return { ok: false, error: DB_ERROR }
  }
}

/** Bifa „Revizuit”: nu schimbă textul, deci nici `editedAt`, jurnalul sau cache-ul cititorului. */
export async function setVerseReviewedAction(input: unknown): Promise<ReviewResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const { verseId, reviewed, seenEditedAt } = parsed.data
  try {
    const { count } = await prisma.bibleVerse.updateMany({ where: { id: verseId, editedAt: seenDate(seenEditedAt) }, data: { reviewed } })
    if (count === 1) return { ok: true }
    const current = await prisma.bibleVerse.findUnique({ where: { id: verseId }, select: { textRo: true, editedAt: true } })
    if (!current) return { ok: false, error: 'Versetul nu mai există.' }
    return { ok: false, error: CONFLICT, conflict: { text: current.textRo, editedAt: iso(current.editedAt) } }
  } catch (err) {
    logDbError('revizuit', err)
    return { ok: false, error: DB_ERROR }
  }
}

export async function createVerseAction(input: unknown): Promise<CreateResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const { slug, chapter, verseNum } = parsed.data
  if (!getBook(slug)) return { ok: false, error: 'Carte necunoscută.' }
  if (!isValidNewVerseNumber(verseNum)) return { ok: false, error: 'Numărul versetului trebuie să fie mai mare decât 0.' }
  const prepared = prepareVerseText(parsed.data.text)
  if (!prepared.ok) return { ok: false, error: prepared.error }

  const duplicate = `Versetul ${verseNum} există deja în acest capitol.`
  try {
    const error = await prisma.$transaction(async tx => {
      const row = await tx.bibleChapter.findFirst({ where: { chapterNum: chapter, book: { slug } }, select: { id: true } })
      if (!row) return 'Capitolul nu există.'
      const existing = await tx.bibleVerse.findUnique({ where: { chapterId_verseNum: { chapterId: row.id, verseNum } }, select: { id: true } })
      if (existing) return duplicate
      const verse = await tx.bibleVerse.create({
        data: { chapterId: row.id, verseNum, textRo: prepared.text, textSearch: prepared.textSearch, editedAt: new Date() },
        select: { id: true },
      })
      await tx.bibleEdit.create({
        data: { verseId: verse.id, bookSlug: slug, chapterNum: chapter, verseNum, action: 'CREATE', oldText: null, newText: prepared.text, editor: admin.email },
      })
      await bumpReaderCache(tx)
      return null
    }, TX_SHORT)
    if (error) return { ok: false, error }
  } catch (err) {
    // cheia unică: altcineva l-a creat între verificare și scriere
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { ok: false, error: duplicate }
    logDbError('creare', err)
    return { ok: false, error: DB_ERROR }
  }
  refreshReader(slug, [chapter])
  revalidatePath(`/admin/biblia/${slug}/${chapter}`)
  return { ok: true }
}

function replaceInputOf(data: z.infer<typeof replaceSchema>): { ok: true; slug: string; input: ReplaceInput } | { ok: false; error: string } {
  if (!getBook(data.slug)) return { ok: false, error: 'Alege o carte.' }
  const checked = checkReplaceInput(data)
  return checked.ok ? { ok: true, slug: data.slug, input: checked.input } : checked
}

export async function previewReplaceAction(input: unknown): Promise<PreviewResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = replaceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  const checked = replaceInputOf(parsed.data)
  if (!checked.ok) return checked
  try {
    const plan = planReplace(checked.slug, await loadReplaceRows(prisma, checked.slug, checked.input.find), checked.input)
    return { ok: true, total: plan.total, applicable: plan.changes.length, samples: plan.samples, invalid: plan.invalid.slice(0, PREVIEW_INVALID), token: plan.token }
  } catch (err) {
    logDbError('previzualizare', err)
    return { ok: false, error: 'Previzualizarea nu a reușit; încearcă din nou.' }
  }
}
export async function applyReplaceAction(input: unknown): Promise<ApplyResult> {
  const admin = await requireBibleAdmin()
  if (!admin) return { ok: false, error: UNAUTHORIZED }
  const parsed = applySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: BAD_INPUT }
  if (!parsed.data.confirmed) return { ok: false, error: 'Lipsește confirmarea.' }
  const checked = replaceInputOf(parsed.data)
  if (!checked.ok) return checked
  const { slug, input: replaceInput } = checked
  const stale = 'Versetele s-au schimbat după previzualizare; nimic nu s-a scris. Previzualizează din nou.'

  try {
    const outcome = await prisma.$transaction(async tx => {
      const plan = planReplace(slug, await loadReplaceRows(tx, slug, replaceInput.find), replaceInput)
      if (plan.token !== parsed.data.token) return { kind: 'stale' as const }
      if (plan.invalid.length) return { kind: 'invalid' as const }
      if (!plan.changes.length) return { kind: 'empty' as const }
      const now = new Date()
      for (const c of plan.changes) {
        const { count } = await tx.bibleVerse.updateMany({
          where: { id: c.id, editedAt: c.editedAt },
          data: { textRo: c.newText, textSearch: c.textSearch, editedAt: now },
        })
        if (count !== 1) throw new StaleReplace()
      }
      await tx.bibleEdit.createMany({
        data: plan.changes.map(c => ({
          verseId: c.id, bookSlug: slug, chapterNum: c.chapterNum, verseNum: c.verseNum,
          action: 'BULK', oldText: c.textRo, newText: c.newText, editor: admin.email,
        })),
      })
      await bumpReaderCache(tx)
      return { kind: 'done' as const, changed: plan.changes.length, remaining: plan.total - plan.changes.length, chapters: plan.changes.map(c => c.chapterNum) }
    }, TX_BULK)

    if (outcome.kind === 'stale') return { ok: false, error: stale }
    if (outcome.kind === 'invalid') return { ok: false, error: 'Unele versete rezultate nu trec validarea; nimic nu s-a scris.' }
    if (outcome.kind === 'empty') return { ok: false, error: 'Niciun verset de schimbat.' }
    refreshReader(slug, outcome.chapters)
    return { ok: true, changed: outcome.changed, remaining: outcome.remaining }
  } catch (err) {
    if (err instanceof StaleReplace) return { ok: false, error: stale }
    logDbError('înlocuire', err)
    return { ok: false, error: DB_ERROR }
  }
}
