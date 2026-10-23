import { prisma } from '@/lib/prisma'
import { getServerT } from '@/lib/i18n/server'
import { FALLBACK_SEMNATURA, messageExcerptHtml } from '@/lib/priestMessage'
import PriestMessageCard from './PriestMessageCard'

/** „Cuvântul Părintelui" pe prima pagină: extrasul formatat din mesajul activ (singura apariție a mesajului aici). */
export default async function PriestMessageSection() {
  const [mesaj, t] = await Promise.all([
    prisma.priestMessage.findFirst({ where: { active: true } }),
    getServerT(),
  ])

  const { html, truncated } = messageExcerptHtml(mesaj?.mesajRo)

  return (
    <PriestMessageCard
      html={html}
      truncated={truncated}
      signature={mesaj?.semnaturaRo || FALLBACK_SEMNATURA}
      kicker={t.shell.kindWord}
      author={t.shell.brand}
      readMoreLabel={t.shell.readFullMessage}
    />
  )
}
