'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import { slugify } from '@/lib/utils'

interface VideoCategory { id: string; name: string; slug: string; order: number; _count: { videos: number } }
interface Video {
  id: string; title: string; slug: string; url: string; platform: string; videoId: string
  categoryId: string | null; description: string | null; order: number; createdAt: string
  category: { id: string; name: string } | null
}

// ─── URL parsing ─────────────────────────────────────────────────────────────

function parseVideoUrl(url: string): { platform: string; videoId: string } | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  if (ytMatch) return { platform: 'youtube', videoId: ytMatch[1] }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) return { platform: 'vimeo', videoId: vimeoMatch[1] }
  return null
}

function getThumbnail(platform: string, videoId: string) {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  if (platform === 'vimeo') return `https://vumbnail.com/${videoId}.jpg`
  return null
}

function getEmbedUrl(platform: string, videoId: string) {
  if (platform === 'youtube') return `https://www.youtube.com/embed/${videoId}`
  if (platform === 'vimeo') return `https://player.vimeo.com/video/${videoId}`
  return null
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9', fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif' }
const btnPrimary: React.CSSProperties = { backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none', borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer' }
const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.45rem 0.875rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', cursor: 'pointer' }

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
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

const emptyForm = { title: '', slug: '', url: '', categoryId: '', description: '' }

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminVideoPage() {
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string>('all')

  // Category edit state
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [catLoading, setCatLoading] = useState(false)

  // Video form state
  const [showForm, setShowForm] = useState(false)
  const [editVideo, setEditVideo] = useState<Video | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [urlParsed, setUrlParsed] = useState<{ platform: string; videoId: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/admin/video-categorii')
    if (res.ok) setCategories(await res.json())
  }, [])

  const fetchVideos = useCallback(async () => {
    const qs = selectedCat !== 'all' ? `?categoryId=${selectedCat}` : ''
    const res = await fetch(`/api/admin/video${qs}`)
    if (res.ok) setVideos(await res.json())
    setLoading(false)
  }, [selectedCat])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { setLoading(true); fetchVideos() }, [fetchVideos])

  // Parse URL as user types
  useEffect(() => {
    setUrlParsed(form.url ? parseVideoUrl(form.url) : null)
  }, [form.url])

  // ─── Category actions ─────────────────────────────────────────────────────

  async function handleAddCat() {
    if (!newCatName.trim()) return
    setCatLoading(true)
    try {
      const res = await fetch('/api/admin/video-categorii', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) })
      if (!res.ok) throw new Error((await res.json()).error)
      setNewCatName(''); setAddingCat(false)
      showToast('Categorie adăugată ✓', 'success')
      fetchCategories()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Eroare', 'error') }
    finally { setCatLoading(false) }
  }

  async function handleRenameCat() {
    if (!editCatId || !editCatName.trim()) return
    setCatLoading(true)
    try {
      const res = await fetch(`/api/admin/video-categorii/${editCatId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editCatName.trim() }) })
      if (!res.ok) throw new Error((await res.json()).error)
      setEditCatId(null)
      showToast('Categorie redenumită ✓', 'success')
      fetchCategories()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Eroare', 'error') }
    finally { setCatLoading(false) }
  }

  async function handleDeleteCat() {
    if (!deleteCatId) return
    setCatLoading(true)
    try {
      await fetch(`/api/admin/video-categorii/${deleteCatId}`, { method: 'DELETE' })
      showToast('Categorie ștearsă ✓', 'success')
      if (selectedCat === deleteCatId) setSelectedCat('all')
      setDeleteCatId(null)
      fetchCategories(); fetchVideos()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setCatLoading(false) }
  }

  // ─── Video actions ────────────────────────────────────────────────────────

  function openNew() {
    setEditVideo(null)
    setForm({ ...emptyForm, categoryId: selectedCat !== 'all' ? selectedCat : '' })
    setSlugTouched(false)
    setShowForm(true)
  }

  function openEdit(v: Video) {
    setEditVideo(v)
    setForm({ title: v.title, slug: v.slug, url: v.url, categoryId: v.categoryId || '', description: v.description || '' })
    setSlugTouched(true)
    setShowForm(true)
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setForm(f => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) { showToast('Titlul și URL-ul sunt obligatorii', 'error'); return }
    const parsed = parseVideoUrl(form.url)
    if (!parsed) { showToast('URL invalid. Suportat: YouTube și Vimeo', 'error'); return }
    setSaving(true)
    try {
      const body = { title: form.title, slug: form.slug || slugify(form.title), url: form.url, platform: parsed.platform, videoId: parsed.videoId, categoryId: form.categoryId || null, description: form.description }
      const url = editVideo ? `/api/admin/video/${editVideo.id}` : '/api/admin/video'
      const method = editVideo ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast(editVideo ? 'Video actualizat ✓' : 'Video adăugat ✓', 'success')
      setShowForm(false)
      fetchVideos(); fetchCategories()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteVideo() {
    if (!deleteVideoId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/video/${deleteVideoId}`, { method: 'DELETE' })
      showToast('Video șters ✓', 'success')
      setDeleteVideoId(null)
      fetchVideos(); fetchCategories()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  const totalVideos = categories.reduce((sum, c) => sum + c._count.videos, 0)

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />

      {/* ─── Main area ─── */}
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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Video</span>
        </div>

        {/* Content: categories sidebar + video grid */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ─── Categories sidebar ─── */}
          <div style={{ width: '220px', flexShrink: 0, backgroundColor: '#0A0704', borderRight: '1px solid #1A1008', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #1A1008', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Categorii</span>
              <button onClick={() => { setAddingCat(true); setTimeout(() => document.getElementById('new-cat-inp')?.focus(), 50) }} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} title="Adaugă categorie">+</button>
            </div>

            {/* Add category inline */}
            {addingCat && (
              <div style={{ padding: '0.75rem', borderBottom: '1px solid #1A1008', display: 'flex', gap: '0.4rem' }}>
                <input
                  id="new-cat-inp"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); if (e.key === 'Escape') { setAddingCat(false); setNewCatName('') } }}
                  placeholder="Denumire..."
                  style={{ ...inp, padding: '0.35rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                />
                <button onClick={handleAddCat} disabled={catLoading} style={{ ...btnPrimary, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✓</button>
                <button onClick={() => { setAddingCat(false); setNewCatName('') }} style={{ ...btnGhost, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
              </div>
            )}

            {/* "All" filter */}
            <button
              onClick={() => setSelectedCat('all')}
              style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', backgroundColor: selectedCat === 'all' ? '#1A1008' : 'transparent', border: 'none', borderLeft: selectedCat === 'all' ? '3px solid #C9A84C' : '3px solid transparent', color: selectedCat === 'all' ? '#C9A84C' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Toate</span>
              <span style={{ color: '#5A4020', fontSize: '0.75rem' }}>{totalVideos}</span>
            </button>

            {/* Category list */}
            {categories.map(cat => (
              <div key={cat.id} style={{ position: 'relative' }}>
                {editCatId === cat.id ? (
                  <div style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.35rem' }}>
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameCat(); if (e.key === 'Escape') setEditCatId(null) }}
                      autoFocus
                      style={{ ...inp, padding: '0.3rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                    />
                    <button onClick={handleRenameCat} disabled={catLoading} style={{ ...btnPrimary, padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>✓</button>
                    <button onClick={() => setEditCatId(null)} style={{ ...btnGhost, padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedCat(cat.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', backgroundColor: selectedCat === cat.id ? '#1A1008' : 'transparent', border: 'none', borderLeft: selectedCat === cat.id ? '3px solid #C9A84C' : '3px solid transparent', color: selectedCat === cat.id ? '#C9A84C' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{cat.name}</span>
                    <span style={{ color: '#5A4020', fontSize: '0.75rem', flexShrink: 0 }}>{cat._count.videos}</span>
                  </button>
                )}

                {/* Cat actions on hover — always visible as tiny icons */}
                {editCatId !== cat.id && (
                  <div style={{ position: 'absolute', right: '2.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name) }} style={{ background: 'none', border: 'none', color: '#3A2A0A', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.2rem' }} title="Redenumește">✏</button>
                    <button onClick={() => setDeleteCatId(cat.id)} style={{ background: 'none', border: 'none', color: '#3A0A0A', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.2rem' }} title="Șterge">✕</button>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && !addingCat && (
              <p style={{ padding: '1rem', color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textAlign: 'center' }}>
                Fără categorii.<br />Apasă + pentru a adăuga.
              </p>
            )}
          </div>

          {/* ─── Videos grid ─── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.25rem', margin: 0 }}>
                  🎬 {selectedCat === 'all' ? 'Toate video-urile' : categories.find(c => c.id === selectedCat)?.name || 'Video'}
                </h1>
                <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>{videos.length} video-uri</span>
              </div>
              <button onClick={openNew} style={btnPrimary}>+ Video nou</button>
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem', flex: 1 }}>
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
              ) : videos.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎬</div>
                  <p>Niciun video. Apasă "Video nou" pentru a adăuga primul.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {videos.map(v => {
                    const thumb = getThumbnail(v.platform, v.videoId)
                    return (
                      <div key={v.id} style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Thumbnail */}
                        <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#0A0704' }}>
                          {thumb ? (
                            <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A2A0A', fontSize: '2rem' }}>▶</div>
                          )}
                          {/* Platform badge */}
                          <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', backgroundColor: v.platform === 'youtube' ? 'rgba(200,0,0,0.85)' : 'rgba(26,183,234,0.85)', color: '#fff', fontFamily: 'Georgia, serif', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {v.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                          </span>
                          {/* Play overlay */}
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2EBD9', fontSize: '1rem', textDecoration: 'none' }}>▶</a>
                          </div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <h3 style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>{v.title}</h3>
                          {v.category && (
                            <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.75rem', backgroundColor: '#1A1008', padding: '0.15rem 0.5rem', borderRadius: '3px', alignSelf: 'flex-start' }}>{v.category.name}</span>
                          )}
                          {v.description && (
                            <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                            <button onClick={() => openEdit(v)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.825rem', padding: 0 }}>Editează</button>
                            <button onClick={() => setDeleteVideoId(v.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.825rem', padding: 0 }}>Șterge</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Video form drawer ─── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '520px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>{editVideo ? 'Editare video' : 'Video nou'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1, overflowY: 'auto' }}>

              {/* URL */}
              <div>
                <label style={lbl}>URL video (YouTube sau Vimeo) *</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... sau https://vimeo.com/..."
                  style={inp}
                />
                {/* Preview */}
                {form.url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {urlParsed ? (
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', backgroundColor: '#0A0704', borderRadius: '6px', border: '1px solid #1A1008' }}>
                        {getThumbnail(urlParsed.platform, urlParsed.videoId) && (
                          <img src={getThumbnail(urlParsed.platform, urlParsed.videoId)!} alt="" style={{ width: '96px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        )}
                        <div>
                          <span style={{ color: '#4ACA4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem', display: 'block' }}>
                            ✓ {urlParsed.platform === 'youtube' ? 'YouTube' : 'Vimeo'} detectat
                          </span>
                          <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>ID: {urlParsed.videoId}</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#CA8A4A', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>⚠ URL nerecunoscut. Suportat: YouTube și Vimeo.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={lbl}>Titlu *</label>
                <input
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Sfânta Liturghie — Duminica Floriilor 2024"
                  style={inp}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={lbl}>Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })) }}
                  placeholder="duminica-a-5a-dupa-cincizecime"
                  style={{ ...inp, color: '#9B8050' }}
                />
                <span style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.75rem', display: 'block', marginTop: '0.35rem' }}>
                  /video/{categories.find(c => c.id === form.categoryId)?.slug || '…'}/{form.slug || '…'}
                </span>
              </div>

              {/* Category */}
              <div>
                <label style={lbl}>Categorie</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} style={inp}>
                  <option value="">— Fără categorie —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Descriere (opțional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Scurtă descriere a video-ului..."
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Se salvează...' : editVideo ? 'Actualizează' : 'Adaugă video'}
              </button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {deleteCatId && (
        <ConfirmModal
          message={`Sigur ștergeți categoria "${categories.find(c => c.id === deleteCatId)?.name}"? Video-urile din ea rămân fără categorie.`}
          onConfirm={handleDeleteCat}
          onCancel={() => setDeleteCatId(null)}
          loading={catLoading}
        />
      )}
      {deleteVideoId && (
        <ConfirmModal
          message="Sigur doriți să ștergeți acest video?"
          onConfirm={handleDeleteVideo}
          onCancel={() => setDeleteVideoId(null)}
          loading={deleting}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
