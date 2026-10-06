import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerT } from '@/lib/i18n/server'
import { FALLBACK_MESAJ, FALLBACK_SEMNATURA, firstSentences } from '@/lib/priestMessage'
import FeedCard from '@/components/shell/FeedCard'

/** Postarea-citat „Cuvântul părintelui" (primele două propoziții din mesajul activ). */
export default async function PriestMessageSection() {
  const [mesaj, t] = await Promise.all([
    prisma.priestMessage.findFirst({ where: { active: true } }),
    getServerT(),
  ])

  const mesajText = mesaj?.mesajRo || FALLBACK_MESAJ
  const semnatura = mesaj?.semnaturaRo || FALLBACK_SEMNATURA
  const excerpt = firstSentences(mesajText, 2) + '…'

  return (
    <FeedCard kind="cuvant" kicker={t.shell.kindWord} author={t.shell.brand}>
      <figure className="flex flex-col gap-3">
        <blockquote className="lead" style={{ fontSize: 25 }}>
          <p>„{excerpt}”</p>
        </blockquote>
        <figcaption className="gold text-[17px]">— {semnatura}</figcaption>
      </figure>
      <Link href="/mesajul-parintelui" className="link-gold inline-block mt-3 text-[17px]">
        {t.shell.readFullMessage}
      </Link>
    </FeedCard>
  )
}
