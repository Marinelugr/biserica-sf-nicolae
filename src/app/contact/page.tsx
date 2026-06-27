import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactează Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Criuleni, Moldova. Formular de contact, adresă și program.',
}

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-14">
        <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: '#8A7050' }}>
          Suntem alături de voi
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: '#1C1B3A' }}>
          Contact
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* ─── Informații de contact ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#F8F7F5', border: '1px solid #E8E5E0' }}
          >
            <h2 className="font-heading text-xl mb-6" style={{ color: '#1C1B3A' }}>
              Parohia Sfântul Ierarh Nicolae
            </h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span style={{ color: '#C9A84C', marginTop: '2px' }} aria-hidden="true">✦</span>
                <div>
                  <p className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8A7050' }}>
                    Adresa
                  </p>
                  <p className="font-body text-sm" style={{ color: '#3A1A1A' }}>
                    Hîrtopul Mic<br />
                    Raionul Criuleni<br />
                    Republica Moldova
                  </p>
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: '#E8E5E0' }} />

              <div className="flex gap-3">
                <span style={{ color: '#C9A84C', marginTop: '2px' }} aria-hidden="true">✦</span>
                <div>
                  <p className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8A7050' }}>
                    Program slujbe
                  </p>
                  <p className="font-body text-sm" style={{ color: '#3A1A1A' }}>
                    Duminică — ora 9:00<br />
                    Sărbători — conform calendarului<br />
                    Miercuri & Vineri (post) — 17:00
                  </p>
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: '#E8E5E0' }} />

              <div className="flex gap-3">
                <span style={{ color: '#C9A84C', marginTop: '2px' }} aria-hidden="true">✦</span>
                <div>
                  <p className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#8A7050' }}>
                    Email
                  </p>
                  <a
                    href="mailto:inimaortodoxiei@gmail.com"
                    className="font-body text-sm hover:underline transition-colors"
                    style={{ color: '#C9A84C' }}
                  >
                    inimaortodoxiei@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Harta simplă — placeholder */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: '#F2EBD9', border: '1px solid #D4C8A0', height: '200px' }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span style={{ color: '#C9A84C', fontSize: '32px' }} aria-hidden="true">☦</span>
              <p className="font-body text-sm" style={{ color: '#8A7050' }}>
                Hîrtopul Mic, Criuleni, Moldova
              </p>
              <a
                href="https://maps.google.com/?q=Hirtopul+Mic+Criuleni+Moldova"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs px-4 py-1.5 rounded border transition-colors hover:bg-amber-900/10"
                style={{ borderColor: '#D4C8A0', color: '#8A7050' }}
              >
                Deschide în Google Maps →
              </a>
            </div>
          </div>
        </div>

        {/* ─── Formular contact ─── */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
