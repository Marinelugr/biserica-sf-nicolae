import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.fn()
const createMany = vi.fn()
const create = vi.fn()

vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@/lib/prisma', () => ({ prisma: { mediaItem: { createMany: (a: unknown) => createMany(a), create: (a: unknown) => create(a) } } }))

const { POST } = await import('./route')

const SB = 'https://proiect.supabase.co'
const pub = (name: string) => `${SB}/storage/v1/object/public/images/admin/${name}`

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/admin/media', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', SB)
  auth.mockReset().mockResolvedValue({ user: { id: 'admin' } })
  createMany.mockReset().mockImplementation(({ data }: { data: unknown[] }) => Promise.resolve({ count: data.length }))
  create.mockReset().mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'm1', ...data }))
})

describe('POST /api/admin/media', () => {
  it('neautentificat → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await post({ entityType: 'article', entityId: 'a1', items: [{ url: pub('a.webp') }] })
    expect(res.status).toBe(401)
    expect(createMany).not.toHaveBeenCalled()
  })

  it('items valide → createMany o singură dată, cu order de la 0', async () => {
    const res = await post({
      entityType: 'article', entityId: 'a1',
      items: [
        { url: pub('a.webp'), thumbnailUrl: `${SB}/storage/v1/object/public/images/thumbnails/a.webp`, caption: ' Hram ', order: 7 },
        { url: pub('b.webp'), caption: '' },
      ],
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ count: 2 })
    expect(createMany).toHaveBeenCalledTimes(1)
    expect(createMany.mock.calls[0][0].data).toEqual([
      { url: pub('a.webp'), thumbnailUrl: `${SB}/storage/v1/object/public/images/thumbnails/a.webp`, caption: 'Hram', order: 0, entityType: 'article', entityId: 'a1' },
      { url: pub('b.webp'), thumbnailUrl: null, caption: null, order: 1, entityType: 'article', entityId: 'a1' },
    ])
  })

  it('adresă din afara Storage-ului nostru → 400', async () => {
    for (const url of ['https://rau.example/x.webp', `${SB}.rau.example/storage/v1/object/public/x.webp`, `${SB}/storage/v1/object/sign/images/x.webp`]) {
      const res = await post({ entityType: 'article', entityId: 'a1', items: [{ url }] })
      expect(res.status, url).toBe(400)
    }
    const thumb = await post({ entityType: 'article', entityId: 'a1', items: [{ url: pub('a.webp'), thumbnailUrl: 'https://rau.example/t.webp' }] })
    expect(thumb.status).toBe(400)
    expect(createMany).not.toHaveBeenCalled()
  })

  it('peste 100 de poze → 400', async () => {
    const items = Array.from({ length: 101 }, (_, i) => ({ url: pub(`${i}.webp`) }))
    const res = await post({ entityType: 'article', entityId: 'a1', items })
    expect(res.status).toBe(400)
    expect(createMany).not.toHaveBeenCalled()
  })

  it('entityType necunoscut → 400', async () => {
    const res = await post({ entityType: 'user', entityId: 'a1', items: [{ url: pub('a.webp') }] })
    expect(res.status).toBe(400)
  })

  it('entityId lipsă → 400', async () => {
    const res = await post({ entityType: 'article', entityId: null, items: [{ url: pub('a.webp') }] })
    expect(res.status).toBe(400)
  })

  it('cererea veche cu un singur url funcționează ca înainte', async () => {
    const res = await post({ url: 'https://orice/x.webp', thumbnailUrl: 'https://orice/t.webp', entityType: 'saint', entityId: 's1', order: 3 })
    expect(res.status).toBe(201)
    expect(create).toHaveBeenCalledWith({ data: { url: 'https://orice/x.webp', thumbnailUrl: 'https://orice/t.webp', caption: null, order: 3, entityType: 'saint', entityId: 's1' } })
    expect(createMany).not.toHaveBeenCalled()
  })

  it('cererea veche fără url → 400 ca înainte', async () => {
    const res = await post({ entityType: 'saint', entityId: 's1' })
    expect(res.status).toBe(400)
  })
})
