import { describe, it, expect } from 'vitest'
import { isHeic, heicErrorMessage } from './heic'

describe('isHeic', () => {
  it('după tip', () => {
    expect(isHeic({ name: 'poza', type: 'image/heic' })).toBe(true)
    expect(isHeic({ name: 'poza', type: 'image/HEIF' })).toBe(true)
  })
  it('după extensie, când tipul e gol (unele browsere)', () => {
    expect(isHeic({ name: 'IMG_7475.HEIC', type: '' })).toBe(true)
    expect(isHeic({ name: 'a.heif', type: '' })).toBe(true)
  })
  it('restul nu', () => {
    expect(isHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false)
    expect(isHeic({ name: 'heic.png', type: 'image/png' })).toBe(false)
    expect(isHeic({ name: 'a.heic.jpg', type: '' })).toBe(false)
  })
  it('mesajul de eroare are numele pozei', () => {
    expect(heicErrorMessage('IMG_1.HEIC')).toMatch(/^Poza IMG_1\.HEIC este în format HEIC/)
  })
})
