/** Verificarea site-ului după import: ce capitole se descarcă și ce trebuie să conțină. Pure. */
import type { ParsedBook } from './parse'

export interface LiveTarget { slug: string; chapter: number; verses: number }

/** Primul capitol din fiecare carte + `extra` capitole alese aleator (fără dubluri), cel mult `max` în total. */
export function pickTargets(books: ParsedBook[], extra = 40, max = 130, rand: () => number = Math.random): LiveTarget[] {
  const all: LiveTarget[] = books.flatMap(b => b.chapters.map(c => ({ slug: b.slug, chapter: c.n, verses: c.verses.length })))
  const firsts = books.map(b => all.find(t => t.slug === b.slug && t.chapter === b.chapters[0]?.n)).filter((t): t is LiveTarget => !!t)
  const rest = all.filter(t => !firsts.includes(t))
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]] }
  return [...firsts, ...rest.slice(0, extra)].slice(0, max)
}

/** Verifică HTML-ul unei pagini de capitol; întoarce problemele (listă goală = în regulă). */
export function checkChapterHtml(html: string, target: LiveTarget, opts: { titleIncludes: string; sourceNote: string }): string[] {
  const out: string[] = []
  const verses = (html.match(/data-verse="\d+"/g) || []).length
  if (verses !== target.verses) out.push(`versete în pagină ${verses}, în bible-data ${target.verses}`)
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  if (!title.includes(opts.titleIncludes)) out.push(`titlul „${title}" nu conține „${opts.titleIncludes}"`)
  if (!html.includes(opts.sourceNote)) out.push('lipsește nota sursei')
  return out
}
