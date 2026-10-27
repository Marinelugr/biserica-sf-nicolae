import { describe, it, expect } from 'vitest'
import { parseBookText, splitByBooks, detectFormat, suggestOptions, chapterHeader, bookTitle, romanToInt, splitVerses } from './parse'

// Doar text de probă — niciun verset real.
const PARAGRAF = `SFÂNTA EVANGHELIE DUPĂ MARCU

Capitolul 1

Pericopă de probă

1. Text de probă unu, rândul întâi.
continuarea versetului întâi.

2. Text de probă doi.
3. Text de probă trei.

* Notă de probă la versetul 3.

Capitolul 2

1. Text de probă, capitolul doi.
2. Încă un text de probă.`

describe('parseBookText — un verset pe paragraf', () => {
  const r = parseBookText('marcu', PARAGRAF)
  it('capitole și versete, verset pe două rânduri unit', () => {
    expect(r.book.chapters.map(c => [c.n, c.verses.length])).toEqual([[1, 3], [2, 2]])
    expect(r.book.chapters[0].verses[0].text).toBe('Text de probă unu, rândul întâi. continuarea versetului întâi.')
    expect(r.joined).toBe(1)
  })
  it('titlul, pericopa și nota sunt lăsate deoparte și numărate', () => {
    expect(r.headings).toBe(2)
    expect(r.notes).toBe(1)
    expect(JSON.stringify(r.book)).not.toMatch(/Pericopă|Notă|EVANGHELIE/)
    expect(r.issues).toEqual([])
  })
})

describe('parseBookText — numerotare greșită se raportează, nu se repară', () => {
  it('verset sărit și capitol în afara ordinii', () => {
    const r = parseBookText('marcu', 'Cap. 1\n1 Text de probă.\n3 Text de probă.\nCap. 3\n1 Text de probă.')
    expect(r.issues.map(i => i.kind)).toEqual(['verse-order', 'chapter-order'])
    expect(r.book.chapters[0].verses.map(v => v.n)).toEqual([1, 3])
  })
})

describe('parseBookText — alte formate', () => {
  it('versete în interiorul paragrafului', () => {
    const r = parseBookText('iuda', 'Capitolul I\n1 Text de probă unu. 2 Text de probă doi. 3 „Text de probă trei.”', { verseStyle: 'inline' })
    expect(r.book.chapters[0].verses).toEqual([
      { n: 1, text: 'Text de probă unu.' }, { n: 2, text: 'Text de probă doi.' }, { n: 3, text: '„Text de probă trei.”' },
    ])
  })
  it('versete între paranteze drepte și capitole ca număr singur', () => {
    const r = parseBookText('iuda', '1\n[1] Text de probă. [2] Text de probă 2 ani.\n2\n[1] Text de probă.', { verseStyle: 'bracket', bareNumberChapters: true })
    expect(r.book.chapters.map(c => c.verses.map(v => v.text))).toEqual([['Text de probă.', 'Text de probă 2 ani.'], ['Text de probă.']])
  })
  it('Psalmii: titlul numerotat 0 e acceptat', () => {
    const r = parseBookText('psalmi', 'Psalmul 1\n0 Titlu de probă.\n1 Text de probă.')
    expect(r.issues).toEqual([])
    expect(r.book.chapters[0].verses.map(v => v.n)).toEqual([0, 1])
  })
})

describe('splitByBooks', () => {
  it('titlurile despart cărțile; pagina de titlu rămâne separat', () => {
    const s = splitByBooks('Ediție de probă, 2000\n\nFACEREA\nCapitolul 1\n1 Text de probă.\nIEȘIREA\nCapitolul 1\n1 Text de probă.')
    expect(s.map(x => x.slug)).toEqual([null, 'facerea', 'iesirea'])
    expect(s[0].text).toMatch(/Ediție de probă/)
  })
})

describe('ajutoare', () => {
  it('chapterHeader, bookTitle, romanToInt, splitVerses', () => {
    expect(chapterHeader('Capitolul 12')).toBe(12)
    expect(chapterHeader('CAP. XIV')).toBe(14)
    expect(chapterHeader('Psalmul 150')).toBe(150)
    expect(chapterHeader('12')).toBeNull()
    expect(chapterHeader('12', { bareNumberChapters: true })).toBe(12)
    expect(bookTitle('Cartea întâi a Regilor')).toBe('1-regi')
    expect(bookTitle('CARTEA ÎNTÂIA A LUI MOISE (FACEREA)')).toBe('facerea')
    expect(bookTitle('Ioan 3:16')).toBeNull()
    expect(romanToInt('XLIX')).toBe(49)
    expect(romanToInt('abc')).toBeNull()
    expect(splitVerses('fără număr', 'paragraph')).toEqual({ lead: 'fără număr', verses: [] })
  })
  it('detectFormat + suggestOptions aleg stilul după cifre', () => {
    const st = detectFormat(PARAGRAF)
    expect(st.chapterHeaders).toBe(2)
    expect(st.versesAtStart).toBe(5)
    const s = suggestOptions(st)
    expect(s.options.verseStyle).toBe('paragraph')
    expect(s.confident).toBe(true)
    expect(suggestOptions(detectFormat('doar text de probă')).confident).toBe(false)
    expect(suggestOptions(detectFormat('1\n[1] a [2] b [3] c')).options).toMatchObject({ verseStyle: 'bracket', bareNumberChapters: true })
  })
})
