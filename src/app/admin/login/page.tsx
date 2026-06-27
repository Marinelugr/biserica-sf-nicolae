'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setError('Email sau parolă incorectă.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#1A1008',
    border: '1px solid #2A1A0A',
    borderRadius: '4px',
    padding: '0.625rem 0.875rem',
    color: '#F2EBD9',
    fontSize: '1rem',
    fontFamily: 'Georgia, serif',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const lbl: React.CSSProperties = {
    display: 'block',
    color: '#9B8050',
    fontSize: '0.875rem',
    marginBottom: '0.375rem',
    fontFamily: 'Georgia, serif',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#110C07',
        border: '1px solid #2A1A0A',
        borderRadius: '8px',
        padding: '2.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', color: '#C9A84C', marginBottom: '0.5rem' }}>☦</div>
          <div style={{ color: '#C9A84C', fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Sfântul Ierarh Nicolae
          </div>
          <div style={{ color: '#5A4020', fontSize: '0.875rem', marginTop: '0.25rem', fontFamily: 'Georgia, serif' }}>
            Panou de Administrare
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>Parolă</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
          </div>

          {error && (
            <div style={{
              color: '#C06050',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#1A0808',
              borderRadius: '4px',
              border: '1px solid #3A1010',
              fontFamily: 'Georgia, serif',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#5A1010' : '#8B1A1A',
              color: '#F2EBD9',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem',
              fontSize: '1rem',
              fontFamily: 'Georgia, serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Se conectează...' : 'Intră în cont'}
          </button>
        </form>
      </div>
    </div>
  )
}
