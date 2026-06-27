'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '🏠 Pagina principală', exact: true },
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/stiri', label: '📰 Știri și articole' },
  { href: '/admin/carti', label: '📖 Bibliotecă' },
  { href: '/admin/slujbe', label: '🗓️ Slujbe' },
  { href: '/admin/sfinti', label: '👤 Sfinți' },
  { href: '/admin/video', label: '🎬 Video' },
  { href: '/admin/magazin', label: '🛒 Magazin' },
  { href: '/admin/donatii', label: '💰 Donații' },
  { href: '/admin/media', label: '🖼️ Media' },
  { href: '/admin/setari', label: '⚙️ Setări' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '230px',
      minHeight: '100vh',
      backgroundColor: '#0A0704',
      borderRight: '1px solid #1E1208',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid #1E1208' }}>
        <div style={{ fontSize: '1.75rem', color: '#C9A84C', lineHeight: 1 }}>☦</div>
        <div style={{ color: '#C9A84C', fontSize: '0.875rem', fontFamily: 'Georgia, serif', fontWeight: 600, marginTop: '0.5rem' }}>
          Admin Panel
        </div>
      </div>

      <nav style={{ padding: '0.75rem 0' }}>
        {links.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'block',
                padding: '0.5rem 1.25rem',
                color: isActive ? '#C9A84C' : '#9B8050',
                backgroundColor: isActive ? '#1A1008' : 'transparent',
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
                fontSize: '0.875rem',
                fontFamily: 'Georgia, serif',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
