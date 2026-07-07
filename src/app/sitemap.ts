import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { translatePath } from '@/lib/i18n/slugs'

const BASE = 'https://biserica-sf-nicolae.org'

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
  const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/despre', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/paroh', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/biblie', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/calendar', changeFrequency: 'daily', priority: 0.9 },
    { path: '/carti', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/sfantul-nicolae', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/istoria-bisericii', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/video', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/stiri', changeFrequency: 'daily', priority: 0.8 },
    { path: '/donatii', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/magazin', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
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
      where: { published: true },
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
  } catch { /* skip */ }

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
  } catch { /* skip */ }

  let bibleRoutes: MetadataRoute.Sitemap = []
  try {
    const bibleBooks = await prisma.bibleBook.findMany({
      select: { slug: true },
    })
    bibleRoutes = bibleBooks.map(b => ({
      url: `${BASE}/biblie/${b.slug}/1`,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
      alternates: langAlternates(`/biblie/${b.slug}/1`),
    }))
  } catch { /* skip */ }

  return [...staticRoutes, ...articleRoutes, ...bookRoutes, ...bibleRoutes]
}
