import { describe, it, expect } from 'vitest'
import {
  isHtml, legacyTextToHtml, messageToHtml, messageToPlainText, messageDescription,
  messageExcerptHtml, decorateLetter, splitBlocks, FALLBACK_MESAJ,
} from './priestMessage'
import { MESAJ_VECHI } from './fixtures/mesajVechi'

describe('legacyTextToHtml', () => {
  it('**Iubiți credincioși,** → paragraf îngroșat', () => {
    expect(legacyTextToHtml('**Iubiți credincioși,**')).toBe('<p><strong>Iubiți credincioși,</strong></p>')
  })

  it('HTML-ul din textul vechi ajunge escapat, nu executat', () => {
    const html = legacyTextToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
    expect(legacyTextToHtml('<img src=x onerror=alert(1)>')).not.toMatch(/<img/)
  })

  it('linie goală → paragraf nou, rând nou → <br>', () => {
    expect(legacyTextToHtml('Unu\ndoi\n\nTrei\r\n\r\npatru')).toBe('<p>Unu<br>doi</p><p>Trei</p><p>patru</p>')
  })

  it('`**` fără pereche dispare', () => {
    expect(legacyTextToHtml('Text **neînchis')).toBe('<p>Text neînchis</p>')
    expect(legacyTextToHtml('**a** și **b')).toBe('<p><strong>a</strong> și b</p>')
  })

  it('*cursiv* fără spații lângă asteriscuri', () => {
    expect(legacyTextToHtml('un *cuvânt* aici')).toBe('<p>un <em>cuvânt</em> aici</p>')
    expect(legacyTextToHtml('2 * 3 * 4')).toBe('<p>2 * 3 * 4</p>')
  })
})

describe('messageToHtml', () => {
  it('HTML nou trece neschimbat', () => {
    const html = '<p><strong>Iubiți credincioși,</strong></p><h2>Titlu</h2><p>Text <em>cursiv</em></p>'
    expect(isHtml(html)).toBe(true)
    expect(messageToHtml(html)).toBe(html)
  })

  it('gol → mesajul implicit', () => {
    expect(messageToHtml('')).toBe(legacyTextToHtml(FALLBACK_MESAJ))
    expect(messageToHtml(null)).toContain('Hristos în mijlocul nostru!')
  })

  it('mesajul real vechi: fără `**`, cu paragrafe și salut îngroșat', () => {
    expect(isHtml(MESAJ_VECHI)).toBe(false)
    const html = messageToHtml(MESAJ_VECHI)
    expect(html).not.toContain('**')
    expect(html.startsWith('<p><strong>Iubiți credincioși,</strong></p>')).toBe(true)
    expect(splitBlocks(html).length).toBe(12)
    expect(messageToPlainText(MESAJ_VECHI)).not.toContain('*')
  })
})

describe('messageDescription', () => {
  it('nu conține `*`, se oprește la limită de cuvânt', () => {
    const d = messageDescription(MESAJ_VECHI, 160)
    expect(d).not.toContain('*')
    expect(d.length).toBeLessThanOrEqual(160)
    expect(d.endsWith('…')).toBe(true)
    expect(d).toMatch(/^Iubiți credincioși, Trăim/)
    expect(d.slice(0, -1)).not.toMatch(/\s$/)
  })
  it('textul scurt rămâne întreg', () => {
    expect(messageDescription('Scurt **și** bun', 160)).toBe('Scurt și bun')
  })
})

describe('splitBlocks', () => {
  it('blocuri imbricate de același tip', () => {
    expect(splitBlocks('<ul><li>a<ul><li>b</li></ul></li></ul><p>c</p><hr>')).toEqual([
      '<ul><li>a<ul><li>b</li></ul></li></ul>', '<p>c</p>', '<hr>',
    ])
  })
})

function balanced(html: string): boolean {
  const stack: string[] = []
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    const name = m[2].toLowerCase()
    if (['br', 'hr', 'img'].includes(name)) continue
    if (m[1]) { if (stack.pop() !== name) return false } else stack.push(name)
  }
  return stack.length === 0
}

describe('messageExcerptHtml', () => {
  it('respectă limita, nu rupe etichete, salutul nu se numără', () => {
    const { html, truncated } = messageExcerptHtml(MESAJ_VECHI, { maxChars: 420 })
    expect(truncated).toBe(true)
    expect(balanced(html)).toBe(true)
    expect(html).not.toContain('**')
    const blocks = splitBlocks(html)
    expect(blocks[0]).toBe('<p class="salutare"><strong>Iubiți credincioși,</strong></p>')
    // salut + primul paragraf (≈450 de caractere depășesc deja limita) — nimic mai mult
    expect(blocks.length).toBe(2)
  })

  it('se oprește după blocul care depășește limita', () => {
    const raw = '<p>' + 'a'.repeat(100) + '</p><p>' + 'b'.repeat(100) + '</p><p>' + 'c'.repeat(100) + '</p>'
    const { html, truncated } = messageExcerptHtml(raw, { maxChars: 150 })
    expect(html).toBe('<p>' + 'a'.repeat(100) + '</p><p>' + 'b'.repeat(100) + '</p>')
    expect(truncated).toBe(true)
  })

  it('mesaj scurt: întreg, fără trunchiere; paragrafele goale se ignoră', () => {
    const { html, truncated } = messageExcerptHtml('<p>Pace vouă.</p><p></p>')
    expect(html).toBe('<p>Pace vouă.</p>')
    expect(truncated).toBe(false)
  })
})

describe('decorateLetter', () => {
  it('salutul scurt primește clasa `salutare`', () => {
    expect(decorateLetter('<p>Dragi frați!</p><p>Text</p>')).toBe('<p class="salutare">Dragi frați!</p><p>Text</p>')
    expect(decorateLetter('<p class="x">Iubiți,</p>')).toBe('<p class="salutare x">Iubiți,</p>')
  })
  it('primul paragraf lung sau fără , : ! rămâne neschimbat', () => {
    expect(decorateLetter('<p>Iubiți credincioși</p>')).toBe('<p>Iubiți credincioși</p>')
    const long = '<p>' + 'x'.repeat(70) + ',</p>'
    expect(decorateLetter(long)).toBe(long)
    expect(decorateLetter('<h2>Salut,</h2>')).toBe('<h2>Salut,</h2>')
  })
})
