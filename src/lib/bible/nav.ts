/** Capitolul anterior / următor, peste granița cărților. Funcții pure. */
import { neighbors } from './books'

export interface ChapterLink { slug: string; chapter: number | null }

/**
 * `prevBookCount` = câte capitole are cartea anterioară în baza de date (0/null →
 * linkul duce la pagina acelei cărți, `chapter: null`).
 */
export function chapterNav(slug: string, chapter: number, count: number, prevBookCount: number | null): { prev: ChapterLink | null; next: ChapterLink | null } {
  const { prev: prevBook, next: nextBook } = neighbors(slug)
  const prev = chapter > 1
    ? { slug, chapter: chapter - 1 }
    : prevBook ? { slug: prevBook.slug, chapter: prevBookCount && prevBookCount > 0 ? prevBookCount : null } : null
  const next = chapter < count
    ? { slug, chapter: chapter + 1 }
    : nextBook ? { slug: nextBook.slug, chapter: 1 } : null
  return { prev, next }
}

export function chapterPath(link: ChapterLink): string {
  return link.chapter ? `/biblie/${link.slug}/${link.chapter}` : `/biblie/${link.slug}`
}

/** Parametrul de capitol din URL → număr întreg ≥ 1, altfel null („3a", „0", „-1", „1.5"). */
export function parseChapterParam(raw: string): number | null {
  if (!/^[1-9]\d{0,2}$/.test(raw)) return null
  return Number(raw)
}
