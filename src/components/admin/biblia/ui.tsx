import Link from 'next/link'

const serif = 'Georgia, serif'

export const ui = {
  h1: { color: '#C9A84C', fontFamily: serif, fontSize: '1.5rem', margin: '0 0 1rem' },
  h2: { color: '#C9A84C', fontFamily: serif, fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' },
  text: { color: '#F2EBD9', fontFamily: serif, lineHeight: 1.6 },
  muted: { color: '#B39A68', fontFamily: serif, fontSize: '0.875rem', lineHeight: 1.5 },
  label: { display: 'block', color: '#B39A68', fontSize: '0.875rem', marginBottom: '0.35rem', fontFamily: serif },
  input: { width: '100%', backgroundColor: '#1A1008', border: '1px solid #5A4020', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '1rem', fontFamily: serif, boxSizing: 'border-box', minHeight: '44px' },
  verseInput: { width: '100%', backgroundColor: '#1A1008', border: '1px solid #5A4020', borderRadius: '4px', padding: '0.75rem', color: '#F2EBD9', fontSize: '1.25rem', lineHeight: 1.6, fontFamily: serif, boxSizing: 'border-box', resize: 'vertical' },
  button: { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: serif, fontSize: '0.95rem', cursor: 'pointer', minHeight: '44px' },
  ghost: { display: 'inline-flex', alignItems: 'center', backgroundColor: 'transparent', color: '#C9A84C', border: '1px solid #5A4020', borderRadius: '4px', padding: '0.5rem 1rem', fontFamily: serif, fontSize: '0.95rem', cursor: 'pointer', minHeight: '44px', boxSizing: 'border-box' },
  card: { backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '6px', padding: '0.875rem 1rem' },
  ok: { color: '#6FD86F', fontFamily: serif, fontSize: '0.9rem' },
  error: { color: '#F08A8A', fontFamily: serif, fontSize: '0.9rem' },
  warn: { color: '#E8B04A', fontFamily: serif, fontSize: '0.875rem' },
  mark: { backgroundColor: '#6B4A10', color: '#FFF4D6', padding: '0 2px', borderRadius: '2px' },
} satisfies Record<string, React.CSSProperties>

export interface Crumb { href?: string; label: string }

/** Firimiturile și legăturile comune ale secțiunii Biblia. */
export function BibliaHeader({ crumbs }: { crumbs: Crumb[] }) {
  const tools = [
    { href: '/admin/biblia', label: 'Cărți' },
    { href: '/admin/biblia/cauta', label: 'Caută' },
    { href: '/admin/biblia/inlocuieste', label: 'Înlocuiește' },
    { href: '/admin/biblia/jurnal', label: 'Jurnal' },
  ]
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <nav aria-label="Firimituri" style={{ ...ui.muted, display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <Link href="/admin" style={{ color: '#B39A68' }}>Admin</Link>
        {crumbs.map(c => (
          <span key={c.label} style={{ display: 'flex', gap: '0.4rem' }}>
            <span aria-hidden="true">›</span>
            {c.href ? <Link href={c.href} style={{ color: '#B39A68' }}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </nav>
      <nav aria-label="Instrumente Biblia" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {tools.map(t => <Link key={t.href} href={t.href} style={ui.ghost}>{t.label}</Link>)}
      </nav>
    </div>
  )
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagini" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
      {page > 1 && <Link href={href(page - 1)} style={ui.ghost}>← Mai noi</Link>}
      <span style={ui.muted}>Pagina {page} din {pages}</span>
      {page < pages && <Link href={href(page + 1)} style={ui.ghost}>Mai vechi →</Link>}
    </nav>
  )
}

/** Numărul paginii din `?page=`: orice valoare greșită devine 1. */
export function pageParam(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(n) && n > 0 && n < 1_000_000 ? n : 1
}
