import { describe, it, expect } from 'vitest'
import { parseReference, findBookByName } from './reference'

const OK: [string, object][] = [
  ['Ioan 3:16', { slug: 'ioan', chapter: 3, verse: 16 }],
  ['Ioan 3,16', { slug: 'ioan', chapter: 3, verse: 16 }],
  ['Ioan 3.16', { slug: 'ioan', chapter: 3, verse: 16 }],
  ['Ioan 3, 16-18', { slug: 'ioan', chapter: 3, verse: 16, verseTo: 18 }],
  ['Ioan 3:16–18', { slug: 'ioan', chapter: 3, verse: 16, verseTo: 18 }],
  ['Ioan 3', { slug: 'ioan', chapter: 3 }],
  ['ioan', { slug: 'ioan' }],
  ['IOAN 1', { slug: 'ioan', chapter: 1 }],
  ['In 1:1', { slug: 'ioan', chapter: 1, verse: 1 }],
  ['1 Cor 13:4', { slug: '1-corinteni', chapter: 13, verse: 4 }],
  ['1Cor 13', { slug: '1-corinteni', chapter: 13 }],
  ['1 cor. 13', { slug: '1-corinteni', chapter: 13 }],
  ['I Cor 13', { slug: '1-corinteni', chapter: 13 }],
  ['II Cor 5', { slug: '2-corinteni', chapter: 5 }],
  ['Mt 5', { slug: 'matei', chapter: 5 }],
  ['Mt. 5:3', { slug: 'matei', chapter: 5, verse: 3 }],
  ['Ps 50', { slug: 'psalmi', chapter: 50 }],
  ['Psalmul 22', { slug: 'psalmi', chapter: 22 }],
  ['Evanghelia după Matei 5', { slug: 'matei', chapter: 5 }],
  ['evanghelia dupa matei 5', { slug: 'matei', chapter: 5 }],
  ['Facerea 1:1', { slug: 'facerea', chapter: 1, verse: 1 }],
  ['Geneza 1', { slug: 'facerea', chapter: 1 }],
  ['Fc 2', { slug: 'facerea', chapter: 2 }],
  ['Ieșirea 20', { slug: 'iesirea', chapter: 20 }],
  ['iesirea 20', { slug: 'iesirea', chapter: 20 }],
  ['Fap 2', { slug: 'faptele-apostolilor', chapter: 2 }],
  ['Rom 8:1', { slug: 'romani', chapter: 8, verse: 1 }],
  ['Apoc 22:21', { slug: 'apocalipsa', chapter: 22, verse: 21 }],
  ['1 In 4:8', { slug: '1-ioan', chapter: 4, verse: 8 }],
  ['3 Regi 17', { slug: '3-regi', chapter: 17 }],
  ['Cântarea Cântărilor 2', { slug: 'cantarea-cantarilor', chapter: 2 }],
  ['cantarea cantarilor 2', { slug: 'cantarea-cantarilor', chapter: 2 }],
  ['Sfânta Evanghelie după Luca 1', { slug: 'luca', chapter: 1 }],
  ['  luca   2 : 1 ', { slug: 'luca', chapter: 2, verse: 1 }],
  ['Iuda 1', { slug: 'iuda', chapter: 1 }],
  ['Iona 2', { slug: 'iona', chapter: 2 }],
  ['Ap 1', { slug: 'apocalipsa', chapter: 1 }],
]

const BAD: unknown[] = [
  'Regi 3',          // ambiguu: 1–4 Regi
  'Regi',
  'Corinteni 13',    // ambiguu: 1 / 2 Corinteni
  'Petru 1',
  'Ioan 0',
  'Ioan 3:0',
  'Ioan 3:18-16',    // interval invers
  'Ioan 3 16',       // fără separator
  'NuExista 3',
  '',
  '   ',
  '12345',
  ':::',
  'x'.repeat(200),
  null,
  undefined,
  42,
  {},
  'iubire',
  'Ioan 3:16:2',
]

describe('parseReference', () => {
  it.each(OK)('„%s"', (input, want) => {
    expect(parseReference(input)).toEqual(want)
  })
  it.each(BAD.map(b => [b]))('null pentru %j', input => {
    expect(parseReference(input)).toBeNull()
  })
  it('are cel puțin 30 de cazuri', () => {
    expect(OK.length + BAD.length).toBeGreaterThanOrEqual(30)
  })
})

describe('findBookByName', () => {
  it('etichete întregi, alias-uri, fără diacritice; ambiguu → null', () => {
    expect(findBookByName('Cartea întâi a Regilor')?.slug).toBe('1-regi')
    expect(findBookByName('Pildele lui Solomon')?.slug).toBe('pilde')
    expect(findBookByName('INTELEPCIUNEA LUI SOLOMON')?.slug).toBe('intelepciunea-lui-solomon')
    expect(findBookByName('Regi')).toBeNull()
  })
})
