import type { Prisma } from '@prisma/client'

/** Articolele programate (scheduledFor în viitor) rămân ascunse din vizualizările publice. */
export const scheduledGate: Prisma.ArticleWhereInput = {
  OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
}

/** where-clause pentru query-uri publice fără alt OR propriu (listă, detaliu, sitemap). */
export const publicArticleWhere: Prisma.ArticleWhereInput = {
  published: true,
  ...scheduledGate,
}

export function isScheduledFuture(article: { published: boolean; scheduledFor: Date | null }): boolean {
  return article.published && !!article.scheduledFor && article.scheduledFor.getTime() > Date.now()
}
