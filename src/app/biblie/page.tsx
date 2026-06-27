import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sfânta Scriptură — Biblia Ortodoxă',
  description: 'Citește Sfânta Scriptură online. Biblia Ortodoxă — Vechiul Testament și Noul Testament, în limba română, conform ediției Sfântului Sinod.',
}

// ─── VECHIUL TESTAMENT — 53 cărți ────────────────────────────────────────────
const VT_BOOKS = [
  { label: 'Facerea (Întâia Carte a lui Moise)',               slug: 'facerea' },
  { label: 'Ieșirea (A doua Carte a lui Moise)',               slug: 'iesirea' },
  { label: 'Leviticul (A treia Carte a lui Moise)',            slug: 'leviticul' },
  { label: 'Numerii (A patra Carte a lui Moise)',              slug: 'numerii' },
  { label: 'Deuteronomul (A cincea Carte a lui Moise)',        slug: 'deuteronomul' },
  { label: 'Cartea lui Iosua Navi',                           slug: 'iosua-navi' },
  { label: 'Cartea Judecătorilor',                            slug: 'judecatorii' },
  { label: 'Cartea Rut',                                      slug: 'rut' },
  { label: 'Cartea întâi a Regilor',                          slug: '1-regi' },
  { label: 'Cartea a doua a Regilor',                         slug: '2-regi' },
  { label: 'Cartea a treia a Regilor',                        slug: '3-regi' },
  { label: 'Cartea a patra a Regilor',                        slug: '4-regi' },
  { label: 'Cartea întâi Paralipomena (întâi a Cronicilor)',  slug: '1-paralipomena' },
  { label: 'Cartea a doua Paralipomena (a doua a Cronicilor)',slug: '2-paralipomena' },
  { label: 'Cartea întâi a lui Ezdra',                       slug: '1-ezdra' },
  { label: 'Cartea lui Neemia (a doua Ezdra)',                slug: 'neemia' },
  { label: 'Cartea a treia a lui Ezdra',                      slug: '3-ezdra' },
  { label: 'Cartea lui Tobit',                                slug: 'tobit' },
  { label: 'Cartea Iuditei',                                  slug: 'iudita' },
  { label: 'Cartea Esterei',                                  slug: 'estera' },
  { label: 'Cartea lui Iov',                                  slug: 'iov' },
  { label: 'Psalmii',                                         slug: 'psalmi' },
  { label: 'Pildele lui Solomon',                             slug: 'pilde' },
  { label: 'Ecclesiastul',                                    slug: 'eclesiastul' },
  { label: 'Cântarea Cântărilor',                             slug: 'cantarea-cantarilor' },
  { label: 'Cartea înțelepciunii lui Solomon',                slug: 'intelepciunea-lui-solomon' },
  { label: 'Cartea înțelepciunii lui Isus, fiul lui Sirah',  slug: 'sirah' },
  { label: 'Isaia',                                           slug: 'isaia' },
  { label: 'Ieremia',                                         slug: 'ieremia' },
  { label: 'Plângerile lui Ieremia',                          slug: 'plangerile' },
  { label: 'Baruh',                                           slug: 'baruh' },
  { label: 'Epistola lui Ieremia',                            slug: 'epistola-lui-ieremia' },
  { label: 'Iezechiel',                                       slug: 'iezechiel' },
  { label: 'Daniel',                                          slug: 'daniel' },
  { label: 'Cântarea celor trei tineri',                      slug: 'cei-trei-tineri' },
  { label: 'Istoria Susanei',                                 slug: 'susana' },
  { label: 'Istoria omorârii balaurului',                     slug: 'balaur' },
  { label: 'Osea',                                            slug: 'osea' },
  { label: 'Ioil',                                            slug: 'ioil' },
  { label: 'Amos',                                            slug: 'amos' },
  { label: 'Avdie',                                           slug: 'avdie' },
  { label: 'Iona',                                            slug: 'iona' },
  { label: 'Miheia',                                          slug: 'miheia' },
  { label: 'Naum',                                            slug: 'naum' },
  { label: 'Avacum',                                          slug: 'avacum' },
  { label: 'Sofonie',                                         slug: 'sofonie' },
  { label: 'Agheu',                                           slug: 'agheu' },
  { label: 'Zaharia',                                         slug: 'zaharia' },
  { label: 'Maleahi',                                         slug: 'maleahi' },
  { label: 'Cartea întâi a Macabeilor',                       slug: '1-macabei' },
  { label: 'Cartea a doua a Macabeilor',                      slug: '2-macabei' },
  { label: 'Cartea a treia a Macabeilor',                     slug: '3-macabei' },
  { label: 'Rugăciunea regelui Manase',                       slug: 'rugaciunea-manase' },
] // 53 cărți

// ─── NOUL TESTAMENT — 27 cărți ───────────────────────────────────────────────
const NT_BOOKS = [
  { label: 'Sfânta Evanghelie după Matei',                                          slug: 'matei' },
  { label: 'Sfânta Evanghelie după Marcu',                                          slug: 'marcu' },
  { label: 'Sfânta Evanghelie după Luca',                                           slug: 'luca' },
  { label: 'Sfânta Evanghelie după Ioan',                                           slug: 'ioan' },
  { label: 'Faptele Sfinților Apostoli',                                            slug: 'faptele-apostolilor' },
  { label: 'Epistola către Romani a Sfântului Apostol Pavel',                       slug: 'romani' },
  { label: 'Epistola întâi către Corinteni a Sfântului Apostol Pavel',             slug: '1-corinteni' },
  { label: 'Epistola a doua către Corinteni a Sfântului Apostol Pavel',            slug: '2-corinteni' },
  { label: 'Epistola către Galateni a Sfântului Apostol Pavel',                    slug: 'galateni' },
  { label: 'Epistola către Efeseni a Sfântului Apostol Pavel',                     slug: 'efeseni' },
  { label: 'Epistola către Filipeni a Sfântului Apostol Pavel',                    slug: 'filipeni' },
  { label: 'Epistola către Coloseni a Sfântului Apostol Pavel',                    slug: 'coloseni' },
  { label: 'Epistola întâi către Tesaloniceni a Sfântului Apostol Pavel',          slug: '1-tesaloniceni' },
  { label: 'Epistola a doua către Tesaloniceni a Sfântului Apostol Pavel',         slug: '2-tesaloniceni' },
  { label: 'Epistola întâi către Timotei a Sfântului Apostol Pavel',              slug: '1-timotei' },
  { label: 'Epistola a doua către Timotei a Sfântului Apostol Pavel',             slug: '2-timotei' },
  { label: 'Epistola către Tit a Sfântului Apostol Pavel',                         slug: 'tit' },
  { label: 'Epistola către Filimon a Sfântului Apostol Pavel',                     slug: 'filimon' },
  { label: 'Epistola către Evrei a Sfântului Apostol Pavel',                       slug: 'evrei' },
  { label: 'Epistola Sobornicească a Sfântului Apostol Iacov',                     slug: 'iacov' },
  { label: 'Întâia Epistolă Sobornicească a Sfântului Apostol Petru',             slug: '1-petru' },
  { label: 'A doua Epistolă Sobornicească a Sfântului Apostol Petru',             slug: '2-petru' },
  { label: 'Întâia Epistolă Sobornicească a Sfântului Apostol Ioan',              slug: '1-ioan' },
  { label: 'A doua Epistolă Sobornicească a Sfântului Apostol Ioan',              slug: '2-ioan' },
  { label: 'A treia Epistolă Sobornicească a Sfântului Apostol Ioan',             slug: '3-ioan' },
  { label: 'Epistola Sobornicească a Sfântului Apostol Iuda',                      slug: 'iuda' },
  { label: 'Apocalipsa Sfântului Ioan Teologul',                                   slug: 'apocalipsa' },
] // 27 cărți

export default async function BibliePage() {
  const t = await getServerT()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-body text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#8A7050' }}>
          {t.bible.pageSubtitle}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl mb-5" style={{ color: '#1C1B3A' }}>
          {t.bible.title}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
        </div>

        {/* Căutare */}
        <form className="flex gap-0 max-w-xl mx-auto rounded-md overflow-hidden shadow-sm" action="/biblie" method="get">
          <label htmlFor="bible-search" className="sr-only">{t.bible.searchPlaceholder}</label>
          <input
            id="bible-search"
            type="search"
            name="q"
            placeholder={t.bible.searchPlaceholder}
            className="flex-1 px-4 py-3 text-sm font-body outline-none"
            style={{ border: '1px solid #E8E5E0', borderRight: 'none', color: '#3A1A1A', backgroundColor: '#FAFAF8' }}
          />
          <button type="submit" className="px-6 py-3 font-body text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}>
            {t.bible.searchBtn}
          </button>
        </form>
      </div>

      {/* ═══ VECHIUL TESTAMENT ═══ */}
      <section className="mb-12" aria-label={t.bible.oldTestament}>
        <div className="flex items-center gap-4 mb-6">
          <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
          <div className="text-center shrink-0">
            <h2 className="font-body tracking-[0.4em]"
              style={{ color: '#8B1A1A', fontSize: '13px', letterSpacing: '0.4em' }}>
              {t.bible.oldTestament}
            </h2>
            <p className="font-body text-xs mt-0.5" style={{ color: '#B0A080' }}>
              {t.bible.oldTestamentBooks}
            </p>
          </div>
          <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
        </div>

        <ol className="space-y-px">
          {VT_BOOKS.map((book, i) => (
            <li key={book.slug}>
              <a
                href={`/biblie/${book.slug}`}
                className="font-heading flex items-baseline gap-3 py-1.5 group transition-colors"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}
              >
                <span className="text-xs shrink-0 w-5 text-right" style={{ color: '#D4C8A0' }}>
                  {i + 1}
                </span>
                <span
                  className="group-hover:underline transition-colors duration-150 group-hover:text-amber-700"
                  style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C', textUnderlineOffset: '3px' }}
                >
                  {book.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ NOUL TESTAMENT ═══ */}
      <section aria-label={t.bible.newTestament}>
        <div className="flex items-center gap-4 mb-6">
          <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
          <div className="text-center shrink-0">
            <h2 className="font-body tracking-[0.4em]"
              style={{ color: '#8B1A1A', fontSize: '13px', letterSpacing: '0.4em' }}>
              {t.bible.newTestament}
            </h2>
            <p className="font-body text-xs mt-0.5" style={{ color: '#B0A080' }}>
              {t.bible.newTestamentBooks}
            </p>
          </div>
          <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
        </div>

        <ol className="space-y-px" start={54}>
          {NT_BOOKS.map((book, i) => (
            <li key={book.slug}>
              <a
                href={`/biblie/${book.slug}`}
                className="font-heading flex items-baseline gap-3 py-1.5 group transition-colors"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}
              >
                <span className="text-xs shrink-0 w-5 text-right" style={{ color: '#D4C8A0' }}>
                  {53 + i + 1}
                </span>
                <span
                  className="group-hover:underline transition-colors duration-150 group-hover:text-amber-700"
                  style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C', textUnderlineOffset: '3px' }}
                >
                  {book.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* Totaluri */}
      <div className="mt-10 pt-6 flex justify-center gap-8 text-center" style={{ borderTop: '1px solid #E8E5E0' }}>
        <div>
          <p className="font-heading text-2xl" style={{ color: '#8B1A1A' }}>53</p>
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>cărți VT</p>
        </div>
        <div>
          <p className="font-heading text-2xl" style={{ color: '#8B6014' }}>27</p>
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>cărți NT</p>
        </div>
        <div>
          <p className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>80</p>
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>total</p>
        </div>
      </div>
    </div>
  )
}
