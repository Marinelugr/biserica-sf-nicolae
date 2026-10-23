import { describe, it, expect } from 'vitest'
import { describeLoadFailure, isDisplayableImageUrl, extensionOf, onlyDisplayable } from './imageLoad'

const base = 'https://x.supabase.co/storage/v1/object/public/images/admin'

describe('describeLoadFailure', () => {
  it('extensie cu majuscule + tip', () => {
    expect(describeLoadFailure(`${base}/1-IMG_7475.HEIC`, 'image/heic')).toEqual({ extension: '.heic', contentType: 'image/heic', detail: '.heic · image/heic' })
  })
  it('parametri și fragment în adresă', () => {
    expect(describeLoadFailure(`${base}/a.heic?width=480&v=2#x`, null).extension).toBe('.heic')
    expect(describeLoadFailure(`${base}/a.webp?x=a.heic`, null).extension).toBe('.webp')
  })
  it('tip lipsă sau cu parametri', () => {
    expect(describeLoadFailure(`${base}/a.heic`)).toEqual({ extension: '.heic', contentType: null, detail: '.heic' })
    expect(describeLoadFailure(`${base}/a.heic`, '')).toMatchObject({ contentType: null })
    expect(describeLoadFailure(`${base}/a.jpg`, 'Text/HTML; charset=utf-8').contentType).toBe('text/html')
  })
  it('fără extensie', () => {
    expect(describeLoadFailure(`${base}/fara-extensie`, null)).toEqual({ extension: null, contentType: null, detail: '' })
    expect(extensionOf('https://x.ro/director.cu.punct/poza')).toBeNull()
  })
})

describe('isDisplayableImageUrl', () => {
  it('HEIC/HEIF → false, indiferent de majuscule și parametri', () => {
    expect(isDisplayableImageUrl(`${base}/a.heic`)).toBe(false)
    expect(isDisplayableImageUrl(`${base}/a.HEIF`)).toBe(false)
    expect(isDisplayableImageUrl(`${base}/a.HeIc?t=1`)).toBe(false)
  })
  it('null / gol → false', () => {
    expect(isDisplayableImageUrl(null)).toBe(false)
    expect(isDisplayableImageUrl(undefined)).toBe(false)
    expect(isDisplayableImageUrl('')).toBe(false)
    expect(isDisplayableImageUrl('   ')).toBe(false)
  })
  it('restul → true', () => {
    expect(isDisplayableImageUrl(`${base}/a.webp`)).toBe(true)
    expect(isDisplayableImageUrl(`${base}/a.jpg?x=b.heic`)).toBe(true)
    expect(isDisplayableImageUrl('/images/12.jpg')).toBe(true)
    expect(isDisplayableImageUrl(`${base}/heic`)).toBe(true)
  })
})

describe('onlyDisplayable', () => {
  it('scoate pozele HEIC și miniaturile HEIC', () => {
    const items = [
      { id: '1', url: `${base}/a.webp`, thumbnailUrl: `${base}/t.webp` },
      { id: '2', url: `${base}/b.heic`, thumbnailUrl: null },
      { id: '3', url: `${base}/c.jpg`, thumbnailUrl: `${base}/t.HEIC` },
    ]
    expect(onlyDisplayable(items)).toEqual([
      { id: '1', url: `${base}/a.webp`, thumbnailUrl: `${base}/t.webp` },
      { id: '3', url: `${base}/c.jpg`, thumbnailUrl: null },
    ])
    expect(onlyDisplayable([items[1]])).toEqual([])
  })
})
