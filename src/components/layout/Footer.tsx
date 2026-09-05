import Link from 'next/link'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/href'

const CONTACT_INFO = {
  phone: '+373 67 306 191',
  email: 'parinte.marin@biserica-sf-nicolae.org',
}

export default async function Footer() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
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

  const scheduleItems = [
    { zi: t.footer.schedule.sunday,   ora: '09:00', slujba: t.footer.schedule.liturgy },
    { zi: t.footer.schedule.saturday, ora: '17:00', slujba: t.footer.schedule.vespers },
    { zi: t.footer.schedule.friday,   ora: '08:00', slujba: t.footer.schedule.matins },
    { zi: t.footer.schedule.feasts,   ora: '09:00', slujba: t.footer.schedule.liturgy },
  ]

  return (
    <footer style={{ backgroundColor: '#04080F', borderTop: '1px solid rgba(255,255,255,0.08)' }} className="mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-cobalt grid grid-cols-1 md:grid-cols-4 gap-10 p-6 sm:p-10">

          {/* Coloana 1 — Logo & adresă */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl" style={{ color: '#C9A84C' }} aria-hidden="true">☦</span>
              <span className="font-heading text-base font-semibold" style={{ color: '#C9A84C' }}>
                Sfântul Ierarh Nicolae
              </span>
            </div>
            <p className="font-body text-base leading-relaxed" style={{ color: '#A8B4CC' }}>
              {t.footer.parish}<br />
              {t.footer.address}<br />
              {t.footer.country}
            </p>
            <p className="font-body text-sm mt-2 leading-relaxed" style={{ color: '#828EA8' }}>
              {t.footer.metropolis}
            </p>
            <div className="mt-4 space-y-1.5">
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 font-body text-base transition-colors hover:text-amber-600"
                style={{ color: '#A8B4CC' }}>
                <span aria-hidden="true">☎</span> {CONTACT_INFO.phone}
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-2 font-body text-base transition-colors hover:text-amber-600"
                style={{ color: '#A8B4CC' }}>
                <span aria-hidden="true">✉</span> {CONTACT_INFO.email}
              </a>
            </div>
          </div>

          {/* Coloana 2 — Pagini */}
          <div>
            <h3 className="font-heading text-base font-semibold mb-4 tracking-widest uppercase" style={{ color: '#A8B4CC' }}>
              {t.footer.pagesTitle}
            </h3>
            <ul className="space-y-2">
              {pageLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-base transition-colors hover:text-amber-600" style={{ color: '#A8B4CC' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coloana 3 — Program slujbe */}
          <div>
            <h3 className="font-heading text-base font-semibold mb-4 tracking-widest uppercase" style={{ color: '#A8B4CC' }}>
              {t.footer.scheduleTitle}
            </h3>
            <ul className="space-y-2">
              {scheduleItems.map(item => (
                <li key={item.zi} className="flex items-baseline gap-2">
                  <span className="font-body text-sm w-20 shrink-0" style={{ color: '#828EA8' }}>{item.zi}</span>
                  <span className="font-body text-base" style={{ color: '#C9A84C' }}>{item.ora}</span>
                  <span className="font-body text-sm" style={{ color: '#A8B4CC' }}>{item.slujba}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coloana 4 — Contact & Social */}
          <div>
            <h3 className="font-heading text-base font-semibold mb-4 tracking-widest uppercase" style={{ color: '#A8B4CC' }}>
              {t.footer.contactTitle}
            </h3>
            <ul className="space-y-2 mb-6">
              <li>
                <Link href={localizedHref('/contact', locale)} className="font-body text-base transition-colors hover:text-amber-600" style={{ color: '#A8B4CC' }}>
                  {t.footer.contact}
                </Link>
              </li>
              <li>
                <Link href={localizedHref('/donatii', locale)} className="font-body text-base transition-colors hover:text-red-400" style={{ color: '#8B1A1A' }}>
                  {t.footer.support}
                </Link>
              </li>
            </ul>

            {/* Rețele sociale */}
            <div className="flex gap-3 mt-4">
              {[
                {
                  label: 'Facebook', href: '#',
                  icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
                },
                {
                  label: 'Telegram', href: '#',
                  icon: <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />,
                },
                {
                  label: 'YouTube', href: '#',
                  icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
                },
              ].map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-8 h-8 rounded border transition-all hover:border-amber-600 hover:text-amber-600"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#A8B4CC' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-body text-sm" style={{ color: '#5c6478' }}>
            © {year} {t.footer.copyright}
          </p>
          <p className="font-body text-sm italic" style={{ color: '#5c6478' }}>
            {t.footer.blessing} · <a href="tel:+37367306191" className="transition-colors hover:text-amber-600" style={{ color: '#5c6478' }}>+373 67 306 191</a> ☦
          </p>
          <div className="flex gap-4">
            {[
              { href: '/contact',  label: t.footer.contact },
              { href: '/donatii', label: t.nav.donate },
              { href: '/politica-de-confidentialitate', label: t.footer.privacyPolicy },
            ].map(link => (
              <Link key={link.href} href={localizedHref(link.href, locale)} className="font-body text-sm transition-colors hover:text-amber-600" style={{ color: '#5c6478' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
