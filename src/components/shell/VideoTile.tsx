import Link from 'next/link'

interface Props {
  href: string
  title: string
  thumb: string | null
  external?: boolean
}

/** Card video din grilă: miniatură 16:9 rotunjită, buton `play` auriu, titlu. */
export default function VideoTile({ href, title, thumb, external }: Props) {
  const content = (
    <>
      <div
        className="media ph bg-cover bg-center"
        style={{ aspectRatio: '16 / 9', backgroundImage: thumb ? `url(${thumb})` : undefined }}
      >
        <span className="play sm" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
        </span>
      </div>
      <div className="body" style={{ padding: '14px 18px 18px' }}>
        <p className="text-[18px] leading-snug group-hover:text-gold transition-colors">{title}</p>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="news group" data-reveal>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className="news group" data-reveal>
      {content}
    </Link>
  )
}
