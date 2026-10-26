import { describe, it, expect } from 'vitest'
import { chapterNav, chapterPath, parseChapterParam } from './nav'

describe('chapterNav', () => {
  it('în interiorul cărții', () => {
    expect(chapterNav('ioan', 3, 21, 24)).toEqual({ prev: { slug: 'ioan', chapter: 2 }, next: { slug: 'ioan', chapter: 4 } })
  })
  it('peste granița cărții: ultimul capitol al cărții anterioare, primul al următoarei', () => {
    expect(chapterNav('ioan', 1, 21, 24).prev).toEqual({ slug: 'luca', chapter: 24 })
    expect(chapterNav('ioan', 21, 21, 24).next).toEqual({ slug: 'faptele-apostolilor', chapter: 1 })
  })
  it('cartea anterioară neimportată → pagina cărții; capetele Bibliei → null', () => {
    expect(chapterPath(chapterNav('ioan', 1, 21, 0).prev!)).toBe('/biblie/luca')
    expect(chapterNav('facerea', 1, 50, null).prev).toBeNull()
    expect(chapterNav('apocalipsa', 22, 22, 3).next).toBeNull()
    expect(chapterPath({ slug: 'iuda', chapter: 1 })).toBe('/biblie/iuda/1')
  })
})

describe('parseChapterParam', () => {
  it('doar numere întregi ≥ 1', () => {
    expect(parseChapterParam('3')).toBe(3)
    expect(parseChapterParam('150')).toBe(150)
    for (const bad of ['0', '-1', '03', '3a', '1.5', '', '1000', 'abc']) expect(parseChapterParam(bad)).toBeNull()
  })
})
