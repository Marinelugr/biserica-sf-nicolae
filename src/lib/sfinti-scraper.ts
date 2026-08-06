import { decode } from 'he'

interface SfantScrapat { text: string; praznic: boolean }

const ENTRY_RE = /<a[^>]+class="[^"]*entry-link[^"]*"[^>]*>\s*<span[^>]*>([\s\S]+?)<\/span>\s*<\/a>/gi

export function parseZi(html: string): SfantScrapat[] {
  const rezultate: SfantScrapat[] = []
  for (const m of html.matchAll(ENTRY_RE)) {
    let text = m[1].replace(/<[^>]*>/g, '')
    text = decode(text).replace(/\s+/g, ' ').trim().replace(/\.$/, '')
    if (text.length > 3) rezultate.push({ text, praznic: /class="[^"]*\br1\b[^"]*"/i.test(m[0]) })
  }
  return rezultate
}

export async function preiaZi(zi: number, luna: number, an: number): Promise<SfantScrapat[]> {
  const url = `https://calendar.ortodox.md/calendar/detailed/RO/${String(zi).padStart(2, '0')}/${String(luna).padStart(2, '0')}/${an}`
  const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 0 },
  }
  const res = await fetch(url, fetchOptions)
  if (!res.ok) return []
  return parseZi(await res.text())
}

export function slugSfant(text: string, luna: number, zi: number): string {
  const base = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
  return `${base}-${luna}-${zi}`
}
