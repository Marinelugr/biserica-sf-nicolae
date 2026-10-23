import { escape } from 'he'
import { htmlToPlainText } from '@/lib/utils'

export const FALLBACK_MESAJ = 'Bine ați venit la pagina oficială a bisericii cu hramul Sfântul Ierarh Nicolae din Hîrtopul Mic, raionul Criuleni, Republica Moldova. Îmi doresc ca toată informația care o găsiți aici să fie izvor de lumină și de întărire duhovnicească pentru sufletele voastre. Dragi creștini, vă punem la dispoziție Sfânta Scriptură, calendarul ortodox, rugăciuni pentru toate trebuințele, cărți ortodoxe, filme ortodoxe, noutăți din viața parohiei și din viața Bisericii lui Hristos din toată lumea. Hristos în mijlocul nostru!'
export const FALLBACK_SEMNATURA = 'Pr. Marin Grigoriță, Parohul Bisericii'
export const FALLBACK_PHOTO_URL = '/images/parinte-marin.jpg'

/** Limita HTML-ului salvat din admin (verificată și pe server). */
export const MAX_MESSAGE_HTML = 30_000

/** Un salut („Iubiți credincioși,”) are cel mult atâtea caractere de text simplu. */
const GREETING_MAX = 60

const HTML_TAG = /<(p|h[1-6]|ul|ol|li|blockquote|pre|div|strong|em|b|i|u|s|a|br|hr)\b[^>]*>/i

/** Mesajul e deja HTML (salvat din editorul TipTap), nu text simplu vechi? */
export function isHtml(s: string): boolean {
  return HTML_TAG.test(s)
}

/**
 * Mesajele vechi (scrise în <textarea>): text simplu cu marcaje de tip Markdown.
 * Întâi se escapează HTML-ul, apoi: linie goală → paragraf nou, rând nou → <br>,
 * **text** → <strong>, *text* → <em>; `**` rămas fără pereche se șterge.
 */
export function legacyTextToHtml(text: string): string {
  const blocks = escape(text.replace(/\r\n?/g, '\n'))
    .split(/\n[ \t]*\n/)
    .map(b => b.trim())
    .filter(Boolean)

  return blocks
    .map(block => {
      const inline = block
        .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
        .replace(/\*\*/g, '')
        .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![*\w])/g, '$1<em>$2</em>')
        .replace(/[ \t]*\n[ \t]*/g, '<br>')
      return `<p>${inline}</p>`
    })
    .join('')
}

/** HTML-ul de afișat: HTML nou trece neschimbat, textul vechi se convertește, golul → mesajul implicit. */
export function messageToHtml(raw: string | null | undefined): string {
  const s = (raw ?? '').trim()
  if (!s) return legacyTextToHtml(FALLBACK_MESAJ)
  if (isHtml(s)) return s
  return legacyTextToHtml(s)
}

export function messageToPlainText(raw: string | null | undefined): string {
  return htmlToPlainText(messageToHtml(raw))
}

/** Descrierea meta: text simplu, tăiat la limită de cuvânt, fără asteriscuri. */
export function messageDescription(raw: string | null | undefined, max = 160): string {
  const plain = messageToPlainText(raw).replace(/\*+/g, '').replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '') + '…'
}

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'wbr'])

/**
 * Blocurile de nivel superior ale HTML-ului, în ordine (<p>, <h2>, <ul>…),
 * cu etichetele imbricate de același tip numărate corect.
 */
export function splitBlocks(html: string): string[] {
  const blocks: string[] = []
  const tag = /<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi
  let pos = 0
  let open: string | null = null
  let depth = 0
  let start = 0
  let m: RegExpExecArray | null
  while ((m = tag.exec(html))) {
    const [full, closing, rawName, selfClose] = m
    const name = rawName.toLowerCase()
    if (open === null) {
      const before = html.slice(pos, m.index)
      if (before.trim()) blocks.push(before.trim())
      pos = m.index + full.length
      if (closing) continue
      if (VOID_TAGS.has(name) || selfClose) { blocks.push(full); continue }
      open = name
      depth = 1
      start = m.index
      continue
    }
    if (name !== open) continue
    if (closing) depth--
    else if (!selfClose) depth++
    if (depth === 0) {
      blocks.push(html.slice(start, m.index + full.length))
      pos = m.index + full.length
      open = null
    }
  }
  const rest = open === null ? html.slice(pos) : html.slice(start)
  if (rest.trim()) blocks.push(rest.trim())
  return blocks
}

function isGreeting(blockHtml: string): boolean {
  if (!/^<p[\s>]/i.test(blockHtml)) return false
  const plain = htmlToPlainText(blockHtml)
  return plain.length > 0 && plain.length <= GREETING_MAX && /[,:!]$/.test(plain)
}

/**
 * Extrasul pentru prima pagină: blocuri întregi, în ordine, până când textul
 * simplu depășește `maxChars` (salutul scurt de la început nu se numără).
 * Nu taie niciodată în mijlocul unui bloc — tăierea vizuală o face CSS-ul.
 */
export function messageExcerptHtml(raw: string | null | undefined, { maxChars = 420 } = {}): { html: string; truncated: boolean } {
  const blocks = splitBlocks(messageToHtml(raw)).filter(b => htmlToPlainText(b))
  const out: string[] = []
  let count = 0
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    out.push(b)
    i++
    if (i === 1 && isGreeting(b)) continue
    count += htmlToPlainText(b).length
    if (count >= maxChars) break
  }
  return { html: decorateLetter(out.join('')), truncated: i < blocks.length }
}

/** Primul paragraf, dacă e un salut scurt („Iubiți credincioși,”), primește clasa `salutare`. */
export function decorateLetter(html: string): string {
  const first = splitBlocks(html)[0]
  if (!first || !isGreeting(first) || /class="[^"]*\bsalutare\b/.test(first)) return html
  const decorated = /^<p\s[^>]*class="/i.test(first)
    ? first.replace(/class="/i, 'class="salutare ')
    : first.replace(/^<p/i, '<p class="salutare"')
  return html.replace(first, decorated)
}

/** @deprecated folosit doar până la trecerea pe extrasul formatat (A3). */
export function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.slice(0, count).join(' ').trim()
}
