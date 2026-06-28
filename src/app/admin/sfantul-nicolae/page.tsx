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
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer' }
const sectionBox: React.CSSProperties = { backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }
const sectionTitle: React.CSSProperties = { color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E1208' }

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

export default function AdminSfantulNicolaePage() {
  const [life, setLife] = useState('')
  const [tropar, setTropar] = useState('')
  const [condac, setCondac] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [feast1, setFeast1] = useState('19 Decembrie — Adormirea Sfântului Nicolae')
  const [feast1Desc, setFeast1Desc] = useState('Ziua principală de prăznuire. Sfântul s-a săvârșit din viață în jurul anului 345 d.Hr.')
  const [feast2, setFeast2] = useState('22 Mai — Aducerea Sfintelor Moaște la Bari')
  const [feast2Desc, setFeast2Desc] = useState('Comemorarea transferului moaștelor din Mireele Lichiei la Bari (Italia) în 1087.')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/settings?key=saint_nicholas_content')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setLife(data.life || '')
          setTropar(data.tropar || '')
          setCondac(data.condac || '')
          setIconUrl(data.iconUrl || '')
          setFeast1(data.feast1 || '19 Decembrie — Adormirea Sfântului Nicolae')
          setFeast1Desc(data.feast1Desc || 'Ziua principală de prăznuire. Sfântul s-a săvârșit din viață în jurul anului 345 d.Hr.')
          setFeast2(data.feast2 || '22 Mai — Aducerea Sfintelor Moaște la Bari')
          setFeast2Desc(data.feast2Desc || 'Comemorarea transferului moaștelor din Mireele Lichiei la Bari (Italia) în 1087.')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'saint_nicholas_content', value: { life, tropar, condac, iconUrl, feast1, feast1Desc, feast2, feast2Desc } }),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      showToast('Conținut salvat cu succes ✓', 'success')
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Sfântul Nicolae</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>✦ Sfântul Ierarh Nicolae</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/sfantul-nicolae" target="_blank" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-block' }}>
                ↗ Vizualizează pagina
              </a>
              <button onClick={handleSave} disabled={saving || loading} style={{ ...btnGold, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <>
              {/* ─── Icoana ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🖼️ Icoana principală</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>URL icoană</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={iconUrl}
                        onChange={e => setIconUrl(e.target.value)}
                        placeholder="https://... sau încarcă mai jos"
                        style={{ ...inp, flex: 1 }}
                      />
                      <ImageUploadButton onUpload={url => setIconUrl(url)} />
                    </div>
                    <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                      Introduceți un URL sau încărcați direct din calculator.
                    </p>
                  </div>
                  {iconUrl && (
                    <div style={{ flexShrink: 0, width: '100px', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A1A0A' }}>
                      <img src={iconUrl} alt="Icoana" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Date prăznuire (editabile) ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📅 Date prăznuire</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div style={{ backgroundColor: '#0A0704', border: '1px solid #1A1008', borderRadius: '6px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', borderRadius: '4px', width: '44px', height: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 600, lineHeight: 1, flexShrink: 0 }}>
                        <span>19</span><span style={{ fontSize: '0.5rem', marginTop: '2px' }}>DEC</span>
                      </div>
                      <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Prima prăznuire</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <label style={lbl}>Titlu</label>
                        <input value={feast1} onChange={e => setFeast1(e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Descriere</label>
                        <input value={feast1Desc} onChange={e => setFeast1Desc(e.target.value)} style={inp} />
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0A0704', border: '1px solid #1A1008', borderRadius: '6px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ backgroundColor: '#C9A84C', color: '#0D0905', borderRadius: '4px', width: '44px', height: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 600, lineHeight: 1, flexShrink: 0 }}>
                        <span>22</span><span style={{ fontSize: '0.5rem', marginTop: '2px' }}>MAI</span>
                      </div>
                      <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>A doua prăznuire</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <label style={lbl}>Titlu</label>
                        <input value={feast2} onChange={e => setFeast2(e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Descriere</label>
                        <input value={feast2Desc} onChange={e => setFeast2Desc(e.target.value)} style={inp} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Viața sfântului ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📖 Viața Sfântului (conținut principal)</div>
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.875rem' }}>
                  Editați biografia Sfântului Ierarh Nicolae. Aceasta va înlocui textul implicit de pe pagina publică.
                </p>
                <TipTapEditor
                  value={life}
                  onChange={setLife}
                  placeholder="Sfântul Ierarh Nicolae s-a născut..."
                />
              </div>

              {/* ─── Tropar ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🎵 Troparul</div>
                <textarea
                  value={tropar}
                  onChange={e => setTropar(e.target.value)}
                  rows={6}
                  placeholder="Regulă a credinței și chip al blândeții..."
                  style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }}
                />
                <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Versurile troparlui sunt separate de bare (/) în textul original; tastați liber.
                </p>
              </div>

              {/* ─── Condac ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🎵 Condacul</div>
                <textarea
                  value={condac}
                  onChange={e => setCondac(e.target.value)}
                  rows={6}
                  placeholder="În Mireele Lichiei, sfinte, sfințitor te-ai arătat..."
                  style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }}
                />
              </div>

              {/* ─── Galerie imagini ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📷 Galerie imagini</div>
                <MediaGallery entityType="saint" entityId="sfantul-nicolae" maxPhotos={50} />
              </div>

              {/* Bottom save */}
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
