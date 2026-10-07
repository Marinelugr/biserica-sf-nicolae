import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const priest = await prisma.priest.findFirst({ select: { nameRo: true, photoUrl: true, bioRo: true, seoKeywords: true } })
  const plainBio = priest?.bioRo?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Părintele paroh al Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, Republica Moldova.'
  return {
    title: `Parohul Bisericii — ${priest?.nameRo ?? 'Preot Paroh'} | Sf. Nicolae Hîrtopul Mic`,
    description: plainBio,
    keywords: priest?.seoKeywords ? priest.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
    alternates: buildAlternates('/paroh'),
    openGraph: {
      title: `${priest?.nameRo ?? 'Preot Paroh'} — Parohul Bisericii`,
      description: plainBio,
      type: 'profile',
      url: '/paroh',
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      images: [{ url: priest?.photoUrl || '/og-default.jpg', width: 800, height: 600, alt: priest?.nameRo ?? 'Parohul Bisericii' }],
    },
  }
}

export default async function ParohPage() {
  const t = await getServerT()
  const priest = await prisma.priest.findFirst()
  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'priest', entityId: priest?.id ?? '' },
    orderBy: { order: 'asc' },
  })

  if (!priest) {
    return (
      <PageShell aside="full">
        <PageHead eyebrow={t.priest.badge} title={t.priest.pageTitle} />
        <div className="card"><p className="mute text-[19px]">{t.priest.notAvailable}</p></div>
      </PageShell>
    )
  }

  const name = priest.nameRo
  const title = priest.titleRo
  const bio = priest.bioRo ?? ''
  const ordained = priest.ordained ?? ''
  const parish = priest.parish ?? ''
  const education = priest.education ?? ''

  const section = (id: string, heading: string, children: React.ReactNode) => (
    <section className="card" aria-labelledby={id} data-reveal>
      <h2 id={id} className="h-m mb-4">{heading}</h2>
      {children}
    </section>
  )

  return (
    <PageShell aside="full">
      <PageHead eyebrow={t.priest.badge} title={t.priest.pageTitle}>
        <p className="h-s" style={{ fontSize: 26 }}>{name}</p>
        {title && <p className="gold text-[19px]">{title}</p>}
        {(ordained || parish) && (
          <div className="flex flex-col gap-1 text-[18px]">
            {ordained && <p><span className="gold" aria-hidden="true">✦</span> {ordained}</p>}
            {parish && <p><span className="gold" aria-hidden="true">✦</span> {parish}</p>}
          </div>
        )}
        {(priest.phone || priest.email || priest.facebook) && (
          <div className="flex flex-wrap gap-2.5 mt-1">
            {priest.phone && <a href={`tel:${priest.phone}`} className="chip">📞 {priest.phone}</a>}
            {priest.email && <a href={`mailto:${priest.email}`} className="chip">✉ {priest.email}</a>}
            {priest.facebook && <a href={priest.facebook} target="_blank" rel="noopener noreferrer" className="chip">{t.priest.facebookLabel}</a>}
          </div>
        )}
      </PageHead>

      {bio && section('paroh-bio', t.priest.biography, <div className="rich reading" dangerouslySetInnerHTML={{ __html: bio }} />)}
      {education && section('paroh-edu', t.priest.education, <div className="rich reading" dangerouslySetInnerHTML={{ __html: education }} />)}
      {gallery.length > 0 && section('paroh-galerie', t.priest.galleryTitle, <PublicGallery items={gallery} />)}

      {(priest.phone || priest.email || priest.facebook) && section('paroh-contact', t.priest.contactTitle, (
        <div className="flex flex-wrap gap-8">
          {priest.phone && (
            <div className="flex flex-col gap-1">
              <span className="label">{t.priest.phoneLabel}</span>
              <a href={`tel:${priest.phone}`} className="link-gold text-[19px]">{priest.phone}</a>
            </div>
          )}
          {priest.email && (
            <div className="flex flex-col gap-1">
              <span className="label">{t.priest.emailLabel}</span>
              <a href={`mailto:${priest.email}`} className="link-gold text-[19px] break-all">{priest.email}</a>
            </div>
          )}
          {priest.facebook && (
            <div className="flex flex-col gap-1">
              <span className="label">{t.priest.facebookLabel}</span>
              <a href={priest.facebook} target="_blank" rel="noopener noreferrer" className="link-gold text-[19px]">{t.priest.facebookPageLabel}</a>
            </div>
          )}
        </div>
      ))}
    </PageShell>
  )
}
