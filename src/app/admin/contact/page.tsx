'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import type { ContactInfo } from '@/lib/contact-info'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

const EMPTY: ContactInfo = {
  phone: '', email: '', address: '', facebook: '', schedule: '', message: '', mapEmbed: '',
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.625rem 0.875rem', color: '#F2EBD9', fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.875rem', marginBottom: '0.375rem', fontFamily: 'Georgia, serif' }

export default function AdminContactPage() {
  const [form, setForm] = useState<ContactInfo>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/contact')
      .then(res => res.json())
      .then(data => setForm(data))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof ContactInfo>(field: K, value: ContactInfo[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast('Datele de contact au fost salvate ✓', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1E1208', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.4rem' }}>☦</span>
            <span style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'Georgia, serif' }}>Admin — Date de contact</span>
          </div>
          <AdminSignOutButton />
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '760px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Telefon</label>
                  <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+373 67 306 191" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="text" value={form.email} onChange={e => set('email', e.target.value)} placeholder="parinte.marin@biserica-sf-nicolae.org" style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Adresă</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3} placeholder="Hîrtopul Mic&#10;Raionul Criuleni&#10;Republica Moldova" style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div>
                <label style={lbl}>Facebook URL</label>
                <input type="text" value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="https://www.facebook.com/..." style={inp} />
              </div>

              <div>
                <label style={lbl}>Program slujbe (rezumat)</label>
                <textarea value={form.schedule} onChange={e => set('schedule', e.target.value)} rows={4} placeholder={'Duminică - 09:00 - Sfânta Liturghie'} style={{ ...inp, resize: 'vertical' }} />
                <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', display: 'block', marginTop: '0.35rem' }}>
                  O linie pe fiecare intrare: Zi - Oră - Denumire slujbă.
                </span>
              </div>

              <div>
                <label style={lbl}>Coordonate Google Maps (embed URL)</label>
                <input type="text" value={form.mapEmbed} onChange={e => set('mapEmbed', e.target.value)} placeholder="https://www.google.com/maps?q=...&output=embed" style={inp} />
              </div>

              <div>
                <label style={lbl}>Mesaj pe pagina /contact (opțional)</label>
                <TipTapEditor value={form.message} onChange={v => set('message', v)} placeholder="Un mesaj de bun venit pentru vizitatorii paginii de contact..." />
              </div>

              <div>
                <button onClick={handleSave} disabled={saving} style={{
                  backgroundColor: saving ? '#5A1010' : '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px',
                  padding: '0.75rem 2rem', fontSize: '1rem', fontFamily: 'Georgia, serif', cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Se salvează...' : 'Salvează'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
