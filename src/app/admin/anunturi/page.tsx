'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import { anuntStare, anuntExpiryDate, isValidHttpUrl, type AnuntStare } from '@/lib/anunturi'

interface Anunt {
  id: string
  titlu: string
  mesaj: string
  linkArticol: string | null
  dataStart: string
  zileAfisare: number
  activ: boolean
  createdAt: string
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnPrimary: React.CSSProperties = { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }

const STARE_META: Record<AnuntStare, { label: string; bg: string; fg: string; border: string }> = {
  activ:     { label: '● Activ acum',            bg: '#0A2A0A', fg: '#4ACA4A', border: '#1A5A1A' },
  programat: { label: '◷ Programat pentru viitor', bg: '#0A1A3A', fg: '#5A8FE8', border: '#1A3A6B' },
  expirat:   { label: '✕ Expirat',               bg: '#1A1008', fg: '#8A7350', border: '#2A1A0A' },
  oprit:     { label: '⏻ Oprit manual',          bg: '#2A1408', fg: '#E0A030', border: '#6B4A10' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Data de azi ca YYYY-MM-DD (pentru input[type=date] și default). */
function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

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

const emptyForm = { titlu: '', mesaj: '', linkArticol: '', dataStart: todayInputValue(), zileAfisare: '7', activ: true }

export default function AdminAnunturiPage() {
  const [anunturi, setAnunturi] = useState<Anunt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editAnunt, setEditAnunt] = useState<Anunt | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  const fetchAnunturi = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/anunturi', { cache: 'no-store' })
      if (res.ok) setAnunturi(await res.json())
      else showToast('Nu s-au putut încărca anunțurile (' + res.status + ')', 'error')
    } catch {
      showToast('Nu s-au putut încărca anunțurile', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchAnunturi() }, [fetchAnunturi])

  function openNew() {
    setEditAnunt(null)
    setForm({ ...emptyForm, dataStart: todayInputValue() })
    setShowForm(true)
  }

  function openEdit(a: Anunt) {
    setEditAnunt(a)
    setForm({
      titlu: a.titlu,
      mesaj: a.mesaj,
      linkArticol: a.linkArticol ?? '',
      dataStart: a.dataStart.slice(0, 10),
      zileAfisare: String(a.zileAfisare),
      activ: a.activ,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titlu.trim() || !form.mesaj.trim()) { showToast('Titlul și mesajul sunt obligatorii', 'error'); return }
    const zile = Number(form.zileAfisare)
    if (!Number.isFinite(zile) || zile < 1) { showToast('Numărul de zile trebuie să fie cel puțin 1', 'error'); return }
    const link = form.linkArticol.trim()
    if (link && !isValidHttpUrl(link)) { showToast('Linkul articolului nu este un URL valid (folosiți http:// sau https://)', 'error'); return }
    setSaving(true)
    try {
      const url = editAnunt ? `/api/admin/anunturi/${editAnunt.id}` : '/api/admin/anunturi'
      const method = editAnunt ? 'PATCH' : 'POST'
      const body = { titlu: form.titlu, mesaj: form.mesaj, linkArticol: link, dataStart: form.dataStart, zileAfisare: zile, activ: form.activ }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Eroare ${res.status}`) }
      showToast(editAnunt ? 'Anunț actualizat ✓' : 'Anunț adăugat ✓', 'success')
      setShowForm(false)
      fetchAnunturi()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally { setSaving(false) }
  }

  async function handleToggleActiv(a: Anunt) {
    setTogglingId(a.id)
    try {
      const res = await fetch(`/api/admin/anunturi/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activ: !a.activ }),
      })
      if (!res.ok) throw new Error(String(res.status))
      showToast(a.activ ? 'Anunț oprit ✓' : 'Anunț repornit ✓', 'success')
      fetchAnunturi()
    } catch {
      showToast('Eroare la modificarea stării', 'error')
    } finally { setTogglingId(null) }
  }

  async function handleCopyLink(a: Anunt) {
    if (!a.linkArticol) return
    try {
      await navigator.clipboard.writeText(a.linkArticol)
      setCopiedId(a.id)
      setTimeout(() => setCopiedId(c => (c === a.id ? null : c)), 1800)
    } catch {
      showToast('Nu s-a putut copia linkul', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/anunturi/${deleteId}`, { method: 'DELETE' })
      showToast('Anunț șters ✓', 'success')
      setDeleteId(null)
      fetchAnunturi()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  const now = new Date()
  // Anunțul care se afișează acum pe homepage: activ acum + expiră primul
  const homepageId = anunturi
    .filter(a => anuntStare(a, now) === 'activ')
    .sort((x, y) => anuntExpiryDate(x).getTime() - anuntExpiryDate(y).getTime())[0]?.id

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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Anunțuri</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }} className="p-4 sm:px-8 sm:py-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>🔔 Anunțuri</h1>
            <button onClick={openNew} style={btnPrimary}>+ Anunț nou</button>
          </div>

          <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.85rem', marginTop: 0, marginBottom: '1.25rem', lineHeight: 1.6, maxWidth: '640px' }}>
            Un anunț apare pe homepage, lângă banda cu data curentă, cât timp e <strong style={{ color: '#9B8050' }}>activ</strong> și
            data de azi e între <em>Data de început</em> și <em>Data de început + zile de afișare</em>.
            Dacă mai multe anunțuri sunt active simultan, homepage-ul arată doar pe cel care <strong style={{ color: '#9B8050' }}>expiră primul</strong>;
            restul apar automat pe rând.
          </p>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : anunturi.length === 0 ? (
            <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
              Niciun anunț încă. Adaugă primul anunț.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {anunturi.map(a => {
                const stare = anuntStare(a, now)
                const meta = STARE_META[stare]
                const isOnHomepage = a.id === homepageId
                return (
                  <div key={a.id} style={{ backgroundColor: '#110C07', border: `1px solid ${isOnHomepage ? '#8B1A1A' : '#2A1A0A'}`, borderRadius: '8px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: meta.bg, color: meta.fg, border: `1px solid ${meta.border}`, borderRadius: '999px', padding: '0.2rem 0.7rem', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>
                            {meta.label}
                          </span>
                          {isOnHomepage && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#2A0A0A', color: '#E0908A', border: '1px solid #5A1A1A', borderRadius: '999px', padding: '0.2rem 0.7rem', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>
                              🔔 Vizibil acum pe homepage
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: '0.2rem' }}>{a.titlu}</div>
                        <div style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem', lineHeight: 1.5 }}>{a.mesaj}</div>
                        <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                          {fmtDate(a.dataStart)} → {fmtDate(anuntExpiryDate(a).toISOString())} &nbsp;·&nbsp; {a.zileAfisare} {a.zileAfisare === 1 ? 'zi' : 'zile'}
                        </div>
                        {a.linkArticol && (
                          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <span aria-hidden="true">🔗</span>
                            <a href={a.linkArticol} target="_blank" rel="noopener noreferrer" style={{ color: '#8A7350', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.linkArticol}</a>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {a.linkArticol && (
                          <button
                            onClick={() => handleCopyLink(a)}
                            title="Copiază linkul articolului"
                            style={{ background: 'none', border: 'none', color: copiedId === a.id ? '#4ACA4A' : '#9B8050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            {copiedId === a.id ? (
                              <>✓ Copiat!</>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copiază linkul
                              </>
                            )}
                          </button>
                        )}
                        <button onClick={() => handleToggleActiv(a)} disabled={togglingId === a.id} style={{ background: 'none', border: 'none', color: a.activ ? '#E0A030' : '#4ACA4A', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem', padding: 0 }}>
                          {togglingId === a.id ? '...' : a.activ ? 'Oprește' : 'Repornește'}
                        </button>
                        <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem', padding: 0 }}>Editează</button>
                        <button onClick={() => setDeleteId(a.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem', padding: 0 }}>Șterge</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {anunturi.length} {anunturi.length === 1 ? 'anunț' : 'anunțuri'} în total
          </div>
        </main>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '520px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
                {editAnunt ? 'Editare anunț' : 'Anunț nou'}
              </span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1, overflowY: 'auto' }}>
              <div>
                <label style={lbl}>Titlu *</label>
                <input value={form.titlu} onChange={e => setForm(f => ({ ...f, titlu: e.target.value }))} placeholder="Ex: Hramul bisericii" maxLength={120} style={inp} />
              </div>

              <div>
                <label style={lbl}>Mesaj * <span style={{ color: '#5A4020' }}>(1–2 propoziții)</span></label>
                <textarea value={form.mesaj} onChange={e => setForm(f => ({ ...f, mesaj: e.target.value }))} placeholder="Ex: Vă așteptăm duminică la Sfânta Liturghie de la ora 9:00, urmată de agapă în curtea bisericii." rows={3} maxLength={280} style={{ ...inp, resize: 'vertical' }} />
                <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'right' }}>{form.mesaj.length}/280</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={lbl}>Data de început *</label>
                  <input type="date" value={form.dataStart} onChange={e => setForm(f => ({ ...f, dataStart: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Zile de afișare *</label>
                  <input type="number" min={1} max={365} value={form.zileAfisare} onChange={e => setForm(f => ({ ...f, zileAfisare: e.target.value }))} style={inp} />
                </div>
              </div>

              {form.dataStart && Number(form.zileAfisare) >= 1 && (
                <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '-0.4rem' }}>
                  Se afișează de la <strong style={{ color: '#9B8050' }}>{fmtDate(form.dataStart + 'T00:00:00Z')}</strong> până la{' '}
                  <strong style={{ color: '#9B8050' }}>{fmtDate(new Date(Date.parse(form.dataStart + 'T00:00:00Z') + Number(form.zileAfisare) * 86400000).toISOString())}</strong> (exclusiv).
                </div>
              )}

              <div>
                <label style={lbl}>Link articol <span style={{ color: '#5A4020' }}>(opțional)</span></label>
                <input
                  type="url"
                  inputMode="url"
                  value={form.linkArticol}
                  onChange={e => setForm(f => ({ ...f, linkArticol: e.target.value }))}
                  placeholder="https://biserica-sf-nicolae.org/stiri/..."
                  style={{
                    ...inp,
                    border: form.linkArticol.trim() && !isValidHttpUrl(form.linkArticol) ? '1px solid #8B3A3A' : inp.border,
                  }}
                />
                <div style={{ color: form.linkArticol.trim() && !isValidHttpUrl(form.linkArticol) ? '#C77' : '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {form.linkArticol.trim() && !isValidHttpUrl(form.linkArticol)
                    ? 'URL invalid — folosiți o adresă completă (http:// sau https://)'
                    : 'Dacă e completat, tot cardul de pe homepage devine link către articol.'}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.activ} onChange={e => setForm(f => ({ ...f, activ: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#8B1A1A' }} />
                Activ (debifează pentru a-l opri manual, chiar dacă e încă în perioadă)
              </label>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Se salvează...' : editAnunt ? 'Actualizează' : 'Adaugă anunț'}</button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal message="Sigur doriți să ștergeți acest anunț?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
