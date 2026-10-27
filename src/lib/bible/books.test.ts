import { describe, it, expect } from 'vitest'
import { BIBLE_BOOKS, NT_CHAPTER_COUNTS, getBook, bookLabel, neighbors } from './books'
import { aliasKey, bookNames } from './reference'

describe('BIBLE_BOOKS', () => {
  it('80 de cărți: 53 VT + 27 NT, orderNum 1..80 fără goluri', () => {
    expect(BIBLE_BOOKS).toHaveLength(80)
    expect(BIBLE_BOOKS.filter(b => b.testament === 'VT')).toHaveLength(53)
    expect(BIBLE_BOOKS.filter(b => b.testament === 'NT')).toHaveLength(27)
    expect(BIBLE_BOOKS.map(b => b.orderNum)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1))
    // VT întâi, apoi NT
    expect(BIBLE_BOOKS.slice(0, 53).every(b => b.testament === 'VT')).toBe(true)
  })

  it('slug unic și valid pentru URL; etichete nevide în 3 limbi', () => {
    const slugs = BIBLE_BOOKS.map(b => b.slug)
    expect(new Set(slugs).size).toBe(80)
    for (const b of BIBLE_BOOKS) {
      expect(b.slug).toMatch(/^[a-z0-9-]+$/)
      for (const l of [b.labelRo, b.labelRu, b.labelEn]) expect(l.trim().length).toBeGreaterThan(0)
      expect(b.aliases.length).toBeGreaterThan(0)
    }
  })

  it('NT_CHAPTER_COUNTS: exact cele 27 de cărți NT, total 260', () => {
    const nt = BIBLE_BOOKS.filter(b => b.testament === 'NT').map(b => b.slug).sort()
    expect(Object.keys(NT_CHAPTER_COUNTS).sort()).toEqual(nt)
    expect(Object.values(NT_CHAPTER_COUNTS).reduce((a, b) => a + b, 0)).toBe(260)
  })

  it('niciun alias (după normalizare) nu duce la două cărți', () => {
    const owner = new Map<string, string>()
    const clashes: string[] = []
    for (const b of BIBLE_BOOKS) {
      for (const key of new Set(bookNames(b).map(aliasKey))) {
        const o = owner.get(key)
        if (o && o !== b.slug) clashes.push(`${key}: ${o} / ${b.slug}`)
        owner.set(key, b.slug)
      }
    }
    expect(clashes).toEqual([])
  })

  it('getBook, bookLabel, neighbors', () => {
    const ioan = getBook('ioan')!
    expect(bookLabel(ioan, 'ro')).toBe('Sfânta Evanghelie după Ioan')
    expect(bookLabel(ioan, 'en')).toMatch(/John/)
    expect(bookLabel(ioan, 'ru')).toMatch(/Иоанна/)
    expect(getBook('nu-exista')).toBeUndefined()
    expect(neighbors('facerea').prev).toBeNull()
    expect(neighbors('facerea').next?.slug).toBe('iesirea')
    expect(neighbors('apocalipsa').next).toBeNull()
    expect(neighbors('matei').prev?.slug).toBe('rugaciunea-manase')
    expect(neighbors('x')).toEqual({ prev: null, next: null })
  })
})
