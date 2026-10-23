/**
 * Identitatea vizuală a secțiunilor. Culorile stau într-un singur loc:
 * `src/app/sections.css` (blocurile `[data-sec="…"]`). Aici doar numele și
 * pictograma fiecărei secțiuni. Decizii și valori finale: docs/DESIGN-SECTIUNI.md.
 */
export const SEC_IDS = [
  'astazi', 'anunt', 'slujbe', 'cuvant', 'sfinti', 'evanghelie', 'rugaciune',
  'stiri', 'biblioteca', 'biserica', 'video', 'profil',
] as const

export type SecId = (typeof SEC_IDS)[number]

export type SecIconName =
  | 'calendar' | 'bell' | 'clock' | 'quill' | 'halo' | 'book' | 'candle'
  | 'news' | 'books' | 'church' | 'play' | 'cross'

export const SEC_ICON: Record<SecId, SecIconName> = {
  astazi: 'calendar',
  anunt: 'bell',
  slujbe: 'clock',
  cuvant: 'quill',
  sfinti: 'halo',
  evanghelie: 'book',
  rugaciune: 'candle',
  stiri: 'news',
  biblioteca: 'books',
  biserica: 'church',
  video: 'play',
  profil: 'cross',
}

/** Cotorul colorat din „Bibliotecă": tipul cărții → grupul de culoare. */
export type ShelfGroup = 'acatiste' | 'rugaciuni' | 'teologie' | 'altele'

export function shelfGroup(type: string | null | undefined): ShelfGroup {
  switch ((type || '').toUpperCase()) {
    case 'ACATIST': return 'acatiste'
    case 'RUGACIUNE':
    case 'CANON': return 'rugaciuni'
    case 'SLUJBA':
    case 'VIATA':
    case 'PREDICA':
    case 'BIBLIE': return 'teologie'
    default: return 'altele'
  }
}
