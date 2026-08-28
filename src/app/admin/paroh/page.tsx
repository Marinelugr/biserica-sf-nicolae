'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'
import MediaGallery from '@/components/admin/MediaGallery'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnGold: React.CSSProperties = { backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.5rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }
const sectionBox: React.CSSProperties = { backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }
const sectionTitle: React.CSSProperties = { color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E1208' }

interface PriestForm {
  id: string | null
  nameRo: string
  titleRo: string
  photoUrl: string
  bioRo: string
  ordained: string
  parish: string
  education: string
  phone: string
  email: string
  facebook: string
  seoKeywords: string
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

const empty: PriestForm = {
  id: null, nameRo: '', titleRo: 'Preot Paroh',
  photoUrl: '', bioRo: '',
  ordained: '', parish: '',
  education: '', phone: '', email: '', facebook: '', seoKeywords: '',
}

const DRAFT_KEY = 'draft_paroh'

export default function AdminParohPage() {
  const [form, setForm] = useState<PriestForm>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  // Auto-save la 30 secunde
  useEffect(() => {
    if (!isDirty || loading) return
    const t = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, _savedAt: new Date().toISOString() }))
      setLastSaved(new Date())
      setIsDirty(false)
    }, 30000)
    return () => clearInterval(t)
  }, [isDirty, form, loading])

  useEffect(() => {
    // Verifică draft nesalvat
    const draftRaw = localStorage.getItem(DRAFT_KEY)
    if (draftRaw) {
      try {
        const parsed = JSON.parse(draftRaw) as PriestForm & { _savedAt: string }
        const time = new Date(parsed._savedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        if (confirm(`Există un draft nesalvat din ${time}. Restaurezi?`)) {
          const { _savedAt: _, ...rest } = parsed as PriestForm & { _savedAt: string }
          setForm(rest)
          setLoading(false)
          return
        }
        localStorage.removeItem(DRAFT_KEY)
      } catch { localStorage.removeItem(DRAFT_KEY) }
    }

    fetch('/api/admin/paroh')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            id: data.id || null,
            nameRo: data.nameRo || '',
            titleRo: data.titleRo || 'Preot Paroh',
            photoUrl: data.photoUrl || '',
            bioRo: data.bioRo || '',
            ordained: data.ordained || '',
            parish: data.parish || '',
            education: data.education || '',
            phone: data.phone || '',
            email: data.email || '',
            facebook: data.facebook || '',
            seoKeywords: data.seoKeywords || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!form.nameRo.trim() || !form.titleRo.trim()) {
      showToast('Numele și titlul sunt obligatorii', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/paroh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      const data = await res.json()
      setForm(f => ({ ...f, id: data.id }))
      localStorage.removeItem(DRAFT_KEY)
      setIsDirty(false)
      showToast('Date salvate cu succes ✓', 'success')
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  const set = (key: keyof PriestForm, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setIsDirty(true)
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Paroh</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }} className="p-4 sm:px-8 sm:py-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>⛪ Preotul Paroh</h1>
              {lastSaved && (
                <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                  💾 Draft salvat la {lastSaved.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/paroh" target="_blank" style={{ ...btnGhost }}>↗ Vizualizează pagina</a>
              <button onClick={handleSave} disabled={saving || loading} style={{ ...btnGold, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <>
              {/* ─── Date principale ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📋 Date principale</div>
                <div style={{ display: 'grid', gap: '1.1rem' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                      <label style={lbl}>Numele complet *</label>
                      <input value={form.nameRo} onChange={e => set('nameRo', e.target.value)} placeholder="Preacucernic Părinte..." style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Titlul *</label>
                      <input value={form.titleRo} onChange={e => set('titleRo', e.target.value)} placeholder="Preot Paroh" style={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                      <label style={lbl}>Hirotonit în...</label>
                      <input value={form.ordained} onChange={e => set('ordained', e.target.value)} placeholder="ex: Hirotonit în anul 2005..." style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Parohia</label>
                      <input value={form.parish} onChange={e => set('parish', e.target.value)} placeholder="Paroh la Parohia..." style={inp} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Fotografie ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📸 Fotografia principală</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>URL fotografie</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="https://..." style={{ ...inp, flex: 1 }} />
                      <ImageUploadButton onUpload={url => set('photoUrl', url)} label="Încarcă foto" />
                    </div>
                  </div>
                  {form.photoUrl && (
                    <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #C9A84C' }}>
                      <img src={form.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Biografie ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📖 Biografie</div>
                <TipTapEditor value={form.bioRo} onChange={v => set('bioRo', v)} placeholder="Biografia preotului paroh..." />
              </div>

              {/* ─── Educație ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🎓 Educație și formare</div>
                <TipTapEditor value={form.education} onChange={v => set('education', v)} placeholder="Studii teologice, formare pastorală..." />
              </div>

              {/* ─── Contact ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📞 Contact</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={lbl}>Telefon</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+373 ..." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email</label>
                    <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="paroh@..." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Facebook URL</label>
                    <input value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/..." style={inp} />
                  </div>
                </div>
              </div>

              {/* ─── SEO ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🔍 SEO</div>
                <label style={lbl}>Cuvinte cheie SEO (opțional, separate prin virgulă)</label>
                <input value={form.seoKeywords} onChange={e => set('seoKeywords', e.target.value)} placeholder="ex: preot paroh, biserică Hîrtopul Mic, pr. Marin Grigoriță" style={inp} />
              </div>

              {/* ─── Galerie foto ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📷 Galerie foto</div>
                {form.id ? (
                  <MediaGallery entityType="priest" entityId={form.id} maxPhotos={30} />
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px' }}>
                    Salvați datele mai întâi pentru a putea adăuga fotografii.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
                <button onClick={handleSave} disabled={saving} style={{ ...btnGold, opacity: saving ? 0.7 : 1, fontSize: '1rem', padding: '0.625rem 2rem' }}>
                  {saving ? 'Se salvează...' : '💾 Salvează tot'}
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
