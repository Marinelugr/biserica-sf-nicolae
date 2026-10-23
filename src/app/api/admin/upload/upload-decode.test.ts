import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// processImageBuffer real; sharp simulat să arunce (ca binarul fără HEVC) doar când `sharpThrows`.
const auth = vi.fn()
const upload = vi.fn()
let sharpThrows = false

vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: (...a: unknown[]) => upload(...a),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://proiect.supabase.co/storage/v1/object/public/images/${path}` } }),
      }),
    },
  }),
}))
vi.mock('sharp', async (importOriginal) => {
  const real = (await importOriginal<{ default: typeof import('sharp') }>()).default
  const fake = (...args: Parameters<typeof real>) => {
    if (!sharpThrows) return real(...args)
    const chain = {
      rotate: () => chain,
      resize: () => chain,
      webp: () => chain,
      toBuffer: () => Promise.reject(new Error('heif: Error while loading plugin: Support for this compression format has not been built in (11.6003)')),
    }
    return chain
  }
  return { default: Object.assign(fake, { cache: () => {}, concurrency: () => {} }) }
})

const { POST } = await import('./route')
const sharp = (await import('sharp')).default

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://proiect.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'cheie-de-test')
  auth.mockReset().mockResolvedValue({ user: { id: 'admin' } })
  upload.mockReset().mockImplementation((path: string) => Promise.resolve({ data: { path }, error: null }))
  sharpThrows = false
})

function send(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return POST(new NextRequest('http://localhost/api/admin/upload', { method: 'POST', body: fd }))
}

describe('POST /api/admin/upload — fișiere nedecodabile', () => {
  it('HEIC pe care sharp nu-l poate decoda → 415, nimic în Storage', async () => {
    sharpThrows = true
    const res = await send(new File([new Uint8Array(200)], 'IMG_7475.HEIC', { type: 'image/heic' }))
    expect(res.status).toBe(415)
    expect(await res.json()).toEqual({ error: 'Formatul HEIC nu poate fi procesat pe server. Exportă poza ca JPG și încearcă din nou.' })
    expect(upload).not.toHaveBeenCalled()
  })

  it('HEIF la fel ca HEIC', async () => {
    sharpThrows = true
    const res = await send(new File([new Uint8Array(200)], 'a.heif', { type: 'image/heif' }))
    expect(res.status).toBe(415)
    expect((await res.json()).error).toMatch(/HEIC/)
    expect(upload).not.toHaveBeenCalled()
  })

  it('fișier text redenumit .jpg → 415 „nu pare o poză validă”, nimic în Storage', async () => {
    const res = await send(new File(['acesta nu e o poză'], 'proba.jpg', { type: 'image/jpeg' }))
    expect(res.status).toBe(415)
    expect(await res.json()).toEqual({ error: 'Fișierul nu pare o poză validă.' })
    expect(upload).not.toHaveBeenCalled()
  })

  it('GIF și SVG trec neschimbate (sharp nu se folosește)', async () => {
    sharpThrows = true
    for (const [name, type] of [['a.gif', 'image/gif'], ['a.svg', 'image/svg+xml']]) {
      upload.mockClear()
      const res = await send(new File([new Uint8Array([1, 2, 3])], name, { type }))
      expect(res.status).toBe(200)
      expect(upload).toHaveBeenCalledTimes(1)
      expect(upload.mock.calls[0][2].contentType).toBe(type)
    }
  })

  it('JPEG mic valid trece', async () => {
    const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#c00' } }).jpeg().toBuffer()
    const res = await send(new File([new Uint8Array(jpeg)], 'mic.jpg', { type: 'image/jpeg' }))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toMatch(/^https:\/\/proiect\.supabase\.co\/storage\/v1\/object\/public\/images\/admin\/\d+-mic\.(jpg|webp)$/)
    expect(upload).toHaveBeenCalledTimes(1)
  })
})
