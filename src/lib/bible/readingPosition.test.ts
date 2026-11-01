// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LEGACY_POSITION_KEY, LEGACY_RECENT_KEY, POSITION_KEY, RECENT_KEY, chapterHref, clearHistory, getHistorySnapshot, isSearchReferrer, parsePosition, parseRecent,
  readPosition, readRecent, resumeHref, savePosition, topVerse, verseFromHash, waitsForScroll,
} from './readingPosition'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('migrarea cheilor vechi', () => {
  const position = { carte: 'ioan', capitol: 3, verset: 12, ts: 1000 }
  const recent = [{ carte: 'ioan', capitol: 3, ts: 1000 }, { carte: 'matei', capitol: 5, ts: 900 }]

  it('cheile au numele comune', () => {
    expect(POSITION_KEY).toBe('lectura:biblia:poz')
    expect(RECENT_KEY).toBe('lectura:biblia:recente')
  })

  it('mută poziția și recentele la prima citire, apoi șterge cheile vechi', () => {
    localStorage.setItem(LEGACY_POSITION_KEY, JSON.stringify(position))
    localStorage.setItem(LEGACY_RECENT_KEY, JSON.stringify(recent))
    expect(getHistorySnapshot()).toEqual({ position, recent: [recent[1]] })
    expect(JSON.parse(localStorage.getItem(POSITION_KEY)!)).toEqual(position)
    expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual(recent)
    expect(localStorage.getItem(LEGACY_POSITION_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_RECENT_KEY)).toBeNull()
  })

  it('o salvare înainte de orice citire nu pierde recentele vechi', () => {
    localStorage.setItem(LEGACY_RECENT_KEY, JSON.stringify(recent))
    savePosition('iuda', 1, 2, 2000)
    expect(readRecent().map(r => r.carte)).toEqual(['iuda', 'ioan', 'matei'])
  })

  it('nu suprascrie o poziție nouă cu una veche', () => {
    savePosition('iuda', 1, 2, 2000)
    localStorage.setItem(LEGACY_POSITION_KEY, JSON.stringify(position))
    expect(readPosition()?.carte).toBe('iuda')
    expect(localStorage.getItem(LEGACY_POSITION_KEY)).toBeNull()
  })

  it('o valoare veche coruptă se șterge și nu ajunge în cheia nouă', () => {
    localStorage.setItem(LEGACY_POSITION_KEY, '{stricat')
    expect(readPosition()).toBeNull()
    expect(localStorage.getItem(LEGACY_POSITION_KEY)).toBeNull()
    expect(localStorage.getItem(POSITION_KEY)).toBeNull()
  })

  it('cu stocarea plină, cheia veche rămâne și poziția nu se pierde', () => {
    localStorage.setItem(LEGACY_POSITION_KEY, JSON.stringify(position))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('plin', 'QuotaExceededError') })
    expect(readPosition()).toBeNull()
    expect(localStorage.getItem(LEGACY_POSITION_KEY)).not.toBeNull()
    vi.restoreAllMocks()
    expect(readPosition()).toEqual(position)
  })

  it('„Șterge istoricul" golește și cheile vechi', () => {
    localStorage.setItem(LEGACY_POSITION_KEY, 'x')
    clearHistory()
    expect(localStorage.getItem(LEGACY_POSITION_KEY)).toBeNull()
  })
})

describe('salvare și citire', () => {
  it('păstrează {carte, capitol, verset, ts} în cheia lectura:biblia:poz', () => {
    savePosition('ioan', 3, 12, 1000)
    expect(JSON.parse(localStorage.getItem(POSITION_KEY)!)).toEqual({ carte: 'ioan', capitol: 3, verset: 12, ts: 1000 })
    expect(readPosition()).toEqual({ carte: 'ioan', capitol: 3, verset: 12, ts: 1000 })
  })

  it('nu scrie o poziție invalidă', () => {
    savePosition('nu-exista', 3, 12)
    savePosition('ioan', 0, 12)
    savePosition('ioan', 3, -1)
    savePosition('ioan', 3, 1.5)
    expect(localStorage.length).toBe(0)
  })
})

describe('citite recent', () => {
  it('cel mai recent primul, fără dubluri', () => {
    savePosition('ioan', 1, 1, 1)
    savePosition('ioan', 2, 1, 2)
    savePosition('ioan', 1, 9, 3)
    expect(readRecent().map(r => [r.carte, r.capitol, r.ts])).toEqual([['ioan', 1, 3], ['ioan', 2, 2]])
  })

  it('cel mult 5 capitole', () => {
    for (let i = 1; i <= 8; i++) savePosition('psalmi', i, 1, i)
    expect(readRecent().map(r => r.capitol)).toEqual([8, 7, 6, 5, 4])
  })

  it('același număr de capitol în altă carte e alt capitol', () => {
    savePosition('ioan', 3, 1, 1)
    savePosition('matei', 3, 1, 2)
    expect(readRecent().map(r => r.carte)).toEqual(['matei', 'ioan'])
  })

  it('curăță o listă cu dubluri sau prea lungă', () => {
    const item = (capitol: number) => ({ carte: 'ioan', capitol, ts: 1 })
    expect(parseRecent(JSON.stringify([item(1), item(1), item(2)]))?.map(r => r.capitol)).toEqual([1, 2])
    expect(parseRecent(JSON.stringify([1, 2, 3, 4, 5, 6, 7].map(item)))).toHaveLength(5)
  })
})

describe('valori corupte: cheia se șterge și funcția se dezactivează', () => {
  const corrupt = [
    ['JSON invalid', '{nu e json'],
    ['null', 'null'],
    ['carte inexistentă', '{"carte":"nu-exista","capitol":3,"verset":1,"ts":1}'],
    ['carte moștenită din Object', '{"carte":"constructor","capitol":3,"verset":1,"ts":1}'],
    ['verset negativ', '{"carte":"ioan","capitol":3,"verset":-4,"ts":1}'],
    ['verset zero', '{"carte":"ioan","capitol":3,"verset":0,"ts":1}'],
    ['capitol zecimal', '{"carte":"ioan","capitol":1.5,"verset":1,"ts":1}'],
    ['capitol text', '{"carte":"ioan","capitol":"3","verset":1,"ts":1}'],
    ['fără ts', '{"carte":"ioan","capitol":3,"verset":1}'],
  ]

  it.each(corrupt)('poziție: %s', (_, raw) => {
    localStorage.setItem(POSITION_KEY, raw)
    expect(readPosition()).toBeNull()
    expect(localStorage.getItem(POSITION_KEY)).toBeNull()
    expect(getHistorySnapshot()).toBeNull()
  })

  it.each([['JSON invalid', '[{'], ['nu e listă', '{"a":1}'], ['intrare invalidă', '[{"carte":"ioan","capitol":-1,"ts":1}]']])('recente: %s', (_, raw) => {
    localStorage.setItem(RECENT_KEY, raw)
    expect(readRecent()).toEqual([])
    expect(localStorage.getItem(RECENT_KEY)).toBeNull()
  })

  it('o listă de recente coruptă nu ascunde poziția validă', () => {
    savePosition('ioan', 3, 2, 1)
    localStorage.setItem(RECENT_KEY, 'stricat')
    expect(getHistorySnapshot()).toEqual({ position: { carte: 'ioan', capitol: 3, verset: 2, ts: 1 }, recent: [] })
  })

  it('parsePosition respinge o carte necunoscută', () => {
    expect(parsePosition('{"carte":"x","capitol":1,"verset":1,"ts":1}')).toBeNull()
  })
})

describe('localStorage care aruncă excepții', () => {
  const blocked = () => { throw new DOMException('blocat', 'SecurityError') }

  it('metodele aruncă: nicio eroare, nicio poziție', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
    expect(() => savePosition('ioan', 3, 1)).not.toThrow()
    expect(readPosition()).toBeNull()
    expect(readRecent()).toEqual([])
    expect(getHistorySnapshot()).toBeNull()
    expect(() => clearHistory()).not.toThrow()
  })

  it('chiar accesul la window.localStorage aruncă', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(blocked)
    expect(() => savePosition('ioan', 3, 1)).not.toThrow()
    expect(readPosition()).toBeNull()
    expect(getHistorySnapshot()).toBeNull()
  })

  it('stocarea plină la scriere nu strică nimic', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('plin', 'QuotaExceededError') })
    expect(() => savePosition('ioan', 3, 1)).not.toThrow()
    expect(readPosition()).toBeNull()
  })
})

describe('starea cardului', () => {
  it('arată cele 4 capitole anterioare, fără cel curent', () => {
    for (let i = 1; i <= 6; i++) savePosition('psalmi', i, 2, i)
    const history = getHistorySnapshot()!
    expect(history.position.capitol).toBe(6)
    expect(history.recent.map(r => r.capitol)).toEqual([5, 4, 3, 2])
  })

  it('întoarce același obiect cât timp stocarea nu se schimbă', () => {
    savePosition('ioan', 3, 2, 1)
    expect(getHistorySnapshot()).toBe(getHistorySnapshot())
  })

  it('stabil și după ștergerea unei valori corupte', () => {
    localStorage.setItem(POSITION_KEY, 'stricat')
    const first = getHistorySnapshot()
    expect(getHistorySnapshot()).toBe(first)
  })

  it('„Șterge istoricul" golește ambele chei și anunță abonații', () => {
    savePosition('ioan', 3, 2, 1)
    const listener = vi.fn()
    window.addEventListener('lectura:biblia', listener)
    clearHistory()
    window.removeEventListener('lectura:biblia', listener)
    expect(localStorage.getItem(POSITION_KEY)).toBeNull()
    expect(localStorage.getItem(RECENT_KEY)).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    expect(getHistorySnapshot()).toBeNull()
  })
})

describe('linkuri', () => {
  const position = { carte: 'ioan', capitol: 3, verset: 12, ts: 1 }
  it.each([['ro', '/biblie/ioan/3#v12'], ['en', '/en/bible/ioan/3#v12'], ['ru', '/ru/bibliya/ioan/3#v12']] as const)('%s', (locale, href) => {
    expect(resumeHref(position, locale)).toBe(href)
    expect(chapterHref(position, locale)).toBe(href.split('#')[0])
  })
})

describe('regulile urmăritorului', () => {
  it('versetul de sus e cel mai mic vizibil, iar versetul 0 devine 1', () => {
    expect(topVerse([7, 5, 6])).toBe(5)
    expect(topVerse([0, 1, 2])).toBe(1)
    expect(topVerse([])).toBeNull()
  })

  it('citește doar ancore #v<N>', () => {
    expect(verseFromHash('#v12')).toBe(12)
    expect(verseFromHash('#v')).toBeNull()
    expect(verseFromHash('#x12')).toBeNull()
    expect(verseFromHash('')).toBeNull()
  })

  it('recunoaște sosirea de la căutare', () => {
    expect(isSearchReferrer('https://parintelemarin.com/biblie?q=lumina')).toBe(true)
    expect(isSearchReferrer('https://parintelemarin.com/biblie')).toBe(false)
    expect(isSearchReferrer('')).toBe(false)
  })

  it('așteaptă derularea la ancoră, la referrer de căutare și după redirecționare', () => {
    const nav = { hash: '', referrer: '', redirectCount: 0 }
    expect(waitsForScroll(nav)).toBe(false)
    expect(waitsForScroll({ ...nav, hash: '#v5' })).toBe(true)
    expect(waitsForScroll({ ...nav, referrer: 'https://parintelemarin.com/biblie?q=x' })).toBe(true)
    expect(waitsForScroll({ ...nav, redirectCount: 1 })).toBe(true)
  })
})
