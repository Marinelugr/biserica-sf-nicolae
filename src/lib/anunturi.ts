const DAY_MS = 24 * 60 * 60 * 1000

export interface AnuntRecord {
  id: string
  titlu: string
  mesaj: string
  linkArticol?: string | null
  dataStart: Date | string
  zileAfisare: number
  activ: boolean
  createdAt?: Date | string
}

/** `true` dacă string-ul e un URL http(s) valid. String gol / whitespace → `false`. */
export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const u = new URL(trimmed)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export type AnuntStare = 'activ' | 'programat' | 'expirat' | 'oprit'

/** Data (exclusiv) la care anunțul nu mai e afișat: dataStart + zileAfisare zile. */
export function anuntExpiryDate(a: Pick<AnuntRecord, 'dataStart' | 'zileAfisare'>): Date {
  const start = new Date(a.dataStart)
  return new Date(start.getTime() + Math.max(0, a.zileAfisare) * DAY_MS)
}

/** „Activ acum": activ = true ȘI now ∈ [dataStart, dataStart + zileAfisare zile). */
export function isAnuntActiveNow(a: Pick<AnuntRecord, 'dataStart' | 'zileAfisare' | 'activ'>, now: Date = new Date()): boolean {
  if (!a.activ) return false
  const start = new Date(a.dataStart)
  return now >= start && now < anuntExpiryDate(a)
}

/** Starea calculată, pentru afișarea în admin. */
export function anuntStare(a: Pick<AnuntRecord, 'dataStart' | 'zileAfisare' | 'activ'>, now: Date = new Date()): AnuntStare {
  const start = new Date(a.dataStart)
  if (now >= anuntExpiryDate(a)) return 'expirat'
  if (!a.activ) return 'oprit'
  if (now < start) return 'programat'
  return 'activ'
}

/**
 * Dintre toate anunțurile primite, întoarce SINGURUL care se afișează pe homepage:
 * cel activ acum cu data de expirare cea mai apropiată (se termină primul).
 * `null` dacă niciunul nu e activ.
 */
export function pickHomepageAnunt<T extends AnuntRecord>(anunturi: T[], now: Date = new Date()): T | null {
  const active = anunturi.filter(a => isAnuntActiveNow(a, now))
  if (active.length === 0) return null
  return active.sort((a, b) => {
    const ea = anuntExpiryDate(a).getTime()
    const eb = anuntExpiryDate(b).getTime()
    if (ea !== eb) return ea - eb
    // departajare stabilă: cel mai vechi creat primul
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
  })[0]
}
