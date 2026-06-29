import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const priest = await prisma.priest.findFirst({ select: { nameRo: true, photoUrl: true, bioRo: true } })
  const plainBio = priest?.bioRo?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Părintele paroh al Parohiei Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, Republica Moldova.'
  return {
    title: `Parohul Bisericii — ${priest?.nameRo ?? 'Preot Paroh'} | Sf. Nicolae Hîrtopul Mic`,
    description: plainBio,
    openGraph: {
      title: `${priest?.nameRo ?? 'Preot Paroh'} — Parohul Bisericii`,
      description: plainBio,
      type: 'profile',
      images: [{ url: priest?.photoUrl || '/og-default.jpg', width: 800, height: 600, alt: priest?.nameRo ?? 'Parohul Bisericii' }],
    },
  }
}

export default async function ParohPage() {
  const priest = await prisma.priest.findFirst()
  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'priest', entityId: priest?.id ?? '' },
    orderBy: { order: 'asc' },
  })

  if (!priest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="font-body text-lg" style={{ color: '#9B8050', fontFamily: 'Georgia, serif' }}>
          Informații despre preotul paroh nu sunt disponibile momentan.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Dark header */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Parohia Sfântul Ierarh Nicolae
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 400 }}>
          Parohul Bisericii
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Hero: fotografie + date principale */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-16">
          {/* Fotografie */}
          <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:block">
            {priest.photoUrl ? (
              <div style={{ width: '280px', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', border: '3px solid #C9A84C', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
                <img src={priest.photoUrl} alt={priest.nameRo} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              </div>
            ) : (
              <div style={{ width: '280px', aspectRatio: '3/4', borderRadius: '8px', backgroundColor: '#F7F3EC', border: '2px solid #E8DFC8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#C9A84C', fontSize: '5rem', opacity: 0.4 }}>☦</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ flex: 1 }}>
            <h2 className="font-heading" style={{ color: '#1C1B3A', fontSize: 'clamp(22px, 3.5vw, 32px)', marginBottom: '0.25rem' }}>
              {priest.nameRo}
            </h2>
            <p className="font-body" style={{ color: '#C9A84C', fontSize: '1rem', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
              {priest.titleRo}
            </p>
            {(priest.ordained || priest.parish) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {priest.ordained && (
                  <p className="font-body" style={{ color: '#6A5030', fontSize: '0.925rem', fontFamily: 'Georgia, serif' }}>
                    ✦ {priest.ordained}
                  </p>
                )}
                {priest.parish && (
                  <p className="font-body" style={{ color: '#6A5030', fontSize: '0.925rem', fontFamily: 'Georgia, serif' }}>
                    ✦ {priest.parish}
                  </p>
                )}
              </div>
            )}
            {/* Contact */}
            {(priest.phone || priest.email || priest.facebook) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {priest.phone && (
                  <a href={`tel:${priest.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#8B6014', fontFamily: 'Georgia, serif', fontSize: '0.875rem', textDecoration: 'none' }}>
                    📞 {priest.phone}
                  </a>
                )}
                {priest.email && (
                  <a href={`mailto:${priest.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#8B6014', fontFamily: 'Georgia, serif', fontSize: '0.875rem', textDecoration: 'none' }}>
                    ✉ {priest.email}
                  </a>
                )}
                {priest.facebook && (
                  <a href={priest.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#8B6014', fontFamily: 'Georgia, serif', fontSize: '0.875rem', textDecoration: 'none' }}>
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Biografie */}
        {priest.bioRo && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
              <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Biografie</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
            </div>
            <div
              className="font-body prose prose-lg max-w-none"
              style={{ color: '#3A1A1A', fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: priest.bioRo }}
            />
          </section>
        )}

        {/* Educație */}
        {priest.education && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
              <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Educație și formare</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
            </div>
            <div
              className="font-body prose prose-lg max-w-none"
              style={{ color: '#3A1A1A', fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: priest.education }}
            />
          </section>
        )}

        {/* Galerie */}
        {gallery.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
              <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Galerie foto</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
            </div>
            <PublicGallery items={gallery} />
          </section>
        )}

        {/* Contact section */}
        {(priest.phone || priest.email || priest.facebook) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
              <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Contact</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#E8E5E0' }} />
            </div>
            <div style={{ backgroundColor: '#FBF8F3', border: '1px solid #E8E5E0', borderRadius: '8px', padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {priest.phone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#8A7050', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefon</span>
                  <a href={`tel:${priest.phone}`} style={{ color: '#8B1A1A', fontFamily: 'Georgia, serif', fontSize: '1.05rem', textDecoration: 'none' }}>{priest.phone}</a>
                </div>
              )}
              {priest.email && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#8A7050', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                  <a href={`mailto:${priest.email}`} style={{ color: '#8B1A1A', fontFamily: 'Georgia, serif', fontSize: '1.05rem', textDecoration: 'none' }}>{priest.email}</a>
                </div>
              )}
              {priest.facebook && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#8A7050', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facebook</span>
                  <a href={priest.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#8B1A1A', fontFamily: 'Georgia, serif', fontSize: '1.05rem', textDecoration: 'none' }}>Pagina Facebook</a>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
