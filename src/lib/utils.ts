export function slugify(text: string): string {
  const map: Record<string, string> = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
    'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
  }
  return text
    .split('')
    .map(c => map[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: Date | string, locale = 'ro-MD'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Algoritmul Gauss pentru calculul Paștelui ortodox (stil vechi, Julian Calendar)
export function orthodoxEaster(year: number): Date {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1

  // Convertire din calendarul iulian în gregorian
  const julianDate = new Date(year, month - 1, day)
  // Diferența pentru sec. XXI = 13 zile
  julianDate.setDate(julianDate.getDate() + 13)
  return julianDate
}

export function getLiturgicalDates(year: number) {
  const easter = orthodoxEaster(year)

  const addDays = (date: Date, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  return {
    easter,
    palmSunday: addDays(easter, -7),       // Floriile
    ascension: addDays(easter, 39),        // Înălțarea
    pentecost: addDays(easter, 49),        // Rusaliile
    allSaintsDay: addDays(easter, 56),     // Duminica Tuturor Sfinților
    greatLentStart: addDays(easter, -48),  // Postul Mare
    apostlesFastEnd: new Date(year, 6, 12),   // Sf. Petru și Pavel (29 iunie stil vechi = 12 iulie)
    dormitionFast: { start: new Date(year, 7, 1), end: new Date(year, 7, 28) },
    christmasFast: { start: new Date(year, 10, 15), end: new Date(year, 11, 25) },
  }
}

// Extrage sfinții zilei (day/month — pentru seed și carduri)
export function getTodayDate() {
  const now = new Date()
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() }
}
