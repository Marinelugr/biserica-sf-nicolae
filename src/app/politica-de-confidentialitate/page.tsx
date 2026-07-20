import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.politicaConfidentialitate.title,
    description: t.meta.politicaConfidentialitate.description,
    alternates: buildAlternates('/politica-de-confidentialitate'),
    robots: { index: true, follow: true },
  }
}

export default async function PoliticaConfidentialitatePage() {
  const t = await getServerT()
  const p = t.privacyPage

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-heading mb-3" style={{ color: '#1C1B3A', fontSize: 'clamp(36px, 5vw, 56px)' }}>
          {p.title}
        </h1>
        <p className="font-body text-sm" style={{ color: '#8A7050' }}>{p.lastUpdated}</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>
      </div>

      <p className="font-body text-lg leading-relaxed mb-12" style={{ color: '#3A1A1A' }}>
        {p.intro}
      </p>

      <div className="space-y-10">
        {p.sections.map((section, i) => (
          <section key={i}>
            <h2 className="font-heading text-xl mb-3" style={{ color: '#1C1B3A' }}>
              {section.title}
            </h2>
            <p className="font-body text-base leading-relaxed" style={{ color: '#3A1A1A' }}>
              {section.text}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
