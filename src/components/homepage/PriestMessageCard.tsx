import Link from 'next/link'
import FeedCard from '@/components/shell/FeedCard'

interface Props {
  /** Extrasul formatat (`messageExcerptHtml`). */
  html: string
  truncated: boolean
  signature: string
  kicker: string
  author: string
  readMoreLabel: string
  href?: string
}

/**
 * Cardul „Cuvântul Părintelui" de pe prima pagină — prezentare pură, folosită
 * și de previzualizarea din admin (aceleași clase, nimic duplicat).
 */
export default function PriestMessageCard({ html, truncated, signature, kicker, author, readMoreLabel, href = '/mesajul-parintelui' }: Props) {
  return (
    <FeedCard kind="cuvant" sec="cuvant" kicker={kicker} author={author}>
      <figure className="letter-card">
        <blockquote
          className={`rich letter excerpt${truncated ? ' is-truncated' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <figcaption className="letter-sign">— {signature}</figcaption>
      </figure>
      <Link href={href} className="btn letter-more">{readMoreLabel}</Link>
    </FeedCard>
  )
}
