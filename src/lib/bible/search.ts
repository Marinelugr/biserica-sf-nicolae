/**
 * Căutare în Biblie fără diacritice. Fără importuri din React/Next și fără `@/`
 * (folosit și de scripturile ts-node din prisma/bible/).
 */

const MAX_QUERY = 100
const MAX_WORDS = 6
const MIN_WORD = 2

function foldChar(c: string): string {
  const lower = c.toLowerCase()
  const l = lower.length === 1 ? lower : c
  const base = l.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const b = base.length === 1 ? base : l
  return /[\p{L}\p{N}]/u.test(b) ? b : ' '
}

/**
 * Text pentru căutare: NFC → litere mici → fără diacritice (ă â → a, î → i,
 * ș ş → s, ț ţ → t) → orice semn de punctuație devine spațiu.
 *
 * Invariant: pentru un text NFC (cum e tot textul importat), rezultatul are
 * exact aceeași lungime — caracterul i din rezultat corespunde caracterului i
 * din text, așa că pozițiile găsite se pot evidenția în textul original.
 */
export function normalizeForSearch(text: string): string {
  const s = text.normalize('NFC')
  let out = ''
  for (let i = 0; i < s.length; i++) out += foldChar(s[i])
  return out
}

/** Cuvintele căutate: cel mult 6, fiecare de cel puțin 2 caractere, din primele 100 de caractere. */
export function searchWords(query: string): string[] {
  const words = normalizeForSearch(String(query ?? '').slice(0, MAX_QUERY))
    .split(' ')
    .filter(w => w.length >= MIN_WORD)
  return [...new Set(words)].slice(0, MAX_WORDS)
}

/** Intervalele [start, end) din `text` unde apare oricare dintre cuvinte (după normalizare), unite. */
export function highlightRanges(text: string, words: string[]): [number, number][] {
  const norm = normalizeForSearch(text)
  const ranges: [number, number][] = []
  for (const w of words) {
    if (!w) continue
    let i = norm.indexOf(w)
    while (i !== -1) {
      ranges.push([i, i + w.length])
      i = norm.indexOf(w, i + w.length)
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }
  return merged
}

/** Împarte textul în bucăți simple și evidențiate (pentru <mark>). */
export function highlightParts(text: string, words: string[]): { text: string; hit: boolean }[] {
  const s = text.normalize('NFC')
  const parts: { text: string; hit: boolean }[] = []
  let pos = 0
  for (const [a, b] of highlightRanges(s, words)) {
    if (a > pos) parts.push({ text: s.slice(pos, a), hit: false })
    parts.push({ text: s.slice(a, b), hit: true })
    pos = b
  }
  if (pos < s.length) parts.push({ text: s.slice(pos), hit: false })
  return parts
}
