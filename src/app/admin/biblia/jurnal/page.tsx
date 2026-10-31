import Link from 'next/link'
import { getBook } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { JOURNAL_PAGE_SIZE, loadJournal } from '@/lib/bible/adminQueries'
import { BibliaHeader, Pager, pageParam, ui } from '@/components/admin/biblia/ui'

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = { EDIT: 'Editare', CREATE: 'Verset nou', BULK: 'Înlocuire' }
const dateFormat = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Chisinau' })

export default async function AdminBibliaJournalPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireBibleAdminPage()
  const page = pageParam((await searchParams).page)
  const { total, rows } = await loadJournal(page)

  return (
    <>
      <BibliaHeader crumbs={[{ href: '/admin/biblia', label: 'Biblia' }, { label: 'Jurnal' }]} />
      <h1 style={ui.h1}>Jurnalul modificărilor</h1>
      <p style={ui.muted}>{total} modificări</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem', maxWidth: '860px' }}>
        {rows.map(e => (
          <li key={e.id} style={ui.card}>
            <Link href={`/admin/biblia/${e.bookSlug}/${e.chapterNum}#v${e.verseNum}`} style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', textDecoration: 'underline' }}>
              {getBook(e.bookSlug)?.labelRo ?? e.bookSlug} {e.chapterNum}:{e.verseNum}
            </Link>
            <p style={{ ...ui.muted, margin: '0.25rem 0 0.5rem' }}>
              {ACTION_LABEL[e.action] ?? e.action} · {e.editor} · {dateFormat.format(e.createdAt)}
            </p>
            {e.oldText !== null && <p style={{ ...ui.text, margin: '0 0 0.25rem', overflowWrap: 'anywhere' }}><strong style={ui.muted}>Vechi: </strong>{e.oldText}</p>}
            <p style={{ ...ui.text, margin: 0, overflowWrap: 'anywhere' }}><strong style={ui.muted}>Nou: </strong>{e.newText}</p>
          </li>
        ))}
      </ul>
      <Pager page={page} pages={Math.ceil(total / JOURNAL_PAGE_SIZE)} href={p => `/admin/biblia/jurnal?page=${p}`} />
    </>
  )
}
