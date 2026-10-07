import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import PublicGallery from '@/components/PublicGallery'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const FEAST_COLORS: Record<string, string> = { MARE: 'var(--red)', MIJLOCIE: 'var(--gold-d)', MIC: '#26324f' }

type Props = { params: Promise<{ slug: string }> }

async function getSaint(slug: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.saint.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const saint = await getSaint(slug)
  if (!saint) return {}
  const title = saint.nameRo
  const life = saint.lifeRo || ''
  const plain = life.replace(/<[^>]*>/g, '').substring(0, 160)
  return {
    title: `${title} | Sfinți`,
    description: plain || `Viața și prăznuirea ${title}.`,
    keywords: saint.seoKeywords ? saint.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
    alternates: buildAlternates(`/sfintii/${slug}`),
    openGraph: {
      title, description: plain, type: 'article',
      url: `/sfintii/${slug}`,
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: saint.iconUrl ? [{ url: saint.iconUrl }] : [],
    },
  }
}

export default async function SaintPage({ params }: Props) {
  const { slug } = await params
  const [saint, t] = await Promise.all([getSaint(slug), getServerT()])
  if (!saint) notFound()

  const { prisma } = await import('@/lib/prisma')
  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'saint', entityId: saint.id },
    orderBy: { order: 'asc' },
  })

  const title = saint.nameRo
  const life = saint.lifeRo || ''

  return (
    <PageShell aside="compact">
      <article className="flex flex-col gap-5">
        <PageHead
          size="m"
          crumbs={[{ href: '/', label: t.nav.home }, { href: '/sfintii', label: t.saints.title }, { label: title }]}
          eyebrow={`${saint.day} ${MONTHS_FULL[saint.month - 1]}`}
          title={title}
        >
          <div className="flex flex-wrap items-center gap-4">
            {saint.iconUrl && (
              <div className="w-28 shrink-0 overflow-hidden" style={{ aspectRatio: '4 / 5', borderRadius: 14, border: '1px solid var(--gold-d)' }}>
                <Image src={saint.iconUrl} alt={title} width={112} height={140} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {saint.feastType && (
              <span
                className="text-[15px] px-3.5 py-1 rounded-full"
                style={{ backgroundColor: FEAST_COLORS[saint.feastType] || '#26324f', color: '#fff' }}
              >
                {t.saints.feastTypes[saint.feastType as 'MARE' | 'MIJLOCIE' | 'MIC'] || saint.feastType}
              </span>
            )}
          </div>
        </PageHead>

        <div className="card">
          {life ? (
            <div className="rich reading" dangerouslySetInnerHTML={{ __html: life }} />
          ) : (
            <p className="mute italic">{t.saints.noLifeText}</p>
          )}
        </div>

        {gallery.length > 0 && (
          <section className="card" aria-labelledby="galerie-sfant">
            <h2 id="galerie-sfant" className="eyebrow mb-5">{t.common.gallery}</h2>
            <PublicGallery items={gallery} />
          </section>
        )}

        <div className="card" style={{ padding: '20px 24px' }}>
          <Link href="/sfintii" className="link-gold text-[17px]">{t.saints.backToList}</Link>
        </div>
      </article>
    </PageShell>
  )
}
