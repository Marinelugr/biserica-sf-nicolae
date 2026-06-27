import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Donații — Susțineți lucrările Bisericii',
  description:
    'Susține Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Criuleni. Donații pentru renovarea acoperișului, turnului clopotniță, pictura interiorului și alte lucrări.',
}

const donationProjects = [
  {
    title: 'Renovarea acoperișului',
    description: 'Înlocuirea completă a acoperișului bisericii cu materiale durabile, pentru protejarea lăcașului sfânt.',
    progress: 35,
    target: '150,000 MDL',
  },
  {
    title: 'Renovarea turnului clopotniță',
    description: 'Restaurarea și consolidarea turnului clopotniță, element central al arhitecturii parohiei.',
    progress: 20,
    target: '80,000 MDL',
  },
  {
    title: 'Pictarea interiorului',
    description: 'Realizarea picturii murale ortodoxe în interiorul bisericii, conform canoanelor bizantine.',
    progress: 10,
    target: '300,000 MDL',
  },
  {
    title: 'Lucrări electrice',
    description: 'Modernizarea instalației electrice și iluminatul arhitectural al iconostasului și naosului.',
    progress: 60,
    target: '45,000 MDL',
  },
  {
    title: 'Automatizarea clopotelor',
    description: 'Sistem electronic de automatizare a clopotelor pentru chemarea credincioșilor la slujbe. (planificat)',
    progress: 0,
    target: '25,000 MDL',
  },
]

export default async function DonationsPage() {
  const t = await getServerT()

  const donationMethods = [
    {
      title: t.donate.bankTransfer,
      icon: '🏦',
      details: [
        { label: 'Beneficiar', value: 'Parohia Sfântul Ierarh Nicolae' },
        { label: 'Banca', value: 'Moldova Agroindbank (MAIB)' },
        { label: 'IBAN', value: 'MD00 AGRNMD0X0000000000000', mono: true },
        { label: 'Cod SWIFT', value: 'AGRНMD22', mono: true },
        { label: 'Monedă', value: 'MDL' },
        { label: 'Mențiunea plății', value: 'Donație — Parohia Sf. Nicolae, Hîrtopul Mic', italic: true },
      ],
    },
    {
      title: 'PayPal',
      icon: '💳',
      details: [
        { label: 'Adresă PayPal', value: 'donatii@biserica-sf-nicolae.org' },
        { label: 'Notă', value: 'Includeți în mesaj: Donație Parohia Hîrtopul Mic', italic: true },
      ],
    },
    {
      title: 'Western Union / MoneyGram',
      icon: '🌐',
      details: [
        { label: 'Beneficiar', value: 'Parohia Sfântul Ierarh Nicolae' },
        { label: 'Localitate', value: 'Hîrtopul Mic, Raionul Criuleni, Moldova' },
        { label: 'Detalii', value: 'Contactați parohia pentru informații complete', italic: true },
      ],
    },
    {
      title: t.donate.directDonation,
      icon: '⛪',
      details: [
        { label: 'Adresă', value: 'Hîrtopul Mic, Raionul Criuleni, Republica Moldova' },
        { label: 'Program', value: 'Duminică 09:00–12:00, Sâmbătă 17:00–19:00' },
        { label: 'Contact', value: 'Preoți sau membrii consiliului parohial' },
      ],
    },
  ]

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
        <section className="mb-16">
          <h2 className="font-heading text-3xl mb-2 text-center" style={{ color: '#1C1B3A' }}>
            {t.donate.projectsTitle}
          </h2>
          <p className="font-body text-sm text-center mb-10" style={{ color: '#8A7050' }}>
            {t.donate.projectsSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationProjects.map((project) => (
              <div
                key={project.title}
                className="rounded-lg p-6 flex flex-col"
                style={{ backgroundColor: '#FAFAF8', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <h3 className="font-heading text-lg mb-2" style={{ color: '#1C1B3A' }}>
                  {project.title}
                </h3>
                <p className="font-body text-sm leading-relaxed mb-4 flex-1" style={{ color: '#6A5030' }}>
                  {project.description}
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

        {/* Modalități de donație */}
        <section className="mb-16">
          <h2 className="font-heading text-3xl mb-2 text-center" style={{ color: '#1C1B3A' }}>
            {t.donate.methodsTitle}
          </h2>
          <p className="font-body text-sm text-center mb-10" style={{ color: '#8A7050' }}>
            {t.donate.methodsSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {donationMethods.map((method) => (
              <div
                key={method.title}
                className="rounded-lg p-6"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl" aria-hidden="true">{method.icon}</span>
                  <h3 className="font-heading text-xl" style={{ color: '#1C1B3A' }}>
                    {method.title}
                  </h3>
                </div>
                <dl className="space-y-2">
                  {method.details.map((d) => (
                    <div key={d.label} className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="font-body text-xs uppercase tracking-wide shrink-0" style={{ color: '#8A7050', minWidth: '130px' }}>
                        {d.label}
                      </dt>
                      <dd
                        className={`font-body text-sm ${d.mono ? 'font-mono tracking-wider' : ''} ${d.italic ? 'italic' : ''}`}
                        style={{ color: '#3A1A1A' }}
                      >
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
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
