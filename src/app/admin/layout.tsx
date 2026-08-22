import AdminMobileNav from '@/components/admin/AdminMobileNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0D0905',
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AdminMobileNav />
      {children}
    </div>
  )
}
