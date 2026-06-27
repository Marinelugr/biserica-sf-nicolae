'use client'

import { signOut } from 'next-auth/react'

export default function AdminSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      style={{
        backgroundColor: 'transparent',
        border: '1px solid #3A1A0A',
        color: '#9B8050',
        padding: '0.375rem 0.875rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontFamily: 'Georgia, serif',
        cursor: 'pointer',
      }}
    >
      Deconectare
    </button>
  )
}
