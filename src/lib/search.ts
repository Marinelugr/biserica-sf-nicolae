// Utilitare de căutare — potrivire pe cuvinte individuale, nu pe fraza exactă.
//
// „acatistul sfântului nicolae" trebuie să găsească „Acatistul Sfântului Ierarh
// Nicolae": fiecare cuvânt din query e căutat separat, toate trebuie să apară
// (AND), dar nu neapărat consecutive sau în aceeași ordine.

/** Împarte query-ul în cuvinte separate, ignorând spațiile multiple. */
export function queryWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Construiește un `where` Prisma: fiecare cuvânt trebuie găsit (insensibil la
 * majuscule) în cel puțin unul dintre câmpurile date. Cuvintele sunt legate
 * prin AND, câmpurile prin OR.
 *
 * Ex: buildWordWhere('acatist nicolae', ['titleRo', 'contentRo']) →
 *   { AND: [
 *     { OR: [{ titleRo: { contains: 'acatist', mode: 'insensitive' } },
 *            { contentRo: { contains: 'acatist', mode: 'insensitive' } }] },
 *     { OR: [{ titleRo: { contains: 'nicolae', mode: 'insensitive' } },
 *            { contentRo: { contains: 'nicolae', mode: 'insensitive' } }] },
 *   ] }
 *
 * Dacă query-ul e gol, întoarce `undefined` (fără filtrare).
 */
export function buildWordWhere(query: string, fields: string[]) {
  const words = queryWords(query)
  if (words.length === 0) return undefined

  return {
    AND: words.map(word => ({
      OR: fields.map(field => ({
        [field]: { contains: word, mode: 'insensitive' as const },
      })),
    })),
  }
}

/** Elimină diacriticele: „Sfântului" → „sfantului". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Potrivire în memorie (pentru liste statice, ex. cărțile Bibliei): toate
 * cuvintele din query trebuie să apară în cel puțin unul dintre texte.
 * Insensibil la majuscule ȘI la diacritice.
 */
export function matchesAllWords(query: string, texts: string[]): boolean {
  const words = queryWords(query).map(fold)
  if (words.length === 0) return true
  const haystacks = texts.map(fold)
  return words.every(word => haystacks.some(h => h.includes(word)))
}
