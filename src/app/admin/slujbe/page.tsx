'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

interface ServiceSchedule {
  id: string; year: number; month: number; day: number
  time: string; serviceRo: string; serviceRu: string | null; notes: string | null
}

const MONTHS_FULL = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const DAYS_SHORT = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

const emptyForm = { day: '', time: '08:00', serviceRo: '', serviceRu: '', notes: '' }

export default function AdminSlujbePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [services, setServices] = useState<ServiceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<ServiceSchedule | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/slujbe?year=${year}&month=${month}`)
    if (res.ok) setServices(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchServices() }, [fetchServices])

  function prevMonth() { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  function openNew(day?: number) {
    setEditService(null)
    setForm({ ...emptyForm, day: day ? String(day) : '' })
    setShowForm(true)
  }

  function openEdit(s: ServiceSchedule) {
    setEditService(s)
    setForm({ day: String(s.day), time: s.time, serviceRo: s.serviceRo, serviceRu: s.serviceRu || '', notes: s.notes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.day || !form.time || !form.serviceRo.trim()) { showToast('Ziua, ora și denumirea slujbei sunt obligatorii', 'error'); return }
    setSaving(true)
    try {
      const url = editService ? `/api/admin/slujbe/${editService.id}` : '/api/admin/slujbe'
      const method = editService ? 'PATCH' : 'POST'
      const body = editService
        ? { time: form.time, serviceRo: form.serviceRo, serviceRu: form.serviceRu, notes: form.notes }
        : { year, month, day: form.day, time: form.time, serviceRo: form.serviceRo, serviceRu: form.serviceRu, notes: form.notes }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      showToast(editService ? 'Slujbă actualizată ✓' : 'Slujbă adăugată ✓', 'success')
      setShowForm(false)
      fetchServices()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/slujbe/${deleteId}`, { method: 'DELETE' })
      showToast('Slujbă ștearsă ✓', 'success')
      setDeleteId(null)
      fetchServices()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  async function handleCopyPrevMonth() {
    const prevM = month === 1 ? 12 : month - 1
    const prevY = month === 1 ? year - 1 : year
    setCopying(true)
    try {
      const res = await fetch('/api/admin/slujbe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyFrom: { year: prevY, month: prevM }, copyTo: { year, month } }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      showToast(`${d.count} slujbe copiate din ${MONTHS_FULL[prevM - 1]} ✓`, 'success')
      setShowCopyConfirm(false)
      fetchServices()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la copiere', 'error')
    } finally { setCopying(false) }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const servicesByDay = services.reduce<Record<number, ServiceSchedule[]>>((acc, s) => {
    if (!acc[s.day]) acc[s.day] = []
    acc[s.day].push(s)
    return acc
  }, {})

  const selectedServices = selectedDay ? (servicesByDay[selectedDay] || []) : []

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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Program Slujbe</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>⛪ Program Slujbe</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={() => setShowCopyConfirm(true)} disabled={copying} style={{ ...btnGhost, fontSize: '0.8rem' }}>
                📋 Copiază luna anterioară
              </button>
              <button onClick={() => openNew()} style={btnPrimary}>+ Slujbă nouă</button>
            </div>
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <button onClick={prevMonth} style={{ ...btnGhost, padding: '0.4rem 0.875rem' }}>‹ Anterior</button>
            <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.1rem', minWidth: '180px', textAlign: 'center' }}>
              {MONTHS_FULL[month - 1]} {year}
            </span>
            <button onClick={nextMonth} style={{ ...btnGhost, padding: '0.4rem 0.875rem' }}>Următor ›</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setViewMode('calendar')} style={{ ...btnGhost, padding: '0.4rem 0.875rem', borderColor: viewMode === 'calendar' ? '#C9A84C' : '#2A1A0A', color: viewMode === 'calendar' ? '#C9A84C' : '#9B8050' }}>📅 Calendar</button>
              <button onClick={() => setViewMode('list')} style={{ ...btnGhost, padding: '0.4rem 0.875rem', borderColor: viewMode === 'list' ? '#C9A84C' : '#2A1A0A', color: viewMode === 'list' ? '#C9A84C' : '#9B8050' }}>☰ Listă</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : viewMode === 'calendar' ? (
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              {/* Calendar grid */}
              <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '640px' }}>
                <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Day headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #2A1A0A' }}>
                    {DAYS_SHORT.map(d => (
                      <div key={d} style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: d === 'Du' || d === 'Sâ' ? '#C9A84C' : '#5A4020', fontSize: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{d}</div>
                    ))}
                  </div>
                  {/* Days grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {Array.from({ length: totalCells }, (_, i) => {
                      const dayNum = i - firstDay + 1
                      const isValid = dayNum >= 1 && dayNum <= daysInMonth
                      const dayServices = isValid ? (servicesByDay[dayNum] || []) : []
                      const isSelected = selectedDay === dayNum
                      const isToday = isValid && dayNum === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
                      return (
                        <div
                          key={i}
                          onClick={() => isValid && setSelectedDay(isSelected ? null : dayNum)}
                          style={{
                            minHeight: '70px', padding: '0.4rem', cursor: isValid ? 'pointer' : 'default',
                            backgroundColor: isSelected ? '#1A0F05' : 'transparent',
                            borderRight: (i + 1) % 7 !== 0 ? '1px solid #1A1008' : 'none',
                            borderBottom: i < totalCells - 7 ? '1px solid #1A1008' : 'none',
                            position: 'relative',
                          }}
                        >
                          {isValid && (
                            <>
                              <div style={{ color: isToday ? '#C9A84C' : '#9B8050', fontSize: '0.8rem', fontFamily: 'Georgia, serif', fontWeight: isToday ? 700 : 400, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ backgroundColor: isToday ? '#C9A84C' : undefined, color: isToday ? '#0D0905' : undefined, borderRadius: isToday ? '50%' : undefined, width: isToday ? '20px' : undefined, height: isToday ? '20px' : undefined, display: isToday ? 'flex' : undefined, alignItems: isToday ? 'center' : undefined, justifyContent: isToday ? 'center' : undefined }}>{dayNum}</span>
                                <span onClick={e => { e.stopPropagation(); openNew(dayNum) }} style={{ color: '#3A2A0A', fontSize: '0.9rem', lineHeight: 1, cursor: 'pointer', padding: '0 2px' }} title="Adaugă slujbă">+</span>
                              </div>
                              {dayServices.map(s => (
                                <div key={s.id} style={{ backgroundColor: '#1E0F05', border: '1px solid #3A1A0A', borderRadius: '3px', padding: '0.15rem 0.3rem', marginBottom: '0.15rem', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); openEdit(s) }}>
                                  <span style={{ color: '#C9A84C', fontSize: '0.65rem', fontFamily: 'Georgia, serif' }}>{s.time}</span>
                                  <div style={{ color: '#D4C4A0', fontSize: '0.65rem', fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.serviceRo}</div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Day detail panel */}
              {selectedDay && (
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
                        {selectedDay} {MONTHS_FULL[month - 1]}
                      </span>
                      <button onClick={() => openNew(selectedDay)} style={{ ...btnPrimary, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>+ Adaugă</button>
                    </div>
                    {selectedServices.length === 0 ? (
                      <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>Nicio slujbă în această zi.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedServices.map(s => (
                          <div key={s.id} style={{ backgroundColor: '#1A0F05', border: '1px solid #2A1A0A', borderRadius: '6px', padding: '0.875rem' }}>
                            <div style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{s.time}</div>
                            <div style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.875rem', marginBottom: s.serviceRu || s.notes ? '0.5rem' : 0 }}>{s.serviceRo}</div>
                            {s.serviceRu && <div style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{s.serviceRu}</div>}
                            {s.notes && <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', fontStyle: 'italic' }}>{s.notes}</div>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                              <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.8rem', padding: 0 }}>Editează</button>
                              <button onClick={() => setDeleteId(s.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.8rem', padding: 0 }}>Șterge</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* List view */
            <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
              {services.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                  Nicio slujbă în {MONTHS_FULL[month - 1]} {year}. Adaugă prima slujbă.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A1A0A' }}>
                      {['Zi', 'Oră', 'Slujbă', 'Note', 'Acțiuni'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5A4020', fontSize: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < services.length - 1 ? '1px solid #1E1208' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                          {s.day} {MONTHS_FULL[month - 1].substring(0, 3)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{s.time}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>
                          <div>{s.serviceRo}</div>
                          {s.serviceRu && <div style={{ color: '#5A4020', fontSize: '0.8rem' }}>{s.serviceRu}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.notes || '—'}
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
          )}

          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {services.length} slujbe în {MONTHS_FULL[month - 1]} {year}
          </div>
        </main>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '520px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
                {editService ? 'Editare slujbă' : `Slujbă nouă — ${MONTHS_FULL[month - 1]} ${year}`}
              </span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={lbl}>Ziua din lună *</label>
                  <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} disabled={!!editService} style={{ ...inp, opacity: editService ? 0.5 : 1 }}>
                    <option value="">— Selectează —</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Ora *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Denumirea slujbei (Română) *</label>
                <input value={form.serviceRo} onChange={e => setForm(f => ({ ...f, serviceRo: e.target.value }))} placeholder="Sfânta Liturghie..." style={inp} />
              </div>

              <div>
                <label style={lbl}>Denumirea slujbei (Rusă)</label>
                <input value={form.serviceRu} onChange={e => setForm(f => ({ ...f, serviceRu: e.target.value }))} placeholder="Божественная литургия..." style={inp} />
              </div>

              <div>
                <label style={lbl}>Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notă opțională..." rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Se salvează...' : editService ? 'Actualizează' : 'Adaugă slujbă'}</button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {showCopyConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <p style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Copiați slujbele din{' '}
              <strong style={{ color: '#C9A84C' }}>{MONTHS_FULL[month === 1 ? 11 : month - 2]} {month === 1 ? year - 1 : year}</strong>
              {' '}în{' '}
              <strong style={{ color: '#C9A84C' }}>{MONTHS_FULL[month - 1]} {year}</strong>?
              <br /><span style={{ color: '#9B8050', fontSize: '0.85rem' }}>Slujbele existente din luna curentă nu vor fi șterse.</span>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCopyConfirm(false)} disabled={copying} style={btnGhost}>Anulează</button>
              <button onClick={handleCopyPrevMonth} disabled={copying} style={btnPrimary}>{copying ? 'Se copiază...' : 'Copiază'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal message="Sigur doriți să ștergeți această slujbă?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
