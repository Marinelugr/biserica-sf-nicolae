/**
 * „Din viața Bisericii" — preluarea automată a ultimelor articole de pe două
 * site-uri surse și afișarea lor pe homepage, câte un card fiecare:
 *
 *   1. mitropolia.md                         — „Din viața Mitropoliei"
 *   2. protopopiatul-criuleni-dubasari.md    — „Din viața Protopopiatului"
 *
 * Portare a mecanismului de pe protopopiatul-criuleni-dubasari.md
 * (includes/mitropolia_feed.php + includes/biserica_sf_nicolae_feed.php):
 * cache cu TTL de 6 ore, timeout strict per cerere, EȘEC SILENȚIOS — orice
 * problemă (timeout, HTTP != 200, parsare invalidă) e ignorată, cache-ul vechi
 * rămâne neatins, iar dacă nu există niciun cache cardul afectat pur și simplu
 * nu apare. Nu aruncă niciodată — homepage-ul nu se blochează și nu se rupe.
 *
 * Cache-ul se ține în tabelul `Setting` (o linie / sursă, valoare = JSON),
 * exact ca restul configurărilor site-ului — fără model Prisma nou, fără
 * migrare de schemă. Reîmprospătarea se face:
 *   - programat, din cron-ul /api/cron/feeds (la 6 ore, ca /api/cron/sfinti);
 *   - leneș, la prima vizită după expirarea TTL-ului (fallback dacă cron-ul
 *     n-a rulat încă — ex. imediat după un deploy).
 *
 * Mecanismele de fetch DIFERĂ per sursă (vezi comentariile de la refresh*):
 *   - mitropolia.md      → flux RSS WordPress + oembed pentru imagine;
 *   - protopopiatul...md → endpoint JSON public (data/noutati.json).
 */

import { decode } from 'he'
import { prisma } from '@/lib/prisma'

export interface FeedItem {
  title: string
  /** Dată deja formatată în română (ex. „6 septembrie 2026"); poate fi ''. */
  date: string
  url: string
  /** URL absolut al imaginii reprezentative sau '' (card fără imagine). */
  image: string
}

export interface ChurchLifeCard extends FeedItem {
  sourceUrl: string
  sourceName: string
  sourceLabel: string
}

interface FeedCacheData {
  fetchedAt: number
  items: FeedItem[]
}

interface FeedSource {
  key: string
  settingKey: string
  sourceUrl: string
  sourceName: string
  sourceLabel: string
  refresh: () => Promise<FeedItem[]>
}

const TTL_MS = 6 * 60 * 60 * 1000 // 6 ore, ca pe sursă
const TIMEOUT_MS = 4000 // fail rapid, nu blocăm homepage-ul
const MAX_ITEMS = 3 // pe card se afișează 1; restul = rezervă în cache
const UA = 'BisericaSfNicolaeBot/1.0 (+https://biserica-sf-nicolae.org)'

const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]

function dateRo(d: Date): string {
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS_RO[d.getMonth()]} ${d.getFullYear()}`
}

/** Descarcă un URL cu timeout scurt. Întoarce corpul răspunsului sau null. */
async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': UA },
        cache: 'no-store',
      })
      if (!res.ok) return null
      return await res.text()
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

/** Filtru: URL http(s) plauzibil de imagine de conținut (nu SVG/logo/spacer). */
function imageOk(url: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false
  const low = url.toLowerCase()
  if (low.endsWith('.svg')) return false
  const junk = ['/flags/', 'flag-', 'spacer', 'placeholder', 'blank.', '1x1',
    'pixel.', 'gravatar', 'avatar', 'emoji', '/plugins/', '/wp-includes/', 'logo', 'icon']
  return !junk.some(j => low.includes(j))
}

function absoluteUrl(url: string, base: string): string {
  const u = (url || '').trim()
  if (!u) return ''
  try {
    return new URL(u, base).href
  } catch {
    return ''
  }
}

/** og:image → twitter:image → prima <img> „reală" din HTML (regex, fără DOM). */
function imageFromHtml(html: string, baseUrl: string): string {
  const metaKeys = ['og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image:src', 'twitter:image']
  for (const key of metaKeys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
      'i',
    )
    const tag = html.match(re)?.[0]
    if (!tag) continue
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1]
    if (!content) continue
    const abs = absoluteUrl(decode(content.trim()), baseUrl)
    if (imageOk(abs)) return abs
  }
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0]
    const w = parseInt(tag.match(/\bwidth=["']?(\d+)/i)?.[1] || '0', 10)
    const h = parseInt(tag.match(/\bheight=["']?(\d+)/i)?.[1] || '0', 10)
    if ((w > 0 && w < 200) || (h > 0 && h < 150)) continue
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]
      || tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1]
      || tag.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1]
    if (!src) continue
    const abs = absoluteUrl(decode(src.trim()), baseUrl)
    if (imageOk(abs)) return abs
  }
  return ''
}

// ─── Sursa 1: mitropolia.md — flux RSS WordPress + oembed ─────────────────────

/** Extrage textul unui tag simplu dintr-un bloc XML (fără CDATA). */
function xmlTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!m) return ''
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

/**
 * mitropolia.md publică un flux RSS 2.0 WordPress standard la /feed/.
 * Extragem titlu / link / pubDate din primele articole. Imaginea se ia DOAR
 * pentru primul articol (singurul afișat), prin endpoint-ul oembed WordPress
 * (`thumbnail_url`, ~1 KB) cu fallback pe og:image din pagina articolului —
 * un singur fetch suplimentar, ca pe sursă.
 */
async function refreshMitropolia(): Promise<FeedItem[]> {
  const xml = await fetchText('https://mitropolia.md/feed/')
  if (!xml) return []

  const items: FeedItem[] = []
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const block = m[0]
    const title = decode(xmlTag(block, 'title'))
    const url = xmlTag(block, 'link')
    if (!title || !url) continue
    const pub = xmlTag(block, 'pubDate')
    const d = pub ? new Date(pub) : null
    items.push({ title, url, date: d ? dateRo(d) : '', image: '' })
    if (items.length >= MAX_ITEMS) break
  }
  if (!items.length) return []

  items[0].image = await mitropoliaImage(items[0].url)
  return items
}

async function mitropoliaImage(articleUrl: string): Promise<string> {
  try {
    const origin = new URL(articleUrl).origin
    const endpoint = `${origin}/wp-json/oembed/1.0/embed?format=json&url=${encodeURIComponent(articleUrl)}`
    const json = await fetchText(endpoint)
    if (json) {
      const data = JSON.parse(json) as { thumbnail_url?: string }
      const thumb = data?.thumbnail_url ? absoluteUrl(data.thumbnail_url.trim(), articleUrl) : ''
      if (imageOk(thumb)) return thumb
    }
  } catch {
    // trecem la fallback
  }
  const html = await fetchText(articleUrl)
  return html ? imageFromHtml(html, articleUrl) : ''
}

// ─── Sursa 2: protopopiatul-criuleni-dubasari.md — endpoint JSON public ───────

const PROTOPOPIAT_BASE = 'https://protopopiatul-criuleni-dubasari.md'

interface ProtopopiatRow {
  id?: number | string
  titlu?: string
  data?: string
  publicat_la?: string
  imagine_principala?: string
  imagine_principala_webp?: string
}

/**
 * Spre deosebire de mitropolia.md, protopopiatul-criuleni-dubasari.md nu are
 * flux RSS, dar expune public fișierul care alimentează pagina /noutati.php:
 * `data/noutati.json`. E mai robust decât parsarea HTML — replicăm exact
 * logica din noutati.php: ascundem articolele programate în viitor
 * (`publicat_la`), sortăm după id descrescător și luăm primele.
 * Imaginea vine direct din JSON (`imagine_principala`), fără un fetch în plus.
 */
async function refreshProtopopiat(): Promise<FeedItem[]> {
  const json = await fetchText(`${PROTOPOPIAT_BASE}/data/noutati.json`)
  if (!json) return []

  let rows: ProtopopiatRow[]
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    rows = parsed
  } catch {
    return []
  }

  const now = Date.now()
  const published = rows.filter(n => {
    if (!n?.publicat_la) return true
    const t = Date.parse(String(n.publicat_la).replace(' ', 'T'))
    return isNaN(t) || t <= now
  })
  published.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))

  const items: FeedItem[] = []
  for (const n of published.slice(0, MAX_ITEMS)) {
    const title = String(n.titlu || '').trim()
    if (!title || n.id == null) continue
    const file = n.imagine_principala || ''
    items.push({
      title,
      url: `${PROTOPOPIAT_BASE}/noutate.php?id=${encodeURIComponent(String(n.id))}`,
      date: parseProtopopiatDate(n.data),
      image: file ? `${PROTOPOPIAT_BASE}/assets/noutati/${file}` : '',
    })
  }
  if (!items.length) return []

  // Dacă primul articol n-are imagine în JSON, încercăm og:image din pagină.
  if (!items[0].image) {
    const html = await fetchText(items[0].url)
    if (html) items[0].image = imageFromHtml(html, items[0].url)
  }
  return items
}

/** „DD.MM.YYYY" (formatul din noutati.json) → „D luna YYYY". */
function parseProtopopiatDate(raw?: string): string {
  const s = (raw || '').trim()
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return s
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return dateRo(d) || s
}

// ─── Cache (tabelul Setting) ─────────────────────────────────────────────────

const SOURCES: FeedSource[] = [
  {
    key: 'mitropolia',
    settingKey: 'church_life_feed_mitropolia',
    sourceUrl: 'https://mitropolia.md',
    sourceName: 'mitropolia.md',
    sourceLabel: 'Din viața Mitropoliei',
    refresh: refreshMitropolia,
  },
  {
    key: 'protopopiat',
    settingKey: 'church_life_feed_protopopiat',
    sourceUrl: PROTOPOPIAT_BASE,
    sourceName: 'protopopiatul-criuleni-dubasari.md',
    sourceLabel: 'Din viața Protopopiatului',
    refresh: refreshProtopopiat,
  },
]

async function readCache(key: string): Promise<FeedCacheData | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } })
    if (!row) return null
    const parsed = JSON.parse(row.value)
    if (typeof parsed?.fetchedAt === 'number' && Array.isArray(parsed?.items)) {
      return parsed as FeedCacheData
    }
    return null
  } catch {
    return null
  }
}

async function writeCache(key: string, data: FeedCacheData): Promise<void> {
  try {
    const value = JSON.stringify(data)
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  } catch {
    // scrierea cache-ului nu e critică — datele proaspete rămân pentru randare
  }
}

/** Prima intrare validă (titlu + url) dintr-un cache; restul = rezervă. */
function firstValid(items: FeedItem[]): FeedItem | null {
  return items.find(i => i.title && i.url) || null
}

/**
 * Întoarce cardul unei surse (sau null): citește cache-ul, iar dacă a expirat
 * încearcă O SINGURĂ reîmprospătare. La eșec păstrează cache-ul vechi; dacă nu
 * există niciun cache vechi scrie un marcaj gol cu timestamp proaspăt, ca
 * vizitele următoare să nu mai încerce o cerere blocantă încă 6 ore.
 */
async function loadSource(src: FeedSource): Promise<ChurchLifeCard | null> {
  let cache = await readCache(src.settingKey)
  const age = cache ? Date.now() - cache.fetchedAt : Infinity

  if (age > TTL_MS) {
    const fresh = await src.refresh()
    if (fresh.length) {
      cache = { fetchedAt: Date.now(), items: fresh }
      await writeCache(src.settingKey, cache)
    } else if (!cache || !cache.items.length) {
      cache = { fetchedAt: Date.now(), items: [] }
      await writeCache(src.settingKey, cache)
    }
    // altfel: cache-ul vechi rămâne neatins
  }

  const item = cache ? firstValid(cache.items) : null
  if (!item) return null
  return {
    ...item,
    sourceUrl: src.sourceUrl,
    sourceName: src.sourceName,
    sourceLabel: src.sourceLabel,
  }
}

/**
 * API public pentru homepage. Nu aruncă niciodată — la orice eșec întoarce mai
 * puține carduri (sau []), iar secțiunea „Din viața Bisericii" pur și simplu
 * nu se randează.
 */
export async function getChurchLifeCards(): Promise<ChurchLifeCard[]> {
  try {
    const results = await Promise.all(
      SOURCES.map(src => loadSource(src).catch(() => null)),
    )
    return results.filter((c): c is ChurchLifeCard => c !== null)
  } catch {
    return []
  }
}

/**
 * Reîmprospătare forțată (ignoră TTL-ul) pentru cron-ul /api/cron/feeds.
 * La eșecul unei surse cache-ul vechi rămâne neatins.
 */
export async function refreshAllFeeds(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const src of SOURCES) {
    try {
      const fresh = await src.refresh()
      if (fresh.length) {
        await writeCache(src.settingKey, { fetchedAt: Date.now(), items: fresh })
        out[src.key] = fresh.length
      } else {
        out[src.key] = -1 // eșec — cache vechi păstrat
      }
    } catch {
      out[src.key] = -1
    }
  }
  return out
}
