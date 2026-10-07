import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getContactInfo } from '@/lib/contact-info'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.contact.title,
    description: t.meta.contact.description,
    alternates: buildAlternates('/contact'),
  }
}

export default async function ContactPage() {
  const [t, contact] = await Promise.all([getServerT(), getContactInfo()])

  const infoCards = [
    { icon: '📍', label: t.contactPage.addressLabel, content: contact.address.split('\n').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>) },
    { icon: '⛪', label: t.contactPage.hramLabel, content: t.contactPage.hramValue },
    { icon: '📞', label: t.contactPage.phoneLabel, content: <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="link-gold break-all">{contact.phone}</a> },
    { icon: '✉️', label: t.contactPage.emailLabel, content: <a href={`mailto:${contact.email}`} className="link-gold break-all">{contact.email}</a> },
    { icon: '🌐', label: t.contactPage.facebookLabel, content: <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="link-gold break-all">{contact.facebook.replace(/^https?:\/\/(www\.)?/, '')}</a> },
  ]

  const scheduleItems = contact.schedule.split('\n').filter(Boolean).map(line => {
    const [zi, ora, ...rest] = line.split(' - ')
    return { zi, ora, slujba: rest.join(' - ') }
  })

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.contactPage.subtitle} title={t.contactPage.title}>
        {contact.message && <div className="rich" style={{ fontSize: 19 }} dangerouslySetInnerHTML={{ __html: contact.message }} />}
      </PageHead>

      <section className="card" aria-labelledby="contact-date">
        <h2 id="contact-date" className="h-m mb-5">Parohia Sfântul Ierarh Nicolae</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {infoCards.map(card => (
            <div key={card.label} className="flex gap-3">
              <span aria-hidden="true">{card.icon}</span>
              <div className="min-w-0">
                <p className="label" style={{ marginBottom: 4 }}>{card.label}</p>
                <p className="text-[18px]">{card.content}</p>
              </div>
            </div>
          ))}
        </div>
        <hr className="sep my-6" />
        <h3 className="eyebrow mb-3">{t.contactPage.scheduleTitle}</h3>
        <ul className="flex flex-col">
          {scheduleItems.map((item, i) => (
            <li key={i} className="flex items-baseline gap-3 py-2" style={i < scheduleItems.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
              <span className="w-24 shrink-0 mute text-[16px]">{item.zi}</span>
              <span className="gold serif font-semibold">{item.ora}</span>
              <span>{item.slujba}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-label={t.contactPage.formTitle}>
        <ContactForm />
      </section>

      <section className="card flush" aria-labelledby="contact-harta">
        <h2 id="contact-harta" className="eyebrow" style={{ padding: '18px 24px 14px' }}>{t.contactPage.mapTitle}</h2>
        <iframe
          src={contact.mapEmbed}
          width="100%"
          height="320"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Hîrtopul Mic, Criuleni, Moldova"
        />
      </section>
    </PageShell>
  )
}
