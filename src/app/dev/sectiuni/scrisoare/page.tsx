import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { messageToHtml } from '@/lib/priestMessage'
import { MESAJ_VECHI } from '@/lib/fixtures/mesajVechi'
import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import PriestMessageLetter from '@/components/homepage/PriestMessageLetter'

/*
 * Aceeași compoziție ca /mesajul-parintelui, cu mesajul real vechi (text cu `**`)
 * în loc de baza de date — doar în dezvoltare. În producție: 404.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scrisoarea Părintelui (dezvoltare)',
  robots: { index: false, follow: false },
}

export default function ScrisoareGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <PageShell aside="compact">
      <PageHead sec="cuvant" crumbs={[{ href: '/', label: 'Acasă' }, { label: 'Mesajul Părintelui' }]} title="Mesajul Părintelui" />
      <PriestMessageLetter html={messageToHtml(MESAJ_VECHI)} signature="Pr. Marin Grigoriță, Parohul Bisericii" updatedLabel="Actualizat la 23 octombrie 2026" />
    </PageShell>
  )
}
