import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { localizedHref } from '@/lib/i18n/href'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.magazin.title,
    description: t.meta.magazin.description,
    alternates: buildAlternates('/magazin'),
  }
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
    <PageShell aside="compact">
      <PageHead eyebrow={t.shop.subtitle} title={t.shop.title} />

      {products.length === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mute mt-3 text-[19px]">{t.shop.inProgress}</p>
          <p className="gold mt-2 flex items-center justify-center gap-2"><span aria-hidden="true">☦</span> {t.shop.comingSoon}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map(product => {
            const inStock = product.stock > 0
            const description = product.descriptionRo ? stripHtml(product.descriptionRo) : null
            const price = Number(product.price).toLocaleString('ro-MD')
            return (
              <article key={product.id} className="news" data-reveal>
                <div className="media">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.nameRo} fill sizes="(max-width: 640px) 100vw, 380px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="ph w-full h-full" aria-hidden="true"><span style={{ fontSize: 40 }}>☦</span></div>
                  )}
                  <span
                    className="absolute top-3 right-3 text-[14px] px-3 py-1 rounded-full"
                    style={{ backgroundColor: inStock ? '#1f6b3a' : 'var(--red)', color: '#fff' }}
                  >
                    {inStock ? t.shop.inStock : t.shop.outOfStock}
                  </span>
                </div>
                <div className="body flex-1">
                  {product.category && <span className="kicker gold">{product.category}</span>}
                  <h2 className="h-s">{product.nameRo}</h2>
                  {description && <p className="mute text-[17px] line-clamp-3 flex-1">{description}</p>}
                  <div className="flex items-center justify-between gap-3 mt-auto pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                    <span className="serif text-[22px] font-semibold gold">{price} MDL</span>
                    <Link href={contactHref} className="btn sm">{t.shop.contactToOrder}</Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
