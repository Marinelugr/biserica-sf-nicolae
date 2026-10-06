import Link from 'next/link'

interface Crumb { href?: string; label: string }

interface Props {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  lead?: React.ReactNode
  crumbs?: Crumb[]
  children?: React.ReactNode
  /** Titlul paginii e mai mic (articole, cărți) */
  size?: 'l' | 'm'
}

/** Antetul unei pagini în flux: firimituri, eyebrow, un singur h1, lead opțional. */
export default function PageHead({ eyebrow, title, lead, crumbs, children, size = 'l' }: Props) {
  return (
    <header className="card flex flex-col gap-3">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="text-[16px] mute">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-2 min-w-0">
                {i > 0 && <span aria-hidden="true" className="gold">›</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-gold transition-colors">{c.label}</Link>
                ) : (
                  <span aria-current="page" className="truncate max-w-[16rem] text-ink">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className={size === 'l' ? 'h-l' : 'h-m'} style={size === 'm' ? { fontSize: 'clamp(28px, 3.4vw, 40px)' } : undefined}>
        {title}
      </h1>
      {lead && <div className="lead" style={{ fontSize: 22 }}>{lead}</div>}
      {children}
    </header>
  )
}
