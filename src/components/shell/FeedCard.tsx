import type { SecId } from '@/lib/sectionTheme'
import { SEC_ICON } from '@/lib/sectionTheme'
import { SectionMedal } from './SectionIcon'

export type FeedKind = 'cuvant' | 'video' | 'parohie' | 'biblioteca'

interface Props {
  /** Pentru filtrele din flux (`data-kind`). */
  kind: FeedKind
  /** Identitatea vizuală (`data-sec`, vezi src/app/sections.css). */
  sec: SecId
  /** Titlul secțiunii din antet (ex. „Video", „Cuvântul părintelui"). */
  kicker: string
  /** Numele autorului — se afișează doar la `cuvant` (sau cu `showAuthor`). */
  author?: string
  showAuthor?: boolean
  children: React.ReactNode
  /** Fără antet (medalion + titlu). */
  bare?: boolean
  flush?: boolean
  className?: string
  style?: React.CSSProperties
}

/** O postare din flux: antet cu medalionul secțiunii + titlul ei, în culoarea accentului. */
export default function FeedCard({ kind, sec, kicker, author, showAuthor = sec === 'cuvant', children, bare, flush, className = '', style }: Props) {
  return (
    <article
      className={`card ${flush ? 'flush' : ''} ${className}`}
      style={flush ? style : { padding: '22px 24px', ...style }}
      data-kind={kind}
      data-sec={sec}
      data-reveal
    >
      {!bare && (
        <header className="sec-top" style={flush ? { padding: '18px 24px 14px', marginBottom: 0 } : undefined}>
          <SectionMedal name={SEC_ICON[sec]} />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="sec-kicker">{kicker}</span>
            {showAuthor && author && <span className="sec-author">{author}</span>}
          </div>
          <span className="sec-rule" aria-hidden="true" />
        </header>
      )}
      {children}
    </article>
  )
}
