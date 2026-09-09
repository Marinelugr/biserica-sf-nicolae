import { pickHomepageAnunt, type AnuntRecord } from './anunturi'

/** Anunțul de afișat pe homepage, citit direct din DB. `null` dacă nu există sau DB indisponibil. */
export async function getActiveAnunt(): Promise<AnuntRecord | null> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const anunturi = await prisma.anunt.findMany({ where: { activ: true } })
    return pickHomepageAnunt(anunturi as AnuntRecord[])
  } catch {
    return null
  }
}
