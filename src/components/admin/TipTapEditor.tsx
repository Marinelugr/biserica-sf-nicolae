'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

const TabExtension = Extension.create({
  name: 'tab',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        this.editor.chain().focus().insertContent('    ').run()
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
  { label: 'B', title: 'Bold', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bold') },
  { label: 'I', title: 'Italic', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('italic') },
  { label: 'H2', title: 'Heading 2', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 2 }) },
  { label: 'H3', title: 'Heading 3', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('heading', { level: 3 }) },
  { label: '• Listă', title: 'Bullet List', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('bulletList') },
  { label: '1. Listă', title: 'Ordered List', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run(), isActive: (e: ReturnType<typeof useEditor>) => e?.isActive('orderedList') },
  { label: '—', title: 'Divider', action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHorizontalRule().run(), isActive: () => false },
]

export default function TipTapEditor({ value, onChange, placeholder = 'Scrieți conținutul...' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TabExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div style={{ border: '1px solid #2A1A0A', borderRadius: '4px', backgroundColor: '#1A1008' }}>
      <div style={{ borderBottom: '1px solid #2A1A0A', padding: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1008' }}>
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
      </div>

      <div style={{ padding: '0.875rem', color: '#F2EBD9', fontFamily: 'Georgia, serif', lineHeight: 1.7, minHeight: '280px' }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror { outline: none; min-height: 250px; }
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
      `}</style>
    </div>
  )
}
