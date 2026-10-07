import Link from 'next/link'
import Image from 'next/image'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/href'
import { getScheduleItems } from '@/lib/schedule'
import { socialLinks } from '@/lib/social'
import { getProfileData } from '@/lib/profile'
import SocialIcon from '@/components/shell/SocialIcon'
import { FOOTER_SOCIAL_ANCHOR } from '@/components/shell/ProfileAside'

const CONTACT_INFO = {
  phone: '+373 67 306 191',
  email: 'parinte.marin@biserica-sf-nicolae.org',
}

export default async function Footer() {
  const [t, locale, profile] = await Promise.all([getServerT(), getServerLocale(), getProfileData()])
  const year = new Date().getFullYear()

  const pageLinks = [
    { href: '/despre',             label: t.footer.pages.about },
    { href: '/biblie',             label: t.footer.pages.bible },
    { href: '/carti',              label: t.footer.pages.books },
    { href: '/calendar',           label: t.footer.pages.calendar },
    { href: '/istoria-bisericii',  label: t.footer.pages.history },
    { href: '/sfantul-nicolae',    label: t.footer.pages.saint },
    { href: '/video',              label: t.footer.pages.video },
    { href: '/stiri',              label: t.footer.pages.news },
  ].map(link => ({ ...link, href: localizedHref(link.href, locale) }))

  const scheduleItems = getScheduleItems(t)
  const socials = socialLinks(profile.facebook)
  const headCls = 'eyebrow mb-4'
  const linkCls = 'inline-flex items-center min-h-[32px] transition-colors hover:text-gold'

  return (
    <footer className="mt-auto" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12">
        <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10" style={{ padding: 'clamp(22px, 4vw, 40px)' }}>

          {/* Coloana 1 — Emblemă & adresă */}
          <div>
            <Image
              src="/logo-emblema.png"
              alt="Emblema Parohiei Sfântul Ierarh Nicolae"
              width={132}
              height={190}
              className="mb-4"
              style={{ height: 190, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />
            <p className="text-[17px] leading-relaxed mute">
              {t.footer.parish}<br />
              {t.footer.address}<br />
              {t.footer.country}
            </p>
            <p className="text-[15px] mt-2 leading-relaxed mute">
              {t.footer.metropolis}
            </p>
            <div className="mt-4 space-y-1.5 text-[17px]">
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`} className={`${linkCls} gap-2`}>
                <span aria-hidden="true" className="gold">☎</span> {CONTACT_INFO.phone}
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`} className={`${linkCls} gap-2 break-all`}>
                <span aria-hidden="true" className="gold">✉</span> {CONTACT_INFO.email}
              </a>
            </div>
          </div>

          {/* Coloana 2 — Pagini */}
          <div>
            <h2 className={headCls}>{t.footer.pagesTitle}</h2>
            <ul className="space-y-1 text-[17px]">
              {pageLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className={linkCls}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coloana 3 — Program slujbe */}
          <div>
            <h2 className={headCls}>{t.footer.scheduleTitle}</h2>
            <ul className="space-y-2">
              {scheduleItems.map(item => (
                <li key={item.zi} className="flex items-baseline gap-2 text-[17px]">
                  <span className="w-24 shrink-0 mute text-[16px]">{item.zi}</span>
                  <span className="gold">{item.ora}</span>
                  <span>{item.slujba}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coloana 4 — Contact & Social */}
          <div>
            <h2 className={headCls}>{t.footer.contactTitle}</h2>
            <ul className="space-y-1 mb-5 text-[17px]">
              <li>
                <Link href={localizedHref('/contact', locale)} className={linkCls}>{t.footer.contact}</Link>
              </li>
              <li>
                <Link href={localizedHref('/donatii', locale)} className={`${linkCls} text-rose`}>{t.footer.support}</Link>
              </li>
            </ul>

            {/* Rețele sociale (sursa: src/lib/social.ts) */}
            <div id={FOOTER_SOCIAL_ANCHOR} className="flex flex-wrap gap-2.5" style={{ scrollMarginTop: 'calc(var(--header-h) + 20px)' }}>
              {socials.map(social => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="soc"
                >
                  <SocialIcon name={social.key} size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bara de jos */}
        <div className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[16px] mute text-center md:text-left" style={{ borderTop: '1px solid var(--line)' }}>
          <p>© {year} {t.footer.copyright}</p>
          <p className="italic">
            {t.footer.blessing} · <a href="tel:+37367306191" className="transition-colors hover:text-gold">+373 67 306 191</a> ☦
          </p>
          <div className="flex flex-wrap justify-center gap-x-4">
            {[
              { href: '/contact',  label: t.footer.contact },
              { href: '/donatii', label: t.nav.donate },
              { href: '/politica-de-confidentialitate', label: t.footer.privacyPolicy },
            ].map(link => (
              <Link key={link.href} href={localizedHref(link.href, locale)} className={linkCls}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
