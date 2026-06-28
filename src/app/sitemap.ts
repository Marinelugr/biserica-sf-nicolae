import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = 'https://biserica-sf-nicolae.org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/despre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/paroh`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/biblie`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/calendar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/carti`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/sfantul-nicolae`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/istoria-bisericii`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/video`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/stiri`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/donatii`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/magazin`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

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
    }))
  } catch { /* skip */ }

  return [...staticRoutes, ...articleRoutes, ...bookRoutes]
}
