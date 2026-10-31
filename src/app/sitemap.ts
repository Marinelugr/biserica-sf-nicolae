import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { translatePath } from '@/lib/i18n/slugs'
import { publicArticleWhere } from '@/lib/articleVisibility'
import { SITE_URL } from '@/lib/site'
import { listAllChapters } from '@/lib/bible/queries'
import { TtlCache } from '@/lib/bible/cache'

// Generat la cerere: build-ul CI nu are acces la DB, iar un sitemap static ar conține doar rutele fixe.
export const dynamic = 'force-dynamic'

const BASE = SITE_URL

// O oră, separat în fiecare proces Passenger. Un articol nou apare în sitemap în cel mult o oră.
const SITEMAP_TTL_MS = 60 * 60 * 1000
const cache = new TtlCache<MetadataRoute.Sitemap>(SITEMAP_TTL_MS, 1)

function langAlternates(path: string) {
  const clean = (p: string) => (p === '/' ? '' : p)
  return {
    languages: {
      ro: `${BASE}${clean(path)}`,
      ru: `${BASE}/ru${clean(translatePath(path, 'ru'))}`,
      en: `${BASE}/en${clean(translatePath(path, 'en'))}`,
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cached = cache.get('sitemap')
  if (cached) return cached

  // Un sitemap parțial (o interogare a eșuat) se servește, dar nu se păstrează.
  let complete = true

  const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/despre', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/paroh', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/mesajul-parintelui', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/biblie', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/calendar', changeFrequency: 'daily', priority: 0.9 },
    { path: '/calendar-pascal', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/carti', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/sfantul-nicolae', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/istoria-bisericii', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/video', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/stiri', changeFrequency: 'daily', priority: 0.8 },
    { path: '/donatii', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/sfintii', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/politica-de-confidentialitate', changeFrequency: 'yearly', priority: 0.3 },
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: langAlternates(path),
  }))

  let articleRoutes: MetadataRoute.Sitemap = []
  try {
    const articles = await prisma.article.findMany({
      where: publicArticleWhere,
      select: { slug: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
    })
    articleRoutes = articles.map(a => ({
      url: `${BASE}/stiri/${a.slug}`,
      lastModified: a.publishedAt ?? a.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: langAlternates(`/stiri/${a.slug}`),
    }))
  } catch { complete = false }

  let bookRoutes: MetadataRoute.Sitemap = []
  try {
    const books = await prisma.libraryBook.findMany({
      select: { slug: true, createdAt: true },
    })
    bookRoutes = books.map(b => ({
      url: `${BASE}/carti/${b.slug}`,
      lastModified: b.createdAt,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
      alternates: langAlternates(`/carti/${b.slug}`),
    }))
  } catch { complete = false }

  let saintRoutes: MetadataRoute.Sitemap = []
  try {
    const saints = await prisma.saint.findMany({
      select: { slug: true },
    })
    saintRoutes = saints.map(s => ({
      url: `${BASE}/sfintii/${s.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
      alternates: langAlternates(`/sfintii/${s.slug}`),
    }))
  } catch { complete = false }

  // Toate capitolele existente în baza de date (o singură interogare); tabele goale → nimic
  const chapters = await listAllChapters()
  if (!chapters) complete = false
  const bibleRoutes: MetadataRoute.Sitemap = (chapters ?? []).map(c => ({
    url: `${BASE}/biblie/${c.slug}/${c.chapter}`,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
    alternates: langAlternates(`/biblie/${c.slug}/${c.chapter}`),
  }))

  const routes = [...staticRoutes, ...articleRoutes, ...bookRoutes, ...saintRoutes, ...bibleRoutes]
  if (complete) cache.set('sitemap', routes)
  return routes
}
