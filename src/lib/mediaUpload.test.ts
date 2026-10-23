import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadImage, attachPendingMedia } from '@/lib/mediaUpload'

const file = new File([new Uint8Array([1, 2, 3])], 'poza.jpg', { type: 'image/jpeg' })

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
function html(status: number) {
  return new Response('<html><body>502 Bad Gateway</body></html>', { status, headers: { 'content-type': 'text/html' } })
}

function mockFetch(...responses: Array<Response | Error>) {
  const fn = vi.fn()
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r)
    else fn.mockResolvedValueOnce(r)
  }
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => { vi.unstubAllGlobals() })

describe('uploadImage', () => {
  it('întoarce adresa la succes', async () => {
    const f = mockFetch(json(200, { url: 'https://x/storage/v1/object/public/images/a.webp' }))
    await expect(uploadImage(file)).resolves.toBe('https://x/storage/v1/object/public/images/a.webp')
    expect(f).toHaveBeenCalledTimes(1)
    const body = f.mock.calls[0][1].body as FormData
    expect(body.get('thumbnail')).toBeNull()
  })

  it('trimite thumbnail=true pentru miniatură', async () => {
    const f = mockFetch(json(200, { url: 'u' }))
    await uploadImage(file, { thumbnail: true })
    expect((f.mock.calls[0][1].body as FormData).get('thumbnail')).toBe('true')
  })

  it('reîncearcă o dată după un 502 HTML', async () => {
    const f = mockFetch(html(502), json(200, { url: 'u2' }))
    await expect(uploadImage(file, { retryDelayMs: 0 })).resolves.toBe('u2')
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('după două 502 dă mesaj cu codul și numele pozei', async () => {
    const f = mockFetch(html(502), html(502))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('poza.jpg: Serverul nu a răspuns (cod 502). Încearcă din nou peste un minut.')
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('401 → sesiune expirată, fără reîncercare', async () => {
    const f = mockFetch(json(401, { error: 'Neautorizat' }))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('Sesiunea a expirat. Autentifică-te din nou și reia încărcarea.')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('413 HTML → poză prea mare', async () => {
    mockFetch(html(413))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('poza.jpg: Poza este prea mare pentru server.')
  })

  it('eroare de rețea: reîncearcă, apoi mesaj de conexiune', async () => {
    const f = mockFetch(new TypeError('Failed to fetch'), new TypeError('Failed to fetch'))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('poza.jpg: Conexiunea la internet s-a întrerupt.')
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('eroare de rețea urmată de succes', async () => {
    mockFetch(new TypeError('Failed to fetch'), json(200, { url: 'u3' }))
    await expect(uploadImage(file, { retryDelayMs: 0 })).resolves.toBe('u3')
  })

  it('folosește mesajul {error} trimis de server', async () => {
    mockFetch(json(400, { error: 'Tip fișier neacceptat.' }))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('poza.jpg: Tip fișier neacceptat.')
  })

  it('200 cu HTML în loc de JSON nu dă „Unexpected token”', async () => {
    mockFetch(new Response('<html></html>', { status: 200 }))
    await expect(uploadImage(file, { retryDelayMs: 0 })).rejects.toThrow('Serverul nu a răspuns (cod 200)')
  })
})

describe('attachPendingMedia', () => {
  it('un singur POST cu items renumerotate', async () => {
    const f = mockFetch(json(201, { count: 2 }))
    const n = await attachPendingMedia('article', 'a1', [
      { tempId: 't1', url: 'u1', thumbnailUrl: 'th1', caption: ' Hram ', order: 5 },
      { tempId: 't2', url: 'u2', caption: '', order: 9 },
    ])
    expect(n).toBe(2)
    expect(f).toHaveBeenCalledTimes(1)
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      entityType: 'article', entityId: 'a1',
      items: [
        { url: 'u1', thumbnailUrl: 'th1', caption: 'Hram', order: 0 },
        { url: 'u2', caption: null, order: 1 },
      ],
    })
  })

  it('nu reîncearcă la 502 (ar putea dubla pozele)', async () => {
    const f = mockFetch(html(502))
    await expect(attachPendingMedia('article', 'a1', [{ tempId: 't', url: 'u', caption: '', order: 0 }])).rejects.toThrow('cod 502')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('listă goală → nicio cerere', async () => {
    const f = mockFetch()
    await expect(attachPendingMedia('article', 'a1', [])).resolves.toBe(0)
    expect(f).not.toHaveBeenCalled()
  })
})
