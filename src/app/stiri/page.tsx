import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Știri & Articole',
  description: 'Ultimele noutăți și articole de la Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic, Criuleni.',
}

async function getArticles() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function StiriPage() {
  const articles = await getArticles()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: '#8A7050' }}>
          Parohia noastră
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: '#1C1B3A' }}>
          Știri & Articole
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <span style={{ color: '#D4C8A0', fontSize: '48px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4" style={{ color: '#8A7050' }}>
            Nu există articole publicate momentan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map(article => (
            <article
              key={article.slug}
              className="group rounded-lg overflow-hidden border transition-shadow hover:shadow-md"
              style={{ borderColor: '#E8E5E0' }}
            >
              <div
                className="overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: '#F2EBD9', maxHeight: '260px' }}
              >
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.titleRo}
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="transition-transform group-hover:scale-105"
                    style={{ width: '100%', height: 'auto', maxHeight: '260px', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: '192px' }}>
                    <span style={{ color: '#D4C8A0', fontSize: '48px' }} aria-hidden="true">☦</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                {article.category && (
                  <span className="font-body text-xs uppercase tracking-wide" style={{ color: '#8B1A1A' }}>
                    {article.category}
                  </span>
                )}
                <Link href={`/stiri/${article.slug}`}>
                  <h2 className="font-heading text-xl mt-1 mb-2 group-hover:underline underline-offset-2 leading-snug" style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}>
                    {article.titleRo}
                  </h2>
                </Link>
                {article.publishedAt && (
                  <time className="font-body text-xs" style={{ color: '#8A7050' }}>
                    {formatDate(article.publishedAt)}
                  </time>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
