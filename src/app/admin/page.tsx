import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [articles, books, products, prayers] = await Promise.all([
    prisma.article.count({ where: { published: true } }),
    prisma.libraryBook.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.prayer.count(),
  ])

  const stats = [
    { label: 'Articole publicate', value: articles, color: '#8B1A1A', href: '/admin/stiri' },
    { label: 'Cărți în bibliotecă', value: books, color: '#5A4020', href: '/admin/carti' },
    { label: 'Produse în magazin', value: products, color: '#1A4A2A', href: '/admin/magazin' },
    { label: 'Rugăciuni', value: prayers, color: '#1A2A5A', href: '/admin/carti' },
  ]

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          backgroundColor: '#0A0704',
          borderBottom: '1px solid #1E1208',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.5rem' }}>☦</span>
            <span style={{ color: '#C9A84C', fontSize: '1.05rem', fontFamily: 'Georgia, serif' }}>
              Admin — Sfântul Ierarh Nicolae
            </span>
          </div>
          <AdminSignOutButton />
        </header>

        <main style={{ flex: 1, padding: '2rem' }}>
          <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.75rem', marginBottom: '1.75rem', marginTop: 0 }}>
            Dashboard
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {stats.map(stat => (
              <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: '#110C07',
                  border: '1px solid #2A1A0A',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  borderTop: `3px solid ${stat.color}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ color: '#9B8050', fontSize: '0.8rem', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
                    {stat.label}
                  </div>
                  <div style={{ color: '#F2EBD9', fontSize: '2.5rem', fontFamily: 'Georgia, serif', fontWeight: 600, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ color: '#9B8050', fontSize: '0.8rem', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
              Vizitatori (placeholder)
            </div>
            <div style={{ color: '#5A4020', fontSize: '0.9rem', fontFamily: 'Georgia, serif' }}>
              Statistici Google Analytics disponibile în curând.
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
