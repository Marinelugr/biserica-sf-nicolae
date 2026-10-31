import { BIBLE_BOOKS } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { BibliaHeader, ui } from '@/components/admin/biblia/ui'
import ReplaceForm from '@/components/admin/biblia/ReplaceForm'

export const dynamic = 'force-dynamic'

export default async function AdminBibliaReplacePage() {
  await requireBibleAdminPage()
  return (
    <>
      <BibliaHeader crumbs={[{ href: '/admin/biblia', label: 'Biblia' }, { label: 'Înlocuiește' }]} />
      <h1 style={ui.h1}>Găsește și înlocuiește într-o carte</h1>
      <p style={{ ...ui.muted, maxWidth: '760px', margin: '0 0 1.25rem' }}>
        Previzualizarea este obligatorie. Se schimbă cel mult 500 de versete pe operație, iar fiecare intră în jurnal. Căutarea ține cont de majuscule: „Intru” și „intru” sunt două operații.
      </p>
      <ReplaceForm books={BIBLE_BOOKS.map(b => ({ slug: b.slug, label: b.labelRo }))} />
    </>
  )
}
