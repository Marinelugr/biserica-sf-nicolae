import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

export default async function AdminStiriPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, titleRo: true, slug: true, published: true, publishedAt: true, createdAt: true, category: true },
  })

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.75rem', margin: 0 }}>
              📰 Știri și articole
            </h1>
            <Link href="/admin/stiri/nou" style={{
              backgroundColor: '#8B1A1A',
              color: '#F2EBD9',
              padding: '0.5rem 1.25rem',
              borderRadius: '4px',
              fontFamily: 'Georgia, serif',
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}>
              + Articol nou
            </Link>
          </div>

          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
            {articles.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                Niciun articol. Creați primul articol.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A1A0A' }}>
                    {['Titlu', 'Categorie', 'Status', 'Data', 'Acțiuni'].map(h => (
                      <th key={h} style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        color: '#5A4020',
                        fontSize: '0.75rem',
                        fontFamily: 'Georgia, serif',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, i) => (
                    <tr key={article.id} style={{ borderBottom: i < articles.length - 1 ? '1px solid #1E1208' : 'none' }}>
                      <td style={{ padding: '0.875rem 1rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>
                        {article.titleRo}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                        {article.category || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'Georgia, serif',
                          backgroundColor: article.published ? '#0A2A0A' : '#1A1008',
                          color: article.published ? '#4A9A4A' : '#9B8050',
                          border: `1px solid ${article.published ? '#1A4A1A' : '#2A1A0A'}`,
                        }}>
                          {article.published ? 'Publicat' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                        {(article.publishedAt || article.createdAt).toLocaleDateString('ro-MD')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link href={`/admin/stiri/${article.id}`} style={{
                          color: '#C9A84C',
                          fontFamily: 'Georgia, serif',
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                        }}>
                          Editează
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
