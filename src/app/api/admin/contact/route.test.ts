import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.fn()
const upsert = vi.fn()
const findMany = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { setting: { upsert: (...a: unknown[]) => upsert(...a), findMany: (...a: unknown[]) => findMany(...a) } },
}))

const { PUT } = await import('./route')

function put(body: unknown) {
  return PUT(new NextRequest('http://localhost/api/admin/contact', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  auth.mockReset().mockResolvedValue({ user: { id: 'admin' } })
  upsert.mockReset().mockResolvedValue({})
  findMany.mockReset().mockResolvedValue([])
})

describe('PUT /api/admin/contact', () => {
  it('fără sesiune → 401, nimic salvat', async () => {
    auth.mockResolvedValue(null)
    expect((await put({ phone: '1' })).status).toBe(401)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('salvează câmpurile rămase; programul de slujbe nu se mai scrie', async () => {
    const res = await put({ phone: '+373 1', email: 'a@b.md', address: 'Sat', facebook: 'https://fb', message: '<p>x</p>', mapEmbed: 'https://m', schedule: 'Duminică - 09:00' })
    expect(res.status).toBe(200)
    const keys = upsert.mock.calls.map(c => (c[0] as { where: { key: string } }).where.key).sort()
    expect(keys).toEqual(['contact_address', 'contact_email', 'contact_facebook', 'contact_map_embed', 'contact_message', 'contact_phone'])
    const body = await res.json()
    expect(body).not.toHaveProperty('schedule')
    expect(body.phone).toBeTruthy()
  })
})
