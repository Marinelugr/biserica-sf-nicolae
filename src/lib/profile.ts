import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { FALLBACK_MESAJ, FALLBACK_PHOTO_URL, firstSentences } from '@/lib/priestMessage'
import { DEFAULT_CONTACT } from '@/lib/contact-info'

export interface ProfileData {
  /** Numele afișat, ex. „Părintele Marin Grigoriță". */
  displayName: string
  photoUrl: string
  /** Primele 2 propoziții din mesajul activ (ca în PriestMessageSection). */
  lead: string
  /** Facebook din Admin → Contact (sau valoarea implicită). */
  facebook: string
}

const FALLBACK_NAME = 'Marin Grigoriță'

function withTitle(name: string): string {
  const n = name.trim()
  if (/^(Părintele|Pr\.|Preot)/i.test(n)) return n
  return `Părintele ${n}`
}

/**
 * Datele coloanei de profil — memoizate per request (layout + pagină fac o
 * singură serie de interogări). Nu aruncă niciodată: fără DB, se randează cu
 * fallback-urile existente.
 */
export const getProfileData = cache(async (): Promise<ProfileData> => {
  let nameRo: string | null = null
  let photoUrl: string | null = null
  let mesajText = FALLBACK_MESAJ
  let facebook = DEFAULT_CONTACT.facebook
  try {
    const [priest, mesaj, fbSetting] = await Promise.all([
      prisma.priest.findFirst({ select: { nameRo: true, photoUrl: true } }),
      prisma.priestMessage.findFirst({ where: { active: true } }),
      prisma.setting.findUnique({ where: { key: 'contact_facebook' } }),
    ])
    nameRo = priest?.nameRo ?? null
    photoUrl = priest?.photoUrl || mesaj?.photoUrl || null
    mesajText = mesaj?.mesajRo || FALLBACK_MESAJ
    facebook = fbSetting?.value || DEFAULT_CONTACT.facebook
  } catch {
    // fără DB: rămân fallback-urile
  }
  return {
    displayName: withTitle(nameRo || FALLBACK_NAME),
    photoUrl: photoUrl || FALLBACK_PHOTO_URL,
    lead: firstSentences(mesajText, 2),
    facebook,
  }
})
