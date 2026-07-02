'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'
import MediaGallery from '@/components/admin/MediaGallery'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

interface Saint {
  id: string; nameRo: string; nameRu: string | null; nameEn: string | null
  month: number; day: number; feastType: string | null
  lifeRo: string | null; lifeRu: string | null; lifeEn: string | null
  iconUrl: string | null; slug: string
}

const MONTHS = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const FEAST_TYPES = [
  { value: '', label: '— Fără tip —' },
  { value: 'MARE', label: '✦ Sărbătoare mare' },
  { value: 'MIJLOCIE', label: '◆ Sărbătoare mijlocie' },
  { value: 'MIC', label: '• Sfânt mic' },
]
const FEAST_COLORS: Record<string, string> = { MARE: '#C9A84C', MIJLOCIE: '#8B6014', MIC: '#5A4020' }

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnPrimary: React.CSSProperties = { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, loading }: { message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '2rem', maxWidth: '380px', width: '100%' }}>
        <p style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', marginBottom: '1.5rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={btnGhost}>Anulează</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...btnPrimary, backgroundColor: '#5A0A0A' }}>{loading ? 'Se șterge...' : 'Șterge'}</button>
        </div>
      </div>
    </div>
  )
}

const emptyForm = { nameRo: '', nameRu: '', nameEn: '', month: '1', day: '1', feastType: '', lifeRo: '', lifeRu: '', lifeEn: '', iconUrl: '' }

export default function AdminSfintiPage() {
  const [saints, setSaints] = useState<Saint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editSaint, setEditSaint] = useState<Saint | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  async function translateField(sourceField: 'nameRo' | 'lifeRo', field: 'nameRu' | 'nameEn' | 'lifeRu' | 'lifeEn') {
    const sourceText = form[sourceField]
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
      const val = field.endsWith('Ru') ? data.translations.ru : data.translations.en
      setForm(f => ({ ...f, [field]: val }))
      showToast('Tradus cu DeepL ✓', 'success')
    } catch { showToast('Eroare la traducere DeepL', 'error') }
    finally { setTranslating(t => ({ ...t, [field]: false })) }
  }

  const fetchSaints = useCallback(async () => {
    const res = await fetch('/api/admin/sfinti')
    if (res.ok) setSaints(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchSaints() }, [fetchSaints])

  function openNew() {
    setEditSaint(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(s: Saint) {
    setEditSaint(s)
    setForm({ nameRo: s.nameRo, nameRu: s.nameRu || '', nameEn: s.nameEn || '', month: String(s.month), day: String(s.day), feastType: s.feastType || '', lifeRo: s.lifeRo || '', lifeRu: s.lifeRu || '', lifeEn: s.lifeEn || '', iconUrl: s.iconUrl || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nameRo.trim()) { showToast('Numele (RO) este obligatoriu', 'error'); return }
    setSaving(true)
    try {
      const url = editSaint ? `/api/admin/sfinti/${editSaint.id}` : '/api/admin/sfinti'
      const method = editSaint ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      showToast(editSaint ? 'Sfânt actualizat ✓' : 'Sfânt adăugat ✓', 'success')
      setShowForm(false)
      fetchSaints()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/sfinti/${deleteId}`, { method: 'DELETE' })
      showToast('Sfânt șters ✓', 'success')
      setDeleteId(null)
      fetchSaints()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  const filtered = saints.filter(s => {
    const matchSearch = !search || s.nameRo.toLowerCase().includes(search.toLowerCase())
    const matchMonth = !filterMonth || s.month === parseInt(filterMonth)
    return matchSearch && matchMonth
  })

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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Sfinți</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>👤 Sfinți</h1>
            <button onClick={openNew} style={btnPrimary}>+ Sfânt nou</button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută după nume..." style={{ ...inp, maxWidth: '280px' }} />
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, maxWidth: '180px' }}>
              <option value="">Toate lunile</option>
              {MONTHS_FULL.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
            </select>
            {(search || filterMonth) && (
              <button onClick={() => { setSearch(''); setFilterMonth('') }} style={btnGhost}>✕ Resetează</button>
            )}
          </div>

          {/* Table */}
          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                {saints.length === 0 ? 'Niciun sfânt. Adaugă primul sfânt.' : 'Niciun rezultat pentru filtrele aplicate.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A1A0A' }}>
                    {['Dată', 'Nume', 'Tip sărbătoare', 'Icoană', 'Acțiuni'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5A4020', fontSize: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1E1208' : 'none' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {s.day} {MONTHS[s.month - 1]}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.nameRo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {s.feastType ? (
                          <span style={{ color: FEAST_COLORS[s.feastType] || '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
                            {FEAST_TYPES.find(f => f.value === s.feastType)?.label || s.feastType}
                          </span>
                        ) : <span style={{ color: '#3A2A0A', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {s.iconUrl
                          ? <img src={s.iconUrl} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          : <span style={{ color: '#3A2A0A', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Editează</button>
                        <button onClick={() => setDeleteId(s.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Șterge</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {filtered.length} din {saints.length} sfinți
          </div>
        </main>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '680px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>{editSaint ? 'Editare sfânt' : 'Sfânt nou'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
              {/* Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={lbl}>Lună *</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inp}>
                    {MONTHS_FULL.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Zi *</label>
                  <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} style={inp}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tip sărbătoare</label>
                  <select value={form.feastType} onChange={e => setForm(f => ({ ...f, feastType: e.target.value }))} style={inp}>
                    {FEAST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Names */}
              <div>
                <label style={lbl}>Nume (Română) *</label>
                <input value={form.nameRo} onChange={e => setForm(f => ({ ...f, nameRo: e.target.value }))} placeholder="Sfântul Ierarh Nicolae..." style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Nume (Rusă)</label>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {!form.nameRu && <span style={{ fontSize: '0.65rem', color: '#8B6014' }}>⚠️ Lipsă</span>}
                      {form.nameRu && <span style={{ fontSize: '0.65rem', color: '#5A9050' }}>🤖 DeepL</span>}
                      <button onClick={() => translateField('nameRo', 'nameRu')} disabled={!!translating['nameRu']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                        {translating['nameRu'] ? '...' : '🔄 RU'}
                      </button>
                    </div>
                  </div>
                  <input value={form.nameRu} onChange={e => setForm(f => ({ ...f, nameRu: e.target.value }))} placeholder="Святитель Николай..." style={inp} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Nume (Engleză)</label>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {!form.nameEn && <span style={{ fontSize: '0.65rem', color: '#8B6014' }}>⚠️ Lipsă</span>}
                      {form.nameEn && <span style={{ fontSize: '0.65rem', color: '#5A9050' }}>🤖 DeepL</span>}
                      <button onClick={() => translateField('nameRo', 'nameEn')} disabled={!!translating['nameEn']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                        {translating['nameEn'] ? '...' : '🔄 EN'}
                      </button>
                    </div>
                  </div>
                  <input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="Saint Nicholas..." style={inp} />
                </div>
              </div>

              {/* Icon */}
              <div>
                <label style={lbl}>URL icoană</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input value={form.iconUrl} onChange={e => setForm(f => ({ ...f, iconUrl: e.target.value }))} placeholder="https://..." style={{ ...inp, flex: 1 }} />
                  <ImageUploadButton onUpload={url => setForm(f => ({ ...f, iconUrl: url }))} />
                  {form.iconUrl && (
                    <img src={form.iconUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>
              </div>

              {/* Life */}
              <div style={{ flex: 1 }}>
                <label style={lbl}>Viața sfântului (Română)</label>
                <TipTapEditor value={form.lifeRo} onChange={val => setForm(f => ({ ...f, lifeRo: val }))} placeholder="Viața și faptele sfântului..." />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Viața sfântului (Rusă)</label>
                  <button onClick={() => translateField('lifeRo', 'lifeRu')} disabled={!!translating['lifeRu']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                    {translating['lifeRu'] ? '...' : '🔄 RU'}
                  </button>
                </div>
                <TipTapEditor value={form.lifeRu} onChange={val => setForm(f => ({ ...f, lifeRu: val }))} placeholder="Житие и деяния святого..." />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Viața sfântului (Engleză)</label>
                  <button onClick={() => translateField('lifeRo', 'lifeEn')} disabled={!!translating['lifeEn']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                    {translating['lifeEn'] ? '...' : '🔄 EN'}
                  </button>
                </div>
                <TipTapEditor value={form.lifeEn} onChange={val => setForm(f => ({ ...f, lifeEn: val }))} placeholder="The life and deeds of the saint..." />
              </div>

              {/* Gallery */}
              <div style={{ borderTop: '1px solid #1E1208', paddingTop: '1.1rem' }}>
                <div style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', marginBottom: '0.875rem' }}>📷 Galerie imagini</div>
                {editSaint ? (
                  <MediaGallery entityType="saint" entityId={editSaint.id} maxPhotos={30} />
                ) : (
                  <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', padding: '1rem', border: '1px dashed #2A1A0A', borderRadius: '6px', textAlign: 'center' }}>
                    Salvați sfântul mai întâi, apoi puteți adăuga fotografii.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Se salvează...' : editSaint ? 'Actualizează' : 'Adaugă sfânt'}</button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal message="Sigur doriți să ștergeți acest sfânt?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
