'use client'

import { useSyncExternalStore } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { getBook } from '@/lib/bible/books'
import { bookShortName } from '@/lib/bible/shortNames'
import { fill } from '@/lib/bible/viewModel'
import { chapterHref, clearHistory, getHistorySnapshot, resumeHref, subscribeHistory } from '@/lib/bible/readingPosition'

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
    <section className="card continue-card" aria-label={r.continueTitle}>
      <a href={resumeHref(position, locale)} className="btn gold continue-link">
        {fill(r.continueReading, { book: name(position.carte), chapter: position.capitol, verse: position.verset })}
      </a>
      {recent.length > 0 && (
        <div className="continue-recent">
          <h2 className="eyebrow" style={{ fontSize: 14 }}>{r.recentlyRead}</h2>
          <ul>
            {recent.map(item => (
              <li key={`${item.carte}/${item.capitol}`}>
                <a href={chapterHref(item, locale)}>{name(item.carte)} {item.capitol}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="continue-foot">
        <p className="mute text-[15px]">{r.positionLocalNote}</p>
        <button type="button" className="btn sm" onClick={clearHistory}>{r.clearHistory}</button>
      </div>
    </section>
  )
}
