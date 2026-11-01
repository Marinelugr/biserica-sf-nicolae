'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useI18n } from '@/lib/i18n/context'
import ContinueCard from '@/components/shared/ContinueCard'
import {
  MAX_RECENT_SHOWN, bookHref, clearBookHistory, getBookHistorySnapshot, placeLabel, pruneMissingBooks, resumeBookHref, subscribeBookHistory,
} from '@/lib/carti/readingPosition'

/** Pe server nu există poziție: crawlerele primesc același HTML ca înainte. */
const serverSnapshot = () => null

/** Cardul de pe /carti. `books` vine din lista paginii, deci titlurile sunt mereu cele curente. */
export default function ContinueBooks({ books }: { books: { slug: string; titleRo: string }[] }) {
  const history = useSyncExternalStore(subscribeBookHistory, getBookHistorySnapshot, serverSnapshot)
  const { t, locale } = useI18n()

  useEffect(() => {
    if (history) pruneMissingBooks(new Set(books.map(book => book.slug)))
  }, [history, books])

  if (!history) return null

  const titles = new Map(books.map(book => [book.slug, book.titleRo]))
  const position = history.position && titles.has(history.position.id) ? history.position : null
  const recent = history.recent
    .filter(book => titles.has(book.id) && book.id !== position?.id)
    .slice(0, MAX_RECENT_SHOWN)
  if (!position && recent.length === 0) return null

  return (
    <ContinueCard
      primary={position ? {
        href: resumeBookHref(position, locale),
        text: t.books.continueBook.replace('{title}', titles.get(position.id)!).replace('{place}', placeLabel(position)),
      } : undefined}
      recent={recent.map(book => ({ key: book.id, href: bookHref(book.id, locale), label: titles.get(book.id)! }))}
      onClear={clearBookHistory}
    />
  )
}
