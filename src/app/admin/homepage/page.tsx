'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

interface Widget { section: string; enabled: boolean; order: number }

const LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  sfintii_zilei:       { label: 'Sfinții zilei',        icon: '☦',  desc: 'Calendar ortodox cu sfinții prăznuiți în ziua curentă' },
  evanghelia_zilei:    { label: 'Evanghelia zilei',     icon: '📖', desc: 'Pericopa evanghelică a zilei din calendarul ortodox' },
  rugaciunea_zilei:    { label: 'Rugăciunea zilei',     icon: '🙏', desc: 'Rugăciune zilnică pentru credincioșii parohiei' },
  program_slujbe:      { label: 'Program slujbe',       icon: '⛪', desc: 'Orarul slujbelor din luna curentă' },
  stiri_recente:       { label: 'Știri recente',        icon: '📰', desc: 'Ultimele articole și anunțuri publicate' },
  biblioteca_ortodoxa: { label: 'Biblioteca ortodoxă',  icon: '📚', desc: 'Cărți și texte din biblioteca digitală a parohiei' },
}

function extractYouTubeId(url: string): string | null {
  if (!url.trim()) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  const m = url.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
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

function ArchiveDialog({
  onYes, onNo, loading, title
}: { onYes: () => void; onNo: () => void; loading: boolean; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#110C07', border: '2px solid #2A1A0A', borderRadius: '10px', padding: '2rem', maxWidth: '420px', width: '100%' }}>
        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1rem' }}>📼</div>
        <h3 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.1rem', margin: '0 0 0.75rem', textAlign: 'center' }}>
          Salvați transmisiunea în arhivă?
        </h3>
        <p style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 0.5rem', textAlign: 'center' }}>
          Doriți să salvați această transmisiune în arhiva video?
        </p>
        {title && (
          <p style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 1.5rem', fontStyle: 'italic' }}>
            „{title}"
          </p>
        )}
        <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 1.75rem' }}>
          Va fi adăugată automat în categoria „Sfânta Liturghie Live"
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onNo}
            disabled={loading}
            style={{ backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 1.75rem', fontFamily: 'Georgia, serif', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Nu, șterge
          </button>
          <button
            onClick={onYes}
            disabled={loading}
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.6rem 1.75rem', fontFamily: 'Georgia, serif', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? 'Se salvează...' : '📼 Da, arhivează'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminHomepagePage() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [widgetLoading, setWidgetLoading] = useState(true)
  const [widgetSaving, setWidgetSaving] = useState(false)
  const [widgetDirty, setWidgetDirty] = useState(false)

  const [liveActive, setLiveActive] = useState(false)
  const [liveUrl, setLiveUrl] = useState('')
  const [liveTitle, setLiveTitle] = useState('')
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveSaving, setLiveSaving] = useState(false)
  const [liveDirty, setLiveDirty] = useState(false)

  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [pendingDeactivate, setPendingDeactivate] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/homepage')
      .then(r => r.json())
      .then(data => { setWidgets(data); setWidgetLoading(false) })
      .catch(() => setWidgetLoading(false))

    Promise.all([
      fetch('/api/admin/settings?key=live_stream_active').then(r => r.json()),
      fetch('/api/admin/settings?key=live_stream_url').then(r => r.json()),
      fetch('/api/admin/settings?key=live_stream_title').then(r => r.json()),
    ]).then(([active, url, title]) => {
      setLiveActive(active === true || active === 'true')
      setLiveUrl(url || '')
      setLiveTitle(title || '')
      setLiveLoading(false)
    }).catch(() => setLiveLoading(false))
  }, [])

  function toggle(section: string) {
    setWidgets(ws => ws.map(w => w.section === section ? { ...w, enabled: !w.enabled } : w))
    setWidgetDirty(true)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= widgets.length) return
    setWidgets(ws => {
      const next = [...ws]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((w, i) => ({ ...w, order: i }))
    })
    setWidgetDirty(true)
  }

  async function handleSaveWidgets() {
    setWidgetSaving(true)
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(widgets.map((w, i) => ({ ...w, order: i }))),
      })
      if (!res.ok) throw new Error()
      showToast('Configurare salvată ✓', 'success')
      setWidgetDirty(false)
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setWidgetSaving(false) }
  }

  async function saveToggledLive(active: boolean) {
    await Promise.all([
      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'live_stream_active', value: active }) }),
      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'live_stream_url', value: liveUrl }) }),
      fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'live_stream_title', value: liveTitle }) }),
    ])
  }

  async function handleSaveLive() {
    // If toggling from active → inactive, ask about archiving
    if (liveActive && !pendingDeactivate) {
      // Save first, then ask
    }
    setLiveSaving(true)
    try {
      await saveToggledLive(liveActive)
      showToast(liveActive ? '🔴 LIVE activat pe site ✓' : 'LIVE dezactivat ✓', 'success')
      setLiveDirty(false)
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setLiveSaving(false) }
  }

  function handleToggleLive() {
    const newActive = !liveActive
    if (!newActive && liveActive) {
      // Going from active to inactive — ask about archiving
      setPendingDeactivate(true)
      setShowArchiveDialog(true)
    } else {
      setLiveActive(newActive)
      setLiveDirty(true)
    }
  }

  async function handleArchiveYes() {
    setArchiving(true)
    try {
      const ytId = extractYouTubeId(liveUrl)
      if (ytId) {
        await fetch('/api/admin/live-archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: liveTitle || 'Sfânta Liturghie Live',
            url: liveUrl,
            videoId: ytId,
            platform: 'youtube',
          }),
        })
        showToast('Transmisiune arhivată în „Sfânta Liturghie Live" ✓', 'success')
      }
      // Deactivate and save
      setLiveActive(false)
      setShowArchiveDialog(false)
      setPendingDeactivate(false)
      await saveToggledLive(false)
      setLiveDirty(false)
    } catch { showToast('Eroare la arhivare', 'error') }
    finally { setArchiving(false) }
  }

  async function handleArchiveNo() {
    setShowArchiveDialog(false)
    setPendingDeactivate(false)
    setLiveActive(false)
    setLiveDirty(true)
    // Auto-save deactivation
    try {
      await saveToggledLive(false)
      showToast('LIVE dezactivat ✓', 'success')
      setLiveDirty(false)
    } catch { showToast('Eroare la salvare', 'error') }
  }

  const ytId = extractYouTubeId(liveUrl)
  const enabledCount = widgets.filter(w => w.enabled).length

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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Configurare homepage</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>🏠 Configurare homepage</h1>
            <a href="/" target="_blank" style={{ ...btnGhost, textDecoration: 'none' }}>↗ Vizualizează site</a>
          </div>

          {/* LIVE STREAM SECTION */}
          <div style={{ backgroundColor: '#110C07', border: `2px solid ${liveActive ? '#8B1A1A' : '#2A1A0A'}`, borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem', maxWidth: '680px', transition: 'border-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📡</span>
                <div>
                  <div style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>Transmisiune Live</div>
                  <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                    Activați pentru a afișa embed-ul live pe homepage și pagina /video
                  </div>
                </div>
              </div>
              {liveActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2A0505', border: '1px solid #5A1A1A', borderRadius: '20px', padding: '0.3rem 0.875rem' }}>
                  <span style={{ color: '#EF4444', fontSize: '0.7rem' }}>●</span>
                  <span style={{ color: '#EF4444', fontFamily: 'Georgia, serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE ACTIV</span>
                </div>
              )}
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#0A0704', borderRadius: '8px', border: '1px solid #1A1008' }}>
              <button
                onClick={handleToggleLive}
                disabled={liveLoading}
                style={{ width: '64px', height: '34px', borderRadius: '17px', border: 'none', backgroundColor: liveActive ? '#EF4444' : '#2A1A0A', cursor: 'pointer', position: 'relative', transition: 'background-color 0.25s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '4px', left: liveActive ? '33px' : '4px', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: liveActive ? '#fff' : '#5A4020', transition: 'left 0.25s', display: 'block' }} />
              </button>
              <div>
                <div style={{ color: liveActive ? '#F2EBD9' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: liveActive ? 600 : 400, transition: 'color 0.2s' }}>
                  {liveActive ? '🔴 LIVE ACTIV — cardul apare pe homepage și /video' : 'LIVE INACTIV — cardul este ascuns'}
                </div>
                <div style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                  {liveActive ? 'La dezactivare veți fi întrebat dacă arhivați transmisiunea' : 'Activați înainte de a începe transmisiunea'}
                </div>
              </div>
            </div>

            {/* Title input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'Georgia, serif' }}>
                Titlul slujbei
              </label>
              <input
                value={liveTitle}
                onChange={e => { setLiveTitle(e.target.value); setLiveDirty(true) }}
                placeholder="ex: Sfânta Liturghie — Duminica Floriilor 2025"
                style={inp}
              />
              <div style={{ marginTop: '0.35rem', fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: '#3A2A0A' }}>
                Va apărea pe cardul live și la arhivare ca titlul înregistrării
              </div>
            </div>

            {/* URL input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'Georgia, serif' }}>
                URL YouTube Live sau ID video
              </label>
              <input
                value={liveUrl}
                onChange={e => { setLiveUrl(e.target.value); setLiveDirty(true) }}
                placeholder="https://youtube.com/live/xxxx  sau  ID video (11 caractere)"
                style={inp}
              />
              <div style={{ marginTop: '0.5rem', fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: '#3A2A0A' }}>
                Acceptat: youtube.com/live/ID · youtube.com/watch?v=ID · youtu.be/ID · ID direct
              </div>
            </div>

            {/* URL preview */}
            {liveUrl && (
              <div style={{ marginBottom: '1.25rem' }}>
                {ytId ? (
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', padding: '0.875rem', backgroundColor: '#0A0704', borderRadius: '6px', border: '1px solid #1A1008' }}>
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '112px', height: '70px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0, border: '1px solid #2A1A0A' }} />
                    <div>
                      <div style={{ color: '#4ACA4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.25rem' }}>✓ YouTube ID detectat</div>
                      <div style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginBottom: '0.25rem' }}>ID: <span style={{ color: '#C9A84C' }}>{ytId}</span></div>
                      <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer" style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>↗ Deschide video</a>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#CA8A4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', padding: '0.625rem 0.875rem', backgroundColor: '#1A0A00', borderRadius: '4px', border: '1px solid #3A2000' }}>
                    ⚠ URL nerecunoscut. Verificați formatul.
                  </div>
                )}
              </div>
            )}

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleSaveLive}
                disabled={liveSaving || liveLoading || !liveDirty}
                style={{ backgroundColor: liveActive ? '#8B1A1A' : '#C9A84C', color: liveActive ? '#F2EBD9' : '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.5rem', fontFamily: 'Georgia, serif', fontSize: '0.9rem', cursor: liveDirty ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: liveDirty ? 1 : 0.5, transition: 'all 0.2s' }}
              >
                {liveSaving ? 'Se salvează...' : liveActive ? '🔴 Activează LIVE pe site' : '💾 Salvează setările LIVE'}
              </button>
              {liveDirty && <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>• Modificări nesalvate</span>}
            </div>
          </div>

          {/* WIDGET SECTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', maxWidth: '680px' }}>
            <div>
              <h2 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.1rem', margin: 0 }}>Secțiuni homepage</h2>
              {!widgetLoading && (
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                  {enabledCount} din {widgets.length} active
                </p>
              )}
            </div>
            <button onClick={handleSaveWidgets} disabled={widgetSaving || widgetLoading || !widgetDirty} style={{ ...btnGold, opacity: widgetDirty ? 1 : 0.5 }}>
              {widgetSaving ? 'Se salvează...' : '💾 Salvează ordinea'}
            </button>
          </div>

          {widgetLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '680px' }}>
              {widgets.map((w, i) => {
                const meta = LABELS[w.section]
                if (!meta) return null
                return (
                  <div
                    key={w.section}
                    style={{ backgroundColor: '#110C07', border: `1px solid ${w.enabled ? '#2A1A0A' : '#1A0A0A'}`, borderLeft: `4px solid ${w.enabled ? '#C9A84C' : '#2A1A0A'}`, borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: w.enabled ? 1 : 0.55, transition: 'all 0.15s' }}
                  >
                    <div style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', width: '20px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0, width: '32px', textAlign: 'center' }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: w.enabled ? '#F2EBD9' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{meta.label}</div>
                      <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.78rem', lineHeight: 1.4 }}>{meta.desc}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexShrink: 0 }}>
                      <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.75rem', opacity: i === 0 ? 0.3 : 1 }} title="Mută sus">▲</button>
                      <button onClick={() => move(i, 1)} disabled={i === widgets.length - 1} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.75rem', opacity: i === widgets.length - 1 ? 0.3 : 1 }} title="Mută jos">▼</button>
                    </div>
                    <button
                      onClick={() => toggle(w.section)}
                      style={{ flexShrink: 0, width: '48px', height: '26px', borderRadius: '13px', border: 'none', backgroundColor: w.enabled ? '#C9A84C' : '#2A1A0A', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s' }}
                    >
                      <span style={{ position: 'absolute', top: '3px', left: w.enabled ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: w.enabled ? '#0D0905' : '#5A4020', transition: 'left 0.2s', display: 'block' }} />
                    </button>
                    <span style={{ color: w.enabled ? '#C9A84C' : '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', width: '52px', textAlign: 'right', flexShrink: 0 }}>
                      {w.enabled ? 'Activ' : 'Inactiv'}
                    </span>
                  </div>
                )
              })}

              {widgetDirty && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem', paddingBottom: '2rem' }}>
                  <button onClick={handleSaveWidgets} disabled={widgetSaving} style={{ ...btnGold, fontSize: '1rem', padding: '0.625rem 2.25rem', opacity: widgetSaving ? 0.6 : 1 }}>
                    {widgetSaving ? 'Se salvează...' : '💾 Salvează configurarea'}
                  </button>
                  <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginLeft: '1rem', alignSelf: 'center' }}>• Modificări nesalvate</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showArchiveDialog && (
        <ArchiveDialog
          title={liveTitle}
          onYes={handleArchiveYes}
          onNo={handleArchiveNo}
          loading={archiving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
