/** Regulile raportărilor de la cititori: funcții pure, fără bază de date. */
import { createHmac } from 'node:crypto'
import { normalizeVerseText } from './text'
import { BAD_CHAR_RE } from './validate'
import { MAX_REPORT_MESSAGE, type ReportErrorCode } from './reportLimits'

export const REPORT_LIMIT_PER_HOUR = 10
export const THROTTLE_WINDOW_MS = 60 * 60 * 1000
export const THROTTLE_KEEP_MS = 24 * 60 * 60 * 1000

const URL_RE = /(?:[a-z][a-z0-9+.-]*:\/\/|\bwww\.|\b[\p{L}\p{N}-]+\.(?:com|net|org|info|biz|io|co|ro|md|ru|ua|eu|de|fr|uk|us|xyz|top|site|online|shop|club|app|dev|link|ly|me|tv)\b)/iu

export function containsUrl(text: string): boolean {
  return URL_RE.test(text)
}

export type MessageCheck = { ok: true; message: string | null } | { ok: false; code: ReportErrorCode }

/** Mesajul e opțional. Se curăță ca textul versetelor, apoi se validează. */
export function checkReportMessage(raw: string): MessageCheck {
  const message = normalizeVerseText(raw)
  if (message.length > MAX_REPORT_MESSAGE) return { ok: false, code: 'too-long' }
  if (BAD_CHAR_RE.test(message)) return { ok: false, code: 'invalid' }
  if (containsUrl(message)) return { ok: false, code: 'url' }
  return { ok: true, message: message || null }
}

/** Capcana: un câmp pe care un om nu îl vede. */
export function isHoneypotFilled(value: string | null | undefined): boolean {
  return !!value && value.trim() !== ''
}

/**
 * Ultima adresă din X-Forwarded-For e cea scrisă de serverul nostru; pe cele dinainte
 * le poate trimite oricine, iar cu ele limita s-ar ocoli.
 */
export function clientAddress(forwardedFor: string | null, realIp: string | null): string {
  const last = forwardedFor?.split(',').map(s => s.trim()).filter(Boolean).pop()
  return last || realIp?.trim() || 'necunoscut'
}

/** Nu se păstrează niciodată adresa în clar. */
export function throttleKey(address: string, userAgent: string | null, salt: string): string {
  return createHmac('sha256', salt).update(`${address}\u0000${userAgent ?? ''}`).digest('hex')
}
