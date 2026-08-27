'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'

// Tab / Shift+Tab indentează paragraful curent. Folosim spații indivizibile ( )
// în loc de spații normale: browserul colapsează spațiile normale consecutive la
// randare (white-space: normal), așa că indentarea "dispărea" vizual pe pagina
// publică deși era salvată corect în HTML. Spațiile indivizibile nu sunt colapsate.
const INDENT = '    '

const TabExtension = Extension.create({
  name: 'tab',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        this.editor.chain().focus().insertContent(INDENT).run()
        return true
      },
      'Shift-Tab': () => {
        // șterge un bloc de indentare de la începutul liniei curente, dacă există
        const { state } = this.editor
        const { $from } = state.selection
        const lineStart = $from.start()
        const textBefore = state.doc.textBetween(lineStart, $from.pos, '\n', '\n')
        if (textBefore.endsWith(INDENT)) {
          return this.editor
            .chain()
            .focus()
            .deleteRange({ from: $from.pos - INDENT.length, to: $from.pos })
            .run()
        }
        return true
      },
    }
  },
})

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const toolbarButtons = [
  { label: 'B', title: 'Bold', action: (e: Editor | null) => e?.chain().focus().toggleBold().run(), isActive: (e: Editor | null) => e?.isActive('bold') },
  { label: 'I', title: 'Italic', action: (e: Editor | null) => e?.chain().focus().toggleItalic().run(), isActive: (e: Editor | null) => e?.isActive('italic') },
  { label: 'H2', title: 'Heading 2', action: (e: Editor | null) => e?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e: Editor | null) => e?.isActive('heading', { level: 2 }) },
  { label: 'H3', title: 'Heading 3', action: (e: Editor | null) => e?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e: Editor | null) => e?.isActive('heading', { level: 3 }) },
  { label: '• Listă', title: 'Bullet List', action: (e: Editor | null) => e?.chain().focus().toggleBulletList().run(), isActive: (e: Editor | null) => e?.isActive('bulletList') },
  { label: '1. Listă', title: 'Ordered List', action: (e: Editor | null) => e?.chain().focus().toggleOrderedList().run(), isActive: (e: Editor | null) => e?.isActive('orderedList') },
  { label: '—', title: 'Divider', action: (e: Editor | null) => e?.chain().focus().setHorizontalRule().run(), isActive: () => false },
]

export default function TipTapEditor({ value, onChange, placeholder = 'Scrieți conținutul...' }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      // Tiptap v3 include Link în StarterKit by default — îl dezactivăm aici ca să
      // înregistrăm propria instanță mai jos, cu opțiunile de care avem nevoie
      // (altfel apar două extensii "link" înregistrate, cu warning în consolă).
      StarterKit.configure({ link: false }),
      Placeholder.configure({ placeholder }),
      TabExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  function openLinkPrompt() {
    const prevUrl = editor?.getAttributes('link').href as string | undefined
    setLinkUrl(prevUrl || '')
    setShowLinkInput(true)
  }

  function applyLink() {
    const url = linkUrl.trim()
    if (!url) {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      // Acceptă atât URL-uri externe complete, cât și pagini interne (ex: /stiri/slug)
      const href = /^([a-z][a-z0-9+.-]*:|\/)/i.test(url) ? url : `https://${url}`
      editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const linkActive = editor?.isActive('link')

  return (
    <div style={{ border: '1px solid #2A1A0A', borderRadius: '4px', backgroundColor: '#1A1008' }}>
      <div style={{ borderBottom: '1px solid #2A1A0A', padding: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1008', borderRadius: '4px 4px 0 0' }}>
        {toolbarButtons.map(btn => {
          const active = btn.isActive(editor)
          return (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => btn.action(editor)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '3px',
                border: '1px solid',
                borderColor: active ? '#C9A84C' : '#2A1A0A',
                backgroundColor: active ? '#1A1200' : 'transparent',
                color: active ? '#C9A84C' : '#9B8050',
                fontSize: '0.8rem',
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          )
        })}

        {/* Buton link */}
        <button
          type="button"
          title="Inserează link"
          onClick={openLinkPrompt}
          style={{
            padding: '0.2rem 0.5rem',
            borderRadius: '3px',
            border: '1px solid',
            borderColor: linkActive ? '#C9A84C' : '#2A1A0A',
            backgroundColor: linkActive ? '#1A1200' : 'transparent',
            color: linkActive ? '#C9A84C' : '#9B8050',
            fontSize: '0.85rem',
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          🔗 Link
        </button>

        {showLinkInput && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.25rem' }}>
            <input
              type="text"
              autoFocus
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                if (e.key === 'Escape') { e.preventDefault(); setShowLinkInput(false) }
              }}
              placeholder="https://... sau /stiri/slug-articol"
              style={{
                backgroundColor: '#0D0905',
                border: '1px solid #2A1A0A',
                borderRadius: '3px',
                padding: '0.25rem 0.5rem',
                color: '#F2EBD9',
                fontSize: '0.78rem',
                fontFamily: 'Georgia, serif',
                outline: 'none',
                width: '260px',
                maxWidth: '50vw',
              }}
            />
            <button
              type="button"
              onClick={applyLink}
              style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid #C9A84C', backgroundColor: '#C9A84C', color: '#0D0905', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid #2A1A0A', backgroundColor: 'transparent', color: '#9B8050', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Anulează
            </button>
          </span>
        )}
      </div>

      {/* Zonă de text cu scroll propriu, independent de scroll-ul paginii — toolbar-ul
          de mai sus rămâne mereu vizibil pentru că e în afara acestui bloc scrolabil. */}
      <div
        className="tiptap-editor-scroll"
        style={{
          padding: '0.875rem',
          color: '#F2EBD9',
          fontFamily: 'Georgia, serif',
          lineHeight: 1.7,
          height: '420px',
          overflowY: 'auto',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror { outline: none; min-height: 100%; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #5A4020; float: left; pointer-events: none; height: 0;
        }
        .ProseMirror h2 { color: #C9A84C; font-size: 1.4rem; margin: 1rem 0 0.5rem; }
        .ProseMirror h3 { color: #9B8050; font-size: 1.15rem; margin: 0.75rem 0 0.375rem; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; }
        .ProseMirror li { margin-bottom: 0.25rem; }
        .ProseMirror hr { border-color: #2A1A0A; margin: 1rem 0; }
        .ProseMirror strong { color: #F2EBD9; }
        .ProseMirror em { color: #D4C8A0; }
        .ProseMirror a { color: #C9A84C; text-decoration: underline; }
        .tiptap-editor-scroll::-webkit-scrollbar { width: 8px; }
        .tiptap-editor-scroll::-webkit-scrollbar-thumb { background: #2A1A0A; border-radius: 4px; }
        .tiptap-editor-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  )
}
