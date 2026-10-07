import Image from 'next/image'

export type FeedKind = 'cuvant' | 'video' | 'parohie' | 'biblioteca'

const KICKER_CLASS: Record<FeedKind, string> = {
  cuvant: 'kicker blue',
  video: 'kicker blue',
  parohie: 'kicker',
  biblioteca: 'kicker blue',
}

interface Props {
  kind: FeedKind
  /** Eticheta de sub numele autorului (ex. „Video", „Cuvântul părintelui"). */
  kicker: string
  author: string
  children: React.ReactNode
  /** Fără antet (siglă + autor) — pentru rândurile compacte de știri/bibliotecă. */
  bare?: boolean
  flush?: boolean
  className?: string
  style?: React.CSSProperties
}

/** O postare din flux: antet cu sigla + „Părintele Marin" + kicker colorat după tip. */
export default function FeedCard({ kind, kicker, author, children, bare, flush, className = '', style }: Props) {
  return (
    <article
      className={`card ${flush ? 'flush' : ''} ${className}`}
      style={flush ? style : { padding: '22px 24px', ...style }}
      data-kind={kind}
      data-reveal
    >
      {!bare && (
        <header className="flex items-center gap-3" style={flush ? { padding: '18px 24px' } : { marginBottom: 14 }}>
          <Image src="/logo-mark.png" alt="" width={17} height={36} style={{ height: 36, width: 'auto' }} />
          <div className="flex flex-col leading-tight">
            <span className="h-s" style={{ fontSize: 20 }}>{author}</span>
            <span className={KICKER_CLASS[kind]}>{kicker}</span>
          </div>
        </header>
      )}
      {children}
    </article>
  )
}
