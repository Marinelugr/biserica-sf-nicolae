import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.fn()
const findFirst = vi.fn()
const create = vi.fn()
const update = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { priestMessage: { findFirst: (...a: unknown[]) => findFirst(...a), create: (...a: unknown[]) => create(...a), update: (...a: unknown[]) => update(...a) } },
}))

const { GET, POST } = await import('./route')

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/admin/mesaj-parinte', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  auth.mockReset().mockResolvedValue({ user: { id: 'admin' } })
  findFirst.mockReset().mockResolvedValue(null)
  create.mockReset().mockImplementation(({ data }) => Promise.resolve({ id: 'm1', ...data }))
  update.mockReset()
})

describe('/api/admin/mesaj-parinte', () => {
  it('fără sesiune → 401 (GET și POST), nimic scris', async () => {
    auth.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
    expect((await post({ mesajRo: '<p>Text</p>' })).status).toBe(401)
    expect(create).not.toHaveBeenCalled()
  })

  it('mesaj gol → 400, inclusiv `<p></p>` din editor', async () => {
    for (const mesajRo of ['', '<p></p>', '<p>&nbsp; </p><p><br></p>', undefined, 42]) {
      const res = await post({ mesajRo })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Mesajul (Română) este obligatoriu')
    }
    expect(create).not.toHaveBeenCalled()
  })

  it('HTML peste 30.000 de caractere → 400', async () => {
    const res = await post({ mesajRo: '<p>' + 'a'.repeat(30_000) + '</p>' })
    expect(res.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('HTML valid se salvează neschimbat', async () => {
    const mesajRo = '<p><strong>Iubiți credincioși,</strong></p><p>Text</p>'
    const res = await post({ mesajRo, semnaturaRo: 'Pr. Marin' })
    expect(res.status).toBe(200)
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ mesajRo, semnaturaRo: 'Pr. Marin' }) })
  })
})
