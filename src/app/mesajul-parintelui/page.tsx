import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { buildAlternates } from '@/lib/i18n/alternates'
import ShareButtons from '@/components/shared/ShareButtons'
import { FALLBACK_SEMNATURA, messageDescription, messageToHtml } from '@/lib/priestMessage'
import { SITE_URL } from '@/lib/site'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import PriestMessageLetter from '@/components/homepage/PriestMessageLetter'

export const dynamic = 'force-dynamic'

const SHARE_URL = `${SITE_URL}/mesajul-parintelui`
const SHARE_TEXT = 'Mesajul Părintelui Marin Grigoriță, Parohul Bisericii Sfântul Ierarh Nicolae din Hîrtopul Mic'

export async function generateMetadata(): Promise<Metadata> {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })
  const description = messageDescription(mesaj?.mesajRo, 160)

  return {
    title: 'Mesajul Părintelui | Sf. Nicolae Hîrtopul Mic',
    description,
    alternates: buildAlternates('/mesajul-parintelui'),
    openGraph: {
      title: 'Mesajul Părintelui',
      description,
      type: 'article',
      url: '/mesajul-parintelui',
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      ...(mesaj?.photoUrl ? { images: [{ url: mesaj.photoUrl }] } : {}),
    },
  }
}

export default async function MesajulParinteluiPage() {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })

  const html = messageToHtml(mesaj?.mesajRo)
  const semnatura = mesaj?.semnaturaRo || FALLBACK_SEMNATURA
  const updatedAt = mesaj ? mesaj.updatedAt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <PageShell aside="compact">
      <PageHead crumbs={[{ href: '/', label: 'Acasă' }, { label: 'Mesajul Părintelui' }]} title="Mesajul Părintelui" />
      <PriestMessageLetter html={html} signature={semnatura} updatedLabel={updatedAt ? `Actualizat la ${updatedAt}` : null} />
      <div className="card flex flex-wrap items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
        <Link href="/" className="link-gold text-[17px]">← Înapoi</Link>
        <ShareButtons url={SHARE_URL} title={SHARE_TEXT} />
      </div>
    </PageShell>
  )
}
