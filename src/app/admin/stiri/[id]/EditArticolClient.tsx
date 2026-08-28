'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'
import MediaGallery from '@/components/admin/MediaGallery'
import { utcToChisinauLocalInputValue } from '@/lib/chisinauTime'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

interface Article {
  id: string
  titleRo: string
  slug: string
  category: string | null
  imageUrl: string | null
  contentRo: string
  seoKeywords: string | null
  published: boolean
  scheduledFor: Date | null
}

interface ArticleForm {
  titleRo: string
  slug: string; category: string; imageUrl: string
  contentRo: string
  seoKeywords: string
  published: boolean
  scheduledFor: string
}

const inp: React.CSSProperties = { width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.625rem 0.875rem', color: '#F2EBD9', fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', color: '#9B8050', fontSize: '0.875rem', marginBottom: '0.375rem', fontFamily: 'Georgia, serif' }
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

export default function EditArticolClient({ article }: { article: Article }) {
  const router = useRouter()
  const DRAFT_KEY = `draft_stire_${article.id}`

  const defaultForm: ArticleForm = {
    titleRo: article.titleRo,
    slug: article.slug,
    category: article.category || '',
    imageUrl: article.imageUrl || '',
    contentRo: article.contentRo,
    seoKeywords: article.seoKeywords || '',
    published: article.published,
    scheduledFor: article.scheduledFor ? utcToChisinauLocalInputValue(new Date(article.scheduledFor)) : '',
  }

  const [form, setForm] = useState<ArticleForm>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try {
          return JSON.parse(saved) as ArticleForm
        } catch { /* ignore */ }
      }
    }
    return defaultForm
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const formRef = useRef(form)
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  // Keep ref in sync with state for use in interval
  useEffect(() => { formRef.current = form }, [form])

  // Auto-save draft to localStorage every 30s
  useEffect(() => {
    const t = setInterval(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formRef.current))
        const now = new Date()
        setLastSaved(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`)
      } catch { /* ignore */ }
    }, 30000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stiri/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Eroare la salvare')
      localStorage.removeItem(DRAFT_KEY)
      setLastSaved(null)
      showToast('Articol salvat ✓', 'success')
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Ștergi acest articol definitiv?')) return
    await fetch(`/api/admin/stiri/${article.id}`, { method: 'DELETE' })
    router.push('/admin/stiri')
  }

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1E1208', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/admin/stiri" style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.9rem', textDecoration: 'none' }}>← Înapoi</Link>
            <span style={{ color: '#2A1A0A' }}>|</span>
            <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>Editare articol</span>
          </div>
          <AdminSignOutButton />
        </header>

        <main style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }} className="p-4 sm:px-8 sm:py-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.4rem', margin: 0 }}>📰 Editare articol</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {lastSaved && (
                <span style={{ color: '#5A8050', fontFamily: 'Georgia, serif', fontSize: '0.75rem' }}>
                  💾 Draft salvat la {lastSaved}
                </span>
              )}
              <button onClick={handleDelete} style={{ backgroundColor: 'transparent', color: '#CA4A4A', border: '1px solid #5A1A1A', borderRadius: '4px', padding: '0.5rem 1rem', fontFamily: 'Georgia, serif', fontSize: '0.825rem', cursor: 'pointer' }}>
                🗑 Șterge
              </button>
              <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.5rem 1.5rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Se salvează...' : '💾 Salvează'}
              </button>
            </div>
          </div>

          {/* ─── Date articol ─── */}
          <div style={sectionBox}>
            <div style={sectionTitle}>📝 Date articol</div>
            <div style={{ display: 'grid', gap: '1.1rem' }}>
              <div>
                <label style={lbl}>Titlu *</label>
                <input value={form.titleRo} onChange={e => setForm(f => ({ ...f, titleRo: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Slug (URL)</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={{ ...inp, color: '#9B8050' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={lbl}>Categorie</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ex: Sfinți, Evenimente..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>Imagine principală</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={{ ...inp, flex: 1 }} />
                    <ImageUploadButton onUpload={url => setForm(f => ({ ...f, imageUrl: url }))} />
                  </div>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" style={{ marginTop: '0.5rem', width: '80px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>
              </div>
              <div>
                <label style={lbl}>Cuvinte cheie SEO (opțional, separate prin virgulă)</label>
                <input value={form.seoKeywords} onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))} placeholder="ex: biserică ortodoxă, Sfântul Nicolae, hram, Criuleni" style={inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="pub" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} style={{ width: '1rem', height: '1rem', accentColor: '#8B1A1A' }} />
                <label htmlFor="pub" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>Publicat</label>
              </div>
              <div>
                <label style={lbl}>Programează publicarea pentru (opțional)</label>
                <input type="datetime-local" value={form.scheduledFor}
                  onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))}
                  style={{ ...inp, colorScheme: 'dark' }} />
                <p style={{ color: '#5A4020', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                  Ora Chișinău. Lăsat gol = vizibil imediat dacă „Publicat” e bifat.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Conținut ─── */}
          <div style={sectionBox}>
            <div style={sectionTitle}>📝 Conținut</div>
            <TipTapEditor value={form.contentRo} onChange={v => setForm(f => ({ ...f, contentRo: v }))} />
          </div>

          {/* ─── Galerie foto articol ─── */}
          <div style={sectionBox}>
            <div style={sectionTitle}>📷 Galerie foto articol</div>
            <MediaGallery entityType="article" entityId={article.id} maxPhotos={50} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
            <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#C9A84C', color: '#0D0905', border: 'none', borderRadius: '4px', padding: '0.625rem 2rem', fontFamily: 'Georgia, serif', fontSize: '1rem', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Se salvează...' : '💾 Salvează tot'}
            </button>
          </div>
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
