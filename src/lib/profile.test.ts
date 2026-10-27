import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
const { pickProfilePhoto } = await import('./profile')

const F = '/images/parinte-marin.jpg'
const MSG = 'https://x.supabase.co/storage/v1/object/public/images/admin/1792779630594-1.webp'
const PRIEST = 'https://x.supabase.co/storage/v1/object/public/images/admin/1782677881028-123.jpg'

describe('pickProfilePhoto', () => {
  it('poza de la mesaj are prioritate față de poza parohului', () => {
    expect(pickProfilePhoto({ messagePhoto: MSG, priestPhoto: PRIEST, fallback: F })).toBe(MSG)
  })
  it('mesaj fără poză → poza parohului', () => {
    expect(pickProfilePhoto({ messagePhoto: null, priestPhoto: PRIEST, fallback: F })).toBe(PRIEST)
    expect(pickProfilePhoto({ messagePhoto: '', priestPhoto: PRIEST, fallback: F })).toBe(PRIEST)
    expect(pickProfilePhoto({ priestPhoto: PRIEST, fallback: F })).toBe(PRIEST)
  })
  it('ambele goale → poza implicită', () => {
    expect(pickProfilePhoto({ messagePhoto: null, priestPhoto: null, fallback: F })).toBe(F)
    expect(pickProfilePhoto({ messagePhoto: '', priestPhoto: '', fallback: F })).toBe(F)
    expect(pickProfilePhoto({ fallback: F })).toBe(F)
  })
  it('șirurile doar din spații nu contează; spațiile de la margini se scot', () => {
    expect(pickProfilePhoto({ messagePhoto: '   ', priestPhoto: PRIEST, fallback: F })).toBe(PRIEST)
    expect(pickProfilePhoto({ messagePhoto: ' \t\n', priestPhoto: '  ', fallback: F })).toBe(F)
    expect(pickProfilePhoto({ messagePhoto: `  ${MSG} `, priestPhoto: PRIEST, fallback: F })).toBe(MSG)
  })
})
