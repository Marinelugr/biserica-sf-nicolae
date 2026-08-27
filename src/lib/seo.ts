const MAX_SEO_KEYWORDS = 50

/**
 * Normalizează un câmp "cuvinte cheie SEO" introdus în admin: curăță spațiile,
 * elimină termenii goi și limitează la un număr rezonabil de cuvinte/termeni
 * (separați prin virgulă), ca să nu ajungă un text nesfârșit în <meta keywords>.
 */
export function normalizeSeoKeywords(input: string | null | undefined): string | null {
  if (!input) return null
  const terms = input
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, MAX_SEO_KEYWORDS)
  return terms.length ? terms.join(', ') : null
}
