'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/admin/AdminSidebar'
import ImageUploadButton from '@/components/admin/ImageUploadButton'

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false })

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function NouArticolPage() {
  const router = useRouter()
  const [form, setForm] = useState({ titleRo: '', titleRu: '', titleEn: '', slug: '', category: '', imageUrl: '', published: false, contentRo: '', contentRu: '', contentEn: '' })
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setForm(f => ({ ...f, titleRo: title, slug: slugify(title) }))
  }

  async function translate(field: string) {
    const sourceText = field.startsWith('title') ? form.titleRo : form.contentRo
    if (!sourceText.trim()) { setError('Completați mai întâi câmpul în română'); return }
    setTranslating(t => ({ ...t, [field]: true }))
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, field }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const val = field.endsWith('Ru') ? data.translations.ru : data.translations.en
      setForm(f => ({ ...f, [field]: val }))
    } catch { setError('Eroare la traducere DeepL') }
    finally { setTranslating(t => ({ ...t, [field]: false })) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/stiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }
      const created = await res.json()
      router.push(`/admin/stiri/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', backgroundColor: '#1A1008', border: '1px solid #2A1A0A',
    borderRadius: '4px', padding: '0.625rem 0.875rem', color: '#F2EBD9',
    fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', color: '#9B8050', fontSize: '0.875rem',
    marginBottom: '0.375rem', fontFamily: 'Georgia, serif',
  }
  const btnGhost: React.CSSProperties = { backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A', borderRadius: '4px', padding: '0.2rem 0.5rem', fontFamily: 'Georgia, serif', fontSize: '0.7rem', cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          backgroundColor: '#0A0704', borderBottom: '1px solid #1E1208',
          padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0,
        }}>
          <Link href="/admin/stiri" style={{ color: '#5A4020', fontFamily: 'Georgia, serif', fontSize: '0.9rem', textDecoration: 'none' }}>
            ← Înapoi
          </Link>
          <span style={{ color: '#2A1A0A' }}>|</span>
          <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
            Articol nou
          </span>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '860px' }}>
              <div>
                <label style={lbl}>Titlu (Română) *</label>
                <input type="text" value={form.titleRo} onChange={handleTitleChange} required
                  placeholder="Titlul articolului" style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Rusă)</label>
                    <button type="button" onClick={() => translate('titleRu')} disabled={!!translating['titleRu']} style={btnGhost}>
                    {translating['titleRu'] ? '...' : '🔄 RU'}
                  </button>
                  </div>
                  <input type="text" value={form.titleRu} onChange={e => setForm(f => ({ ...f, titleRu: e.target.value }))} placeholder="Заголовок..." style={inp} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Titlu (Engleză)</label>
                    <button type="button" onClick={() => translate('titleEn')} disabled={!!translating['titleEn']} style={btnGhost}>
                    {translating['titleEn'] ? '...' : '🔄 EN'}
                  </button>
                  </div>
                  <input type="text" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} placeholder="Title..." style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Slug (URL)</label>
                <input type="text" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  style={{ ...inp, color: '#9B8050' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Categorie</label>
                  <input type="text" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="ex: Sfinți, Evenimente..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>Imagine principală</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://..." style={{ ...inp, flex: 1 }} />
                    <ImageUploadButton onUpload={url => setForm(f => ({ ...f, imageUrl: url }))} />
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>Conținut (Română) *</label>
                <TipTapEditor
                  value={form.contentRo}
                  onChange={contentRo => setForm(f => ({ ...f, contentRo }))}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Conținut (Rusă)</label>
                  <button type="button" onClick={() => translate('contentRu')} disabled={!!translating['contentRu']} style={btnGhost}>
                    {translating['contentRu'] ? '...' : '🔄 RU'}
                  </button>
                </div>
                <TipTapEditor
                  value={form.contentRu}
                  onChange={contentRu => setForm(f => ({ ...f, contentRu }))}
                  placeholder="Содержание на русском языке..."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Conținut (Engleză)</label>
                  <button type="button" onClick={() => translate('contentEn')} disabled={!!translating['contentEn']} style={btnGhost}>
                    {translating['contentEn'] ? '...' : '🔄 EN'}
                  </button>
                </div>
                <TipTapEditor
                  value={form.contentEn}
                  onChange={contentEn => setForm(f => ({ ...f, contentEn }))}
                  placeholder="Content in English..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="published" checked={form.published}
                  onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: '#8B1A1A' }} />
                <label htmlFor="published" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>
                  Publicat imediat
                </label>
              </div>

              {error && (
                <div style={{
                  color: '#C06050', padding: '0.75rem 1rem', backgroundColor: '#1A0808',
                  border: '1px solid #3A1010', borderRadius: '4px', fontFamily: 'Georgia, serif', fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={saving} style={{
                  backgroundColor: saving ? '#5A1010' : '#8B1A1A',
                  color: '#F2EBD9', border: 'none', borderRadius: '4px',
                  padding: '0.75rem 2rem', fontSize: '1rem', fontFamily: 'Georgia, serif',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Se salvează...' : 'Salvează articolul'}
                </button>
                <Link href="/admin/stiri" style={{
                  backgroundColor: 'transparent', color: '#9B8050', border: '1px solid #2A1A0A',
                  borderRadius: '4px', padding: '0.75rem 2rem', fontSize: '1rem',
                  fontFamily: 'Georgia, serif', textDecoration: 'none', display: 'inline-block',
                }}>
                  Anulează
                </Link>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
