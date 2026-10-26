// Date de probă pentru galeria /dev/biblia — doar „Text de probă", niciun verset real.
export const BOOK = { title: 'Carte de probă', meta: 'Cartea 0 din 80 · Noul Testament' }
export const CHAPTERS = 3
/** Capitolul 2 are 176 de versete (cât cel mai lung capitol din Psalmi); 1 și 3 sunt scurte. */
export function sampleChapter(n: number): { n: number; text: string }[] {
  const count = n === 2 ? 176 : n === 1 ? 4 : 2
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    text: i % 7 === 3
      ? `Text de probă ${n}:${i + 1}, mai lung, ca să se vadă cum se așază un verset pe mai multe rânduri: „Text de probă între ghilimele”, cu virgule, punct și virgulă; și încă o propoziție de probă.`
      : `Text de probă ${n}:${i + 1}, pentru verificarea afișării.`,
  }))
}
