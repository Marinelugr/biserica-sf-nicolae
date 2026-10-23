// Încărcarea pozelor din admin, folosită de MediaGallery și ImageUploadButton.
// Pe TopHost (LiteSpeed + Passenger) un răspuns de eroare poate fi o pagină
// HTML (502/503), nu JSON, deci corpul se citește ca text și se parsează doar
// dacă se poate. Mesajele ajung direct la utilizator: în română, fără termeni tehnici.

import type { PendingMedia } from '@/lib/pendingMedia'
import { toAttachPayload } from '@/lib/pendingMedia'

const RETRY_STATUSES = new Set([502, 503, 504])
const RETRY_DELAY_MS = 1500

interface UploadOptions {
  thumbnail?: boolean
  signal?: AbortSignal
  /** Doar pentru teste. */
  retryDelayMs?: number
}

async function readBody(res: Response): Promise<{ error?: string; [key: string]: unknown } | null> {
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

function messageFor(status: number, body: { error?: string } | null): string {
  if (status === 401) return 'Sesiunea a expirat. Autentifică-te din nou și reia încărcarea.'
  if (status === 413) return 'Poza este prea mare pentru server.'
  if (body && typeof body.error === 'string' && body.error) return body.error
  if (status >= 500 || !body) return `Serverul nu a răspuns (cod ${status}). Încearcă din nou peste un minut.`
  return `Eroare la încărcare (cod ${status}).`
}

const NETWORK_MESSAGE = 'Conexiunea la internet s-a întrerupt.'

function isAbort(err: unknown): boolean {
  return (err as { name?: string })?.name === 'AbortError'
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Trimite cererea; o singură reîncercare la 502/503/504 sau la o eroare de rețea.
async function fetchWithRetry(input: string, init: RequestInit, retryDelayMs: number): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(input, init)
      if (attempt === 0 && RETRY_STATUSES.has(res.status)) {
        await sleep(retryDelayMs)
        continue
      }
      return res
    } catch (err) {
      if (isAbort(err)) throw err
      if (attempt === 0 && err instanceof TypeError) {
        await sleep(retryDelayMs)
        continue
      }
      throw new Error(NETWORK_MESSAGE)
    }
  }
}

// Fără reîncercare: un POST repetat după un 502 ar putea crea a doua oară aceeași înregistrare.
async function fetchOnce(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (err) {
    if (isAbort(err)) throw err
    throw new Error(NETWORK_MESSAGE)
  }
}

/** Încarcă o poză în Storage și întoarce adresa ei publică. */
export async function uploadImage(file: File, opts: UploadOptions = {}): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  if (opts.thumbnail) fd.append('thumbnail', 'true')

  try {
    const res = await fetchWithRetry('/api/admin/upload', { method: 'POST', body: fd, signal: opts.signal }, opts.retryDelayMs ?? RETRY_DELAY_MS)
    const body = await readBody(res)
    if (!res.ok) throw new Error(messageFor(res.status, body))
    if (!body || typeof body.url !== 'string') throw new Error(`Serverul nu a răspuns (cod ${res.status}). Încearcă din nou peste un minut.`)
    return body.url
  } catch (err) {
    if (isAbort(err)) throw err
    const msg = err instanceof Error ? err.message : NETWORK_MESSAGE
    throw new Error(`${file.name}: ${msg}`)
  }
}

/** Leagă pozele „în așteptare” de o entitate abia creată, într-o singură cerere. */
export async function attachPendingMedia(entityType: string, entityId: string, pending: PendingMedia[]): Promise<number> {
  if (!pending.length) return 0
  const res = await fetchOnce('/api/admin/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityType, entityId, items: toAttachPayload(pending) }),
  })
  const body = await readBody(res)
  if (!res.ok) throw new Error(messageFor(res.status, body))
  return typeof body?.count === 'number' ? body.count : pending.length
}

/** Leagă o singură poză de o entitate existentă (galeria de la editare). */
export async function attachMedia<T>(payload: { url: string; thumbnailUrl?: string; entityType: string; entityId: string; order: number }): Promise<T> {
  const res = await fetchOnce('/api/admin/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await readBody(res)
  if (!res.ok || !body) throw new Error(messageFor(res.status, body))
  return body as T
}
