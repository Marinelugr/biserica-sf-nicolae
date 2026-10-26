/**
 * Biblie SINTETICĂ pentru teste și pentru galeria /dev/biblia: toate cele 80 de
 * cărți, cu numărul corect de capitole în NT și cel obișnuit în VT, și versete
 * „Text de probă …". Niciun verset real.
 */
import { BIBLE_BOOKS, NT_CHAPTER_COUNTS } from './books'
import type { ParsedBook } from './parse'
import { USUAL_VT_CHAPTERS } from './validate'

export function sampleVerse(slug: string, chapter: number, verse: number): string {
  return `Text de probă ${slug} ${chapter}:${verse}, pentru verificarea afișării.`
}

/** `versesPerChapter` poate fi o funcție (ex. 176 de versete într-un capitol). */
export function syntheticBible(versesPerChapter: number | ((slug: string, ch: number) => number) = 3): ParsedBook[] {
  return BIBLE_BOOKS.map(b => {
    const chapters = NT_CHAPTER_COUNTS[b.slug] ?? USUAL_VT_CHAPTERS[b.slug] ?? 1
    return {
      slug: b.slug,
      chapters: Array.from({ length: chapters }, (_, i) => {
        const n = i + 1
        const count = typeof versesPerChapter === 'function' ? versesPerChapter(b.slug, n) : versesPerChapter
        return { n, verses: Array.from({ length: count }, (_, j) => ({ n: j + 1, text: sampleVerse(b.slug, n, j + 1) })) }
      }),
    }
  })
}
