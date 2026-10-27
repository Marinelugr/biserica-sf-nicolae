/**
 * Datele de afișare pentru paginile Bibliei (etichete, firimituri, linkuri),
 * comune rutelor reale și galeriei /dev/biblia.
 */
import type { Translations } from '../i18n/ro'
import type { Locale } from '../i18n/pick'
import { localizedHref } from '../i18n/href'
import { bookLabel, type BibleBookInfo } from './books'

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''))
}

export function bookMeta(book: BibleBookInfo, t: Translations): string {
  const r = t.bible.reader
  return `${fill(r.bookNumber, { n: book.orderNum })} · ${book.testament === 'VT' ? r.oldTestamentName : r.newTestamentName}`
}

export function bibleCrumbs(t: Translations, locale: Locale, book?: BibleBookInfo, chapter?: number) {
  const crumbs: { href?: string; label: string }[] = [{ href: localizedHref('/biblie', locale), label: t.bible.title }]
  if (book) crumbs.push(chapter ? { href: localizedHref(`/biblie/${book.slug}`, locale), label: bookLabel(book, locale) } : { label: bookLabel(book, locale) })
  if (book && chapter) crumbs.push({ label: `${t.bible.chapter} ${chapter}` })
  return crumbs
}

export function chapterLabels(t: Translations) {
  const r = t.bible.reader
  return {
    chapter: t.bible.chapter, chapters: r.chapters, chooseChapter: r.chooseChapter,
    prevChapter: r.prevChapter, nextChapter: r.nextChapter, textSize: r.textSize,
    sizes: [r.sizeNormal, r.sizeLarge, r.sizeXLarge] as [string, string, string],
  }
}

/** Descrierea meta: primele versete, tăiate la limită de cuvânt (~155 de caractere). */
export function versesDescription(verses: { text: string }[], max = 155): string {
  const s = verses.map(v => v.text).join(' ').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return (sp > 0 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, '') + '…'
}
