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
    title: t.meta.sfantulNicolae.title,
    description: t.meta.sfantulNicolae.description,
    alternates: buildAlternates('/sfantul-nicolae'),
  }
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

  const ACATIST = '/carti/acatistul-sfantului-ierarh-nicolae-arhiepiscopul-de-mira-lichia'
  const feastRow = (day: string, mon: string, title: string, desc: string, gold?: boolean) => (
    <div className="flex items-start gap-4 py-3">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 serif font-semibold text-center leading-tight"
        style={gold ? { background: 'var(--gold)', color: '#0a1330' } : { background: 'var(--red)', color: '#fff' }}
      >
        <div>
          <div style={{ fontSize: 20 }}>{day}</div>
          <div style={{ fontSize: 11, letterSpacing: '.1em' }}>{mon}</div>
        </div>
      </div>
      <div>
        <p className="h-s" style={{ fontSize: 21 }}>{title}</p>
        <p className="mute text-[17px] mt-1">{desc}</p>
      </div>
    </div>
  )
  const hymn = (id: string, title: string, text: string, tone: string) => (
    <section className="card" aria-labelledby={id} data-reveal>
      <h2 id={id} className="h-m mb-1">{title}</h2>
      <p className="eyebrow mb-4">{tone}</p>
      <blockquote className="lead" style={{ fontSize: 22 }}>{renderPoem(text)}</blockquote>
    </section>
  )

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.saintNicholasPage.badge} title={t.saintNicholasPage.pageTitle}>
        <p className="lead" style={{ fontSize: 22 }}>{t.saintNicholasPage.subtitle}</p>
      </PageHead>

      <section className="card flex flex-col sm:flex-row gap-6 items-start" aria-labelledby="sn-date">
        <div className="w-full sm:w-52 shrink-0 overflow-hidden" style={{ borderRadius: 18, border: '1px solid var(--gold-d)', aspectRatio: '4 / 5' }}>
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt={t.saintNicholasPage.iconAlt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="ph w-full h-full flex-col text-center px-4">
              <span style={{ fontSize: 56 }} aria-hidden="true">☦</span>
              <p className="mute text-[15px] mt-3">
                {t.saintNicholasPage.iconAlt}
                <br />
                <span className="gold">{t.saintNicholasPage.iconMissing}</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="sn-date" className="h-m mb-2">{t.saintNicholasPage.feastDatesTitle}</h2>
          {feastRow('19', 'DEC', feast1, feast1Desc)}
          <hr className="sep" />
          {feastRow('22', 'MAI', feast2, feast2Desc, true)}
          <Link href={ACATIST} className="btn mt-4">
            <span aria-hidden="true">☦</span>
            <span>{t.saintNicholasPage.acatistLink}</span>
          </Link>
        </div>
      </section>

      <article className="card" aria-labelledby="sn-viata">
        <h2 id="sn-viata" className="h-m mb-5">{t.saintNicholasPage.lifeTitle}</h2>
        {dynLife ? (
          <div className="rich reading" dangerouslySetInnerHTML={{ __html: dynLife }} />
        ) : (
          <div className="reading flex flex-col gap-8">
            {t.saintNicholasPage.fallbackViata.map((sectiune, i) => (
              <section key={i}>
                <h3 className="h-s mb-2">{sectiune.titlu}</h3>
                <p>{sectiune.text}</p>
              </section>
            ))}
          </div>
        )}
      </article>

      {hymn('sn-tropar', t.saintNicholasPage.troparTitle, tropar, t.saintNicholasPage.troparTone)}
      {hymn('sn-condac', t.saintNicholasPage.condacTitle, condac, t.saintNicholasPage.condacTone)}

      {saintGallery.length > 0 && (
        <section className="card" aria-labelledby="sn-galerie" data-reveal>
          <h2 id="sn-galerie" className="eyebrow mb-5">{t.saintNicholasPage.galleryTitle}</h2>
          <PublicGallery items={saintGallery} />
        </section>
      )}

      <div className="card text-center flex flex-col items-center gap-3" data-reveal>
        <span className="gold" style={{ fontSize: '28px' }} aria-hidden="true">☦</span>
        <h2 className="h-s gold">{t.saintNicholasPage.acatistCtaTitle}</h2>
        <p className="mute">{t.saintNicholasPage.acatistCtaText}</p>
        <Link href={ACATIST} className="btn gold">{t.saintNicholasPage.goToLibrary}</Link>
      </div>
    </PageShell>
  )
}
