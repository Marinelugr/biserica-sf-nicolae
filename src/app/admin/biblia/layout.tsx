import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

export const metadata: Metadata = {
  title: 'Biblia — Admin',
  robots: { index: false, follow: false },
}

// Fără verificare aici: fiecare pagină, acțiune și export își verifică singure accesul.
export default function AdminBibliaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1E1208', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '0.75rem' }}>
          <span style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'Georgia, serif' }}>☦ Admin — Biblia</span>
          <AdminSignOutButton />
        </header>
        <main style={{ flex: 1, boxSizing: 'border-box', minWidth: 0 }} className="p-4 sm:px-8 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
