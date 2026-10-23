// Funcții pure pentru pozele care nu se pot afișa (ex. .heic salvate înainte de conversia în browser).

function pathOf(url: string): string {
  return url.split(/[?#]/)[0]
}

// Extensia din adresă, cu punct și litere mici (`.heic`), sau null dacă nu are.
export function extensionOf(url: string): string | null {
  const last = pathOf(url).split('/').pop() ?? ''
  const m = last.match(/\.([a-z0-9]+)$/i)
  return m ? `.${m[1].toLowerCase()}` : null
}

export interface LoadFailure {
  extension: string | null
  contentType: string | null
  /** Ex. „.heic · image/heic”; gol dacă nu se știe nimic. */
  detail: string
}

export function describeLoadFailure(url: string, contentType?: string | null): LoadFailure {
  const extension = extensionOf(url)
  const type = contentType?.split(';')[0].trim().toLowerCase() || null
  return { extension, contentType: type, detail: [extension, type].filter(Boolean).join(' · ') }
}

// Chrome/Firefox nu afișează HEIC/HEIF; pe paginile publice le omitem în loc să arătăm o imagine ruptă.
export function isDisplayableImageUrl(url: string | null | undefined): url is string {
  if (!url || !url.trim()) return false
  const ext = extensionOf(url)
  return ext !== '.heic' && ext !== '.heif'
}
