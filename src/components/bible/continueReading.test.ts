// @vitest-environment jsdom
import { createElement, act, type FC, type PropsWithChildren, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider, type Locale } from '@/lib/i18n/context'
import { POSITION_KEY, RECENT_KEY, savePosition } from '@/lib/bible/readingPosition'
import ContinueReading from './ContinueReading'
import ReadingTracker from './ReadingTracker'

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const Provider = I18nProvider as FC<PropsWithChildren<{ initialLocale: Locale }>>

let root: Root | null = null
let container: HTMLElement

function mount(node: ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(node))
}

const card = (locale: Locale = 'ro') => createElement(Provider, { initialLocale: locale }, createElement(ContinueReading))

beforeEach(() => localStorage.clear())
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  window.location.hash = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ContinueReading', () => {
  const link = () => container.querySelector<HTMLAnchorElement>('a.continue-link')

  it('nu apare fără poziție salvată', () => {
    mount(card())
    expect(container.innerHTML).toBe('')
  })

  it('nu apare cu o poziție invalidă, iar cheia se șterge', () => {
    localStorage.setItem(POSITION_KEY, '{"carte":"ioan","capitol":3,"verset":-1,"ts":1}')
    mount(card())
    expect(container.innerHTML).toBe('')
    expect(localStorage.getItem(POSITION_KEY)).toBeNull()
  })

  it('pe server nu randează nimic, chiar dacă există poziție', () => {
    savePosition('ioan', 3, 12, 1)
    const html = renderToString(card())
    expect(html).not.toContain('continue-card')
    expect(html).not.toContain('Continu')
  })

  it.each([
    ['ro', '/biblie/ioan/3#v12', 'Continuă lectura: Ioan 3, versetul 12'],
    ['en', '/en/bible/ioan/3#v12', 'Continue reading: John 3, verse 12'],
    ['ru', '/ru/bibliya/ioan/3#v12', 'Продолжить чтение: От Иоанна 3, стих 12'],
  ] as const)('%s: link și text localizate', (locale, href, text) => {
    savePosition('ioan', 3, 12, 1)
    mount(card(locale))
    expect(link()!.getAttribute('href')).toBe(href)
    expect(link()!.textContent).toBe(text)
  })

  it('„Citite recent" are capitolele anterioare, ca linkuri localizate', () => {
    savePosition('matei', 5, 1, 1)
    savePosition('ioan', 3, 12, 2)
    mount(card('en'))
    const recent = [...container.querySelectorAll('.continue-recent a')]
    expect(recent.map(a => a.getAttribute('href'))).toEqual(['/en/bible/matei/5'])
  })

  it('fără capitole anterioare, secțiunea „Citite recent" lipsește', () => {
    savePosition('ioan', 3, 12, 1)
    mount(card())
    expect(container.querySelector('.continue-recent')).toBeNull()
  })

  it('„Șterge istoricul" golește cheile și ascunde cardul', () => {
    savePosition('ioan', 3, 12, 1)
    mount(card())
    act(() => container.querySelector('button')!.click())
    expect(localStorage.getItem(POSITION_KEY)).toBeNull()
    expect(localStorage.getItem(RECENT_KEY)).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('cu stocarea blocată nu apare și nu aruncă', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    mount(card())
    expect(container.innerHTML).toBe('')
  })
})

describe('ReadingTracker', () => {
  type Entry = { target: Element; isIntersecting: boolean }
  let report: (entries: Entry[]) => void

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: (entries: Entry[]) => void) { report = cb }
      observe() {}
      disconnect() {}
    })
    for (let n = 1; n <= 5; n++) {
      const verse = document.createElement('span')
      verse.id = `v${n}`
      verse.dataset.verse = String(n)
      verse.scrollIntoView = vi.fn()
      document.body.appendChild(verse)
    }
  })

  const show = (...verses: number[]) => act(() => report(verses.map(n => ({ target: document.getElementById(`v${n}`)!, isIntersecting: true }))))
  const hide = (...verses: number[]) => act(() => report(verses.map(n => ({ target: document.getElementById(`v${n}`)!, isIntersecting: false }))))
  const saved = () => JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null')
  const tracker = () => createElement(ReadingTracker, { carte: 'ioan', capitol: 3 })

  it('salvează cel mai de sus verset vizibil, după 800 ms', () => {
    mount(tracker())
    show(3, 4)
    vi.advanceTimersByTime(799)
    expect(saved()).toBeNull()
    vi.advanceTimersByTime(1)
    expect(saved()).toMatchObject({ carte: 'ioan', capitol: 3, verset: 3 })
  })

  it('urmărește derularea', () => {
    mount(tracker())
    show(1, 2)
    hide(1)
    show(3)
    vi.advanceTimersByTime(800)
    expect(saved().verset).toBe(2)
  })

  it('salvează imediat când pagina se ascunde sau se închide', () => {
    mount(tracker())
    show(4)
    window.dispatchEvent(new Event('pagehide'))
    expect(saved().verset).toBe(4)
    show(5)
    hide(4)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(saved().verset).toBe(5)
  })

  it('păstrează ultimul verset când niciunul nu mai e în ecran', () => {
    mount(tracker())
    show(5)
    hide(5)
    vi.advanceTimersByTime(800)
    expect(saved().verset).toBe(5)
  })

  it('deschis la un verset, fără derulare: nu salvează; după derulare: salvează', () => {
    window.location.hash = '#v4'
    mount(tracker())
    show(4)
    vi.advanceTimersByTime(5000)
    window.dispatchEvent(new Event('pagehide'))
    expect(saved()).toBeNull()

    vi.stubGlobal('scrollY', 500)
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(800)
    expect(saved().verset).toBe(4)
  })

  it('evidențiază 2 s versetul de reluare', () => {
    savePosition('ioan', 3, 4, 1)
    window.location.hash = '#v4'
    mount(tracker())
    const verse = document.getElementById('v4')!
    expect(verse.dataset.resume).toBe('on')
    vi.advanceTimersByTime(2000)
    expect(verse.dataset.resume).toBe('off')
  })

  it('la reluare nu forțează derularea dacă versetul e deja în ecran', () => {
    savePosition('ioan', 3, 4, 1)
    window.location.hash = '#v4'
    const verse = document.getElementById('v4')!
    vi.spyOn(verse, 'getBoundingClientRect').mockReturnValue({ top: 200, bottom: 260 } as DOMRect)
    mount(tracker())
    vi.advanceTimersByTime(50)
    expect(verse.scrollIntoView).not.toHaveBeenCalled()
  })

  it('la reluare readuce versetul doar dacă mărimea textului l-a împins afară din ecran', () => {
    savePosition('ioan', 3, 4, 1)
    window.location.hash = '#v4'
    const verse = document.getElementById('v4')!
    vi.spyOn(verse, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5060 } as DOMRect)
    mount(tracker())
    vi.advanceTimersByTime(50)
    expect(verse.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('nu evidențiază un verset din căutare sau din alt capitol', () => {
    savePosition('ioan', 2, 4, 1)
    window.location.hash = '#v4'
    mount(tracker())
    expect(document.getElementById('v4')!.dataset.resume).toBeUndefined()
  })

  it('cu stocarea blocată nu aruncă', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    mount(tracker())
    show(2)
    expect(() => { vi.advanceTimersByTime(800); window.dispatchEvent(new Event('pagehide')) }).not.toThrow()
  })
})
