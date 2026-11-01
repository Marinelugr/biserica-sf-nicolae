/** Scrierea unui verset din Admin: comună editorului și cozii de revizuire. Fără verificare de acces. */
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { invalidateChapterCache, READER_CACHE_VERSION_KEY } from './queries'

export const TX_SHORT = { timeout: 15_000, maxWait: 10_000 }

/** Se scrie în aceeași tranzacție și ultima, ca rândul să rămână blocat cât mai puțin. */
export function bumpReaderCache(tx: Prisma.TransactionClient) {
  const value = randomUUID()
  return tx.setting.upsert({ where: { key: READER_CACHE_VERSION_KEY }, update: { value }, create: { key: READER_CACHE_VERSION_KEY, value } })
}

export function refreshReader(slug: string, chapters: Iterable<number>) {
  for (const chapter of new Set(chapters)) {
    invalidateChapterCache(slug, chapter)
    revalidatePath(`/biblie/${slug}/${chapter}`)
  }
}

/** Doar codul erorii: mesajele Prisma pot conține textul versetului. */
export function logDbError(where: string, err: unknown) {
  const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.name : 'necunoscută'
  console.error(`[biblia-admin] ${where}: ${code}`)
}

export interface VerseRef { id: string; textRo: string; verseNum: number; slug: string; chapterNum: number }
export type VerseWrite =
  | { kind: 'saved'; editedAt: Date }
  | { kind: 'conflict'; text: string; editedAt: Date | null }

/** Verset + jurnal, în tranzacția primită. Apelantul scrie apoi `bumpReaderCache`. */
export async function writeVerseEdit(
  tx: Prisma.TransactionClient,
  verse: VerseRef,
  prepared: { text: string; textSearch: string },
  seen: Date | null,
  editor: string,
): Promise<VerseWrite> {
  const now = new Date()
  // Comparare atomică: două salvări simultane nu pot trece amândouă.
  const { count } = await tx.bibleVerse.updateMany({
    where: { id: verse.id, editedAt: seen },
    data: { textRo: prepared.text, textSearch: prepared.textSearch, editedAt: now },
  })
  if (count !== 1) {
    const current = await tx.bibleVerse.findUnique({ where: { id: verse.id }, select: { textRo: true, editedAt: true } })
    return { kind: 'conflict', text: current?.textRo ?? verse.textRo, editedAt: current?.editedAt ?? null }
  }
  await tx.bibleEdit.create({
    data: {
      verseId: verse.id,
      bookSlug: verse.slug,
      chapterNum: verse.chapterNum,
      verseNum: verse.verseNum,
      action: 'EDIT',
      oldText: verse.textRo,
      newText: prepared.text,
      editor,
    },
  })
  return { kind: 'saved', editedAt: now }
}
