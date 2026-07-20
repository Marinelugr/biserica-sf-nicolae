import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.istoriaBisericii.title,
    description: t.meta.istoriaBisericii.description,
    alternates: buildAlternates('/istoria-bisericii'),
  }
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default async function IstoriaBisericiiPage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  let dynContent: string | null = null
  let videos: { url: string; title: string }[] = []

  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'church_history_content' } })
    if (setting) {
      const data = JSON.parse(setting.value)
      // suportă și forma veche { content } pentru compatibilitate cu datele deja introduse
      dynContent = pick(locale, data.contentRo ?? data.content ?? '', data.contentRu, data.contentEn) || null
      videos = data.videos || []
    }
  } catch { /* use fallback */ }

  const gallery = await prisma.mediaItem.findMany({
    where: { entityType: 'history', entityId: 'church-history' },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      {/* Banda panoramică 21:9 */}
      <div className="w-full overflow-hidden" style={{ aspectRatio: '21/9', position: 'relative', maxHeight: '420px' }}>
        <Image
          src="/images/12.jpg"
          alt={t.home.heroImageAlt}
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,4,1,0.1) 0%, rgba(7,4,1,0.45) 100%)' }} />
      </div>

      {/* Dark header */}
      <div className="py-14 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          {t.priest.badge}
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(44px, 7vw, 70px)', fontWeight: 400 }}>
          {t.historyPage.pageTitle}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
        <p className="font-body text-sm" style={{ color: '#6A5030' }}>
          {t.home.heroSubtitle}
          <br />
          {t.home.heroMitropolia}
        </p>
      </div>

      {/* Conținut articol */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {dynContent ? (
          <div
            className="tiptap-prose"
            dangerouslySetInnerHTML={{ __html: dynContent }}
          />
        ) : (
          <>
            <p className="font-body text-lg leading-relaxed mb-12 text-center italic" style={{ color: '#4A3020' }}>
              {t.historyPage.fallbackIntro}
            </p>
            <div className="h-px mb-12" style={{ backgroundColor: '#E8E5E0' }} />
            <div className="space-y-12">
              {t.historyPage.sections.map((section, i) => (
                <article key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#C9A84C' }} aria-hidden="true" />
                    <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{section.title}</h2>
                  </div>
                  <p className="font-body text-base leading-relaxed pl-5" style={{ color: '#3A2010', lineHeight: '1.8' }}>
                    {section.text}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ GALERIE FOTO ══ */}
      <section style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E8DFC8', borderBottom: '1px solid #E8DFC8' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-4 mb-8">
            <span className="flex-1 h-px" style={{ backgroundColor: '#D4C8A0' }} />
            <h2 className="font-body text-xs uppercase tracking-[0.35em]" style={{ color: '#8A7050' }}>{t.common.gallery}</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: '#D4C8A0' }} />
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-10">
              <span style={{ color: '#D4C8A0', fontSize: '40px' }} aria-hidden="true">📷</span>
              <p className="font-body text-sm mt-3" style={{ color: '#8A7050' }}>
                {t.historyPage.galleryEmpty}
              </p>
            </div>
          ) : (
            <PublicGallery items={gallery} />
          )}
        </div>
      </section>

      {/* ══ SECȚIUNEA VIDEO ══ */}
      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-4 mb-8">
            <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-body text-xs uppercase tracking-[0.35em]" style={{ color: '#8A7050' }}>{t.nav.video}</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
          </div>

          {videos.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#F7F3EC', border: '2px dashed #D4C8A0' }}>
              <span style={{ color: '#D4C8A0', fontSize: '40px' }} aria-hidden="true">▶</span>
              <p className="font-body text-sm mt-3" style={{ color: '#8A7050' }}>
                {t.historyPage.videosEmpty}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v, i) => {
                const ytId = extractYouTubeId(v.url)
                return (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid #E8E5E0' }}>
                    <div style={{ aspectRatio: '16/9' }}>
                      {ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={v.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F7F3EC' }}>
                          <span style={{ color: '#8A7050', fontSize: '2rem' }}>▶</span>
                        </a>
                      )}
                    </div>
                    <p className="font-body text-sm p-3" style={{ color: '#3A1A1A' }}>{v.title}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Donații */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
          <span style={{ color: '#C9A84C', fontSize: '32px' }} aria-hidden="true">☦</span>
          <p className="font-body text-base mt-4 mb-6" style={{ color: '#4A3020' }}>
            {t.historyPage.ctaText}
          </p>
          <a
            href="/donatii"
            className="font-body text-sm px-6 py-2.5 rounded inline-block transition-all hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
          >
            {t.historyPage.ctaBtn}
          </a>
        </div>
      </div>
    </div>
  )
}
