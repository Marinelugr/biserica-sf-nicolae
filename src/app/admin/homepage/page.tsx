'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

interface Widget { section: string; enabled: boolean; order: number }

const LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  sfintii_zilei:      { label: 'Sfinții zilei',       icon: '☦',  desc: 'Calendar ortodox cu sfinții prăznuiți în ziua curentă' },
  evanghelia_zilei:   { label: 'Evanghelia zilei',    icon: '📖', desc: 'Pericopa evanghelică a zilei din calendarul ortodox' },
  rugaciunea_zilei:   { label: 'Rugăciunea zilei',    icon: '🙏', desc: 'Rugăciune zilnică pentru credincioșii parohiei' },
  program_slujbe:     { label: 'Program slujbe',      icon: '⛪', desc: 'Orarul slujbelor din luna curentă' },
  stiri_recente:      { label: 'Știri recente',       icon: '📰', desc: 'Ultimele articole și anunțuri publicate' },
  biblioteca_ortodoxa:{ label: 'Biblioteca ortodoxă', icon: '📚', desc: 'Cărți și texte din biblioteca digitală a parohiei' },
}

const btnPrimary: React.CSSProperties = { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }
const btnGold: React.CSSProperties = { backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.75rem', fontFamily: 'Georgia, serif', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.35rem 0.6rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer' }

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

export default function AdminHomepagePage() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/homepage')
      .then(r => r.json())
      .then(data => { setWidgets(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggle(section: string) {
    setWidgets(ws => ws.map(w => w.section === section ? { ...w, enabled: !w.enabled } : w))
    setDirty(true)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= widgets.length) return
    setWidgets(ws => {
      const next = [...ws]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((w, i) => ({ ...w, order: i }))
    })
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(widgets.map((w, i) => ({ ...w, order: i }))),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      showToast('Configurare salvată ✓', 'success')
      setDirty(false)
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  const enabledCount = widgets.filter(w => w.enabled).length

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Configurare homepage</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>🏠 Configurare homepage</h1>
              {!loading && (
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
                  {enabledCount} din {widgets.length} secțiuni active
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/" target="_blank" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-block' }}>↗ Vizualizează site</a>
              <button onClick={handleSave} disabled={saving || loading || !dirty} style={{ ...btnGold, opacity: saving || !dirty ? 0.6 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează configurarea'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <>
              {/* Info banner */}
              <div style={{ backgroundColor: '#0A0F07', border: '1px solid #1A2A0A', borderRadius: '6px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#4ACA4A', fontSize: '0.9rem', flexShrink: 0 }}>ℹ</span>
                <p style={{ color: '#6A9A6A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
                  Activați sau dezactivați secțiunile de pe pagina principală și reordonați-le folosind butoanele Sus/Jos. Modificările sunt aplicate imediat după salvare.
                </p>
              </div>

              {/* Widget list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '680px' }}>
                {widgets.map((w, i) => {
                  const meta = LABELS[w.section]
                  if (!meta) return null
                  return (
                    <div
                      key={w.section}
                      style={{
                        backgroundColor: '#110C07',
                        border: `1px solid ${w.enabled ? '#2A1A0A' : '#1A0A0A'}`,
                        borderLeft: `4px solid ${w.enabled ? '#C9A84C' : '#2A1A0A'}`,
                        borderRadius: '8px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        opacity: w.enabled ? 1 : 0.55,
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Drag handle / order indicator */}
                      <div style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </div>

                      {/* Icon */}
                      <div style={{ fontSize: '1.5rem', flexShrink: 0, width: '32px', textAlign: 'center' }}>
                        {meta.icon}
                      </div>

                      {/* Label + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: w.enabled ? '#F2EBD9' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                          {meta.label}
                        </div>
                        <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          {meta.desc}
                        </div>
                      </div>

                      {/* Up / Down */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexShrink: 0 }}>
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.75rem', opacity: i === 0 ? 0.3 : 1 }}
                          title="Mută sus"
                        >▲</button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === widgets.length - 1}
                          style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.75rem', opacity: i === widgets.length - 1 ? 0.3 : 1 }}
                          title="Mută jos"
                        >▼</button>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => toggle(w.section)}
                        style={{
                          flexShrink: 0,
                          width: '48px', height: '26px',
                          borderRadius: '13px',
                          border: 'none',
                          backgroundColor: w.enabled ? '#C9A84C' : '#2A1A0A',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.2s',
                        }}
                        title={w.enabled ? 'Dezactivează' : 'Activează'}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '3px',
                          left: w.enabled ? '25px' : '3px',
                          width: '20px', height: '20px',
                          borderRadius: '50%',
                          backgroundColor: w.enabled ? '#0D0905' : '#5A4020',
                          transition: 'left 0.2s',
                          display: 'block',
                        }} />
                      </button>

                      {/* Status label */}
                      <span style={{ color: w.enabled ? '#C9A84C' : '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', width: '58px', textAlign: 'right', flexShrink: 0 }}>
                        {w.enabled ? 'Activ' : 'Inactiv'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Bottom save */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem', paddingBottom: '2rem' }}>
                <button onClick={handleSave} disabled={saving || !dirty} style={{ ...btnGold, opacity: saving || !dirty ? 0.6 : 1, fontSize: '1rem', padding: '0.625rem 2.25rem' }}>
                  {saving ? 'Se salvează...' : '💾 Salvează configurarea'}
                </button>
                {dirty && (
                  <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginLeft: '1rem', alignSelf: 'center' }}>
                    • Modificări nesalvate
                  </span>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
