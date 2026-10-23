import { describe, it, expect } from 'vitest'
import { normalizeForSearch, searchWords, highlightRanges, highlightParts } from './search'
import { normalizeVerseText, countCedillas } from './text'

const ALFABET = 'aăâbcdefghiîjklmnopqrsșştțţuvwxyzAĂÂBCDEFGHIÎJKLMNOPQRSȘŞTȚŢUVWXYZ0123456789 .,;:!?„”«»—–-()[]\'"…'

describe('normalizeForSearch', () => {
  it('fără diacritice, litere mici, punctuația → spațiu', () => {
    expect(normalizeForSearch('Ăsta-i ÎNCEPUTUL; ș, ş, ț, ţ!')).toBe('asta i inceputul  s  s  t  t ')
    expect(normalizeForSearch('Când Întâi')).toBe('cand intai')
  })

  it('invariant: aceeași lungime ca intrarea (NFC), pe tot alfabetul românesc', () => {
    expect(normalizeForSearch(ALFABET)).toHaveLength(ALFABET.length)
    for (const c of ALFABET) expect(normalizeForSearch(c)).toHaveLength(1)
    const s = 'Text de probă cu „ghilimele” — și cratimă-n cuvânt.'
    expect(normalizeForSearch(s)).toHaveLength(s.length)
  })

  it('o intrare descompusă (NFD) e adusă întâi la NFC', () => {
    const nfd = 'ă'.normalize('NFD')
    expect(nfd).toHaveLength(2)
    expect(normalizeForSearch(nfd)).toBe('a')
  })
})

describe('searchWords', () => {
  it('cel mult 6 cuvinte de ≥ 2 caractere, interogare ≤ 100 de caractere, fără dubluri', () => {
    expect(searchWords('a bb CCC dd ee ff gg hh')).toEqual(['bb', 'ccc', 'dd', 'ee', 'ff', 'gg'])
    expect(searchWords('Lumină lumina')).toEqual(['lumina'])
    expect(searchWords('x'.repeat(150)).join('')).toHaveLength(100)
    expect(searchWords('')).toEqual([])
    expect(searchWords('. , ;')).toEqual([])
  })
})

describe('evidențiere', () => {
  it('pozițiile din textul normalizat se aplică textului original', () => {
    const t = 'Text de probă: Lumina și lumină.'
    expect(highlightRanges(t, ['lumina'])).toEqual([[15, 21], [25, 31]])
    const parts = highlightParts(t, ['lumina', 'proba'])
    expect(parts.filter(p => p.hit).map(p => p.text)).toEqual(['probă', 'Lumina', 'lumină'])
    expect(parts.map(p => p.text).join('')).toBe(t)
  })
  it('intervale suprapuse se unesc', () => {
    expect(highlightRanges('abcdef', ['abc', 'cde'])).toEqual([[0, 5]])
  })
})

describe('normalizeVerseText', () => {
  it('sedilă → virgulă, spații nerupte, lățime zero, cratimă moale, spații multiple', () => {
    expect(normalizeVerseText('  Şi ţara  Ţării şi​ ştiu­   bine \n')).toBe('Și țara Țării și știu bine')
    expect(countCedillas('Şi ţara ş ţ ș ț')).toBe(4)
    expect(normalizeVerseText('ă')).toBe('ă')
  })
  it('nu schimbă ortografia', () => {
    expect(normalizeVerseText('Text de probă: sînt, cînd, pămînt')).toBe('Text de probă: sînt, cînd, pămînt')
  })
})
