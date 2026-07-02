'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import MediaGallery from '@/components/admin/MediaGallery'

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const inpSm: React.CSSProperties = { ...inp, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnGold: React.CSSProperties = { backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.5rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }
const btnDanger: React.CSSProperties = { backgroundColor: 'transparent', color: '#CA4A4A', border: '1px solid #3A1A1A', borderRadius: '4px', padding: '0.3rem 0.6rem', fontFamily: 'Georgia, serif', fontSize: '0.75rem', cursor: 'pointer' }
const sectionBox: React.CSSProperties = { backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }
const sectionTitle: React.CSSProperties = { color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E1208' }
const rowCard: React.CSSProperties = { backgroundColor: '#0A0704', border: '1px solid #2A1A0A', borderRadius: '6px', padding: '1rem', marginBottom: '0.875rem' }

interface DonationProject {
  id: string
  titleRo: string
  titleRu: string
  titleEn: string
  descriptionRo: string
  descriptionRu: string
  descriptionEn: string
  progress: number
  target: string
  order: number
  active: boolean
}

interface LocalAccount { bankName: string; accountLabel: string; accountNumber: string; holder: string }
interface IbanAccount { bankName: string; iban: string; swift: string; beneficiary: string }
interface VideoLink { url: string; caption: string }

interface ConfigForm {
  localAccounts: LocalAccount[]
  ibanAccounts: IbanAccount[]
  paypalEmail: string
  paypalLink: string
  contactName: string
  contactPhone: string
  facebookUrl: string
  tiktokUrl: string
  instagramUrl: string
  safetyNote: string
  videoLinks: VideoLink[]
}

const emptyConfig: ConfigForm = {
  localAccounts: [], ibanAccounts: [], paypalEmail: '', paypalLink: '',
  contactName: '', contactPhone: '', facebookUrl: '', tiktokUrl: '', instagramUrl: '',
  safetyNote: '', videoLinks: [],
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400, backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A', border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`, color: type === 'success' ? '#4ACA4A' : '#CA4A4A', padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

export default function AdminDonatiiPage() {
  const [projects, setProjects] = useState<DonationProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null)
  const [translating, setTranslating] = useState<Record<string, boolean>>({})

  const [config, setConfig] = useState<ConfigForm>(emptyConfig)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/donatii/proiecte')
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => showToast('Eroare la încărcarea proiectelor', 'error'))
      .finally(() => setLoadingProjects(false))
  }, [showToast])

  useEffect(() => {
    fetch('/api/admin/donatii/config')
      .then(r => r.json())
      .then(data => setConfig({
        localAccounts: data.localAccounts || [],
        ibanAccounts: data.ibanAccounts || [],
        paypalEmail: data.paypalEmail || '',
        paypalLink: data.paypalLink || '',
        contactName: data.contactName || '',
        contactPhone: data.contactPhone || '',
        facebookUrl: data.facebookUrl || '',
        tiktokUrl: data.tiktokUrl || '',
        instagramUrl: data.instagramUrl || '',
        safetyNote: data.safetyNote || '',
        videoLinks: data.videoLinks || [],
      }))
      .catch(() => showToast('Eroare la încărcarea configurării', 'error'))
      .finally(() => setLoadingConfig(false))
  }, [showToast])

  function updateProjectField(id: string, field: keyof DonationProject, value: string | number | boolean) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  async function addProject() {
    try {
      const res = await fetch('/api/admin/donatii/proiecte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleRo: 'Proiect nou', descriptionRo: '', progress: 0, target: '' }),
      })
      if (!res.ok) throw new Error()
      const project = await res.json()
      setProjects(prev => [...prev, project])
    } catch {
      showToast('Eroare la adăugarea proiectului', 'error')
    }
  }

  async function saveProject(project: DonationProject) {
    setSavingProjectId(project.id)
    try {
      const res = await fetch(`/api/admin/donatii/proiecte/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (!res.ok) throw new Error()
      showToast('Proiect salvat ✓', 'success')
    } catch {
      showToast('Eroare la salvarea proiectului', 'error')
    } finally {
      setSavingProjectId(null)
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Ștergeți acest proiect?')) return
    try {
      await fetch(`/api/admin/donatii/proiecte/${id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch {
      showToast('Eroare la ștergere', 'error')
    }
  }

  async function moveProject(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= projects.length) return
    const next = [...projects]
    ;[next[index], next[target]] = [next[target], next[index]]
    const a = { ...next[index], order: index }
    const b = { ...next[target], order: target }
    next[index] = a
    next[target] = b
    setProjects(next)
    await Promise.all([
      fetch(`/api/admin/donatii/proiecte/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) }),
      fetch(`/api/admin/donatii/proiecte/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
    ])
  }

  async function translateProjectField(project: DonationProject, sourceField: 'titleRo' | 'descriptionRo', targetSuffix: 'Ru' | 'En') {
    const key = `${project.id}-${sourceField}-${targetSuffix}`
    const sourceText = project[sourceField]
    if (!sourceText.trim()) { showToast('Completați mai întâi câmpul în română', 'error'); return }
    setTranslating(t => ({ ...t, [key]: true }))
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, field: sourceField }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lang = targetSuffix === 'Ru' ? 'ru' : 'en'
      const targetField = (sourceField === 'titleRo' ? 'title' : 'description') + targetSuffix as keyof DonationProject
      updateProjectField(project.id, targetField, data.translations[lang])
      showToast('Tradus cu DeepL ✓', 'success')
    } catch {
      showToast('Eroare la traducere DeepL', 'error')
    } finally {
      setTranslating(t => ({ ...t, [key]: false }))
    }
  }

  function setConfigField<K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) {
    setConfig(c => ({ ...c, [key]: value }))
  }

  function addLocalAccount() {
    setConfigField('localAccounts', [...config.localAccounts, { bankName: '', accountLabel: 'Cont', accountNumber: '', holder: '' }])
  }
  function updateLocalAccount(i: number, field: keyof LocalAccount, value: string) {
    setConfigField('localAccounts', config.localAccounts.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }
  function removeLocalAccount(i: number) {
    setConfigField('localAccounts', config.localAccounts.filter((_, idx) => idx !== i))
  }

  function addIbanAccount() {
    setConfigField('ibanAccounts', [...config.ibanAccounts, { bankName: '', iban: '', swift: '', beneficiary: '' }])
  }
  function updateIbanAccount(i: number, field: keyof IbanAccount, value: string) {
    setConfigField('ibanAccounts', config.ibanAccounts.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }
  function removeIbanAccount(i: number) {
    setConfigField('ibanAccounts', config.ibanAccounts.filter((_, idx) => idx !== i))
  }

  function addVideoLink() {
    setConfigField('videoLinks', [...config.videoLinks, { url: '', caption: '' }])
  }
  function updateVideoLink(i: number, field: keyof VideoLink, value: string) {
    setConfigField('videoLinks', config.videoLinks.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }
  function removeVideoLink(i: number) {
    setConfigField('videoLinks', config.videoLinks.filter((_, idx) => idx !== i))
  }

  async function saveConfig() {
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/donatii/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error()
      showToast('Configurare salvată ✓', 'success')
    } catch {
      showToast('Eroare la salvarea configurării', 'error')
    } finally {
      setSavingConfig(false)
    }
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Donații</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>💰 Donații</h1>
            <a href="/donatii" target="_blank" style={btnGhost}>↗ Vizualizează pagina</a>
          </div>

          {/* ─── Proiecte de renovare ─── */}
          <div style={sectionBox}>
            <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Proiecte de renovare</span>
              <button onClick={addProject} style={{ ...btnGhost, fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>+ Adaugă proiect</button>
            </div>

            {loadingProjects ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>Niciun proiect. Adăugați unul.</div>
            ) : (
              projects.map((project, i) => (
                <div key={project.id} style={rowCard}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Titlu (Română)</label>
                      <input value={project.titleRo} onChange={e => updateProjectField(project.id, 'titleRo', e.target.value)} style={inp} />
                    </div>
                    <div style={{ width: '140px' }}>
                      <label style={lbl}>Progres (%)</label>
                      <input type="number" min={0} max={100} value={project.progress} onChange={e => updateProjectField(project.id, 'progress', Number(e.target.value))} style={inp} />
                    </div>
                    <div style={{ width: '160px' }}>
                      <label style={lbl}>Țintă</label>
                      <input value={project.target} onChange={e => updateProjectField(project.id, 'target', e.target.value)} placeholder="150,000 MDL" style={inp} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Rusă)</label>
                        <button onClick={() => translateProjectField(project, 'titleRo', 'Ru')} disabled={translating[`${project.id}-titleRo-Ru`]} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                          {translating[`${project.id}-titleRo-Ru`] ? '...' : '🔄 RU'}
                        </button>
                      </div>
                      <input value={project.titleRu} onChange={e => updateProjectField(project.id, 'titleRu', e.target.value)} style={inpSm} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Engleză)</label>
                        <button onClick={() => translateProjectField(project, 'titleRo', 'En')} disabled={translating[`${project.id}-titleRo-En`]} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                          {translating[`${project.id}-titleRo-En`] ? '...' : '🔄 EN'}
                        </button>
                      </div>
                      <input value={project.titleEn} onChange={e => updateProjectField(project.id, 'titleEn', e.target.value)} style={inpSm} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={lbl}>Descriere (Română)</label>
                    <textarea value={project.descriptionRo} onChange={e => updateProjectField(project.id, 'descriptionRo', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Rusă)</label>
                        <button onClick={() => translateProjectField(project, 'descriptionRo', 'Ru')} disabled={translating[`${project.id}-descriptionRo-Ru`]} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                          {translating[`${project.id}-descriptionRo-Ru`] ? '...' : '🔄 RU'}
                        </button>
                      </div>
                      <textarea value={project.descriptionRu} onChange={e => updateProjectField(project.id, 'descriptionRu', e.target.value)} rows={2} style={{ ...inpSm, resize: 'vertical' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ ...lbl, marginBottom: 0 }}>Descriere (Engleză)</label>
                        <button onClick={() => translateProjectField(project, 'descriptionRo', 'En')} disabled={translating[`${project.id}-descriptionRo-En`]} style={{ ...btnGhost, padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                          {translating[`${project.id}-descriptionRo-En`] ? '...' : '🔄 EN'}
                        </button>
                      </div>
                      <textarea value={project.descriptionEn} onChange={e => updateProjectField(project.id, 'descriptionEn', e.target.value)} rows={2} style={{ ...inpSm, resize: 'vertical' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9B8050', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}>
                      <input type="checkbox" checked={project.active} onChange={e => updateProjectField(project.id, 'active', e.target.checked)} />
                      Activ (vizibil pe pagină)
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button onClick={() => moveProject(i, -1)} disabled={i === 0} style={{ ...btnGhost, padding: '0.25rem 0.5rem', opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                      <button onClick={() => moveProject(i, 1)} disabled={i === projects.length - 1} style={{ ...btnGhost, padding: '0.25rem 0.5rem', opacity: i === projects.length - 1 ? 0.4 : 1 }}>↓</button>
                      <button onClick={() => deleteProject(project.id)} style={btnDanger}>✕ Șterge</button>
                      <button onClick={() => saveProject(project)} disabled={savingProjectId === project.id} style={{ ...btnGold, padding: '0.35rem 1rem', fontSize: '0.8rem' }}>
                        {savingProjectId === project.id ? 'Se salvează...' : '💾 Salvează'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ─── Date bancare și PayPal ─── */}
          <div style={sectionBox}>
            <div style={sectionTitle}>💳 Date bancare și PayPal</div>

            {loadingConfig ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Conturi locale (MDL)</label>
                    <button onClick={addLocalAccount} style={{ ...btnGhost, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>+ Adaugă cont</button>
                  </div>
                  {config.localAccounts.map((acc, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input value={acc.bankName} onChange={e => updateLocalAccount(i, 'bankName', e.target.value)} placeholder="Bancă (ex: MAIB)" style={{ ...inpSm, flex: '0 0 120px' }} />
                      <input value={acc.accountLabel} onChange={e => updateLocalAccount(i, 'accountLabel', e.target.value)} placeholder="Etichetă (Cont/Card)" style={{ ...inpSm, flex: '0 0 110px' }} />
                      <input value={acc.accountNumber} onChange={e => updateLocalAccount(i, 'accountNumber', e.target.value)} placeholder="Număr cont/card" style={{ ...inpSm, flex: 1 }} />
                      <input value={acc.holder} onChange={e => updateLocalAccount(i, 'holder', e.target.value)} placeholder="Titular" style={{ ...inpSm, flex: '0 0 160px' }} />
                      <button onClick={() => removeLocalAccount(i)} style={btnDanger}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Conturi IBAN (diaspora)</label>
                    <button onClick={addIbanAccount} style={{ ...btnGhost, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>+ Adaugă IBAN</button>
                  </div>
                  {config.ibanAccounts.map((acc, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input value={acc.bankName} onChange={e => updateIbanAccount(i, 'bankName', e.target.value)} placeholder="Bancă" style={{ ...inpSm, flex: '0 0 110px' }} />
                      <input value={acc.iban} onChange={e => updateIbanAccount(i, 'iban', e.target.value)} placeholder="IBAN" style={{ ...inpSm, flex: 1 }} />
                      <input value={acc.swift} onChange={e => updateIbanAccount(i, 'swift', e.target.value)} placeholder="SWIFT" style={{ ...inpSm, flex: '0 0 130px' }} />
                      <input value={acc.beneficiary} onChange={e => updateIbanAccount(i, 'beneficiary', e.target.value)} placeholder="Beneficiar" style={{ ...inpSm, flex: '0 0 160px' }} />
                      <button onClick={() => removeIbanAccount(i)} style={btnDanger}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={lbl}>Email PayPal</label>
                    <input value={config.paypalEmail} onChange={e => setConfigField('paypalEmail', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Link PayPal.me</label>
                    <input value={config.paypalLink} onChange={e => setConfigField('paypalLink', e.target.value)} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={lbl}>Nume contact</label>
                    <input value={config.contactName} onChange={e => setConfigField('contactName', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Telefon</label>
                    <input value={config.contactPhone} onChange={e => setConfigField('contactPhone', e.target.value)} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={lbl}>Facebook URL</label>
                    <input value={config.facebookUrl} onChange={e => setConfigField('facebookUrl', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>TikTok URL</label>
                    <input value={config.tiktokUrl} onChange={e => setConfigField('tiktokUrl', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Instagram URL</label>
                    <input value={config.instagramUrl} onChange={e => setConfigField('instagramUrl', e.target.value)} style={inp} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Notă de siguranță</label>
                  <textarea value={config.safetyNote} onChange={e => setConfigField('safetyNote', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
              </>
            )}
          </div>

          {/* ─── Video-uri ─── */}
          <div style={sectionBox}>
            <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎬 Video-uri</span>
              <button onClick={addVideoLink} style={{ ...btnGhost, fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>+ Adaugă video</button>
            </div>
            {config.videoLinks.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px' }}>
                Niciun video adăugat.
              </div>
            ) : (
              config.videoLinks.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input value={v.url} onChange={e => updateVideoLink(i, 'url', e.target.value)} placeholder="Link video Facebook" style={{ ...inpSm, flex: 2 }} />
                  <input value={v.caption} onChange={e => updateVideoLink(i, 'caption', e.target.value)} placeholder="Descriere (opțional)" style={{ ...inpSm, flex: 1 }} />
                  <button onClick={() => removeVideoLink(i)} style={btnDanger}>✕</button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button onClick={saveConfig} disabled={savingConfig || loadingConfig} style={{ ...btnGold, fontSize: '1rem', padding: '0.625rem 2rem', opacity: savingConfig ? 0.7 : 1 }}>
              {savingConfig ? 'Se salvează...' : '💾 Salvează date bancare și video-uri'}
            </button>
          </div>

          {/* ─── Galerie foto ─── */}
          <div style={sectionBox}>
            <div style={sectionTitle}>📷 Galerie foto</div>
            <MediaGallery entityType="donatii" entityId="main" maxPhotos={30} />
          </div>
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
