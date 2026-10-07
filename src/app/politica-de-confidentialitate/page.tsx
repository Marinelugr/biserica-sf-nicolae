import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'
import { buildAlternates } from '@/lib/i18n/alternates'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

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
    <PageShell aside="compact">
      <PageHead title={p.title}>
        <p className="mute text-[16px]">{p.lastUpdated}</p>
      </PageHead>
      <article className="card">
        <div className="reading flex flex-col gap-8">
          <p>{p.intro}</p>
          {p.sections.map((section, i) => (
            <section key={i}>
              <h2 className="h-s mb-2">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  )
}
