import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { buildAlternates } from '@/lib/i18n/alternates'
import ShareButtons from '@/components/shared/ShareButtons'
import { FALLBACK_MESAJ, FALLBACK_SEMNATURA } from '@/lib/priestMessage'
import { SITE_URL } from '@/lib/site'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

export const dynamic = 'force-dynamic'

const SHARE_URL = `${SITE_URL}/mesajul-parintelui`
const SHARE_TEXT = 'Mesajul Părintelui Marin Grigoriță, Parohul Bisericii Sfântul Ierarh Nicolae din Hîrtopul Mic'

export async function generateMetadata(): Promise<Metadata> {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })
  const mesajRo = mesaj?.mesajRo || FALLBACK_MESAJ
  const description = mesajRo.slice(0, 160)

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

  const mesajText = mesaj?.mesajRo || FALLBACK_MESAJ
  const semnatura = mesaj?.semnaturaRo || FALLBACK_SEMNATURA
  const updatedAt = mesaj ? mesaj.updatedAt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <PageShell aside="compact">
      <PageHead crumbs={[{ href: '/', label: 'Acasă' }, { label: 'Mesajul Părintelui' }]} title="Mesajul Părintelui" />
      <article className="card">
        <figure className="flex flex-col gap-5">
          <blockquote className="lead reading" style={{ fontSize: 'clamp(23px, 2.4vw, 27px)', maxWidth: '62ch', whiteSpace: 'pre-line' }}>
            {mesajText}
          </blockquote>
          <figcaption>
            <p className="gold text-[19px]">— {semnatura}</p>
            {updatedAt && <p className="mute text-[16px] mt-1">Actualizat la {updatedAt}</p>}
          </figcaption>
        </figure>
      </article>
      <div className="card flex flex-wrap items-center justify-between gap-4" style={{ padding: '20px 24px' }}>
        <Link href="/" className="link-gold text-[17px]">← Înapoi</Link>
        <ShareButtons url={SHARE_URL} title={SHARE_TEXT} />
      </div>
    </PageShell>
  )
}
