import { describe, it, expect } from 'vitest'
import { buildBookExport, checkReplaceInput, escapeLike, gapCount, isValidNewVerseNumber, MAX_BULK_VERSES, markParts, missingVerseNumbers, planReplace, prepareVerseText, type ReplaceRow } from './adminCore'
import { normalizeForSearch } from './search'
import { reviewedPercent } from './adminQueries'

const prepared = (raw: string) => {
  const r = prepareVerseText(raw)
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('normalizare la salvare', () => {
  it('sedila devine virgulă, în toate formele', () => {
    expect(prepared('Aşa ţara ŞI Ţinutul').text).toBe('Așa țara ȘI Ținutul')
  })
  it('NFC: litere descompuse, inclusiv s + sedilă combinată', () => {
    expect(prepared('cămașă').text).toBe('cămașă')
    expect(prepared('şi ţara').text).toBe('și țara')
  })
  it('un caracter de lățime zero nu poate ascunde o sedilă sau rupe NFC', () => {
    expect(prepared('s​̧i').text).toBe('și')
    expect(prepared('a​̆').text).toBe('ă')
  })
  it('trim și spații multiple (rândurile noi lipite devin spațiu)', () => {
    expect(prepared('  unu   doi\n\ttrei   patru ').text).toBe('unu doi trei patru')
  })
})

describe('validări la salvare', () => {
  it.each([
    ['gol', ''],
    ['doar spații', '  \n\t '],
    ['caracter de control', 'text\u0007 de probă'],
    ['caracter de control C1', 'text\u0085 de probă'],
    ['caracter de înlocuire', 'text � de probă'],
    ['codare greșită', 'cuvÃ¢nt de probă'],
    ['începe cu o cifră', '12 text de probă'],
  ])('respinge: %s', (_name, raw) => {
    expect(prepareVerseText(raw).ok).toBe(false)
  })
  it('limita de 5000 se aplică după normalizare', () => {
    expect(prepareVerseText('a'.repeat(5000)).ok).toBe(true)
    expect(prepareVerseText('a'.repeat(5001)).ok).toBe(false)
    expect(prepareVerseText(`${'a'.repeat(5000)}    `).ok).toBe(true)
  })
  it('număr de verset nou: doar întreg pozitiv', () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity, 1000, '3', null]) expect(isValidNewVerseNumber(bad)).toBe(false)
    for (const good of [1, 176, 999]) expect(isValidNewVerseNumber(good)).toBe(true)
  })
})

describe('textSearch', () => {
  it.each(['Așa țară și pâine în câmp', 'ÎNCEPUT „între” – ghilimele; punct.', 'é descompus', 'Emoji 🙂 și İ turcesc', 'ß ﬁ ligatură'])('păstrează lungimea 1:1: %s', raw => {
    const r = prepared(raw)
    expect(r.textSearch.length).toBe(r.text.length)
    expect(r.textSearch).toBe(normalizeForSearch(r.text))
  })
})

describe('goluri', () => {
  it('1,2,4,5 → lipsește 3', () => expect(missingVerseNumbers([1, 2, 4, 5])).toEqual([3]))
  it('1,2,5 → lipsesc 3 și 4', () => expect(missingVerseNumbers([1, 2, 5])).toEqual([3, 4]))
  it('fără lipsă; capitol gol; începe de la 3', () => {
    expect(missingVerseNumbers([1, 2, 3])).toEqual([])
    expect(missingVerseNumbers([])).toEqual([])
    expect(missingVerseNumbers([3])).toEqual([1, 2])
  })
  it('versetul 0 (titlul de la Psalmi) nu contează, nici dacă lipsește', () => {
    expect(missingVerseNumbers([0, 1, 2])).toEqual([])
    expect(missingVerseNumbers([0, 2])).toEqual([1])
  })
  it('numărul de goluri din agregate', () => {
    expect(gapCount(4, 5)).toBe(1)
    expect(gapCount(3, 5)).toBe(2)
    expect(gapCount(5, 5)).toBe(0)
    expect(gapCount(0, null)).toBe(0)
  })
  it('100% doar când toate sunt revizuite', () => {
    expect(reviewedPercent(999, 1000)).toBe(99)
    expect(reviewedPercent(10, 10)).toBe(100)
    expect(reviewedPercent(0, 0)).toBe(0)
  })
})

const row = (chapterNum: number, verseNum: number, textRo: string): ReplaceRow => ({ id: `${chapterNum}-${verseNum}`, chapterNum, verseNum, textRo, editedAt: null })
const opts = (find: string, replace: string, wholeWord = true) => ({ find, replace, wholeWord })

describe('găsește și înlocuiește', () => {
  it('cuvinte întregi: nu atinge cuvintele care îl conțin', () => {
    const rows = [row(1, 1, 'mers intru casă dintru sat'), row(1, 2, 'dintru alt loc')]
    const plan = planReplace('iona', rows, opts('intru', 'întru'))
    expect(plan.total).toBe(1)
    expect(plan.changes[0].newText).toBe('mers întru casă dintru sat')
    expect(planReplace('iona', rows, opts('intru', 'întru', false)).total).toBe(2)
  })
  it('granița de cuvânt înțelege diacriticele', () => {
    const plan = planReplace('iona', [row(1, 1, 'țara ara mară')], opts('ara', 'x'))
    expect(plan.changes[0].newText).toBe('țara x mară')
  })
  it('exact, cu majuscule', () => {
    const plan = planReplace('iona', [row(1, 1, 'Intru casă'), row(1, 2, 'pe intru')], opts('intru', 'întru'))
    expect(plan.changes.map(c => c.id)).toEqual(['1-2'])
  })
  it('caracterele speciale nu sunt tipare, nici în căutare, nici în înlocuire', () => {
    expect(planReplace('iona', [row(1, 1, 'a.b axb')], opts('a.b', 'y', false)).changes[0].newText).toBe('y axb')
    expect(planReplace('iona', [row(1, 1, 'unu doi')], opts('doi', '$& trei')).changes[0].newText).toBe('unu $& trei')
  })
  it('textSearch recalculat', () => {
    const c = planReplace('iona', [row(1, 1, 'unu doi')], opts('doi', 'țară')).changes[0]
    expect(c.textSearch).toBe(normalizeForSearch('unu țară'))
  })
  it('ștergerea lasă textul normalizat', () => {
    expect(planReplace('iona', [row(1, 1, 'unu doi trei')], opts('doi', '')).changes[0].newText).toBe('unu trei')
  })
  it('rezultat nevalid: raportat, nu se scrie', () => {
    const plan = planReplace('iona', [row(1, 1, 'doi'), row(1, 2, 'doi trei')], opts('doi', ''))
    expect(plan.invalid).toEqual([{ chapterNum: 1, verseNum: 1, error: expect.any(String) }])
    expect(plan.changes.map(c => c.id)).toEqual(['1-2'])
  })
  it('limita: numără toate, dar operația are cel mult 500; 20 de exemple', () => {
    const rows = Array.from({ length: 620 }, (_, i) => row(1, i + 1, 'unu doi'))
    const plan = planReplace('iona', rows, opts('doi', 'trei'))
    expect(plan.total).toBe(620)
    expect(plan.changes).toHaveLength(MAX_BULK_VERSES)
    expect(plan.changes.at(-1)?.verseNum).toBe(500)
    expect(plan.samples).toHaveLength(20)
    expect(plan.samples[0].before).toEqual([{ text: 'unu ', hit: false }, { text: 'doi', hit: true }])
    expect(plan.samples[0].after).toEqual([{ text: 'unu ', hit: false }, { text: 'trei', hit: true }])
  })
  it('amprenta se schimbă dacă un verset sau înlocuirea se schimbă', () => {
    const base = planReplace('iona', [row(1, 1, 'unu doi')], opts('doi', 'trei')).token
    expect(planReplace('iona', [row(1, 1, 'unu doi')], opts('doi', 'trei')).token).toBe(base)
    expect(planReplace('iona', [row(1, 1, 'unu  doi x')], opts('doi', 'trei')).token).not.toBe(base)
    expect(planReplace('iona', [{ ...row(1, 1, 'unu doi'), editedAt: new Date(0) }], opts('doi', 'trei')).token).not.toBe(base)
    expect(planReplace('iona', [row(1, 1, 'unu doi')], opts('doi', 'patru')).token).not.toBe(base)
    expect(planReplace('iuda', [row(1, 1, 'unu doi')], opts('doi', 'trei')).token).not.toBe(base)
  })
  it('intrări respinse; căutarea cu sedilă e normalizată', () => {
    expect(checkReplaceInput(opts('a', 'b')).ok).toBe(false)
    expect(checkReplaceInput(opts('doi', 'doi')).ok).toBe(false)
    expect(checkReplaceInput(opts('doi', 'x\u0007')).ok).toBe(false)
    expect(checkReplaceInput(opts('  aşa ', 'aceea'))).toEqual({ ok: true, input: opts('așa', 'aceea') })
  })
  it('marcaje și LIKE', () => {
    expect(markParts('fără', '', true)).toEqual([{ text: 'fără', hit: false }])
    expect(escapeLike('100%_a\\')).toBe('100\\%\\_a\\\\')
  })
})

describe('export', () => {
  it('formatul proiectului: sortat, doar câmpurile cerute', () => {
    const out = buildBookExport('iona', [
      { chapterNum: 2, verseNum: 1, textRo: 'c' },
      { chapterNum: 1, verseNum: 2, textRo: 'b' },
      { chapterNum: 1, verseNum: 1, textRo: 'a' },
    ])
    expect(out).toEqual({ slug: 'iona', chapters: [{ n: 1, verses: [{ n: 1, text: 'a' }, { n: 2, text: 'b' }] }, { n: 2, verses: [{ n: 1, text: 'c' }] }] })
  })
  it('păstrează versetul 0', () => {
    expect(buildBookExport('psalmi', [{ chapterNum: 1, verseNum: 1, textRo: 'b' }, { chapterNum: 1, verseNum: 0, textRo: 'a' }]).chapters[0].verses.map(v => v.n)).toEqual([0, 1])
  })
})
