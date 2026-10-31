import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ro from './i18n/ro'
import { siteOpenGraph } from './openGraph'
import { SITE_URL } from './site'

const env = vi.hoisted(() => ({ locale: 'ro' }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: env.locale }) }),
}))

const server = () => import('./i18n/server')

beforeEach(() => { env.locale = 'ro' })

describe('pageUrl', () => {
  it.each([
    ['ro', '/', SITE_URL],
    ['en', '/', `${SITE_URL}/en`],
    ['ru', '/', `${SITE_URL}/ru`],
    ['ro', '/contact', `${SITE_URL}/contact`],
    ['en', '/contact', `${SITE_URL}/en/contact`],
    ['ru', '/contact', `${SITE_URL}/ru/kontakt`],
    ['en', '/stiri/o-stire', `${SITE_URL}/en/news/o-stire`],
    ['ru', '/sfintii/un-sfant', `${SITE_URL}/ru/svyatye/un-sfant`],
  ])('%s %s', async (locale, p, url) => {
    env.locale = locale
    expect(await (await server()).pageUrl(p)).toBe(url)
  })
})

describe('pageOpenGraph', () => {
  it('schimbă față de layout doar og:url', async () => {
    const og = await (await server()).pageOpenGraph('/contact')
    expect(og).toEqual({ ...siteOpenGraph(ro, 'ro'), url: `${SITE_URL}/contact` })
  })
})

describe('paginile publice', () => {
  const root = path.resolve(process.cwd(), 'src/app')
  const pages = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) return name === 'admin' || name === 'dev' || name === 'api' ? [] : pages(p)
    return name === 'page.tsx' ? [p] : []
  })

  it('fiecare își declară og:url, în limba paginii', () => {
    const files = pages(root)
    expect(files.length).toBeGreaterThan(20)
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      const label = path.relative(root, file)
      const declaresUrl = /pageOpenGraph\(|url: await pageUrl\(|bible(Index|Book|Chapter)Metadata\(/.test(src)
      expect(declaresUrl, `${label}: og:url lipsă`).toBe(true)
    }
  })
})
