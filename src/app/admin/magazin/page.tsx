'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import ImageUploadButton from '@/components/admin/ImageUploadButton'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

interface Product {
  id: string; slug: string; nameRo: string; price: string
  descriptionRo: string | null; imageUrl: string | null
  stock: number; category: string | null; active: boolean
}

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

const emptyForm = { nameRo: '', price: '', descriptionRo: '', imageUrl: '', stock: '0', category: '', active: true }

export default function AdminMagazinPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), [])

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/admin/magazin')
    if (res.ok) setProducts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openNew() {
    setEditProduct(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({ nameRo: p.nameRo, price: p.price, descriptionRo: p.descriptionRo || '', imageUrl: p.imageUrl || '', stock: String(p.stock), category: p.category || '', active: p.active })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nameRo.trim() || !form.price.trim()) { showToast('Numele și prețul sunt obligatorii', 'error'); return }
    setSaving(true)
    try {
      const url = editProduct ? `/api/admin/magazin/${editProduct.id}` : '/api/admin/magazin'
      const method = editProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      showToast(editProduct ? 'Produs actualizat ✓' : 'Produs adăugat ✓', 'success')
      setShowForm(false)
      fetchProducts()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Eroare la salvare', 'error')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/magazin/${deleteId}`, { method: 'DELETE' })
      showToast('Produs șters ✓', 'success')
      setDeleteId(null)
      fetchProducts()
    } catch { showToast('Eroare la ștergere', 'error') }
    finally { setDeleting(false) }
  }

  const filtered = products.filter(p => !search || p.nameRo.toLowerCase().includes(search.toLowerCase()))

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
          <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>Magazin</span>
        </div>

        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h1 style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>🛒 Magazin</h1>
            <button onClick={openNew} style={btnPrimary}>+ Produs nou</button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută după nume..." style={{ ...inp, maxWidth: '280px' }} />
            {search && <button onClick={() => setSearch('')} style={btnGhost}>✕ Resetează</button>}
          </div>

          {/* Table */}
          <div style={{ backgroundColor: '#110C07', border: '1px solid #2A1A0A', borderRadius: '8px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>Se încarcă...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5A4020', fontFamily: 'Georgia, serif' }}>
                {products.length === 0 ? 'Niciun produs. Adaugă primul produs.' : 'Niciun rezultat pentru filtrul aplicat.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A1A0A' }}>
                    {['Imagine', 'Nume', 'Preț', 'Stoc', 'Categorie', 'Activ', 'Acțiuni'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#5A4020', fontSize: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1E1208' : 'none' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          : <span style={{ color: '#3A2A0A', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', fontSize: '0.9rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nameRo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {p.price} MDL
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: p.stock > 0 ? '#9B8050' : '#C06050', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
                        {p.category || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: p.active ? '#4ACA4A' : '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
                          {p.active ? '✓ Da' : '✕ Nu'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Editează</button>
                        <button onClick={() => setDeleteId(p.id)} style={{ background: 'none', border: 'none', color: '#C06050', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>Șterge</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {filtered.length} din {products.length} produse
          </div>
        </main>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '560px', height: '100vh', backgroundColor: '#0D0905', borderLeft: '1px solid #2A1A0A', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E1208', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>{editProduct ? 'Editare produs' : 'Produs nou'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9B8050', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
              <div>
                <label style={lbl}>Nume produs *</label>
                <input value={form.nameRo} onChange={e => setForm(f => ({ ...f, nameRo: e.target.value }))} placeholder="Lumânări de ceară..." style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={lbl}>Preț (MDL) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="50" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Stoc</label>
                  <input type="number" min="0" step="1" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Categorie</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Lumânări, Icoane, Cărți..." style={inp} />
              </div>

              {/* Image */}
              <div>
                <label style={lbl}>URL imagine</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={{ ...inp, flex: 1 }} />
                  <ImageUploadButton onUpload={url => setForm(f => ({ ...f, imageUrl: url }))} />
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2A1A0A', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <label style={lbl}>Descriere</label>
                <TipTapEditor value={form.descriptionRo} onChange={val => setForm(f => ({ ...f, descriptionRo: val }))} placeholder="Descrierea produsului..." />
              </div>

              {/* Active toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                <span style={{ color: '#9B8050', fontFamily: 'Georgia, serif', fontSize: '0.875rem' }}>Vizibil în magazin public</span>
              </label>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1E1208', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Se salvează...' : editProduct ? 'Actualizează' : 'Adaugă produs'}</button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal message="Sigur doriți să ștergeți acest produs?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
