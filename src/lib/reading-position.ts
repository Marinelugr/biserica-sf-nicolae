/**
 * „Continuă lectura", comun pentru orice `tip` de conținut: păstrează locul de
 * lectură doar în localStorage-ul acestui browser, fără cont, server sau cookie-uri.
 * Orice acces la stocare trece prin try/catch: cu stocarea blocată, funcția dispare fără erori.
 * Doc: docs/CONTINUA-LECTURA-CARTI.md.
 */

export const MAX_RECENT = 5
export const SAVE_DEBOUNCE_MS = 800

export const positionKey = (tip: string) => `lectura:${tip}:poz`
export const recentKey = (tip: string) => `lectura:${tip}:recente`

// ─── Acces sigur la stocare ──────────────────────────────────────────────────

function readRaw(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}

function writeRaw(key: string, value: string): void {
  try { window.localStorage.setItem(key, value) } catch { /* blocat sau plin */ }
}

function removeRaw(key: string): void {
  try { window.localStorage.removeItem(key) } catch { /* blocat */ }
}

// ─── Validare ────────────────────────────────────────────────────────────────

export const isPositiveInt = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 1

export function parseJson(raw: string): unknown {
  try { return JSON.parse(raw) } catch { return null }
}

/** Primele `max` intrări, fără dubluri; cea mai recentă rămâne prima. */
export function uniqueRecent<R>(items: R[], same: (a: R, b: R) => boolean, max = MAX_RECENT): R[] {
  return items.filter((item, i) => items.findIndex(other => same(other, item)) === i).slice(0, max)
}

/** Null dacă lista sau oricare dintre intrări e invalidă. */
export function parseRecentList<R>(raw: string, toItem: (value: unknown) => R | null, same: (a: R, b: R) => boolean): R[] | null {
  const value = parseJson(raw)
  if (!Array.isArray(value)) return null
  const items = value.map(toItem)
  if (items.some(item => item === null)) return null
  return uniqueRecent(items as R[], same)
}

// ─── Depozitul unui tip ──────────────────────────────────────────────────────

export interface ReadingStoreConfig<P, R, S> {
  tip: string
  parsePosition: (raw: string) => P | null
  parseRecent: (raw: string) => R[] | null
  /** Starea afișată de card, calculată o singură dată pentru fiecare conținut al stocării. */
  select: (position: P | null, recent: R[]) => S | null
  /** Cheile de dinaintea modulului comun; se mută la prima citire, apoi se șterg. */
  legacy?: { position: string; recent: string }
}

export interface ReadingStore<P, R, S> {
  positionKey: string
  recentKey: string
  readPosition: () => P | null
  readRecent: () => R[]
  writePosition: (position: P) => void
  removePosition: () => void
  writeRecent: (recent: R[]) => void
  clear: () => void
  subscribe: (onChange: () => void) => () => void
  /** Același rezultat cât timp stocarea nu se schimbă, cum cere useSyncExternalStore. */
  getSnapshot: () => S | null
}

export function createReadingStore<P, R, S>(config: ReadingStoreConfig<P, R, S>): ReadingStore<P, R, S> {
  const keys = { position: positionKey(config.tip), recent: recentKey(config.tip) }
  const changeEvent = `lectura:${config.tip}`

  function migrateKey(legacyKey: string, key: string, isValid: (raw: string) => boolean) {
    const raw = readRaw(legacyKey)
    if (raw === null) return
    if (readRaw(key) === null && isValid(raw)) {
      writeRaw(key, raw)
      // stocare plină: cheia veche rămâne, ca să nu se piardă poziția
      if (readRaw(key) === null) return
    }
    removeRaw(legacyKey)
  }

  function migrate() {
    if (!config.legacy) return
    migrateKey(config.legacy.position, keys.position, raw => config.parsePosition(raw) !== null)
    migrateKey(config.legacy.recent, keys.recent, raw => config.parseRecent(raw) !== null)
  }

  /** O valoare invalidă se șterge, ca să nu fie validată la nesfârșit. */
  function readValid<T>(key: string, parse: (raw: string) => T | null): T | null {
    migrate()
    const raw = readRaw(key)
    if (raw === null) return null
    const parsed = parse(raw)
    if (parsed === null) removeRaw(key)
    return parsed
  }

  const readPosition = () => readValid(keys.position, config.parsePosition)
  const readRecent = () => readValid(keys.recent, config.parseRecent) ?? []

  const rawSnapshot = () => {
    migrate()
    return `${readRaw(keys.position)}\n${readRaw(keys.recent)}`
  }
  let cached: { raw: string; value: S | null } | null = null

  const notify = () => {
    try { window.dispatchEvent(new Event(changeEvent)) } catch { /* fără window */ }
  }

  return {
    positionKey: keys.position,
    recentKey: keys.recent,
    readPosition,
    readRecent,
    writePosition: position => writeRaw(keys.position, JSON.stringify(position)),
    removePosition: () => removeRaw(keys.position),
    writeRecent: recent => writeRaw(keys.recent, JSON.stringify(recent)),
    clear() {
      for (const key of [keys.position, keys.recent, config.legacy?.position, config.legacy?.recent]) {
        if (key) removeRaw(key)
      }
      notify()
    },
    /** `pageshow`: revenirea cu „Înapoi", din bfcache, trebuie să arate poziția nouă. */
    subscribe(onChange) {
      const events = [changeEvent, 'storage', 'pageshow']
      events.forEach(e => window.addEventListener(e, onChange))
      return () => events.forEach(e => window.removeEventListener(e, onChange))
    },
    getSnapshot() {
      if (cached?.raw === rawSnapshot()) return cached.value
      const value = config.select(readPosition(), readRecent())
      // citirea poate șterge valori invalide: cheia de cache se ia după ea
      cached = { raw: rawSnapshot(), value }
      return value
    },
  }
}

// ─── Momentul salvării ───────────────────────────────────────────────────────

export interface PositionSaver {
  /** Salvează după pauză; o nouă cerere reia numărătoarea. */
  schedule: () => void
  /** Salvează acum. */
  flush: () => void
  cancel: () => void
  /** Scoate ascultătorii, fără să salveze. */
  dispose: () => void
}

/** Salvează cu debounce și imediat când pagina se ascunde sau se închide. */
export function createPositionSaver(save: () => void, delay = SAVE_DEBOUNCE_MS): PositionSaver {
  let timer: ReturnType<typeof setTimeout> | undefined
  const cancel = () => clearTimeout(timer)
  const flush = () => { cancel(); save() }
  const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flush)
  return {
    schedule() { cancel(); timer = setTimeout(flush, delay) },
    flush,
    cancel,
    dispose() {
      cancel()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    },
  }
}
