import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactează Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Criuleni, Moldova. Formular de contact, adresă, telefon și program de slujbe.',
  alternates: buildAlternates('/contact'),
}

const MAP_EMBED_SRC = 'https://www.google.com/maps?q=47.2469,28.9283&z=15&output=embed'

export default async function ContactPage() {
  const t = await getServerT()

  const infoCards = [
    { icon: '📍', label: t.contactPage.addressLabel, content: <>Hîrtopul Mic<br />Raionul Criuleni<br />Republica Moldova</> },
    { icon: '⛪', label: t.contactPage.hramLabel, content: t.contactPage.hramValue },
    { icon: '📞', label: t.contactPage.phoneLabel, content: <a href="tel:+37367306191" className="hover:underline" style={{ color: '#C9A84C' }}>+373 67 306 191</a> },
    { icon: '✉️', label: t.contactPage.emailLabel, content: <a href="mailto:parinte.marin@biserica-sf-nicolae.org" className="hover:underline" style={{ color: '#C9A84C' }}>parinte.marin@biserica-sf-nicolae.org</a> },
    { icon: '🌐', label: t.contactPage.facebookLabel, content: <a href="https://www.facebook.com/PreotMarin" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#C9A84C' }}>facebook.com/PreotMarin</a> },
  ]

  const scheduleItems = [
    { zi: t.footer.schedule.sunday, ora: '09:00', slujba: t.footer.schedule.liturgy },
    { zi: t.footer.schedule.saturday, ora: '17:00', slujba: t.footer.schedule.vespers },
    { zi: t.footer.schedule.friday, ora: '08:00', slujba: t.footer.schedule.matins },
    { zi: t.footer.schedule.feasts, ora: '09:00', slujba: t.footer.schedule.liturgy },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Hero */}
      <div className="text-center mb-14">
        <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: '#8A7050' }}>
          {t.contactPage.subtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: '#1C1B3A' }}>
          {t.contactPage.title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

        <div className="lg:col-span-2 space-y-6">
          {/* Date de contact */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#F8F7F5', border: '1px solid #E8E5E0' }}>
            <h2 className="font-heading text-xl mb-6" style={{ color: '#1C1B3A' }}>
              Parohia Sfântul Ierarh Nicolae
            </h2>
            <div className="space-y-4">
              {infoCards.map((card, i) => (
                <div key={card.label}>
                  {i > 0 && <div className="h-px mb-4" style={{ backgroundColor: '#E8E5E0' }} />}
                  <div className="flex gap-3">
                    <span aria-hidden="true">{card.icon}</span>
                    <div>
                      <p className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8A7050' }}>
                        {card.label}
                      </p>
                      <p className="font-body text-sm" style={{ color: '#3A1A1A' }}>
                        {card.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program slujbe */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#F8F7F5', border: '1px solid #E8E5E0' }}>
            <h2 className="font-heading text-lg mb-4" style={{ color: '#1C1B3A' }}>
              {t.contactPage.scheduleTitle}
            </h2>
            <ul className="space-y-2.5">
              {scheduleItems.map((item, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="font-body text-xs w-20 shrink-0" style={{ color: '#8A7050' }}>{item.zi}</span>
                  <span className="font-heading text-sm font-semibold" style={{ color: '#C9A84C' }}>{item.ora}</span>
                  <span className="font-body text-sm" style={{ color: '#3A1A1A' }}>{item.slujba}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Harta */}
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #E8E5E0' }}>
            <p className="font-body text-xs uppercase tracking-wide px-4 pt-4 pb-2" style={{ color: '#8A7050' }}>
              {t.contactPage.mapTitle}
            </p>
            <iframe
              src={MAP_EMBED_SRC}
              width="100%"
              height="300"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hîrtopul Mic, Criuleni, Moldova"
            />
          </div>
        </div>

        {/* Formular contact */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
