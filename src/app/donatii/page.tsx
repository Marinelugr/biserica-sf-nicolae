import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'
import { DONATII_DEFAULTS, type DonationConfigData, type DonationLocalAccount, type DonationIbanAccount, type DonationVideoLink } from '@/lib/donatii-defaults'
import PublicGallery from '@/components/PublicGallery'
import CopyButton from '@/components/CopyButton'
import { buildAlternates } from '@/lib/i18n/alternates'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.donatii.title,
    description: t.meta.donatii.description,
    alternates: buildAlternates('/donatii'),
  }
}

function facebookEmbedSrc(url: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`
}

export default async function DonationsPage() {
  const t = await getServerT()

  const [projects, configRow, gallery] = await Promise.all([
    prisma.donationProject.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.donationConfig.findFirst(),
    prisma.mediaItem.findMany({ where: { entityType: 'donatii', entityId: 'main' }, orderBy: { order: 'asc' } }),
  ])

  const config: DonationConfigData = configRow
    ? {
        localAccounts: (configRow.localAccounts as unknown as DonationLocalAccount[]) ?? [],
        ibanAccounts: (configRow.ibanAccounts as unknown as DonationIbanAccount[]) ?? [],
        paypalEmail: configRow.paypalEmail ?? '',
        paypalLink: configRow.paypalLink ?? '',
        contactName: configRow.contactName ?? '',
        contactPhone: configRow.contactPhone ?? '',
        facebookUrl: configRow.facebookUrl ?? '',
        tiktokUrl: configRow.tiktokUrl ?? '',
        instagramUrl: configRow.instagramUrl ?? '',
        safetyNote: configRow.safetyNote ?? '',
        videoLinks: (configRow.videoLinks as unknown as DonationVideoLink[]) ?? [],
      }
    : DONATII_DEFAULTS

  const contactNameLocalized = config.contactName
  const safetyNoteLocalized = config.safetyNote

  const sub = 'h-s flex items-center gap-2 mb-4'
  const box = 'rounded-2xl p-4'
  const boxStyle: React.CSSProperties = { border: '1px solid var(--line)', background: 'rgba(5, 10, 26, 0.45)' }

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.donate.badge} title={t.donate.title}>
        <p className="lead" style={{ fontSize: 22 }}>
          {t.donate.verse}
          <br />
          <span className="mute not-italic text-[16px]" style={{ fontFamily: 'var(--body)' }}>{t.donate.verseRef}</span>
        </p>
      </PageHead>

      {projects.length > 0 && (
        <section className="card" aria-labelledby="don-proiecte">
          <h2 id="don-proiecte" className="h-m mb-1">{t.donate.projectsTitle}</h2>
          <p className="mute mb-6">{t.donate.projectsSubtitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <div key={project.id} className="tile" data-reveal>
                <h3 className="h-s">{project.titleRo}</h3>
                <p className="mute text-[17px] leading-relaxed flex-1">{project.descriptionRo}</p>
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1.5 text-[15px] mute">
                    <span>{t.donate.progress}: <strong className="gold">{project.progress}%</strong></span>
                    <span>{t.donate.target}: {project.target}</span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: 'var(--gold)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card red-grad" aria-labelledby="don-metode">
        <h2 id="don-metode" className="h-m mb-1">{t.donate.methodsTitle}</h2>
        <p className="mb-6" style={{ color: '#f1dede' }}>{t.donate.methodsSubtitle}</p>

        {config.localAccounts.length > 0 && (
          <div className="mb-7">
            <h3 className={sub}>🏦 {t.donate.bankAccountsTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.localAccounts.map((acc, i) => (
                <div key={i} className={box} style={boxStyle}>
                  <div className="text-[13px] uppercase tracking-[.14em] mb-1" style={{ color: '#f1c9c9' }}>{acc.bankName} · {acc.accountLabel}</div>
                  <div className="font-mono text-[16px] tracking-wider mb-1 break-all">{acc.accountNumber}</div>
                  <div className="text-[15px] mb-3" style={{ color: '#e9d6d6' }}>{acc.holder}</div>
                  <CopyButton value={acc.accountNumber} copyLabel={t.donate.copyLabel} copiedLabel={t.donate.copiedLabel} />
                </div>
              ))}
            </div>
          </div>
        )}

        {config.ibanAccounts.length > 0 && (
          <div className="mb-7">
            <h3 className={sub}>🌐 {t.donate.ibanAccountsTitle}</h3>
            <div className="grid grid-cols-1 gap-3">
              {config.ibanAccounts.map((acc, i) => (
                <div key={i} className={box} style={boxStyle}>
                  <div className="text-[13px] uppercase tracking-[.14em] mb-2" style={{ color: '#f1c9c9' }}>{acc.bankName}</div>
                  <dl className="space-y-1 mb-3 text-[16px]">
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <dt style={{ color: '#e9d6d6' }}>IBAN</dt>
                      <dd className="font-mono tracking-wider break-all">{acc.iban}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <dt style={{ color: '#e9d6d6' }}>SWIFT</dt>
                      <dd className="font-mono tracking-wider">{acc.swift}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <dt style={{ color: '#e9d6d6' }}>{t.donate.beneficiaryLabel}</dt>
                      <dd>{acc.beneficiary}</dd>
                    </div>
                  </dl>
                  <CopyButton value={acc.iban} copyLabel={t.donate.copyLabel} copiedLabel={t.donate.copiedLabel} />
                </div>
              ))}
            </div>
          </div>
        )}

        {(config.paypalEmail || config.paypalLink) && (
          <div className="mb-2">
            <h3 className={sub}>💳 {t.donate.paypalTitle}</h3>
            <div className={`${box} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`} style={boxStyle}>
              {config.paypalEmail && <span className="break-all">{config.paypalEmail}</span>}
              {config.paypalLink && (
                <a href={config.paypalLink} target="_blank" rel="noopener noreferrer" className="btn red">{t.donate.paypalTitle}</a>
              )}
            </div>
          </div>
        )}

        {safetyNoteLocalized && (
          <p className="italic text-[16px] mt-6" style={{ color: '#f1dede' }}>{safetyNoteLocalized}</p>
        )}
      </section>

      {(config.contactPhone || config.facebookUrl || config.tiktokUrl || config.instagramUrl) && (
        <section className="card" aria-labelledby="don-contact" data-reveal>
          <h2 id="don-contact" className="h-m mb-5">{t.donate.contactSocialTitle}</h2>
          <div className="flex flex-wrap items-center gap-6">
            {config.contactPhone && (
              <div>
                <a href={`tel:${config.contactPhone.replace(/\s+/g, '')}`} className="link-gold text-[20px] block">📞 {config.contactPhone}</a>
                <p className="mute text-[15px] mt-1">{t.donate.viberWhatsappTelegram}</p>
                {contactNameLocalized && <p className="text-[15px] mt-1">{contactNameLocalized}</p>}
              </div>
            )}
            {(config.facebookUrl || config.tiktokUrl || config.instagramUrl) && (
              <div className="flex flex-wrap gap-2.5">
                {config.facebookUrl && <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn sm">Facebook</a>}
                {config.tiktokUrl && <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="btn sm">TikTok</a>}
                {config.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn sm">Instagram</a>}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="don-video" data-reveal>
        <h2 id="don-video" className="h-m mb-5">{t.donate.videosTitle}</h2>
        {config.videoLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {config.videoLinks.map((video, i) => (
              <div key={i}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <iframe
                    src={facebookEmbedSrc(video.url)}
                    title={video.caption || `Video ${i + 1}`}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
                {video.caption && <p className="mute text-[16px] text-center mt-2">{video.caption}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mute italic">{t.donate.videosEmpty}</p>
        )}
      </section>

      <section className="card" aria-labelledby="don-galerie" data-reveal>
        <h2 id="don-galerie" className="h-m mb-1">{t.donate.galleryTitle}</h2>
        <p className="mute mb-5">{t.donate.gallerySubtitle}</p>
        {gallery.length > 0 ? <PublicGallery items={gallery} /> : <p className="mute italic">{t.donate.galleryEmpty}</p>}
      </section>

      <div className="card text-center flex flex-col items-center gap-3" data-reveal>
        <h2 className="h-s gold">{t.donate.contactTitle}</h2>
        <p className="mute">{t.donate.anyAmount}</p>
        <a href="/contact" className="btn">{t.donate.contactBtn}</a>
        <hr className="sep w-full my-3" />
        <p className="lead" style={{ fontSize: 21 }}>{t.donate.blessing} ☦</p>
        <p className="mute text-[16px]">{t.donate.thanks}</p>
      </div>
    </PageShell>
  )
}
