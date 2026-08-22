'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_LINKS } from './adminLinks'

export default function AdminMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (pathname === '/admin/login') return null

  return (
    <div className="lg:hidden" style={{ flexShrink: 0 }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 140,
          backgroundColor: '#0A0704',
          borderBottom: '1px solid #1E1208',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.35rem', color: '#C9A84C', lineHeight: 1 }}>☦</span>
          <span style={{ color: '#C9A84C', fontSize: '0.9rem', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Admin Panel</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul admin"
          aria-expanded={open}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: '1px solid #2A1A0A',
            borderRadius: '8px',
            color: '#C9A84C',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: '#0A0704',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.5rem', color: '#C9A84C', lineHeight: 1 }}>☦</span>
              <span style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Admin Panel</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Închide meniul"
              style={{
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid #2A1A0A', borderRadius: '10px', color: '#9B8050', fontSize: '1.25rem', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <nav style={{ padding: '0.5rem 0' }}>
            {ADMIN_LINKS.map(link => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    padding: '0.75rem 1.25rem',
                    color: isActive ? '#C9A84C' : '#9B8050',
                    backgroundColor: isActive ? '#1A1008' : 'transparent',
                    borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
                    fontSize: '1rem',
                    fontFamily: 'Georgia, serif',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
