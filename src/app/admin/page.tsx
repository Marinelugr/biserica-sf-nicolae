import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [articles, books, products, prayers, topArticles, topVideos, topBooks] = await Promise.all([
    prisma.article.count({ where: { published: true } }),
    prisma.libraryBook.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.prayer.count(),
    prisma.article.findMany({ orderBy: { views: 'desc' }, take: 5, select: { id: true, titleRo: true, slug: true, views: true } }),
    prisma.video.findMany({ orderBy: { views: 'desc' }, take: 5, select: { id: true, title: true, slug: true, views: true, category: { select: { slug: true } } } }),
    prisma.libraryBook.findMany({ orderBy: { views: 'desc' }, take: 5, select: { id: true, titleRo: true, slug: true, views: true } }),
  ])

  const stats = [
    { label: 'Articole publicate', value: articles, color: '#8B1A1A', href: '/admin/stiri' },
    { label: 'Cărți în bibliotecă', value: books, color: '#5A4020', href: '/admin/carti' },
    { label: 'Produse în magazin', value: products, color: '#1A4A2A', href: '/admin/magazin' },
    { label: 'Rugăciuni', value: prayers, color: '#1A2A5A', href: '/admin/carti' },
  ]

  const mostViewed = [
    ...topArticles.map(a => ({ id: a.id, title: a.titleRo, views: a.views, href: `/stiri/${a.slug}`, type: 'Articol' })),
    ...topVideos.map(v => ({ id: v.id, title: v.title, views: v.views, href: v.category ? `/video/${v.category.slug}/${v.slug}` : '/video', type: 'Video' })),
    ...topBooks.map(b => ({ id: b.id, title: b.titleRo, views: b.views, href: `/carti/${b.slug}`, type: 'Carte' })),
  ]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

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

          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ color: '#9B8050', fontSize: '0.8rem', fontFamily: 'Georgia, serif', marginBottom: '1rem' }}>
              Cele mai vizionate
            </div>
            {mostViewed.length === 0 ? (
              <div style={{ color: '#5A4020', fontSize: '0.9rem', fontFamily: 'Georgia, serif' }}>
                Nu există încă vizualizări înregistrate.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mostViewed.map((item, i) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        textDecoration: 'none', color: '#F2EBD9',
                        paddingBottom: i < mostViewed.length - 1 ? '0.75rem' : 0,
                        borderBottom: i < mostViewed.length - 1 ? '1px solid #1E1208' : 'none',
                      }}
                    >
                      <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.85rem', width: '1.25rem', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px',
                        padding: '0.15rem 0.4rem', flexShrink: 0,
                      }}>
                        {item.type}
                      </span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                      <span style={{ color: '#C9A84C', fontSize: '0.85rem', fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                        {item.views.toLocaleString('ro-RO')} vizualizări
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
