import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { localizedHref } from '@/lib/i18n/href'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Magazin',
  description: 'Lumânări, icoane, cărți și obiecte bisericești din magazinul Parohiei Sfântul Ierarh Nicolae, Hîrtopul Mic.',
  alternates: buildAlternates('/magazin'),
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function getProducts() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    })
  } catch {
    return []
  }
}

export default async function MagazinPage() {
  const [products, t, locale] = await Promise.all([getProducts(), getServerT(), getServerLocale()])
  const contactHref = localizedHref('/contact', locale)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.shop.subtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-5" style={{ color: '#1C1B3A' }}>
          {t.shop.title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <span style={{ color: '#D4C8A0', fontSize: '56px' }} aria-hidden="true">☦</span>
          <p className="font-body mt-4 text-lg" style={{ color: '#8A7050' }}>
            {t.shop.inProgress}
          </p>
          <p className="font-body text-sm mt-2 flex items-center justify-center gap-2" style={{ color: '#C9A84C' }}>
            <span>☦</span> {t.shop.comingSoon}
          </p>
        </div>
      ) : (
        <div className="category-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const inStock = product.stock > 0
            const description = product.descriptionRo ? stripHtml(product.descriptionRo) : null
            const price = Number(product.price).toLocaleString('ro-MD')
            return (
              <article
                key={product.id}
                className="category-card flex flex-col rounded-xl overflow-hidden"
                style={{ backgroundColor: '#FDF8EF', border: '1px solid #E8D8B0' }}
              >
                <div className="relative w-full" style={{ aspectRatio: '4/3', backgroundColor: '#F2EBD9' }}>
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.nameRo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ color: '#D4C8A0', fontSize: '40px' }} aria-hidden="true">☦</span>
                    </div>
                  )}
                  <span
                    className="absolute top-3 right-3 font-body text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: inStock ? '#1A5A1A' : '#5A1A1A',
                      color: '#F2EBD9',
                    }}
                  >
                    {inStock ? t.shop.inStock : t.shop.outOfStock}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {product.category && (
                    <span className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8B6014' }}>
                      {product.category}
                    </span>
                  )}
                  <h2 className="font-heading text-lg mb-2" style={{ color: '#1C1B3A' }}>
                    {product.nameRo}
                  </h2>
                  {description && (
                    <p className="font-body text-sm mb-3 line-clamp-3 flex-1" style={{ color: '#5A4A3A' }}>
                      {description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #E8D8B0' }}>
                    <span className="font-heading text-lg" style={{ color: '#8B1A1A' }}>
                      {price} MDL
                    </span>
                    <Link
                      href={contactHref}
                      className="font-body text-xs px-3 py-2 rounded transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
                    >
                      {t.shop.contactToOrder}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
