import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

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
    <PageShell aside="compact">
      <PageHead eyebrow={t.priest.badge} title={t.historyPage.pageTitle}>
        <p className="mute text-[17px]">
          {t.home.heroSubtitle}
          <br />
          {t.home.heroMitropolia}
        </p>
      </PageHead>

      <article className="card">
        {dynContent ? (
          <div className="rich reading" dangerouslySetInnerHTML={{ __html: dynContent }} />
        ) : (
          <div className="reading flex flex-col gap-8">
            <p className="lead" style={{ fontSize: 23 }}>{t.historyPage.fallbackIntro}</p>
            <hr className="sep" />
            {t.historyPage.sections.map((section, i) => (
              <section key={i}>
                <h2 className="h-m mb-3 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-gold" aria-hidden="true" />
                  {section.title}
                </h2>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
        )}
      </article>

      <section className="card" aria-labelledby="istoria-galerie" data-reveal>
        <h2 id="istoria-galerie" className="eyebrow mb-5">{t.common.gallery}</h2>
        {gallery.length === 0 ? (
          <p className="mute text-center py-6"><span aria-hidden="true" className="block text-[36px] mb-2">📷</span>{t.historyPage.galleryEmpty}</p>
        ) : (
          <PublicGallery items={gallery} />
        )}
      </section>

      <section className="card" aria-labelledby="istoria-video" data-reveal>
        <h2 id="istoria-video" className="eyebrow mb-5">{t.nav.video}</h2>
        {videos.length === 0 ? (
          <p className="mute text-center py-6"><span aria-hidden="true" className="block text-[32px] mb-2 gold">▶</span>{t.historyPage.videosEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {videos.map((v, i) => {
              const ytId = extractYouTubeId(v.url)
              return (
                <div key={i} className="news">
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
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="ph w-full h-full" aria-label={v.title}>
                        <span className="play sm"><span aria-hidden="true">▶</span></span>
                      </a>
                    )}
                  </div>
                  <p className="body text-[17px]">{v.title}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="card red-grad text-center flex flex-col items-center gap-4" data-reveal>
        <span className="gold" style={{ fontSize: '32px' }} aria-hidden="true">☦</span>
        <p className="reading">{t.historyPage.ctaText}</p>
        <Link href="/donatii" className="btn red">{t.historyPage.ctaBtn}</Link>
      </div>
    </PageShell>
  )
}
