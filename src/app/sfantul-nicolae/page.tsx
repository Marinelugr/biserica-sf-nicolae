import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sfântul Ierarh Nicolae',
  description:
    'Viața Sfântului Ierarh Nicolae — Arhiepiscopul Mirelor Lichiei. Tropar, Condac, date ale prăznuirii și Acatistul Sfântului Nicolae.',
  alternates: buildAlternates('/sfantul-nicolae'),
}

function renderPoem(text: string) {
  return text.split('/').map((line, i, arr) => (
    <span key={i}>{line.trim()}{i < arr.length - 1 && <br />}</span>
  ))
}

export default async function SfantulNicolaePage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])

  let dynLife: string | null = null
  let dynTropar: string | null = null
  let dynCondac: string | null = null
  let iconUrl: string | null = null
  let feast1 = t.saintNicholasPage.feast1
  let feast1Desc = t.saintNicholasPage.feast1Desc
  let feast2 = t.saintNicholasPage.feast2
  let feast2Desc = t.saintNicholasPage.feast2Desc

  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'saint_nicholas_content' } })
    if (setting) {
      const data = JSON.parse(setting.value)
      // suportă și forma veche (un singur câmp per limbă) pentru compatibilitate cu datele deja introduse
      dynLife = pick(locale, data.lifeRo ?? data.life ?? '', data.lifeRu, data.lifeEn) || null
      dynTropar = pick(locale, data.troparRo ?? data.tropar ?? '', data.troparRu, data.troparEn) || null
      dynCondac = pick(locale, data.condacRo ?? data.condac ?? '', data.condacRu, data.condacEn) || null
      iconUrl = data.iconUrl || null
      const f1 = pick(locale, data.feast1Ro ?? data.feast1 ?? '', data.feast1Ru, data.feast1En)
      const f1d = pick(locale, data.feast1DescRo ?? data.feast1Desc ?? '', data.feast1DescRu, data.feast1DescEn)
      const f2 = pick(locale, data.feast2Ro ?? data.feast2 ?? '', data.feast2Ru, data.feast2En)
      const f2d = pick(locale, data.feast2DescRo ?? data.feast2Desc ?? '', data.feast2DescRu, data.feast2DescEn)
      if (f1) feast1 = f1
      if (f1d) feast1Desc = f1d
      if (f2) feast2 = f2
      if (f2d) feast2Desc = f2d
    }
  } catch { /* use fallback */ }

  const tropar = dynTropar || t.saintNicholasPage.fallbackTropar
  const condac = dynCondac || t.saintNicholasPage.fallbackCondac

  const saintGallery = await prisma.mediaItem.findMany({
    where: { entityType: 'saint', entityId: 'sfantul-nicolae' },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      {/* Dark hero */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          {t.saintNicholasPage.badge}
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(44px, 7vw, 70px)', fontWeight: 400 }}>
          {t.saintNicholasPage.pageTitle}
        </h1>
        <p className="font-body mb-6" style={{ color: '#6A5030', fontSize: '15px' }}>
          {t.saintNicholasPage.subtitle}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Icoana + Date prăznuire */}
        <div className="flex flex-col md:flex-row gap-10 mb-16 items-start">
          {/* Icoana */}
          <div className="w-full md:w-64 shrink-0 rounded-lg overflow-hidden" style={{ minHeight: '280px', border: '1px solid #E8DFC8' }}>
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt={t.saintNicholasPage.iconAlt} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '280px' }} />
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-16" style={{ backgroundColor: '#F7F3EC', minHeight: '280px' }}>
                <span style={{ color: '#D4C8A0', fontSize: '64px' }} aria-hidden="true">☦</span>
                <p className="font-body text-xs mt-4 text-center px-4" style={{ color: '#B0A080' }}>
                  {t.saintNicholasPage.iconAlt}
                  <br />
                  <span style={{ color: '#C9A84C' }}>{t.saintNicholasPage.iconMissing}</span>
                </p>
              </div>
            )}
          </div>

          {/* Informații */}
          <div className="flex-1">
            <h2 className="font-heading text-2xl mb-6" style={{ color: '#1C1B3A' }}>{t.saintNicholasPage.feastDatesTitle}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
                <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 font-heading font-semibold" style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', fontSize: '16px' }}>
                  <div className="text-center leading-tight">
                    <div>19</div>
                    <div style={{ fontSize: '9px' }}>DEC</div>
                  </div>
                </div>
                <div>
                  <p className="font-heading text-base" style={{ color: '#1C1B3A' }}>
                    {feast1}
                  </p>
                  <p className="font-body text-sm mt-1" style={{ color: '#8A7050' }}>
                    {feast1Desc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
                <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 font-heading font-semibold" style={{ backgroundColor: '#C9A84C', color: '#1C1B3A', fontSize: '16px' }}>
                  <div className="text-center leading-tight">
                    <div>22</div>
                    <div style={{ fontSize: '9px' }}>MAI</div>
                  </div>
                </div>
                <div>
                  <p className="font-heading text-base" style={{ color: '#1C1B3A' }}>
                    {feast2}
                  </p>
                  <p className="font-body text-sm mt-1" style={{ color: '#8A7050' }}>
                    {feast2Desc}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/carti"
              className="font-body text-sm px-5 py-2.5 rounded border inline-flex items-center gap-2 transition-all hover:bg-amber-50"
              style={{ color: '#8B6014', borderColor: '#C9A84C' }}
            >
              <span>☦</span>
              <span>{t.saintNicholasPage.acatistLink}</span>
            </Link>
          </div>
        </div>

        {/* Viața sfântului */}
        <section className="mb-16">
          <h2 className="font-heading text-3xl mb-8" style={{ color: '#1C1B3A' }}>
            {t.saintNicholasPage.lifeTitle}
          </h2>
          <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

          {dynLife ? (
            <div className="tiptap-prose" dangerouslySetInnerHTML={{ __html: dynLife }} />
          ) : (
            <div className="space-y-10">
              {t.saintNicholasPage.fallbackViata.map((sectiune, i) => (
                <article key={i}>
                  <h3 className="font-heading text-xl mb-3" style={{ color: '#4A2010' }}>{sectiune.titlu}</h3>
                  <p className="font-body text-base leading-relaxed" style={{ color: '#3A2010', lineHeight: '1.8' }}>{sectiune.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Tropar */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{t.saintNicholasPage.troparTitle}</h2>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <blockquote
            className="font-body text-base leading-relaxed italic text-center mx-auto max-w-2xl p-6 rounded-lg"
            style={{ color: '#3A1A1A', backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', lineHeight: '1.9' }}
          >
            {renderPoem(tropar)}
          </blockquote>
          <p className="font-body text-xs text-center mt-2" style={{ color: '#8A7050' }}>{t.saintNicholasPage.troparTone}</p>
        </section>

        {/* Condac */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{t.saintNicholasPage.condacTitle}</h2>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <blockquote
            className="font-body text-base leading-relaxed italic text-center mx-auto max-w-2xl p-6 rounded-lg"
            style={{ color: '#3A1A1A', backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', lineHeight: '1.9' }}
          >
            {renderPoem(condac)}
          </blockquote>
          <p className="font-body text-xs text-center mt-2" style={{ color: '#8A7050' }}>{t.saintNicholasPage.condacTone}</p>
        </section>

        {/* Galerie imagini */}
        {saintGallery.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#3A2010' }} />
              <h2 className="font-heading text-xl" style={{ color: '#C9A84C' }}>{t.saintNicholasPage.galleryTitle}</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#3A2010' }} />
            </div>
            <PublicGallery items={saintGallery} />
          </section>
        )}

        {/* Link Acatist */}
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#0D0905', border: '1px solid #1E1208' }}>
          <span style={{ color: '#C9A84C', fontSize: '28px' }} aria-hidden="true">☦</span>
          <h3 className="font-heading text-xl mt-3 mb-2" style={{ color: '#C9A84C' }}>
            {t.saintNicholasPage.acatistCtaTitle}
          </h3>
          <p className="font-body text-sm mb-5" style={{ color: '#6A5030' }}>
            {t.saintNicholasPage.acatistCtaText}
          </p>
          <Link
            href="/carti"
            className="font-body text-sm px-6 py-2.5 rounded border inline-block transition-all hover:bg-white/10"
            style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
          >
            {t.saintNicholasPage.goToLibrary}
          </Link>
        </div>
      </div>
    </div>
  )
}
