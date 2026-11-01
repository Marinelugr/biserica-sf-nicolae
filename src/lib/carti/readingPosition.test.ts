// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BOOK_POSITION_KEY, BOOK_RECENT_KEY, bookHref, clearBookHistory, findSections, forgetBookLocation, getBookHistorySnapshot, isResumeHash,
  parseBookPosition, parseRecentBooks, percentRead, placeLabel, pruneMissingBooks, readBookPosition, readRecentBooks, resumeBookHref,
  saveBookLocation, savedLocation, touchBook,
} from './readingPosition'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

const section = { sectiune: 'Condac 5', ancora: 's9' }

describe('poziția unei cărți', () => {
  it('cheile sunt ale tipului carte', () => {
    expect(BOOK_POSITION_KEY).toBe('lectura:carte:poz')
    expect(BOOK_RECENT_KEY).toBe('lectura:carte:recente')
  })

  it('salvează o secțiune sau un procent', () => {
    saveBookLocation('acatist', section, 10)
    expect(readBookPosition()).toEqual({ id: 'acatist', ts: 10, ...section })
    saveBookLocation('tilcuire', { procent: 35 }, 20)
    expect(readBookPosition()).toEqual({ id: 'tilcuire', ts: 20, procent: 35 })
  })

  it('ține minte locul fiecărei cărți din listă, nu doar al ultimei', () => {
    saveBookLocation('acatist', section, 10)
    saveBookLocation('tilcuire', { procent: 35 }, 20)
    expect(savedLocation('acatist')).toMatchObject(section)
    expect(savedLocation('tilcuire')).toMatchObject({ procent: 35 })
    expect(savedLocation('alta')).toBeNull()
  })

  it('deschiderea urcă în listă și nu pierde locul', () => {
    saveBookLocation('acatist', section, 10)
    saveBookLocation('tilcuire', { procent: 35 }, 20)
    touchBook('acatist', 30)
    expect(readRecentBooks()[0]).toEqual({ id: 'acatist', ts: 30, ...section })
    expect(readRecentBooks()).toHaveLength(2)
  })

  it('o carte doar deschisă e în listă, fără loc și fără poziție', () => {
    touchBook('rugaciune', 10)
    expect(readRecentBooks()).toEqual([{ id: 'rugaciune', ts: 10 }])
    expect(readBookPosition()).toBeNull()
    expect(savedLocation('rugaciune')).toBeNull()
    expect(getBookHistorySnapshot()).toEqual({ position: null, recent: [{ id: 'rugaciune', ts: 10 }] })
  })

  it('cel mult 5 cărți, cea mai recentă prima', () => {
    for (let i = 1; i <= 7; i++) touchBook(`carte-${i}`, i)
    expect(readRecentBooks().map(b => b.id)).toEqual(['carte-7', 'carte-6', 'carte-5', 'carte-4', 'carte-3'])
  })

  it('forgetBookLocation scoate locul, dar cartea rămâne citită recent', () => {
    saveBookLocation('acatist', section, 10)
    forgetBookLocation('acatist', 20)
    expect(readBookPosition()).toBeNull()
    expect(readRecentBooks()).toEqual([{ id: 'acatist', ts: 20 }])
  })

  it('forgetBookLocation nu atinge poziția altei cărți', () => {
    saveBookLocation('acatist', section, 10)
    forgetBookLocation('alta', 20)
    expect(readBookPosition()?.id).toBe('acatist')
  })

  it('nu salvează un loc invalid', () => {
    saveBookLocation('acatist', { procent: 0 })
    saveBookLocation('acatist', { procent: 101 })
    saveBookLocation('acatist', { procent: 1.5 })
    saveBookLocation('acatist', { sectiune: '', ancora: 's1' })
    saveBookLocation('acatist', { sectiune: 'x', ancora: 'altceva' })
    saveBookLocation('../rau', { procent: 5 })
    expect(localStorage.getItem(BOOK_POSITION_KEY)).toBeNull()
  })
})

describe('valori corupte: cheia se șterge', () => {
  it.each([
    ['JSON invalid', '{nu e json'],
    ['fără loc', '{"id":"a","ts":1}'],
    ['procent negativ', '{"id":"a","ts":1,"procent":-4}'],
    ['procent peste 100', '{"id":"a","ts":1,"procent":140}'],
    ['ancoră necunoscută', '{"id":"a","ts":1,"sectiune":"x","ancora":"#rau"}'],
    ['secțiune fără ancoră', '{"id":"a","ts":1,"sectiune":"x"}'],
    ['și secțiune, și procent', '{"id":"a","ts":1,"sectiune":"x","ancora":"s1","procent":5}'],
    ['slug nevalid', '{"id":"../x","ts":1,"procent":5}'],
    ['fără ts', '{"id":"a","procent":5}'],
  ])('poziție: %s', (_, raw) => {
    localStorage.setItem(BOOK_POSITION_KEY, raw)
    expect(readBookPosition()).toBeNull()
    expect(localStorage.getItem(BOOK_POSITION_KEY)).toBeNull()
  })

  it.each([['nu e listă', '{"id":"a"}'], ['intrare invalidă', '[{"id":"a","ts":-1}]']])('recente: %s', (_, raw) => {
    localStorage.setItem(BOOK_RECENT_KEY, raw)
    expect(readRecentBooks()).toEqual([])
    expect(localStorage.getItem(BOOK_RECENT_KEY)).toBeNull()
  })

  it('parsere pure', () => {
    expect(parseBookPosition('{"id":"carte-1","ts":1,"procent":5}')).toEqual({ id: 'carte-1', ts: 1, procent: 5 })
    expect(parseRecentBooks('[{"id":"a","ts":2},{"id":"a","ts":1}]')).toEqual([{ id: 'a', ts: 2 }])
  })
})

describe('localStorage care aruncă', () => {
  it('nimic nu aruncă și nu există poziție', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    expect(() => {
      touchBook('a')
      saveBookLocation('a', { procent: 5 })
      forgetBookLocation('a')
      pruneMissingBooks(new Set(['b']))
      clearBookHistory()
    }).not.toThrow()
    expect(savedLocation('a')).toBeNull()
    expect(getBookHistorySnapshot()).toBeNull()
  })
})

describe('cărți care nu mai există', () => {
  it('scoate poziția și intrările lor, restul rămân', () => {
    saveBookLocation('veche', { procent: 5 }, 1)
    saveBookLocation('buna', { procent: 6 }, 2)
    saveBookLocation('veche', { procent: 7 }, 3)
    pruneMissingBooks(new Set(['buna']))
    expect(readBookPosition()).toBeNull()
    expect(readRecentBooks().map(b => b.id)).toEqual(['buna'])
  })

  it('o listă goală nu șterge nimic: poate fi o bază indisponibilă', () => {
    saveBookLocation('buna', { procent: 6 }, 2)
    pruneMissingBooks(new Set())
    expect(readBookPosition()?.id).toBe('buna')
  })
})

describe('linkuri și etichete', () => {
  it.each([['ro', '/carti/a'], ['en', '/en/library/a'], ['ru', '/ru/biblioteka/a']] as const)('%s', (locale, href) => {
    expect(bookHref('a', locale)).toBe(href)
    expect(resumeBookHref({ id: 'a', ts: 1, procent: 35 }, locale)).toBe(`${href}#p35`)
    expect(resumeBookHref({ id: 'a', ts: 1, ...section }, locale)).toBe(`${href}#s9`)
  })

  it('etichete', () => {
    expect(placeLabel(section)).toBe('Condac 5')
    expect(placeLabel({ procent: 35 })).toBe('35%')
  })

  it('recunoaște doar ancorele de reluare', () => {
    expect(isResumeHash('#s9')).toBe(true)
    expect(isResumeHash('#p35')).toBe(true)
    expect(isResumeHash('#galerie')).toBe(false)
    expect(isResumeHash('')).toBe(false)
  })
})

describe('structura textului', () => {
  const content = (html: string) => {
    const el = document.createElement('div')
    el.innerHTML = html
    return el
  }

  it('paragrafele doar îngroșate sunt secțiuni', () => {
    const sections = findSections(content('<p><strong>Condac 1</strong></p><p>text</p><p><strong>Icos 1</strong></p><p>text</p><p><strong>Condac 2</strong></p>'))
    expect(sections.map(s => [s.title, s.anchor])).toEqual([['Condac 1', 's1'], ['Icos 1', 's2'], ['Condac 2', 's3']])
  })

  it('titlurile h1–h4 sunt secțiuni', () => {
    expect(findSections(content('<h2>A</h2><h3>B</h3><h4>C</h4>')).map(s => s.title)).toEqual(['A', 'B', 'C'])
  })

  it('sub 3 titluri nu există secțiuni: poziția e procentul', () => {
    expect(findSections(content('<h2>A</h2><p>text</p><p><strong>B</strong></p>'))).toEqual([])
  })

  it('nu ia drept titlu un paragraf cu text obișnuit sau îngroșat lung', () => {
    const long = 'x'.repeat(81)
    expect(findSections(content(`<p><strong>A</strong> și text</p><p><strong>${long}</strong></p><p><strong>B</strong><em>c</em></p><p></p>`))).toEqual([])
  })
})

describe('percentRead', () => {
  it('procentul textului trecut de linia de lectură', () => {
    expect(percentRead(100, 1000, 100)).toBe(0)
    expect(percentRead(-250, 1000, 100)).toBe(35)
    expect(percentRead(-5000, 1000, 100)).toBe(100)
    expect(percentRead(500, 1000, 100)).toBe(0)
    expect(percentRead(0, 0, 100)).toBe(0)
  })
})
