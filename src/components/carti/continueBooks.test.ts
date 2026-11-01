// @vitest-environment jsdom
import { act, createElement, type FC, type PropsWithChildren, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider, type Locale } from '@/lib/i18n/context'
import {
  BOOK_POSITION_KEY, BOOK_RECENT_KEY, readBookPosition, readRecentBooks, saveBookLocation, savedLocation, touchBook,
} from '@/lib/carti/readingPosition'
import BookReading from './BookReading'
import ContinueBooks from './ContinueBooks'

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const Provider = I18nProvider as FC<PropsWithChildren<{ initialLocale: Locale }>>
const BOOKS = [
  { slug: 'acatist', titleRo: 'Acatist de probă' },
  { slug: 'tilcuire', titleRo: 'Tâlcuire de probă' },
  { slug: 'rugaciune', titleRo: 'Rugăciune de probă' },
]

let root: Root | null = null
let container: HTMLElement

function mount(node: ReactNode, locale: Locale = 'ro') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(createElement(Provider, { initialLocale: locale }, node)))
}

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

describe('ContinueBooks', () => {
  const card = () => createElement(ContinueBooks, { books: BOOKS })
  const link = () => container.querySelector('a.continue-link')
  const recent = () => [...container.querySelectorAll('.continue-recent a')].map(a => [a.getAttribute('href'), a.textContent])

  it('fără istoric nu apare', () => {
    mount(card())
    expect(container.innerHTML).toBe('')
  })

  it('pe server nu randează nimic', () => {
    saveBookLocation('acatist', { procent: 5 }, 1)
    expect(renderToString(createElement(Provider, { initialLocale: 'ro' }, card()))).not.toContain('continue-card')
  })

  it.each([
    ['ro', '/carti/acatist#s9', 'Continuă lectura: Acatist de probă, Condac 5'],
    ['en', '/en/library/acatist#s9', 'Continue reading: Acatist de probă, Condac 5'],
    ['ru', '/ru/biblioteka/acatist#s9', 'Продолжить чтение: Acatist de probă, Condac 5'],
  ] as const)('%s: secțiune', (locale, href, text) => {
    saveBookLocation('acatist', { sectiune: 'Condac 5', ancora: 's9' }, 1)
    mount(card(), locale)
    expect(link()!.getAttribute('href')).toBe(href)
    expect(link()!.textContent).toBe(text)
  })

  it('procent, cu titlul din lista paginii', () => {
    saveBookLocation('tilcuire', { procent: 35 }, 1)
    mount(card())
    expect(link()!.getAttribute('href')).toBe('/carti/tilcuire#p35')
    expect(link()!.textContent).toBe('Continuă lectura: Tâlcuire de probă, 35%')
  })

  it('o carte fără loc apare doar la „Citite recent"', () => {
    touchBook('rugaciune', 1)
    mount(card())
    expect(link()).toBeNull()
    expect(recent()).toEqual([['/carti/rugaciune', 'Rugăciune de probă']])
  })

  it('„Citite recent" nu repetă cartea din buton', () => {
    saveBookLocation('tilcuire', { procent: 35 }, 1)
    touchBook('rugaciune', 2)
    mount(card())
    expect(recent().map(r => r[0])).toEqual(['/carti/rugaciune'])
  })

  it('cel mult 4 cărți la „Citite recent"', () => {
    const books = Array.from({ length: 6 }, (_, i) => ({ slug: `c-${i}`, titleRo: `C ${i}` }))
    books.forEach((b, i) => touchBook(b.slug, i + 1))
    mount(createElement(ContinueBooks, { books }))
    expect(recent()).toHaveLength(4)
  })

  it('o carte ștearsă din Bibliotecă dispare și din stocare', () => {
    saveBookLocation('stearsa', { procent: 35 }, 1)
    touchBook('rugaciune', 2)
    mount(card())
    expect(link()).toBeNull()
    expect(recent().map(r => r[0])).toEqual(['/carti/rugaciune'])
    expect(readBookPosition()).toBeNull()
    expect(readRecentBooks().map(b => b.id)).toEqual(['rugaciune'])
  })

  it('„Șterge istoricul" golește cheile și ascunde cardul', () => {
    saveBookLocation('acatist', { procent: 35 }, 1)
    mount(card())
    act(() => container.querySelector('button')!.click())
    expect(localStorage.getItem(BOOK_POSITION_KEY)).toBeNull()
    expect(localStorage.getItem(BOOK_RECENT_KEY)).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('cu stocarea blocată nu apare și nu aruncă', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    mount(card())
    expect(container.innerHTML).toBe('')
  })
})

describe('BookReading', () => {
  type Entry = { target: Element; isIntersecting: boolean }
  let report: (entries: Entry[]) => void
  let content: HTMLElement
  const rect = (top: number, height: number) => ({ top, height, bottom: top + height }) as DOMRect

  function prepare(html: string) {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: (entries: Entry[]) => void) { report = cb }
      observe() {}
      disconnect() {}
    })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    content = document.createElement('div')
    content.className = 'rich reading'
    content.innerHTML = html
    document.body.appendChild(content)
    for (const el of content.querySelectorAll('p')) el.scrollIntoView = vi.fn()
  }

  const SECTIONS = '<p><strong>Condac 1</strong></p><p>a</p><p><strong>Icos 1</strong></p><p>b</p><p><strong>Condac 2</strong></p><p>c</p>'
  const scrollBy = (y: number) => {
    vi.stubGlobal('scrollY', y)
    act(() => { window.dispatchEvent(new Event('scroll')) })
  }
  /** Trece perioada de așezare, apoi cititorul derulează. */
  const readTo = (top: number) => {
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(rect(top, 5000))
    act(() => { vi.advanceTimersByTime(1000) })
    scrollBy(1000)
  }
  const passHeading = (i: number) => act(() => report([{ target: content.querySelectorAll('p')[i], isIntersecting: true }]))
  const reader = (id = 'acatist') => createElement(BookReading, { id })
  const button = () => container.querySelector('button')

  it('dă secțiuni doar în client, fără să schimbe textul', () => {
    prepare(SECTIONS)
    mount(reader())
    expect(content.querySelector('#s2')?.textContent).toBe('Icos 1')
  })

  it('deschisă fără derulare: doar în listă, fără loc', () => {
    prepare(SECTIONS)
    mount(reader())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(readRecentBooks().map(b => b.id)).toEqual(['acatist'])
    expect(readBookPosition()).toBeNull()
  })

  it('salvează ultima secțiune depășită, după 800 ms', () => {
    prepare(SECTIONS)
    mount(reader())
    readTo(-1000)
    passHeading(0)
    passHeading(2)
    act(() => { vi.advanceTimersByTime(800) })
    expect(readBookPosition()).toMatchObject({ id: 'acatist', sectiune: 'Icos 1', ancora: 's2' })
  })

  it('fără secțiuni, salvează procentul', () => {
    prepare('<p>text</p><p>text</p>')
    mount(reader('tilcuire'))
    readTo(-1650)
    act(() => { vi.advanceTimersByTime(800) })
    const position = readBookPosition()
    expect(position).toMatchObject({ id: 'tilcuire' })
    expect((position as { procent: number }).procent).toBeGreaterThan(30)
  })

  it('salvează imediat la ieșirea din pagină', () => {
    prepare('<p>text</p>')
    mount(reader('tilcuire'))
    readTo(-1650)
    window.dispatchEvent(new Event('pagehide'))
    expect(readBookPosition()?.id).toBe('tilcuire')
  })

  it('la început, derularea nu suprascrie locul salvat', () => {
    prepare('<p>text</p>')
    saveBookLocation('tilcuire', { procent: 60 }, 1)
    mount(reader('tilcuire'))
    readTo(50)
    act(() => { vi.advanceTimersByTime(800) })
    expect(savedLocation('tilcuire')).toMatchObject({ procent: 60 })
  })

  it('la sfârșitul textului locul dispare, cartea rămâne citită recent', () => {
    prepare('<p>text</p>')
    saveBookLocation('tilcuire', { procent: 60 }, 1)
    mount(reader('tilcuire'))
    readTo(-5000)
    act(() => { vi.advanceTimersByTime(800) })
    expect(readBookPosition()).toBeNull()
    expect(readRecentBooks().map(b => b.id)).toEqual(['tilcuire'])
  })

  it('butonul apare doar dacă această carte are loc salvat', () => {
    prepare(SECTIONS)
    saveBookLocation('alta', { procent: 50 }, 1)
    mount(reader())
    expect(button()).toBeNull()
  })

  it.each([
    ['ro', 'Continuă de la 60%'],
    ['en', 'Continue from 60%'],
    ['ru', 'Продолжить с места: 60%'],
  ] as const)('%s: buton cu locul salvat', (locale, text) => {
    prepare('<p>text</p>')
    saveBookLocation('tilcuire', { procent: 60 }, 1)
    mount(reader('tilcuire'), locale)
    expect(button()!.textContent).toBe(text)
  })

  it('clicul pe buton duce la loc și ascunde butonul', () => {
    prepare(SECTIONS)
    saveBookLocation('acatist', { sectiune: 'Icos 1', ancora: 's2' }, 1)
    mount(reader())
    act(() => button()!.click())
    expect(content.querySelector<HTMLElement>('#s2')!.scrollIntoView).toHaveBeenCalled()
    expect(button()).toBeNull()
  })

  it('deschiderea normală nu derulează', () => {
    prepare('<p>text</p>')
    saveBookLocation('tilcuire', { procent: 60 }, 1)
    mount(reader('tilcuire'))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('din cardul Bibliotecii derulează la procent și scoate ancora din URL', () => {
    prepare('<p>text</p>')
    saveBookLocation('tilcuire', { procent: 60 }, 1)
    window.location.hash = '#p60'
    mount(reader('tilcuire'))
    expect(window.scrollTo).toHaveBeenCalledOnce()
    expect(window.location.hash).toBe('')
    expect(button()).toBeNull()
  })

  it('ancoră necunoscută după editarea cărții: locul se șterge', () => {
    prepare(SECTIONS)
    saveBookLocation('acatist', { sectiune: 'Icos 9', ancora: 's20' }, 1)
    mount(reader())
    expect(savedLocation('acatist')).toBeNull()
    expect(button()).toBeNull()
  })

  it('aceeași ancoră, alt titlu: locul se șterge', () => {
    prepare(SECTIONS)
    saveBookLocation('acatist', { sectiune: 'Alt titlu', ancora: 's2' }, 1)
    mount(reader())
    expect(savedLocation('acatist')).toBeNull()
  })

  it('cu stocarea blocată nu aruncă', () => {
    prepare('<p>text</p>')
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    mount(reader('tilcuire'))
    readTo(-1650)
    expect(() => { window.dispatchEvent(new Event('pagehide')) }).not.toThrow()
    expect(button()).toBeNull()
  })
})
