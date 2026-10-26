import { describe, it, expect } from 'vitest'
import { validateBible, parseExceptions, formatIssue, checkVerseText, type Issue } from './validate'
import { syntheticBible } from './synthetic'
import type { ParsedBook } from './parse'

const codes = (xs: Issue[]) => xs.map(i => i.code)
const clone = (b: ParsedBook[]) => JSON.parse(JSON.stringify(b)) as ParsedBook[]
// ~35 000 de versete de probă: în intervalul obișnuit, fără avertismentul de total
const FULL = syntheticBible((slug, ch) => (slug === 'psalmi' && ch === 119 ? 176 : 29))

describe('validateBible', () => {
  it('Biblia sintetică completă trece fără blocante și fără avertismente', () => {
    const r = validateBible(FULL)
    expect(r.blocking).toEqual([])
    expect(r.warnings).toEqual([])
    expect(r.books).toHaveLength(80)
    expect(r.totalChapters).toBe(FULL.reduce((n, b) => n + b.chapters.length, 0))
    expect(r.psalms).toEqual({ psalms: 151, withVerseZero: 0 })
  })

  it('carte lipsă, necunoscută, dublă', () => {
    const b = clone(FULL).filter(x => x.slug !== 'rut')
    b.push({ slug: 'carte-necunoscuta', chapters: [{ n: 1, verses: [{ n: 1, text: 'Text de probă.' }] }] })
    b.push(clone(FULL).find(x => x.slug === 'iona')!)
    expect(codes(validateBible(b).blocking)).toEqual(expect.arrayContaining(['missing-book', 'unknown-book', 'duplicate-book']))
  })

  it('capitole și versete nu la rând, duplicate, verset gol', () => {
    const b = clone(FULL)
    const iov = b.find(x => x.slug === 'iov')!
    iov.chapters[1].n = 5
    iov.chapters[0].verses[1].n = 99
    iov.chapters[2].verses[1].n = 1
    iov.chapters[3].verses[0].text = '   '
    const r = validateBible(b)
    expect(codes(r.blocking)).toEqual(expect.arrayContaining(['chapters-not-consecutive', 'verses-not-consecutive', 'duplicate-verse', 'empty-verse']))
  })

  it('Noul Testament: număr greșit de capitole e blocant; în VT e doar avertisment', () => {
    const b = clone(FULL)
    b.find(x => x.slug === 'matei')!.chapters.pop()
    b.find(x => x.slug === 'facerea')!.chapters.pop()
    const r = validateBible(b)
    expect(r.blocking.find(i => i.code === 'nt-chapter-count')?.slug).toBe('matei')
    expect(r.warnings.find(i => i.code === 'vt-chapter-count')?.slug).toBe('facerea')
  })

  it('avertismente: capitol lung, verset lung, verset repetat, total', () => {
    const b = clone(FULL)
    const iov = b.find(x => x.slug === 'iov')!
    iov.chapters[0].verses = Array.from({ length: 181 }, (_, i) => ({ n: i + 1, text: `Text de probă ${i}.` }))
    iov.chapters[1].verses[0].text = 'Text de probă. '.repeat(300)
    iov.chapters[2].verses[1].text = iov.chapters[2].verses[0].text
    const r = validateBible(b)
    expect(codes(r.warnings)).toEqual(expect.arrayContaining(['many-verses', 'long-verse', 'same-as-previous']))
    expect(r.blocking).toEqual([])
    expect(codes(validateBible(syntheticBible(3)).warnings)).toContain('total-verses')
  })

  it('Psalmi: titlul numerotat 0 e acceptat și raportat', () => {
    const b = clone(FULL)
    const ps = b.find(x => x.slug === 'psalmi')!
    ps.chapters[2].verses.unshift({ n: 0, text: 'Titlu de probă.' })
    const r = validateBible(b)
    expect(r.blocking).toEqual([])
    expect(r.psalms?.withVerseZero).toBe(1)
  })

  it('excepțiile lui Marin acceptă exact problema numită', () => {
    const b = clone(FULL)
    b.find(x => x.slug === 'matei')!.chapters.pop()
    const r = validateBible(b, [{ code: 'nt-chapter-count', slug: 'matei', motiv: 'ediția are 27 de capitole aici' }])
    expect(r.blocking).toEqual([])
    expect(r.issues.find(i => i.code === 'nt-chapter-count')?.accepted).toMatch(/ediția/)
    expect(formatIssue(r.issues.find(i => i.code === 'nt-chapter-count')!)).toMatch(/ACCEPTAT/)
  })
})

describe('checkVerseText', () => {
  it('caractere stricate, sedilă, cifră la început', () => {
    const at = { slug: 'iov', chapter: 1, verse: 1 }
    expect(codes(checkVerseText('Text � de probă', at))).toEqual(['bad-char'])
    expect(codes(checkVerseText('Text\u0007 de probă', at))).toEqual(['bad-char'])
    expect(codes(checkVerseText('Text ÃŽn probă', at))).toEqual(['mojibake'])
    expect(codes(checkVerseText('Şi text de probă', at))).toEqual(['cedilla'])
    expect(codes(checkVerseText('3 Text de probă', at))).toEqual(['leading-digit'])
    expect(checkVerseText('Și text de probă: 3 ani.', at)).toEqual([])
  })
})

describe('parseExceptions', () => {
  it('format corect / greșit', () => {
    expect(parseExceptions({ exceptii: [{ code: 'vt-chapter-count', slug: 'psalmi', motiv: 'm' }] })).toHaveLength(1)
    expect(() => parseExceptions({})).toThrow(/exceptii/)
    expect(() => parseExceptions({ exceptii: [{ code: 'x' }] })).toThrow(/motiv/)
  })
})
