/**
 * Sărbători fixe în stil VECHI (Julian Calendar), exprimate în date GREGORIENE.
 * Offset sec. XXI: +13 zile față de data iuliană.
 * Ex: Sf. Nicolae = 6 dec iulian → 19 dec gregorian
 */

export type FeastType = 'GREAT' | 'MEDIUM' | 'SAINT' | 'FAST_START' | 'FAST_END'

export interface OldCalendarFeast {
  month: number   // Gregorian month
  day: number     // Gregorian day
  nameKey: keyof import('../i18n/ro').Translations['calendar']['feastNames']
  type: FeastType
  color: string
  julianDate: string  // info for display (DD MMM stil vechi)
}

export const OLD_CALENDAR_FEASTS: OldCalendarFeast[] = [
  // IANUARIE
  { month: 1,  day: 7,  nameKey: 'christmas',          type: 'GREAT',  color: '#8B1A1A', julianDate: '25 dec' },
  { month: 1,  day: 14, nameKey: 'circumcision',        type: 'MEDIUM', color: '#8B6014', julianDate: '1 ian'  },
  { month: 1,  day: 19, nameKey: 'epiphany',            type: 'GREAT',  color: '#8B1A1A', julianDate: '6 ian'  },
  // FEBRUARIE
  { month: 2,  day: 15, nameKey: 'meetingLord',         type: 'GREAT',  color: '#8B1A1A', julianDate: '2 feb'  },
  // APRILIE
  { month: 4,  day: 7,  nameKey: 'annunciation',        type: 'GREAT',  color: '#8B1A1A', julianDate: '25 mar' },
  // IULIE
  { month: 7,  day: 7,  nameKey: 'birthJohnBaptist',    type: 'GREAT',  color: '#8B1A1A', julianDate: '24 iun' },
  { month: 7,  day: 12, nameKey: 'peterPaul',           type: 'GREAT',  color: '#8B1A1A', julianDate: '29 iun' },
  // AUGUST
  { month: 8,  day: 19, nameKey: 'transfiguration',     type: 'GREAT',  color: '#8B1A1A', julianDate: '6 aug'  },
  { month: 8,  day: 28, nameKey: 'dormition',           type: 'GREAT',  color: '#8B1A1A', julianDate: '15 aug' },
  // SEPTEMBRIE
  { month: 9,  day: 21, nameKey: 'nativityMary',        type: 'GREAT',  color: '#8B1A1A', julianDate: '8 sep'  },
  { month: 9,  day: 27, nameKey: 'exaltationCross',     type: 'GREAT',  color: '#8B1A1A', julianDate: '14 sep' },
  // NOIEMBRIE
  { month: 11, day: 21, nameKey: 'archangels',          type: 'MEDIUM', color: '#8B6014', julianDate: '8 nov'  },
  // DECEMBRIE
  { month: 12, day: 4,  nameKey: 'entryTemple',         type: 'GREAT',  color: '#8B1A1A', julianDate: '21 nov' },
  { month: 12, day: 19, nameKey: 'saintNicholas',       type: 'GREAT',  color: '#8B1A1A', julianDate: '6 dec'  },
]

/** Returnează sărbătorile fixe pentru o zi/lună gregoriană */
export function getFixedFeasts(day: number, month: number): OldCalendarFeast[] {
  return OLD_CALENDAR_FEASTS.filter(f => f.month === month && f.day === day)
}

/**
 * Perioadele de post FIXE (în date gregoriene, stil vechi + 13 zile).
 *
 * Postul Crăciunului:  28 nov – 6 ian  (15 nov – 24 dec iulian)
 * Postul Adormirii:    14 aug – 27 aug  (1 aug – 14 aug iulian)
 * (Postul Mare și Postul Apostolilor sunt schimbătoare — calculate din Paști)
 */
export interface FastPeriod {
  nameKey: keyof import('../i18n/ro').Translations['calendar']['fastNames']
  color: string
  /** Verifică dacă ziua/luna/an intră în post */
  inFast: (day: number, month: number, year: number) => boolean
}

export const FIXED_FASTS: FastPeriod[] = [
  {
    nameKey: 'christmasFast',
    color: '#4A6A2A',
    inFast: (day, month) => {
      // 28 nov – 31 dec (sau 1 ian – 6 ian inclusiv)
      if (month === 11 && day >= 28) return true
      if (month === 12) return true
      if (month === 1 && day <= 6) return true
      return false
    },
  },
  {
    nameKey: 'dormitionFast',
    color: '#4A6A2A',
    inFast: (day, month) => month === 8 && day >= 14 && day <= 27,
  },
]

/**
 * Verifică postul Apostolilor (schimbător).
 * Începe în ziua de luni după Duminica Tuturor Sfinților,
 * se termină pe 11 iulie gregorian (ajunul Sf. Petru și Pavel = 12 iulie).
 *
 * allSaintsDay = Duminica Tuturor Sfinților (calculată din Paști)
 */
export function isApostlesFast(
  day: number, month: number, year: number,
  allSaintsDay: Date,
): boolean {
  const target = new Date(year, month - 1, day)
  target.setHours(0, 0, 0, 0)
  // Luni după Duminica Tuturor Sfinților
  const fastStart = new Date(allSaintsDay)
  fastStart.setDate(fastStart.getDate() + 1)
  fastStart.setHours(0, 0, 0, 0)
  // Sf. Petru și Pavel: 12 iulie; postul se termină pe 11 iulie
  const fastEnd = new Date(year, 6, 11) // 11 iulie
  fastEnd.setHours(23, 59, 59, 0)

  return target >= fastStart && target <= fastEnd
}
