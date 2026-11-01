'use client'

import { useSyncExternalStore } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { getBook } from '@/lib/bible/books'
import { bookShortName } from '@/lib/bible/shortNames'
import { fill } from '@/lib/bible/viewModel'
import { chapterHref, clearHistory, getHistorySnapshot, resumeHref, subscribeHistory } from '@/lib/bible/readingPosition'
import ContinueCard from '@/components/shared/ContinueCard'

/** Pe server nu există poziție: crawlerele primesc același HTML ca înainte. */
const serverSnapshot = () => null

/** Cardul „Continuă lectura" de pe /biblie. Fără poziție salvată și validă, nu apare. */
export default function ContinueReading() {
  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot, serverSnapshot)
  const { t, locale } = useI18n()
  if (!history) return null

  const r = t.bible.reader
  const { position, recent } = history
  const name = (carte: string) => bookShortName(getBook(carte)!, locale)

  return (
    <ContinueCard
      primary={{
        href: resumeHref(position, locale),
        text: fill(r.continueReading, { book: name(position.carte), chapter: position.capitol, verse: position.verset }),
      }}
      recent={recent.map(item => ({
        key: `${item.carte}/${item.capitol}`,
        href: chapterHref(item, locale),
        label: `${name(item.carte)} ${item.capitol}`,
      }))}
      onClear={clearHistory}
    />
  )
}
