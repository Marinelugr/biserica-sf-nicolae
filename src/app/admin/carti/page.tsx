'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────

interface BookCategory { id: string; name: string; emoji: string; color: string; order: number }
interface LibraryBook {
  id: string; titleRo: string; slug: string; type: string
  categoryId: string | null; category: BookCategory | null
  contentRo: string; author: string | null; source: string | null
  imageUrl: string | null; galleryUrls: string[]; videoUrl: string | null; videoTitle: string | null
  createdAt: string
}

const BOOK_TYPES = [
  { value: 'ACATIST', label: 'Acatist' },
  { value: 'CANON', label: 'Canon' },
  { value: 'RUGACIUNE', label: 'Rugăciune' },
  { value: 'VIATA_SFANT', label: 'Viața sfântului' },
  { value: 'TEOLOGIE', label: 'Teologie' },
  { value: 'ALTELE', label: 'Altele' },
]

const PRESET_COLORS = ['#C9A84C', '#8B1A1A', '#1A5A2A', '#1A2A6A', '#6A1A5A', '#5A4A1A']
const PRESET_EMOJIS = ['📖', '🙏', '✝️', '☦', '📜', '🕯️', '⛪', '📿', '🌿', '🌟']

// ── Styles ─────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A',
  borderRadius: '4px', padding: '0.6rem 0.875rem', color: '#F2EBD9',
  fontSize: '0.95rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', color: '#9B8050', fontSize: '0.8rem', marginBottom: '0.35rem', fontFamily: 'Georgia, serif',
}
const btnPrimary: React.CSSProperties = {
  backgroundColor: '#8B1A1A', color: '#F2EBD9', border: 'none',
  borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A',
  borderRadius: '4px', padding: '0.5rem 1.25rem', fontFamily: 'Georgia, serif', fontSize: '0.875rem', cursor: 'pointer',
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 400,
      backgroundColor: type === 'success' ? '#0A2A0A' : '#2A0A0A',
      border: `1px solid ${type === 'success' ? '#1A5A1A' : '#5A1A1A'}`,
      color: type === 'success' ? '#4ACA4A' : '#CA4A4A',
      padding: '0.875rem 1.25rem', borderRadius: '6px', fontFamily: 'Georgia, serif',
      fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', maxWidth: '340px',
    }}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}

// ── Confirm Modal ──────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '2rem', maxWidth: '380px', width: '100%' }}>
        <p style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', marginBottom: '1.5rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={btnGhost}>Anulează</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...btnPrimary, backgroundColor: '#5A0A0A' }}>
            {loading ? 'Se șterge...' : 'Șterge'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminCartiPage() {
  // Data
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [loading, setLoading] = useState(true)

  // Filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showCatPanel, setShowCatPanel] = useState(false)

  // Book form
  const [showBookForm, setShowBookForm] = useState(false)
  const [editBook, setEditBook] = useState<LibraryBook | null>(null)
  const [bookForm, setBookForm] = useState({ titleRo: '', type: 'ACATIST', categoryId: '', contentRo: '', author: '', source: '', imageUrl: '', galleryUrls: [] as string[], videoUrl: '', videoTitle: '' })
  const [savingBook, setSavingBook] = useState(false)

  // Category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState<BookCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', emoji: '📖', color: '#C9A84C' })
  const [savingCat, setSavingCat] = useState(false)

  // Delete
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null)
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [catsRes, booksRes] = await Promise.all([
      fetch('/api/admin/categorii-carti'),
      fetch('/api/admin/carti'),
    ])
    if (catsRes.ok) setCategories(await catsRes.json())
    if (booksRes.ok) setBooks(await booksRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Book CRUD ──────────────────────────────────────────────────────────

  function openNewBook() {
    setEditBook(null)
    setBookForm({ titleRo: '', type: 'ACATIST', categoryId: activeCategory || '', contentRo: '', author: '', source: '', imageUrl: '', galleryUrls: [], videoUrl: '', videoTitle: '' })
    setShowBookForm(true)
  }

  function openEditBook(book: LibraryBook) {
    setEditBook(book)
    setBookForm({ titleRo: book.titleRo, type: book.type, categoryId: book.categoryId || '', contentRo: book.contentRo, author: book.author || '', source: book.source || '', imageUrl: book.imageUrl || '', galleryUrls: book.galleryUrls || [], videoUrl: book.videoUrl || '', videoTitle: book.videoTitle || '' })
    setShowBookForm(true)
  }

  async function saveBook() {
    if (!bookForm.titleRo.trim()) { showToast('Titlul este obligatoriu', 'error'); return }
    setSavingBook(true)
    try {
      const url = editBook ? `/api/admin/carti/${editBook.id}` : '/api/admin/carti'
      const method = editBook ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookForm) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      showToast(editBook ? 'Carte actualizată ✓' : 'Carte adăugată ✓', 'success')
      setShowBookForm(false)
      fetchAll()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally { setSavingBook(false) }
  }

  async function confirmDeleteBook() {
    if (!deleteBookId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/carti/${deleteBookId}`, { method: 'DELETE' })
      showToast('Carte ștearsă ✓', 'success')
      setDeleteBookId(null)
      fetchAll()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  // ── Category CRUD ──────────────────────────────────────────────────────

  function openNewCat() {
    setEditCat(null)
    setCatForm({ name: '', emoji: '📖', color: '#C9A84C' })
    setShowCatForm(true)
  }

  function openEditCat(cat: BookCategory) {
    setEditCat(cat)
    setCatForm({ name: cat.name, emoji: cat.emoji, color: cat.color })
    setShowCatForm(true)
  }

  async function saveCat() {
    if (!catForm.name.trim()) { showToast('Numele este obligatoriu', 'error'); return }
    setSavingCat(true)
    try {
      const url = editCat ? `/api/admin/categorii-carti/${editCat.id}` : '/api/admin/categorii-carti'
      const method = editCat ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
      if (!res.ok) throw new Error('Eroare')
      showToast(editCat ? 'Categorie actualizată ✓' : 'Categorie adăugată ✓', 'success')
      setShowCatForm(false)
      fetchAll()
    } catch { showToast('Eroare la salvare', 'error') }
    finally { setSavingCat(false) }
  }

  async function confirmDeleteCat() {
    if (!deleteCatId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/categorii-carti/${deleteCatId}`, { method: 'DELETE' })
      showToast('Categorie ștearsă (cărțile au rămas fără categorie) ✓', 'success')
      setDeleteCatId(null)
      if (activeCategory === deleteCatId) setActiveCategory(null)
      fetchAll()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  // ── Filtered books ─────────────────────────────────────────────────────

  const filteredBooks = activeCategory
    ? books.filter(b => b.categoryId === activeCategory)
    : books

  // ── Render ─────────────────────────────────────────────────────────────

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

        {/* Breadcrumb */}
        <div style={{ backgroundColor: '#0A0704', borderBottom: '1px solid #1A1008', padding: '0.4rem 2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/admin" style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', textDecoration: 'none' }}>Admin</a>
          <span style={{ color: '#2A1A0A' }}>›</span>
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Bibliotecă</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          {/* Title + action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>📖 Bibliotecă ortodoxă</h1>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowCatPanel(v => !v)} style={btnGhost}>
                {showCatPanel ? '✕ Închide categorii' : '🏷️ Categorii'}
              </button>
              <button onClick={openNewBook} style={btnPrimary}>+ Carte nouă</button>
            </div>
          </div>

          {/* Category panel */}
          {showCatPanel && (
            <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>Gestionare categorii</span>
                <button onClick={openNewCat} style={btnPrimary}>+ Categorie nouă</button>
              </div>
              {categories.length === 0 ? (
                <p style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>Nicio categorie. Adaugă prima categorie.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#0A0704', borderRadius: '6px', border: '1px solid #1E1208' }}>
                      <span style={{ fontSize: '1.25rem' }}>{cat.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</div>
                        <div style={{ width: '32px', height: '4px', backgroundColor: cat.color, borderRadius: '2px', marginTop: '0.25rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                        <button onClick={() => openEditCat(cat)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>✎</button>
                        <button onClick={() => setDeleteCatId(cat.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid', borderColor: activeCategory === null ? '#C9A84C' : '#2A1A0A', backgroundColor: activeCategory === null ? '#1A1200' : 'transparent', color: activeCategory === null ? '#C9A84C' : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Toate ({books.length})
            </button>
            {categories.map(cat => {
              const count = books.filter(b => b.categoryId === cat.id).length
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid', borderColor: isActive ? cat.color : '#2A1A0A', backgroundColor: isActive ? '#1A1200' : 'transparent', color: isActive ? cat.color : '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {cat.emoji} {cat.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Books table */}
          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
            ) : filteredBooks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                Nicio carte. {!activeCategory ? 'Adaugă prima carte.' : 'Nicio carte în această categorie.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A1A0A' }}>
                    {['Titlu', 'Tip', 'Categorie', 'Autor', 'Acțiuni'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5A4020', fontSize: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book, i) => (
                    <tr key={book.id} style={{ borderBottom: i < filteredBooks.length - 1 ? '1px solid #1E1208' : 'none' }}>
                      <td style={{ padding: '0.875rem 1rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.titleRo}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'Georgia, serif', backgroundColor: '#1A1008', color: '#9B8050', border: '1px solid #2A1A0A' }}>
                          {BOOK_TYPES.find(t => t.value === book.type)?.label || book.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {book.category ? (
                          <span style={{ color: book.category.color, fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                            {book.category.emoji} {book.category.name}
                          </span>
                        ) : (
                          <span style={{ color: '#3A2A0A', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>{book.author || '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button onClick={() => openEditBook(book)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Editează</button>
                        <button onClick={() => setDeleteBookId(book.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Șterge</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* ── Book Form Modal ──────────────────────────────────────────────── */}
      {showBookForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '700px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Drawer header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
                {editBook ? 'Editare carte' : 'Carte nouă'}
              </span>
              <button onClick={() => setShowBookForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            {/* Form */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
              <div>
                <label style={lbl}>Titlu *</label>
                <input value={bookForm.titleRo} onChange={e => setBookForm(f => ({ ...f, titleRo: e.target.value }))} placeholder="Titlul cărții" style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Tip *</label>
                  <select value={bookForm.type} onChange={e => setBookForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                    {BOOK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Categorie</label>
                  <select value={bookForm.categoryId} onChange={e => setBookForm(f => ({ ...f, categoryId: e.target.value }))} style={inp}>
                    <option value="">— Fără categorie —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Autor</label>
                  <input value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} placeholder="ex: Sfântul Ioan Gură de Aur" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Sursă</label>
                  <input value={bookForm.source} onChange={e => setBookForm(f => ({ ...f, source: e.target.value }))} placeholder="ex: Mineiul pe Decembrie" style={inp} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={lbl}>Conținut</label>
                <TipTapEditor
                  value={bookForm.contentRo}
                  onChange={val => setBookForm(f => ({ ...f, contentRo: val }))}
                  placeholder="Scrieți conținutul cărții..."
                />
              </div>

              {/* ── Imagine principală ──────────────────────────────────── */}
              <div style={{ borderTop: '1px solid #1E1208', paddingTop: '1.1rem' }}>
                <div style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', marginBottom: '0.875rem' }}>🖼️ Imagine principală (cover)</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    value={bookForm.imageUrl}
                    onChange={e => setBookForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    style={{ ...inp, flex: 1 }}
                  />
                  <ImageUploadButton onUpload={url => setBookForm(f => ({ ...f, imageUrl: url }))} label="Încarcă" />
                </div>
                {bookForm.imageUrl && (
                  <div style={{ marginTop: '0.75rem', position: 'relative', display: 'inline-block' }}>
                    <img src={bookForm.imageUrl} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <button onClick={() => setBookForm(f => ({ ...f, imageUrl: '' }))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#5A0A0A', border: 'none', color: '#F2EBD9', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                )}
              </div>

              {/* ── Galerie imagini ─────────────────────────────────────── */}
              <div style={{ borderTop: '1px solid #1E1208', paddingTop: '1.1rem' }}>
                <div style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', marginBottom: '0.875rem' }}>📷 Galerie imagini</div>
                <ImageUploadButton
                  onUpload={url => setBookForm(f => ({ ...f, galleryUrls: [...f.galleryUrls, url] }))}
                  label="+ Adaugă imagine"
                />
                {bookForm.galleryUrls.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {bookForm.galleryUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt="" style={{ width: '72px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <button
                          onClick={() => setBookForm(f => ({ ...f, galleryUrls: f.galleryUrls.filter((_, j) => j !== i) }))}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#5A0A0A', border: 'none', color: '#F2EBD9', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Video ───────────────────────────────────────────────── */}
              <div style={{ borderTop: '1px solid #1E1208', paddingTop: '1.1rem' }}>
                <div style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', marginBottom: '0.875rem' }}>🎬 Video (YouTube / Vimeo)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>Titlul video-ului</label>
                    <input value={bookForm.videoTitle} onChange={e => setBookForm(f => ({ ...f, videoTitle: e.target.value }))} placeholder="ex: Acatistul Sfântului Nicolae — Cântare" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>URL YouTube / Vimeo</label>
                    <input value={bookForm.videoUrl} onChange={e => setBookForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." style={inp} />
                  </div>
                  {bookForm.videoUrl && extractYouTubeId(bookForm.videoUrl) && (
                    <div style={{ aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A1A0A', maxWidth: '380px' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(bookForm.videoUrl)}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={saveBook} disabled={savingBook} style={{ ...btnPrimary, opacity: savingBook ? 0.6 : 1 }}>
                {savingBook ? 'Se salvează...' : editBook ? 'Actualizează' : 'Salvează'}
              </button>
              <button onClick={() => setShowBookForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Form Modal ──────────────────────────────────────────── */}
      {showCatForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
                {editCat ? 'Editare categorie' : 'Categorie nouă'}
              </span>
              <button onClick={() => setShowCatForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Nume categorie *</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Acatiste și Canoane" style={inp} />
              </div>

              <div>
                <label style={lbl}>Emoji</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {PRESET_EMOJIS.map(em => (
                    <button key={em} onClick={() => setCatForm(f => ({ ...f, emoji: em }))} style={{ fontSize: '1.25rem', padding: '0.3rem', background: 'none', border: `2px solid ${catForm.emoji === em ? '#C9A84C' : 'transparent'}`, borderRadius: '4px', cursor: 'pointer' }}>{em}</button>
                  ))}
                </div>
                <input value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Sau scrie un emoji" style={{ ...inp, maxWidth: '120px' }} />
              </div>

              <div>
                <label style={lbl}>Culoare</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {PRESET_COLORS.map(col => (
                    <button key={col} onClick={() => setCatForm(f => ({ ...f, color: col }))} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: col, border: `3px solid ${catForm.color === col ? '#F2EBD9' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: '40px', height: '32px', borderRadius: '4px', border: '1px solid #2A1A0A', backgroundColor: '#1A1008', cursor: 'pointer' }} />
                  <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>{catForm.color}</span>
                </div>
              </div>

              {/* Preview */}
              <div style={{ padding: '0.75rem', backgroundColor: '#0A0704', borderRadius: '6px', border: '1px solid #1E1208', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{catForm.emoji || '📖'}</span>
                <div>
                  <div style={{ color: catForm.color, fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>{catForm.name || 'Previzualizare'}</div>
                  <div style={{ width: '40px', height: '3px', backgroundColor: catForm.color, borderRadius: '2px', marginTop: '0.25rem' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={saveCat} disabled={savingCat} style={{ ...btnPrimary, opacity: savingCat ? 0.6 : 1 }}>
                {savingCat ? 'Se salvează...' : editCat ? 'Actualizează' : 'Adaugă'}
              </button>
              <button onClick={() => setShowCatForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modals ────────────────────────────────────────── */}
      {deleteBookId && (
        <ConfirmModal
          message="Sigur doriți să ștergeți această carte? Acțiunea nu poate fi anulată."
          onConfirm={confirmDeleteBook}
          onCancel={() => setDeleteBookId(null)}
          loading={deleting}
        />
      )}
      {deleteCatId && (
        <ConfirmModal
          message="Sigur doriți să ștergeți această categorie? Cărțile vor rămâne dar fără categorie."
          onConfirm={confirmDeleteCat}
          onCancel={() => setDeleteCatId(null)}
          loading={deleting}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
