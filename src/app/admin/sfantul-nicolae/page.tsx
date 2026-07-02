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

interface ContentForm {
  lifeRo: string; lifeRu: string; lifeEn: string
  troparRo: string; troparRu: string; troparEn: string
  condacRo: string; condacRu: string; condacEn: string
  iconUrl: string
  feast1Ro: string; feast1Ru: string; feast1En: string
  feast1DescRo: string; feast1DescRu: string; feast1DescEn: string
  feast2Ro: string; feast2Ru: string; feast2En: string
  feast2DescRo: string; feast2DescRu: string; feast2DescEn: string
}

const DEFAULT_FEAST1_RO = '19 Decembrie — Adormirea Sfântului Nicolae'
const DEFAULT_FEAST1_DESC_RO = 'Ziua principală de prăznuire. Sfântul s-a săvârșit din viață în jurul anului 345 d.Hr.'
const DEFAULT_FEAST2_RO = '22 Mai — Aducerea Sfintelor Moaște la Bari'
const DEFAULT_FEAST2_DESC_RO = 'Comemorarea transferului moaștelor din Mireele Lichiei la Bari (Italia) în 1087.'

const emptyForm: ContentForm = {
  lifeRo: '', lifeRu: '', lifeEn: '',
  troparRo: '', troparRu: '', troparEn: '',
  condacRo: '', condacRu: '', condacEn: '',
  iconUrl: '',
  feast1Ro: DEFAULT_FEAST1_RO, feast1Ru: '', feast1En: '',
  feast1DescRo: DEFAULT_FEAST1_DESC_RO, feast1DescRu: '', feast1DescEn: '',
  feast2Ro: DEFAULT_FEAST2_RO, feast2Ru: '', feast2En: '',
  feast2DescRo: DEFAULT_FEAST2_DESC_RO, feast2DescRu: '', feast2DescEn: '',
}

export default function AdminSfantulNicolaePage() {
  const [form, setForm] = useState<ContentForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])
  const set = (key: keyof ContentForm, val: string) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    fetch('/api/admin/settings?key=saint_nicholas_content')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            // suportă și forma veche (un singur câmp per limbă) pentru compatibilitate cu datele deja introduse
            lifeRo: data.lifeRo ?? data.life ?? '', lifeRu: data.lifeRu ?? '', lifeEn: data.lifeEn ?? '',
            troparRo: data.troparRo ?? data.tropar ?? '', troparRu: data.troparRu ?? '', troparEn: data.troparEn ?? '',
            condacRo: data.condacRo ?? data.condac ?? '', condacRu: data.condacRu ?? '', condacEn: data.condacEn ?? '',
            iconUrl: data.iconUrl || '',
            feast1Ro: data.feast1Ro ?? data.feast1 ?? DEFAULT_FEAST1_RO, feast1Ru: data.feast1Ru ?? '', feast1En: data.feast1En ?? '',
            feast1DescRo: data.feast1DescRo ?? data.feast1Desc ?? DEFAULT_FEAST1_DESC_RO, feast1DescRu: data.feast1DescRu ?? '', feast1DescEn: data.feast1DescEn ?? '',
            feast2Ro: data.feast2Ro ?? data.feast2 ?? DEFAULT_FEAST2_RO, feast2Ru: data.feast2Ru ?? '', feast2En: data.feast2En ?? '',
            feast2DescRo: data.feast2DescRo ?? data.feast2Desc ?? DEFAULT_FEAST2_DESC_RO, feast2DescRu: data.feast2DescRu ?? '', feast2DescEn: data.feast2DescEn ?? '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function translateField(sourceField: keyof ContentForm, targetField: keyof ContentForm) {
    const sourceText = form[sourceField]
    if (!sourceText.trim()) { showToast('Completați mai întâi câmpul în română', 'error'); return }
    setTranslating(t => ({ ...t, [targetField]: true }))
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, field: targetField }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lang = String(targetField).endsWith('Ru') ? 'ru' : 'en'
      set(targetField, data.translations[lang])
      showToast('Tradus cu DeepL ✓', 'success')
    } catch { showToast('Eroare la traducere DeepL', 'error') }
    finally { setTranslating(t => ({ ...t, [targetField]: false })) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'saint_nicholas_content', value: form }),
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
                        value={form.iconUrl}
                        onChange={e => set('iconUrl', e.target.value)}
                        placeholder="https://... sau încarcă mai jos"
                        style={{ ...inp, flex: 1 }}
                      />
                      <ImageUploadButton onUpload={url => set('iconUrl', url)} />
                    </div>
                    <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                      Introduceți un URL sau încărcați direct din calculator.
                    </p>
                  </div>
                  {form.iconUrl && (
                    <div style={{ flexShrink: 0, width: '100px', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A1A0A' }}>
                      <img src={form.iconUrl} alt="Icoana" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                        <label style={lbl}>Titlu (Română)</label>
                        <input value={form.feast1Ro} onChange={e => set('feast1Ro', e.target.value)} style={inp} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Rusă)</label>
                            <button onClick={() => translateField('feast1Ro', 'feast1Ru')} disabled={translating['feast1Ru']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 RU</button>
                          </div>
                          <input value={form.feast1Ru} onChange={e => set('feast1Ru', e.target.value)} style={inp} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Engleză)</label>
                            <button onClick={() => translateField('feast1Ro', 'feast1En')} disabled={translating['feast1En']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 EN</button>
                          </div>
                          <input value={form.feast1En} onChange={e => set('feast1En', e.target.value)} style={inp} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Descriere (Română)</label>
                        <input value={form.feast1DescRo} onChange={e => set('feast1DescRo', e.target.value)} style={inp} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Rusă)</label>
                            <button onClick={() => translateField('feast1DescRo', 'feast1DescRu')} disabled={translating['feast1DescRu']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 RU</button>
                          </div>
                          <input value={form.feast1DescRu} onChange={e => set('feast1DescRu', e.target.value)} style={inp} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Engleză)</label>
                            <button onClick={() => translateField('feast1DescRo', 'feast1DescEn')} disabled={translating['feast1DescEn']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 EN</button>
                          </div>
                          <input value={form.feast1DescEn} onChange={e => set('feast1DescEn', e.target.value)} style={inp} />
                        </div>
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
                        <label style={lbl}>Titlu (Română)</label>
                        <input value={form.feast2Ro} onChange={e => set('feast2Ro', e.target.value)} style={inp} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Rusă)</label>
                            <button onClick={() => translateField('feast2Ro', 'feast2Ru')} disabled={translating['feast2Ru']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 RU</button>
                          </div>
                          <input value={form.feast2Ru} onChange={e => set('feast2Ru', e.target.value)} style={inp} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Engleză)</label>
                            <button onClick={() => translateField('feast2Ro', 'feast2En')} disabled={translating['feast2En']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 EN</button>
                          </div>
                          <input value={form.feast2En} onChange={e => set('feast2En', e.target.value)} style={inp} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Descriere (Română)</label>
                        <input value={form.feast2DescRo} onChange={e => set('feast2DescRo', e.target.value)} style={inp} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Rusă)</label>
                            <button onClick={() => translateField('feast2DescRo', 'feast2DescRu')} disabled={translating['feast2DescRu']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 RU</button>
                          </div>
                          <input value={form.feast2DescRu} onChange={e => set('feast2DescRu', e.target.value)} style={inp} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Engleză)</label>
                            <button onClick={() => translateField('feast2DescRo', 'feast2DescEn')} disabled={translating['feast2DescEn']} style={{ ...btnGhost, padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>🔄 EN</button>
                          </div>
                          <input value={form.feast2DescEn} onChange={e => set('feast2DescEn', e.target.value)} style={inp} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Viața sfântului ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📖 Viața Sfântului — Română (conținut principal)</div>
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.875rem' }}>
                  Editați biografia Sfântului Ierarh Nicolae. Aceasta va înlocui textul implicit de pe pagina publică.
                </p>
                <TipTapEditor
                  value={form.lifeRo}
                  onChange={v => set('lifeRo', v)}
                  placeholder="Sfântul Ierarh Nicolae s-a născut..."
                />
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📖 Viața Sfântului — Rusă</span>
                  <button onClick={() => translateField('lifeRo', 'lifeRu')} disabled={translating['lifeRu']} style={btnGhost}>
                    {translating['lifeRu'] ? 'Se traduce...' : '🔄 Traduce RU'}
                  </button>
                </div>
                <TipTapEditor value={form.lifeRu} onChange={v => set('lifeRu', v)} placeholder="Житие святителя Николая..." />
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📖 Viața Sfântului — Engleză</span>
                  <button onClick={() => translateField('lifeRo', 'lifeEn')} disabled={translating['lifeEn']} style={btnGhost}>
                    {translating['lifeEn'] ? 'Se traduce...' : '🔄 Traduce EN'}
                  </button>
                </div>
                <TipTapEditor value={form.lifeEn} onChange={v => set('lifeEn', v)} placeholder="The life of Saint Nicholas..." />
              </div>

              {/* ─── Tropar ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🎵 Troparul (Română)</div>
                <textarea
                  value={form.troparRo}
                  onChange={e => set('troparRo', e.target.value)}
                  rows={6}
                  placeholder="Regulă a credinței și chip al blândeții..."
                  style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }}
                />
                <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Versurile troparlui sunt separate de bare (/) în textul original; tastați liber.
                </p>
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎵 Troparul (Rusă / slavonă bisericească)</span>
                  <button onClick={() => translateField('troparRo', 'troparRu')} disabled={translating['troparRu']} style={btnGhost}>
                    {translating['troparRu'] ? 'Se traduce...' : '🔄 Traduce RU'}
                  </button>
                </div>
                <textarea value={form.troparRu} onChange={e => set('troparRu', e.target.value)} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }} />
                <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Recomandat: textul liturgic tradițional (slavonă/rusă), nu traducere automată — corectați manual după traducerea DeepL.
                </p>
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎵 Troparul (Engleză)</span>
                  <button onClick={() => translateField('troparRo', 'troparEn')} disabled={translating['troparEn']} style={btnGhost}>
                    {translating['troparEn'] ? 'Se traduce...' : '🔄 Traduce EN'}
                  </button>
                </div>
                <textarea value={form.troparEn} onChange={e => set('troparEn', e.target.value)} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }} />
              </div>

              {/* ─── Condac ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>🎵 Condacul (Română)</div>
                <textarea
                  value={form.condacRo}
                  onChange={e => set('condacRo', e.target.value)}
                  rows={6}
                  placeholder="În Mireele Lichiei, sfinte, sfințitor te-ai arătat..."
                  style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }}
                />
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎵 Condacul (Rusă / slavonă bisericească)</span>
                  <button onClick={() => translateField('condacRo', 'condacRu')} disabled={translating['condacRu']} style={btnGhost}>
                    {translating['condacRu'] ? 'Se traduce...' : '🔄 Traduce RU'}
                  </button>
                </div>
                <textarea value={form.condacRu} onChange={e => set('condacRu', e.target.value)} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }} />
              </div>

              <div style={sectionBox}>
                <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎵 Condacul (Engleză)</span>
                  <button onClick={() => translateField('condacRo', 'condacEn')} disabled={translating['condacEn']} style={btnGhost}>
                    {translating['condacEn'] ? 'Se traduce...' : '🔄 Traduce EN'}
                  </button>
                </div>
                <textarea value={form.condacEn} onChange={e => set('condacEn', e.target.value)} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: '1.8' }} />
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
