'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

interface GalleryItem { url: string; alt: string }
interface VideoItem { url: string; title: string }

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnPrimary: React.CSSProperties = { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }
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

export default function AdminIstoriaBisericiiPage() {
  const [content, setContent] = useState('')
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [newImgUrl, setNewImgUrl] = useState('')
  const [newImgAlt, setNewImgAlt] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitle, setNewVideoTitle] = useState('')

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  useEffect(() => {
    fetch('/api/admin/settings?key=church_history_content')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setContent(data.content || '')
          setGallery(data.gallery || [])
          setVideos(data.videos || [])
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
        body: JSON.stringify({ key: 'church_history_content', value: { content, gallery, videos } }),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      showToast('Conținut salvat cu succes ✓', 'success')
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  function addImage() {
    if (!newImgUrl.trim()) return
    setGallery(g => [...g, { url: newImgUrl.trim(), alt: newImgAlt.trim() }])
    setNewImgUrl('')
    setNewImgAlt('')
  }

  function removeImage(i: number) {
    setGallery(g => g.filter((_, idx) => idx !== i))
  }

  function addVideo() {
    const url = newVideoUrl.trim()
    if (!url) return
    const id = extractYouTubeId(url)
    if (!id) { showToast('URL YouTube invalid. Exemplu: https://youtube.com/watch?v=...', 'error'); return }
    setVideos(v => [...v, { url, title: newVideoTitle.trim() || url }])
    setNewVideoUrl('')
    setNewVideoTitle('')
  }

  function removeVideo(i: number) {
    setVideos(v => v.filter((_, idx) => idx !== i))
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Istoria Bisericii</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>🏛️ Istoria Bisericii</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href="/istoria-bisericii" target="_blank" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-block' }}>
                ↗ Vizualizează pagina
              </a>
              <button onClick={handleSave} disabled={saving || loading} style={{ ...btnGold, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează tot'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
          ) : (
            <>
              {/* ─── Conținut text ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📝 Textul istoriei</div>
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '0.875rem' }}>
                  Editați conținutul principal al paginii Istoria Bisericii. Aceasta va înlocui textul implicit.
                </p>
                <TipTapEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Introduceți istoria bisericii..."
                />
              </div>

              {/* ─── Galerie foto ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>📷 Galerie foto</div>
                {/* Add form */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <label style={lbl}>URL imagine</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={newImgUrl}
                        onChange={e => setNewImgUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addImage()}
                        placeholder="https://... sau încarcă"
                        style={{ ...inp, flex: 1 }}
                      />
                      <ImageUploadButton onUpload={url => setNewImgUrl(url)} />
                    </div>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={lbl}>Descriere (opțional)</label>
                    <input
                      value={newImgAlt}
                      onChange={e => setNewImgAlt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addImage()}
                      placeholder="Altarul Bisericii..."
                      style={inp}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={addImage} style={btnPrimary}>+ Adaugă</button>
                  </div>
                </div>

                {gallery.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px' }}>
                    Nicio imagine adăugată. Adăugați URL-uri de imagini mai sus.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    {gallery.map((img, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A1A0A' }}>
                        <img
                          src={img.url}
                          alt={img.alt || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.backgroundColor = '#1A1008' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0.5rem' }}>
                          {img.alt && <span style={{ color: '#D4C4A0', fontSize: '0.65rem', fontFamily: 'Georgia, serif', lineHeight: 1.3 }}>{img.alt}</span>}
                          <button
                            onClick={() => removeImage(i)}
                            style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', backgroundColor: 'rgba(90,10,10,0.85)', border: 'none', borderRadius: '3px', color: '#F2EBD9', cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                  {gallery.length} {gallery.length === 1 ? 'imagine' : 'imagini'}
                </p>
              </div>

              {/* ─── Video ─── */}
              <div style={sectionBox}>
                <div style={sectionTitle}>▶ Video</div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <label style={lbl}>URL YouTube</label>
                    <input
                      value={newVideoUrl}
                      onChange={e => setNewVideoUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addVideo()}
                      placeholder="https://youtube.com/watch?v=..."
                      style={inp}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={lbl}>Titlu video</label>
                    <input
                      value={newVideoTitle}
                      onChange={e => setNewVideoTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addVideo()}
                      placeholder="Sfințirea Altarului..."
                      style={inp}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={addVideo} style={btnPrimary}>+ Adaugă</button>
                  </div>
                </div>
                {/* Preview URL helper */}
                {newVideoUrl && (() => {
                  const id = extractYouTubeId(newVideoUrl)
                  return id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#0A0704', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #1A1008' }}>
                      <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ color: '#4ACA4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>✓ Video YouTube detectat</span>
                    </div>
                  ) : (
                    <div style={{ color: '#CA8A4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠ URL YouTube nerecunoscut</div>
                  )
                })()}

                {videos.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.875rem', border: '1px dashed #2A1A0A', borderRadius: '6px' }}>
                    Niciun video adăugat. Adăugați link-uri YouTube mai sus.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    {videos.map((v, i) => {
                      const ytId = extractYouTubeId(v.url)
                      return (
                        <div key={i} style={{ backgroundColor: '#0A0704', border: '1px solid #2A1A0A', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                            {ytId ? (
                              <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', backgroundColor: '#1A1008', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A2A0A', fontSize: '2rem' }}>▶</div>
                            )}
                            <button
                              onClick={() => removeVideo(i)}
                              style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', backgroundColor: 'rgba(90,10,10,0.9)', border: 'none', borderRadius: '3px', color: '#F2EBD9', cursor: 'pointer', padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                            >✕</button>
                          </div>
                          <div style={{ padding: '0.6rem 0.75rem' }}>
                            <p style={{ color: '#D4C4A0', fontFamily: 'Georgia, serif', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <p style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                  {videos.length} {videos.length === 1 ? 'video' : 'video-uri'}
                </p>
              </div>

              {/* Bottom save */}
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
