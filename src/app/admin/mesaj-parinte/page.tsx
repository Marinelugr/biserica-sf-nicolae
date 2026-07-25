'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnGold: React.CSSProperties = { backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.5rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }
const sectionBox: React.CSSProperties = { backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }
const sectionTitle: React.CSSProperties = { color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E1208' }
const textarea: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: '140px', lineHeight: 1.6 }

interface MesajForm {
  id: string | null
  photoUrl: string
  mesajRo: string
  mesajRu: string
  mesajEn: string
  semnaturaRo: string
  active: boolean
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

const empty: MesajForm = {
  id: null, photoUrl: '', mesajRo: '', mesajRu: '', mesajEn: '',
  semnaturaRo: 'Pr. Marin Grigoriță, Parohul Bisericii', active: true,
}

export default function AdminMesajParintePage() {
  const [form, setForm] = useState<MesajForm>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  async function translateField(sourceText: string, field: keyof MesajForm) {
    if (!sourceText.trim()) { showToast('Completați mai întâi câmpul în română', 'error'); return }
    setTranslating(t => ({ ...t, [field]: true }))
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, field }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lang = String(field).endsWith('Ru') ? 'ru' : 'en'
      set(field, data.translations[lang])
      showToast('Tradus cu DeepL ✓', 'success')
    } catch { showToast('Eroare la traducere DeepL', 'error') }
    finally { setTranslating(t => ({ ...t, [field]: false })) }
  }

  useEffect(() => {
    fetch('/api/admin/mesaj-parinte')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            id: data.id || null,
            photoUrl: data.photoUrl || '',
            mesajRo: data.mesajRo || '',
            mesajRu: data.mesajRu || '',
            mesajEn: data.mesajEn || '',
            semnaturaRo: data.semnaturaRo || 'Pr. Marin Grigoriță, Parohul Bisericii',
            active: data.active ?? true,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!form.mesajRo.trim()) {
      showToast('Mesajul (Română) este obligatoriu', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/mesaj-parinte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      const data = await res.json()
      setForm(f => ({ ...f, id: data.id }))
      showToast('Date salvate cu succes ✓', 'success')
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  const set = (key: keyof MesajForm, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }))
  }

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1E1208', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.4rem' }}>☦</span>
            <span style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'Georgia, serif' }}>Admin — Sfântul Ierarh Nicolae</span>
          </div>
          <AdminSignOutButton />
        </header>

        <div style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1A1008', padding: '0.4rem 2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/admin" style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textDecoration: 'none' }}>Admin</a>
          <span style={{ color: '#2A1A0A' }}>›</span>
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Mesajul Părintelui</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>✉️ Mesajul Părintelui</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/mesajul-parintelui" target="_blank" style={{ ...btnGhost }}>↗ Vizualizează pagina</a>
              <button onClick={handleSave} disabled={saving || loading} style={{ ...btnGold, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <>
              {/* ─── Fotografie ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📸 Fotografia</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>URL fotografie</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="https://..." style={{ ...inp, flex: 1 }} />
                      <ImageUploadButton onUpload={url => set('photoUrl', url)} label="Încarcă foto" />
                    </div>
                  </div>
                  {form.photoUrl && (
                    <div style={{ flexShrink: 0, width: '80px', height: '104px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #C9A84C' }}>
                      <img src={form.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Mesaj RO ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>✉️ Mesajul (Română) *</div>
                <textarea value={form.mesajRo} onChange={e => set('mesajRo', e.target.value)} placeholder="Bine ați venit la pagina oficială a bisericii..." style={textarea} />
              </div>

              {/* ─── Mesaj RU ─── */}
              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✉️ Mesajul (Rusă)</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {!form.mesajRu && <span style={{ fontSize: '0.75rem', color: '#8B6014' }}>⚠️ Lipsă</span>}
                    {form.mesajRu && <span style={{ fontSize: '0.75rem', color: '#5A9050' }}>🤖 DeepL</span>}
                    <button onClick={() => translateField(form.mesajRo, 'mesajRu')} disabled={translating['mesajRu']} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                      {translating['mesajRu'] ? 'Se traduce...' : '🔄 Traduce RU'}
                    </button>
                  </div>
                </div>
                <textarea value={form.mesajRu} onChange={e => set('mesajRu', e.target.value)} placeholder="Добро пожаловать..." style={textarea} />
              </div>

              {/* ─── Mesaj EN ─── */}
              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✉️ Mesajul (Engleză)</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {!form.mesajEn && <span style={{ fontSize: '0.75rem', color: '#8B6014' }}>⚠️ Lipsă</span>}
                    {form.mesajEn && <span style={{ fontSize: '0.75rem', color: '#5A9050' }}>🤖 DeepL</span>}
                    <button onClick={() => translateField(form.mesajRo, 'mesajEn')} disabled={translating['mesajEn']} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                      {translating['mesajEn'] ? 'Se traduce...' : '🔄 Traduce EN'}
                    </button>
                  </div>
                </div>
                <textarea value={form.mesajEn} onChange={e => set('mesajEn', e.target.value)} placeholder="Welcome to the official page..." style={textarea} />
              </div>

              {/* ─── Semnătură + Activ ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>✍️ Semnătură și vizibilitate</div>
                <div style={{ display: 'grid', gap: '1.1rem' }}>
                  <div>
                    <label style={lbl}>Semnătură (Română)</label>
                    <input value={form.semnaturaRo} onChange={e => set('semnaturaRo', e.target.value)} placeholder="Pr. Marin Grigoriță, Parohul Bisericii" style={inp} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                    <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>
                      Activ — {form.active ? 'vizibil pe homepage și pe pagina proprie' : 'ascuns (revine fallback-ul implicit)'}
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
                <button onClick={handleSave} disabled={saving} style={{ ...btnGold, opacity: saving ? 0.7 : 1, fontSize: '1rem', padding: '0.625rem 2rem' }}>
                  {saving ? 'Se salvează...' : '💾 Salvează'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
