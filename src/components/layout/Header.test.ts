import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import en from '@/lib/i18n/en'
import ro from '@/lib/i18n/ro'
import ru from '@/lib/i18n/ru'

type Locale = 'ro' | 'en' | 'ru'
const state = vi.hoisted(() => ({ pathname: '/', locale: 'ro' as string, t: {} as unknown }))
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next/image', () => ({ default: () => null }))
vi.mock('@/lib/i18n/context', () => ({ useI18n: () => ({ t: state.t, locale: state.locale }) }))

const { default: Header } = await import('./Header')
const translations = { ro, en, ru }

function render(locale: Locale, pathname: string) {
  Object.assign(state, { locale, pathname, t: translations[locale] })
  return renderToStaticMarkup(createElement(Header))
}

/** Textele elementelor de prim nivel: legături și butonul „Parohia”. */
function navLabels(html: string): string[] {
  return [...html.matchAll(/<(?:a|button)\b[^>]*>([^<]+)/g)].map(m => m[1])
}
const desktopNav = (html: string) => html.slice(html.indexOf('<nav'), html.indexOf('</nav>'))
const mobileNav = (html: string) => html.slice(html.lastIndexOf('<nav'), html.lastIndexOf('</nav>'))
const biblelink = (html: string, label: string) => [...html.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].find(m => m[1] === label)?.[0] ?? ''

const CASES: [Locale, string, string, string[]][] = [
  ['ro', 'Biblia', '/biblie', ['Cuvântul', 'Video', 'Calendar', 'Biblia', 'Bibliotecă', 'Parohia']],
  ['en', 'Bible', '/en/bible', ['The Word', 'Video', 'Calendar', 'Bible', 'Library', 'Parish']],
  ['ru', 'Библия', '/ru/bibliya', ['Слово', 'Видео', 'Календарь', 'Библия', 'Библиотека', 'Приход']],
]

beforeEach(() => { state.pathname = '/' })

describe.each(CASES)('meniul principal (%s)', (locale, label, href, order) => {
  it('desktop: ordinea cerută, „Contact” la sfârșit', () => {
    const labels = navLabels(desktopNav(render(locale, '/')))
    expect(labels.slice(0, order.length)).toEqual(order)
    expect(labels.at(-1)).toBe(translations[locale].nav.contact)
  })

  it('duce la ruta localizată', () => {
    expect(biblelink(desktopNav(render(locale, '/')), label)).toContain(`href="${href}"`)
  })

  it('mobil: Biblia e o singură dată, imediat înainte de Bibliotecă', () => {
    const labels = navLabels(mobileNav(render(locale, '/')))
    expect(labels.filter(l => l === label)).toHaveLength(1)
    expect(labels[labels.indexOf(label) + 1]).toBe(order[4])
  })

  it.each([href, `${href}/ioan`, `${href}/ioan/3`])('activ pe %s, pe desktop și pe mobil', path => {
    const html = render(locale, path)
    expect(biblelink(desktopNav(html), label)).toContain('aria-current="page"')
    expect(biblelink(mobileNav(html), label)).toContain('aria-current="page"')
  })

  it('inactiv pe alte pagini, inclusiv pe adrese care doar încep la fel', () => {
    for (const path of ['/', `${href}-altceva`, '/contact']) {
      expect(biblelink(desktopNav(render(locale, path)), label)).not.toContain('aria-current')
    }
  })
})
