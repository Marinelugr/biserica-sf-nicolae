import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) },
  notFound: () => { throw new Error('NOT_FOUND') },
}))

// Orice atingere a bazei de date pică testul.
const touched = vi.hoisted(() => ({ count: 0 }))
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy({}, { get: () => { touched.count++; throw new Error('baza de date nu trebuie atinsă') } }),
}))

const NON_ADMINS: [string, unknown][] = [
  ['rol greșit', { user: { id: 'x', email: 'x@exemplu.md', role: 'editor' } }],
  ['fără rol', { user: { id: 'x', email: 'x@exemplu.md' } }],
  ['fără email', { user: { id: 'x', role: 'admin' } }],
]

const noParams = { params: Promise.resolve({}), searchParams: Promise.resolve({}) }
const bookParams = { params: Promise.resolve({ carte: 'iona' }), searchParams: Promise.resolve({}) }
const chapterParams = { params: Promise.resolve({ carte: 'iona', capitol: '1' }), searchParams: Promise.resolve({}) }

type Page = (props: never) => unknown
const pages: [string, () => Promise<{ default: Page }>, unknown][] = [
  ['/admin/biblia', () => import('./page'), noParams],
  ['/admin/biblia/[carte]', () => import('./[carte]/page'), bookParams],
  ['/admin/biblia/[carte]/[capitol]', () => import('./[carte]/[capitol]/page'), chapterParams],
  ['/admin/biblia/cauta', () => import('./cauta/page'), { searchParams: Promise.resolve({ q: 'cuvant' }) }],
  ['/admin/biblia/inlocuieste', () => import('./inlocuieste/page'), {}],
  ['/admin/biblia/jurnal', () => import('./jurnal/page'), noParams],
]

const exports_: [string, () => Promise<Response>][] = [
  ['export/[carte]', async () => (await import('./export/[carte]/route')).GET(new Request('http://localhost/x'), { params: Promise.resolve({ carte: 'iona' }) })],
  ['export/toate', async () => (await import('./export/toate/route')).GET()],
]

const payload = {
  saveVerseAction: { verseId: 'v1', text: 'text de probă', seenEditedAt: null },
  setVerseReviewedAction: { verseId: 'v1', reviewed: true, seenEditedAt: null },
  createVerseAction: { slug: 'iona', chapter: 1, verseNum: 5, text: 'text de probă' },
  previewReplaceAction: { slug: 'iona', find: 'unu', replace: 'doi', wholeWord: true },
  applyReplaceAction: { slug: 'iona', find: 'unu', replace: 'doi', wholeWord: true, token: '0'.repeat(64), confirmed: true },
}
const actionNames = Object.keys(payload) as (keyof typeof payload)[]

beforeEach(() => {
  auth.mockReset()
  touched.count = 0
})

describe.each(pages)('pagina %s', (_name, load, props) => {
  it('neautentificat → autentificare', async () => {
    auth.mockResolvedValue(null)
    const { default: Page } = await load()
    await expect(Page(props as never) as Promise<unknown>).rejects.toThrow('REDIRECT:/admin/login')
    expect(touched.count).toBe(0)
  })
  it.each(NON_ADMINS)('%s → 404', async (_n, session) => {
    auth.mockResolvedValue(session)
    const { default: Page } = await load()
    await expect(Page(props as never) as Promise<unknown>).rejects.toThrow('NOT_FOUND')
    expect(touched.count).toBe(0)
  })
})

describe.each(exports_)('%s', (_name, call) => {
  it('neautentificat → 401, no-store, fără bază', async () => {
    auth.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(401)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(touched.count).toBe(0)
  })
  it.each(NON_ADMINS)('%s → 401', async (_n, session) => {
    auth.mockResolvedValue(session)
    expect((await call()).status).toBe(401)
    expect(touched.count).toBe(0)
  })
})

describe.each(actionNames)('acțiunea %s', name => {
  const run = async () => {
    const actions = await import('./actions')
    return (actions[name] as (input: unknown) => Promise<{ ok: boolean; error?: string }>)(payload[name])
  }
  it('neautentificat: respins, fără bază', async () => {
    auth.mockResolvedValue(null)
    expect(await run()).toMatchObject({ ok: false, error: 'Nu ai acces la această acțiune.' })
    expect(touched.count).toBe(0)
  })
  it.each(NON_ADMINS)('%s: respins, fără bază', async (_n, session) => {
    auth.mockResolvedValue(session)
    expect(await run()).toMatchObject({ ok: false, error: 'Nu ai acces la această acțiune.' })
    expect(touched.count).toBe(0)
  })
})

it('acțiunile testate sunt toate cele exportate', async () => {
  const actions = await import('./actions')
  expect(Object.keys(actions).sort()).toEqual([...actionNames].sort())
})

it('secțiunea nu se indexează', async () => {
  const { metadata } = await import('./layout')
  expect(metadata.robots).toEqual({ index: false, follow: false })
})
