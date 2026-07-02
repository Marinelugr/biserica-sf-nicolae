import type { Metadata } from 'next'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { prisma } from '@/lib/prisma'
import { DONATII_DEFAULTS, type DonationConfigData, type DonationLocalAccount, type DonationIbanAccount, type DonationVideoLink } from '@/lib/donatii-defaults'
import PublicGallery from '@/components/PublicGallery'
import CopyButton from '@/components/CopyButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Donații — Susțineți lucrările Bisericii',
  description:
    'Susține Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Criuleni. Donații pentru renovarea acoperișului, turnului clopotniță, pictura interiorului și alte lucrări.',
}

function facebookEmbedSrc(url: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`
}

export default async function DonationsPage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])

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
        contactNameRu: configRow.contactNameRu ?? '',
        contactNameEn: configRow.contactNameEn ?? '',
        contactPhone: configRow.contactPhone ?? '',
        facebookUrl: configRow.facebookUrl ?? '',
        tiktokUrl: configRow.tiktokUrl ?? '',
        instagramUrl: configRow.instagramUrl ?? '',
        safetyNote: configRow.safetyNote ?? '',
        safetyNoteRu: configRow.safetyNoteRu ?? '',
        safetyNoteEn: configRow.safetyNoteEn ?? '',
        videoLinks: (configRow.videoLinks as unknown as DonationVideoLink[]) ?? [],
      }
    : DONATII_DEFAULTS

  const contactNameLocalized = pick(locale, config.contactName, config.contactNameRu, config.contactNameEn)
  const safetyNoteLocalized = pick(locale, config.safetyNote, config.safetyNoteRu, config.safetyNoteEn)

  return (
    <div>
      {/* Hero dark */}
      <div
        className="relative py-20 px-4 text-center"
        style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}
      >
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8B1A1A' }}>
          {t.donate.badge}
        </p>
        <h1
          className="font-heading italic mb-5 leading-tight"
          style={{ color: '#C9A84C', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400 }}
        >
          {t.donate.title}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
        <p className="font-body text-base max-w-xl mx-auto" style={{ color: '#8A7050' }}>
          {t.donate.verse}
          <br />
          <span className="text-sm" style={{ color: '#5A4020' }}>{t.donate.verseRef}</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Secțiunea proiecte */}
        {projects.length > 0 && (
          <section className="mb-16">
            <h2 className="font-heading text-3xl mb-2 text-center" style={{ color: '#1C1B3A' }}>
              {t.donate.projectsTitle}
            </h2>
            <p className="font-body text-sm text-center mb-10" style={{ color: '#8A7050' }}>
              {t.donate.projectsSubtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg p-6 flex flex-col"
                  style={{ backgroundColor: '#FAFAF8', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                >
                  <h3 className="font-heading text-lg mb-2" style={{ color: '#1C1B3A' }}>
                    {pick(locale, project.titleRo, project.titleRu, project.titleEn)}
                  </h3>
                  <p className="font-body text-sm leading-relaxed mb-4 flex-1" style={{ color: '#6A5030' }}>
                    {pick(locale, project.descriptionRo, project.descriptionRu, project.descriptionEn)}
                  </p>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-body text-xs" style={{ color: '#8A7050' }}>
                        {t.donate.progress}: <strong style={{ color: '#8B1A1A' }}>{project.progress}%</strong>
                      </span>
                      <span className="font-body text-xs" style={{ color: '#8A7050' }}>
                        {t.donate.target}: {project.target}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: '6px', backgroundColor: '#E8E5E0' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.progress === 0 ? '#D4C8A0' : '#8B1A1A',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modalități de donație */}
        <section className="mb-16">
          <h2 className="font-heading text-3xl mb-2 text-center" style={{ color: '#1C1B3A' }}>
            {t.donate.methodsTitle}
          </h2>
          <p className="font-body text-sm text-center mb-10" style={{ color: '#8A7050' }}>
            {t.donate.methodsSubtitle}
          </p>

          {/* Conturi locale */}
          {config.localAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="font-heading text-lg mb-4" style={{ color: '#1C1B3A' }}>
                🏦 {t.donate.bankAccountsTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {config.localAccounts.map((acc, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  >
                    <div className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8A7050' }}>{acc.bankName} · {acc.accountLabel}</div>
                    <div className="font-mono text-sm tracking-wider mb-1" style={{ color: '#3A1A1A' }}>{acc.accountNumber}</div>
                    <div className="font-body text-xs mb-3" style={{ color: '#8A7050' }}>{acc.holder}</div>
                    <CopyButton value={acc.accountNumber} copyLabel={t.donate.copyLabel} copiedLabel={t.donate.copiedLabel} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IBAN diaspora */}
          {config.ibanAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="font-heading text-lg mb-4" style={{ color: '#1C1B3A' }}>
                🌐 {t.donate.ibanAccountsTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.ibanAccounts.map((acc, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  >
                    <div className="font-body text-xs uppercase tracking-wide mb-2" style={{ color: '#8A7050' }}>{acc.bankName}</div>
                    <dl className="space-y-1 mb-3">
                      <div className="flex justify-between font-body text-sm">
                        <dt style={{ color: '#8A7050' }}>IBAN</dt>
                        <dd className="font-mono tracking-wider" style={{ color: '#3A1A1A' }}>{acc.iban}</dd>
                      </div>
                      <div className="flex justify-between font-body text-sm">
                        <dt style={{ color: '#8A7050' }}>SWIFT</dt>
                        <dd className="font-mono tracking-wider" style={{ color: '#3A1A1A' }}>{acc.swift}</dd>
                      </div>
                      <div className="flex justify-between font-body text-sm">
                        <dt style={{ color: '#8A7050' }}>{t.donate.beneficiaryLabel}</dt>
                        <dd style={{ color: '#3A1A1A' }}>{acc.beneficiary}</dd>
                      </div>
                    </dl>
                    <CopyButton value={acc.iban} copyLabel={t.donate.copyLabel} copiedLabel={t.donate.copiedLabel} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PayPal */}
          {(config.paypalEmail || config.paypalLink) && (
            <div className="mb-4">
              <h3 className="font-heading text-lg mb-4" style={{ color: '#1C1B3A' }}>
                💳 {t.donate.paypalTitle}
              </h3>
              <div
                className="rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                {config.paypalEmail && (
                  <span className="font-body text-sm" style={{ color: '#6A5030' }}>{config.paypalEmail}</span>
                )}
                {config.paypalLink && (
                  <a
                    href={config.paypalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm px-5 py-2 rounded-full inline-block text-center"
                    style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
                  >
                    {t.donate.paypalTitle}
                  </a>
                )}
              </div>
            </div>
          )}

          {safetyNoteLocalized && (
            <p className="font-body text-center text-sm italic mt-6" style={{ color: '#8A7050' }}>
              {safetyNoteLocalized}
            </p>
          )}
        </section>

        {/* Contact și rețele sociale */}
        {(config.contactPhone || config.facebookUrl || config.tiktokUrl || config.instagramUrl) && (
          <section className="mb-16">
            <h2 className="font-heading text-2xl mb-6 text-center" style={{ color: '#1C1B3A' }}>
              {t.donate.contactSocialTitle}
            </h2>
            <div
              className="rounded-lg p-6 flex flex-wrap items-center justify-center gap-8"
              style={{ backgroundColor: '#FBF8F3', border: '1px solid #E8E5E0' }}
            >
              {config.contactPhone && (
                <div className="text-center">
                  <a href={`tel:${config.contactPhone.replace(/\s+/g, '')}`} className="font-body text-lg block" style={{ color: '#8B1A1A', textDecoration: 'none' }}>
                    📞 {config.contactPhone}
                  </a>
                  <p className="font-body text-xs mt-1" style={{ color: '#8A7050' }}>{t.donate.viberWhatsappTelegram}</p>
                  {contactNameLocalized && (
                    <p className="font-body text-xs mt-1" style={{ color: '#6A5030' }}>{contactNameLocalized}</p>
                  )}
                </div>
              )}
              {(config.facebookUrl || config.tiktokUrl || config.instagramUrl) && (
                <div className="flex gap-3">
                  {config.facebookUrl && (
                    <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="font-body text-sm px-4 py-2 rounded-full border" style={{ borderColor: '#8B1A1A', color: '#8B1A1A', textDecoration: 'none' }}>Facebook</a>
                  )}
                  {config.tiktokUrl && (
                    <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="font-body text-sm px-4 py-2 rounded-full border" style={{ borderColor: '#8B1A1A', color: '#8B1A1A', textDecoration: 'none' }}>TikTok</a>
                  )}
                  {config.instagramUrl && (
                    <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="font-body text-sm px-4 py-2 rounded-full border" style={{ borderColor: '#8B1A1A', color: '#8B1A1A', textDecoration: 'none' }}>Instagram</a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Video */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl mb-6 text-center" style={{ color: '#1C1B3A' }}>
            {t.donate.videosTitle}
          </h2>
          {config.videoLinks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.videoLinks.map((video, i) => (
                <div key={i}>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E8E5E0' }}>
                    <iframe
                      src={facebookEmbedSrc(video.url)}
                      title={video.caption || `Video ${i + 1}`}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                  {video.caption && (
                    <p className="font-body text-sm text-center mt-2" style={{ color: '#8A7050' }}>{video.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-center text-sm italic" style={{ color: '#8A7050' }}>{t.donate.videosEmpty}</p>
          )}
        </section>

        {/* Galerie foto */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl mb-2 text-center" style={{ color: '#1C1B3A' }}>
            {t.donate.galleryTitle}
          </h2>
          <p className="font-body text-sm text-center mb-8" style={{ color: '#8A7050' }}>
            {t.donate.gallerySubtitle}
          </p>
          {gallery.length > 0 ? (
            <PublicGallery items={gallery} />
          ) : (
            <p className="font-body text-center text-sm italic" style={{ color: '#8A7050' }}>{t.donate.galleryEmpty}</p>
          )}
        </section>

        {/* Contact */}
        <div
          className="rounded-lg p-6 text-center mb-10"
          style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
        >
          <h3 className="font-heading text-xl mb-2" style={{ color: '#C9A84C' }}>
            {t.donate.contactTitle}
          </h3>
          <p className="font-body text-sm mb-4 opacity-80">
            {t.donate.anyAmount}
          </p>
          <a
            href="/contact"
            className="font-body text-sm px-6 py-2.5 rounded border inline-block transition-all hover:bg-white/10"
            style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
          >
            {t.donate.contactBtn}
          </a>
        </div>

        {/* Footer binecuvântare */}
        <p className="font-body text-center text-base italic" style={{ color: '#8A7050' }}>
          {t.donate.blessing} ☦
        </p>
        <p className="font-body text-center text-sm mt-2" style={{ color: '#5A4020' }}>
          {t.donate.thanks}
        </p>
      </div>
    </div>
  )
}
