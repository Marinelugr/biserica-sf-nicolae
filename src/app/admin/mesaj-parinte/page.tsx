'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'
import { firstSentences, FALLBACK_SEMNATURA } from '@/lib/priestMessage'

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

function PreviewModal({ form, onClose }: { form: MesajForm; onClose: () => void }) {
  const semnatura = form.semnaturaRo.trim() || FALLBACK_SEMNATURA
  const excerpt = firstSentences(form.mesajRo, 2) + '…'

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>👁️ Previzualizare</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {!form.active && (
            <div style={{ backgroundColor: '#2A1A05', border: '1px solid #5A3A10', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#D4A847', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
              ⚠️ Mesajul e Inactiv — pe site se va afișa mesajul implicit (fallback), nu acesta.
            </div>
          )}

          {/* ── Homepage ── */}
          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pe homepage</div>
          <div style={{ backgroundColor: '#f0ebe2', borderRadius: '6px', padding: '1.75rem 1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: form.photoUrl ? 'row' : 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
              {form.photoUrl && (
                <img src={form.photoUrl} alt="" style={{ width: '100px', height: '130px', borderRadius: '8px', border: '1px solid #C9A96E', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3A2A10', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>{excerpt}</p>
                <p style={{ fontFamily: 'Georgia, serif', color: '#C9A96E', fontSize: '0.85rem' }}>— {semnatura}</p>
                <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: '#8A7050' }}>Citește mesajul complet →</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Pagina proprie ── */}
          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pe pagina /mesajul-parintelui</div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', padding: '1.75rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: form.photoUrl ? 'row' : 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
              {form.photoUrl && (
                <img src={form.photoUrl} alt="" style={{ width: '140px', aspectRatio: '3/4', borderRadius: '8px', border: '1px solid #C9A96E', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3A2A10', fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{form.mesajRo}</p>
                <p style={{ fontFamily: 'Georgia, serif', color: '#C9A96E', fontSize: '0.9rem', marginTop: '1.25rem' }}>— {semnatura}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Închide</button>
        </div>
      </div>
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
  const [showPreview, setShowPreview] = useState(false)
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
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Eroare DeepL (cod ${res.status})`) }
      const data = await res.json()
      const lang = String(field).endsWith('Ru') ? 'ru' : 'en'
      set(field, data.translations[lang])
      showToast('Tradus cu DeepL ✓', 'success')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Eroare la traducere DeepL', 'error') }
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

        <main style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }} className="p-4 sm:px-8 sm:py-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>✉️ Mesajul Părintelui</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/mesajul-parintelui" target="_blank" style={{ ...btnGhost }}>↗ Vizualizează pagina</a>
              <button onClick={() => setShowPreview(true)} disabled={!form.mesajRo.trim()} style={{ ...btnGhost, opacity: form.mesajRo.trim() ? 1 : 0.5 }}>👁️ Previzualizare</button>
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
      {showPreview && <PreviewModal form={form} onClose={() => setShowPreview(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
