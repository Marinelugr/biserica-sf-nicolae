import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const findMany = vi.fn()
const settingFind = vi.fn()
vi.mock('../prisma', () => ({
  prisma: {
    bibleVerse: { findMany: (...a: unknown[]) => findMany(...a), count: vi.fn().mockResolvedValue(1) },
    bibleChapter: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) },
    setting: { findUnique: (...a: unknown[]) => settingFind(...a) },
  },
}))

const queries = await import('./queries')

const NEW_FIELDS = /\b(reviewed|editedAt|bibleEdit|BibleEdit|edits)\b/
const ROOT = process.cwd()

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.tsx?$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [p] : []
  })
}

/** Fișierele locale importate, recursiv, pornind de la pagina publică. */
function importGraph(start: string[]): Set<string> {
  const seen = new Set<string>()
  const visit = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8')
    for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1]
      const base = spec.startsWith('@/') ? path.join('src', spec.slice(2)) : spec.startsWith('.') ? path.join(path.dirname(file), spec) : null
      if (!base) continue
      const found = [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].find(f => fs.existsSync(path.join(ROOT, f)))
      if (found) visit(found)
    }
  }
  start.forEach(visit)
  return seen
}

describe('cititorul public nu depinde de schema nouă', () => {
  const publicEntries = [...sourceFiles('src/app/biblie'), 'src/app/sitemap.ts']

  it('nicio pagină /biblie și nimic din ce importă nu folosește coloanele noi sau BibleEdit', () => {
    const graph = importGraph(publicEntries)
    expect(graph.has('src/lib/bible/queries.ts')).toBe(true)
    const offenders = [...graph].filter(f => NEW_FIELDS.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('nu importă nimic din Admin', () => {
    const offenders = [...importGraph(publicEntries)].filter(f => /admin/i.test(f))
    expect(offenders).toEqual([])
  })

  it('interogarea capitolului selectează exact verseNum și textRo', async () => {
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'fraza de probă' }])
    settingFind.mockResolvedValue(null)
    await queries.getChapterVerses('iona', 40)
    expect(findMany.mock.calls[0][0].select).toEqual({ verseNum: true, textRo: true })
  })

  it('căutarea nu cere câmpurile noi', async () => {
    findMany.mockReset().mockResolvedValue([])
    await queries.searchVerses(['proba'], 1)
    expect(Object.keys(findMany.mock.calls[0][0].select).sort()).toEqual(['chapter', 'textRo', 'verseNum'])
  })
})

describe('invalidarea cache-ului cititorului', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    findMany.mockReset()
    settingFind.mockReset()
  })
  const later = () => vi.advanceTimersByTime(6000)

  it('în același proces: capitolul e recitit imediat', async () => {
    later()
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'vechi' }])
    settingFind.mockResolvedValue({ value: 'v1' })
    expect(await queries.getChapterVerses('iona', 1)).toEqual([{ n: 1, text: 'vechi' }])
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'nou' }])
    expect(await queries.getChapterVerses('iona', 1)).toEqual([{ n: 1, text: 'vechi' }])
    queries.invalidateChapterCache('iona', 1)
    expect(await queries.getChapterVerses('iona', 1)).toEqual([{ n: 1, text: 'nou' }])
  })

  it('în alt proces Passenger: versiunea schimbată golește cache-ul în câteva secunde', async () => {
    later()
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'vechi' }])
    settingFind.mockResolvedValue({ value: 'a' })
    await queries.getChapterVerses('iona', 2)
    // Adminul a scris din alt proces: aici nu s-a apelat invalidateChapterCache
    settingFind.mockResolvedValue({ value: 'b' })
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'nou' }])
    expect(await queries.getChapterVerses('iona', 2)).toEqual([{ n: 1, text: 'vechi' }])
    later()
    expect(await queries.getChapterVerses('iona', 2)).toEqual([{ n: 1, text: 'nou' }])
  })

  it('verifică versiunea cel mult o dată la 5 secunde', async () => {
    later()
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'x' }])
    settingFind.mockResolvedValue({ value: 'c' })
    await queries.getChapterVerses('iona', 3)
    await queries.getChapterVerses('iona', 3)
    await queries.getChapterVerses('iona', 3)
    expect(settingFind).toHaveBeenCalledTimes(1)
  })

  it('dacă verificarea eșuează, cititorul merge în continuare', async () => {
    later()
    findMany.mockResolvedValue([{ verseNum: 1, textRo: 'x' }])
    settingFind.mockRejectedValue(new Error('tabel indisponibil'))
    expect(await queries.getChapterVerses('iona', 4)).toEqual([{ n: 1, text: 'x' }])
  })

  it('cache-ul e pe globalThis: comun pentru toate pachetele aceluiași proces', () => {
    expect((globalThis as unknown as Record<string, unknown>).__bibleReaderCache).toBeDefined()
  })
})
