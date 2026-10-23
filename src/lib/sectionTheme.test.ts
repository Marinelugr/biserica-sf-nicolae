import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SEC_IDS, SEC_ICON, shelfGroup } from './sectionTheme'

// Citește CSS-ul real: dacă cineva schimbă o culoare în sections.css, testul o verifică.
const CSS = readFileSync(path.resolve(__dirname, '../app/sections.css'), 'utf8')
const GLOBALS = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')

type RGBA = [number, number, number, number]

function parseColor(s: string): RGBA {
  const v = s.trim()
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
  }
  const rgba = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (rgba) return [+rgba[1], +rgba[2], +rgba[3], rgba[4] === undefined ? 1 : +rgba[4]]
  throw new Error(`Culoare necunoscută: ${s}`)
}

/** `top` peste `bottom` (bottom opac). */
function over(top: RGBA, bottom: RGBA): RGBA {
  const a = top[3]
  return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(1) as RGBA
}

function luminance([r, g, b]: RGBA): number {
  const ch = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

function contrast(fg: RGBA, bg: RGBA): number {
  const solid = fg[3] < 1 ? over(fg, bg) : fg
  const [a, b] = [luminance(solid), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const COLOR_RE = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi

function tokensFor(id: string): Record<string, string> {
  const re = new RegExp(`\\[data-sec="${id}"\\]\\s*,\\s*\\[data-head="${id}"\\]\\s*\\{([^}]*)\\}`)
  const m = CSS.match(re)
  if (!m) throw new Error(`Lipsesc tokenii pentru data-sec="${id}"`)
  const out: Record<string, string> = {}
  for (const d of m[1].matchAll(/(--sec-[a-z-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim()
  return out
}

/** Capetele gradientului (+ lumina decorativă peste ele, dacă există). */
function backgrounds(t: Record<string, string>): RGBA[] {
  const stops = (t['--sec-bg'].match(COLOR_RE) ?? []).map(parseColor)
  expect(stops.length, 'gradient cu cel puțin două culori').toBeGreaterThanOrEqual(2)
  for (const s of stops) expect(s[3], `fundal opac: ${t['--sec-bg']}`).toBe(1)
  if (!t['--sec-glow']) return stops
  const glow = parseColor(t['--sec-glow'])
  return [...stops, ...stops.map(s => over(glow, s))]
}

/** Fundalul implicit `.card` din globals.css, compus peste --bg (antetul paginilor interioare). */
function nightCard(): RGBA[] {
  const bg = parseColor(GLOBALS.match(/:root\s*\{[^}]*--bg:\s*([^;]+);/)![1])
  const card = GLOBALS.match(/\.card\s*\{[^}]*background:\s*linear-gradient\(([^;]+)\);/)![1]
  return (card.match(COLOR_RE) ?? []).map(c => over(parseColor(c), bg))
}

const DISCOVERED = [...CSS.matchAll(/\[data-sec="([a-z]+)"\]\s*,\s*\[data-head=/g)].map(m => m[1])

describe('sections.css — identitățile', () => {
  it('toate cele ≥ 11 identități au tokeni, iar lista din cod e aceeași', () => {
    expect(SEC_IDS.length).toBeGreaterThanOrEqual(11)
    expect([...DISCOVERED].sort()).toEqual([...SEC_IDS].sort())
    for (const id of SEC_IDS) expect(SEC_ICON[id]).toBeTruthy()
  })

  it('nu există două identități cu aceeași pereche accent + fundal', () => {
    const pairs = SEC_IDS.map(id => { const t = tokensFor(id); return `${t['--sec-accent']}|${t['--sec-bg']}` })
    expect(new Set(pairs).size).toBe(pairs.length)
  })

  it('fiecare are toți tokenii obligatorii', () => {
    for (const id of SEC_IDS) {
      const t = tokensFor(id)
      for (const k of ['--sec-accent', '--sec-accent-text', '--sec-on-night', '--sec-bg', '--sec-edge', '--sec-ink', '--sec-mute', '--sec-radius']) {
        expect(t[k], `${id}: ${k}`).toBeTruthy()
      }
    }
  })
})

describe('sections.css — contrast WCAG pe ambele capete ale gradientului', () => {
  const night = nightCard()

  for (const id of SEC_IDS) {
    it(id, () => {
      const t = tokensFor(id)
      const bgs = backgrounds(t)
      const checks: [string, RGBA, number, RGBA[]][] = [
        ['text normal (--sec-ink)', parseColor(t['--sec-ink']), 4.5, bgs],
        ['text secundar (--sec-mute)', parseColor(t['--sec-mute']), 4.5, bgs],
        ['accent-text', parseColor(t['--sec-accent-text']), 4.5, bgs],
        ['accent (grafic / text mare)', parseColor(t['--sec-accent']), 3, bgs],
        ['accent pe antetul paginii (fundal noapte)', parseColor(t['--sec-on-night']), 4.5, night],
      ]
      for (const [label, fg, min, list] of checks) {
        for (const bg of list) {
          const c = contrast(fg, bg)
          expect(c, `${id} · ${label} pe rgb(${bg.slice(0, 3).map(Math.round)}) = ${c.toFixed(2)}`).toBeGreaterThanOrEqual(min)
        }
      }
    })
  }

  it('cazuri speciale: salutul auriu pe vișiniu, textul pe pastile/etichete', () => {
    const gold = parseColor(GLOBALS.match(/:root\s*\{[^}]*--gold:\s*([^;]+);/)![1])
    for (const bg of backgrounds(tokensFor('cuvant'))) expect(contrast(gold, bg)).toBeGreaterThanOrEqual(4.5)
    // eticheta de categorie (#1b1405 pe accentul de la Știri) și anul ales (#0a1330 pe azuriu)
    expect(contrast(parseColor('#1b1405'), parseColor(tokensFor('stiri')['--sec-accent']))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(parseColor('#0a1330'), parseColor(tokensFor('slujbe')['--sec-accent']))).toBeGreaterThanOrEqual(4.5)
  })
})

describe('shelfGroup', () => {
  it('tipurile de cărți → cele patru cotoare', () => {
    expect(shelfGroup('ACATIST')).toBe('acatiste')
    expect(shelfGroup('RUGACIUNE')).toBe('rugaciuni')
    expect(shelfGroup('PREDICA')).toBe('teologie')
    expect(shelfGroup('ALTELE')).toBe('altele')
    expect(shelfGroup(null)).toBe('altele')
  })
})
