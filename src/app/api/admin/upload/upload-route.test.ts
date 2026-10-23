import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.fn()
const process = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@/lib/imageProcessorServer', () => ({ processImageBuffer: (...a: unknown[]) => process(...a) }))

const { POST } = await import('./route')

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://proiect.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'cheie-de-test')
  auth.mockReset().mockResolvedValue({ user: { id: 'admin' } })
  process.mockReset()
})

describe('POST /api/admin/upload', () => {
  it('neautentificat → 401 JSON', async () => {
    auth.mockResolvedValue(null)
    const res = await POST(new NextRequest('http://localhost/api/admin/upload', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('corp multipart întrerupt → 400 JSON în română', async () => {
    const res = await POST(new NextRequest('http://localhost/api/admin/upload', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=xyz' },
      body: '--xyz\r\nContent-Disposition: form-data; name="file"; filename="a.jpg"\r\n\r\nincomplet',
    }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Încărcare întreruptă sau coruptă. Încearcă din nou.' })
  })

  it('excepție neprevăzută → 500 JSON fără detalii interne', async () => {
    process.mockRejectedValue(new Error('vips: out of memory at 0xdeadbeef'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fd = new FormData()
    fd.append('file', new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' }))
    const res = await POST(new NextRequest('http://localhost/api/admin/upload', { method: 'POST', body: fd }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).not.toMatch(/vips|0x/)
  })
})
