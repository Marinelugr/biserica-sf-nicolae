import type { Metadata } from 'next'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { matchesAllWords } from '@/lib/search'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.biblie.title,
    description: t.meta.biblie.description,
    alternates: buildAlternates('/biblie'),
  }
}

// ─── VECHIUL TESTAMENT — 53 cărți ────────────────────────────────────────────
const VT_BOOKS = [
  { labelRo: 'Facerea (Întâia Carte a lui Moise)', labelRu: 'Бытие (Первая книга Моисеева)', labelEn: 'Genesis (The First Book of Moses)', slug: 'facerea' },
  { labelRo: 'Ieșirea (A doua Carte a lui Moise)', labelRu: 'Исход (Вторая книга Моисеева)', labelEn: 'Exodus (The Second Book of Moses)', slug: 'iesirea' },
  { labelRo: 'Leviticul (A treia Carte a lui Moise)', labelRu: 'Левит (Третья книга Моисеева)', labelEn: 'Leviticus (The Third Book of Moses)', slug: 'leviticul' },
  { labelRo: 'Numerii (A patra Carte a lui Moise)', labelRu: 'Числа (Четвёртая книга Моисеева)', labelEn: 'Numbers (The Fourth Book of Moses)', slug: 'numerii' },
  { labelRo: 'Deuteronomul (A cincea Carte a lui Moise)', labelRu: 'Второзаконие (Пятая книга Моисеева)', labelEn: 'Deuteronomy (The Fifth Book of Moses)', slug: 'deuteronomul' },
  { labelRo: 'Cartea lui Iosua Navi', labelRu: 'Книга Иисуса Навина', labelEn: 'The Book of Joshua', slug: 'iosua-navi' },
  { labelRo: 'Cartea Judecătorilor', labelRu: 'Книга Судей израилевых', labelEn: 'The Book of Judges', slug: 'judecatorii' },
  { labelRo: 'Cartea Rut', labelRu: 'Книга Руфь', labelEn: 'The Book of Ruth', slug: 'rut' },
  { labelRo: 'Cartea întâi a Regilor', labelRu: 'Первая книга Царств', labelEn: '1 Kingdoms (1 Samuel)', slug: '1-regi' },
  { labelRo: 'Cartea a doua a Regilor', labelRu: 'Вторая книга Царств', labelEn: '2 Kingdoms (2 Samuel)', slug: '2-regi' },
  { labelRo: 'Cartea a treia a Regilor', labelRu: 'Третья книга Царств', labelEn: '3 Kingdoms (1 Kings)', slug: '3-regi' },
  { labelRo: 'Cartea a patra a Regilor', labelRu: 'Четвёртая книга Царств', labelEn: '4 Kingdoms (2 Kings)', slug: '4-regi' },
  { labelRo: 'Cartea întâi Paralipomena (întâi a Cronicilor)', labelRu: 'Первая книга Паралипоменон', labelEn: '1 Chronicles (Paralipomenon)', slug: '1-paralipomena' },
  { labelRo: 'Cartea a doua Paralipomena (a doua a Cronicilor)', labelRu: 'Вторая книга Паралипоменон', labelEn: '2 Chronicles (Paralipomenon)', slug: '2-paralipomena' },
  { labelRo: 'Cartea întâi a lui Ezdra', labelRu: 'Первая книга Ездры', labelEn: '1 Esdras', slug: '1-ezdra' },
  { labelRo: 'Cartea lui Neemia (a doua Ezdra)', labelRu: 'Книга Неемии (Вторая книга Ездры)', labelEn: 'Nehemiah (2 Esdras)', slug: 'neemia' },
  { labelRo: 'Cartea a treia a lui Ezdra', labelRu: 'Третья книга Ездры', labelEn: '3 Esdras', slug: '3-ezdra' },
  { labelRo: 'Cartea lui Tobit', labelRu: 'Книга Товита', labelEn: 'The Book of Tobit', slug: 'tobit' },
  { labelRo: 'Cartea Iuditei', labelRu: 'Книга Иудифи', labelEn: 'The Book of Judith', slug: 'iudita' },
  { labelRo: 'Cartea Esterei', labelRu: 'Книга Есфирь', labelEn: 'The Book of Esther', slug: 'estera' },
  { labelRo: 'Cartea lui Iov', labelRu: 'Книга Иова', labelEn: 'The Book of Job', slug: 'iov' },
  { labelRo: 'Psalmii', labelRu: 'Псалтирь', labelEn: 'The Psalms', slug: 'psalmi' },
  { labelRo: 'Pildele lui Solomon', labelRu: 'Притчи Соломона', labelEn: 'The Proverbs of Solomon', slug: 'pilde' },
  { labelRo: 'Ecclesiastul', labelRu: 'Книга Екклесиаста', labelEn: 'Ecclesiastes', slug: 'eclesiastul' },
  { labelRo: 'Cântarea Cântărilor', labelRu: 'Песнь Песней Соломона', labelEn: 'The Song of Songs', slug: 'cantarea-cantarilor' },
  { labelRo: 'Cartea înțelepciunii lui Solomon', labelRu: 'Книга Премудрости Соломона', labelEn: 'The Wisdom of Solomon', slug: 'intelepciunea-lui-solomon' },
  { labelRo: 'Cartea înțelepciunii lui Isus, fiul lui Sirah', labelRu: 'Книга Премудрости Иисуса, сына Сирахова', labelEn: 'The Wisdom of Sirach', slug: 'sirah' },
  { labelRo: 'Isaia', labelRu: 'Книга пророка Исаии', labelEn: 'Isaiah', slug: 'isaia' },
  { labelRo: 'Ieremia', labelRu: 'Книга пророка Иеремии', labelEn: 'Jeremiah', slug: 'ieremia' },
  { labelRo: 'Plângerile lui Ieremia', labelRu: 'Плач Иеремии', labelEn: 'Lamentations of Jeremiah', slug: 'plangerile' },
  { labelRo: 'Baruh', labelRu: 'Книга пророка Варуха', labelEn: 'Baruch', slug: 'baruh' },
  { labelRo: 'Epistola lui Ieremia', labelRu: 'Послание Иеремии', labelEn: 'The Epistle of Jeremiah', slug: 'epistola-lui-ieremia' },
  { labelRo: 'Iezechiel', labelRu: 'Книга пророка Иезекииля', labelEn: 'Ezekiel', slug: 'iezechiel' },
  { labelRo: 'Daniel', labelRu: 'Книга пророка Даниила', labelEn: 'Daniel', slug: 'daniel' },
  { labelRo: 'Cântarea celor trei tineri', labelRu: 'Песнь трёх отроков', labelEn: 'The Song of the Three Young Men', slug: 'cei-trei-tineri' },
  { labelRo: 'Istoria Susanei', labelRu: 'История Сусанны', labelEn: 'The History of Susanna', slug: 'susana' },
  { labelRo: 'Istoria omorârii balaurului', labelRu: 'История о Виле и драконе', labelEn: 'Bel and the Dragon', slug: 'balaur' },
  { labelRo: 'Osea', labelRu: 'Книга пророка Осии', labelEn: 'Hosea', slug: 'osea' },
  { labelRo: 'Ioil', labelRu: 'Книга пророка Иоиля', labelEn: 'Joel', slug: 'ioil' },
  { labelRo: 'Amos', labelRu: 'Книга пророка Амоса', labelEn: 'Amos', slug: 'amos' },
  { labelRo: 'Avdie', labelRu: 'Книга пророка Авдия', labelEn: 'Obadiah', slug: 'avdie' },
  { labelRo: 'Iona', labelRu: 'Книга пророка Ионы', labelEn: 'Jonah', slug: 'iona' },
  { labelRo: 'Miheia', labelRu: 'Книга пророка Михея', labelEn: 'Micah', slug: 'miheia' },
  { labelRo: 'Naum', labelRu: 'Книга пророка Наума', labelEn: 'Nahum', slug: 'naum' },
  { labelRo: 'Avacum', labelRu: 'Книга пророка Аввакума', labelEn: 'Habakkuk', slug: 'avacum' },
  { labelRo: 'Sofonie', labelRu: 'Книга пророка Софонии', labelEn: 'Zephaniah', slug: 'sofonie' },
  { labelRo: 'Agheu', labelRu: 'Книга пророка Аггея', labelEn: 'Haggai', slug: 'agheu' },
  { labelRo: 'Zaharia', labelRu: 'Книга пророка Захарии', labelEn: 'Zechariah', slug: 'zaharia' },
  { labelRo: 'Maleahi', labelRu: 'Книга пророка Малахии', labelEn: 'Malachi', slug: 'maleahi' },
  { labelRo: 'Cartea întâi a Macabeilor', labelRu: 'Первая книга Маккавейская', labelEn: '1 Maccabees', slug: '1-macabei' },
  { labelRo: 'Cartea a doua a Macabeilor', labelRu: 'Вторая книга Маккавейская', labelEn: '2 Maccabees', slug: '2-macabei' },
  { labelRo: 'Cartea a treia a Macabeilor', labelRu: 'Третья книга Маккавейская', labelEn: '3 Maccabees', slug: '3-macabei' },
  { labelRo: 'Rugăciunea regelui Manase', labelRu: 'Молитва Манассии', labelEn: 'The Prayer of Manasseh', slug: 'rugaciunea-manase' },
] // 53 cărți

// ─── NOUL TESTAMENT — 27 cărți ───────────────────────────────────────────────
const NT_BOOKS = [
  { labelRo: 'Sfânta Evanghelie după Matei', labelRu: 'Евангелие от Матфея', labelEn: 'The Holy Gospel according to Matthew', slug: 'matei' },
  { labelRo: 'Sfânta Evanghelie după Marcu', labelRu: 'Евангелие от Марка', labelEn: 'The Holy Gospel according to Mark', slug: 'marcu' },
  { labelRo: 'Sfânta Evanghelie după Luca', labelRu: 'Евангелие от Луки', labelEn: 'The Holy Gospel according to Luke', slug: 'luca' },
  { labelRo: 'Sfânta Evanghelie după Ioan', labelRu: 'Евангелие от Иоанна', labelEn: 'The Holy Gospel according to John', slug: 'ioan' },
  { labelRo: 'Faptele Sfinților Apostoli', labelRu: 'Деяния святых Апостолов', labelEn: 'The Acts of the Holy Apostles', slug: 'faptele-apostolilor' },
  { labelRo: 'Epistola către Romani a Sfântului Apostol Pavel', labelRu: 'Послание к Римлянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Romans', slug: 'romani' },
  { labelRo: 'Epistola întâi către Corinteni a Sfântului Apostol Pavel', labelRu: 'Первое послание к Коринфянам святого апостола Павла', labelEn: 'The First Epistle of St. Paul to the Corinthians', slug: '1-corinteni' },
  { labelRo: 'Epistola a doua către Corinteni a Sfântului Apostol Pavel', labelRu: 'Второе послание к Коринфянам святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to the Corinthians', slug: '2-corinteni' },
  { labelRo: 'Epistola către Galateni a Sfântului Apostol Pavel', labelRu: 'Послание к Галатам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Galatians', slug: 'galateni' },
  { labelRo: 'Epistola către Efeseni a Sfântului Apostol Pavel', labelRu: 'Послание к Ефесянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Ephesians', slug: 'efeseni' },
  { labelRo: 'Epistola către Filipeni a Sfântului Apostol Pavel', labelRu: 'Послание к Филиппийцам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Philippians', slug: 'filipeni' },
  { labelRo: 'Epistola către Coloseni a Sfântului Apostol Pavel', labelRu: 'Послание к Колоссянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Colossians', slug: 'coloseni' },
  { labelRo: 'Epistola întâi către Tesaloniceni a Sfântului Apostol Pavel', labelRu: 'Первое послание к Фессалоникийцам святого апостола Павла', labelEn: 'The First Epistle of St. Paul to the Thessalonians', slug: '1-tesaloniceni' },
  { labelRo: 'Epistola a doua către Tesaloniceni a Sfântului Apostol Pavel', labelRu: 'Второе послание к Фессалоникийцам святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to the Thessalonians', slug: '2-tesaloniceni' },
  { labelRo: 'Epistola întâi către Timotei a Sfântului Apostol Pavel', labelRu: 'Первое послание к Тимофею святого апостола Павла', labelEn: 'The First Epistle of St. Paul to Timothy', slug: '1-timotei' },
  { labelRo: 'Epistola a doua către Timotei a Sfântului Apostol Pavel', labelRu: 'Второе послание к Тимофею святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to Timothy', slug: '2-timotei' },
  { labelRo: 'Epistola către Tit a Sfântului Apostol Pavel', labelRu: 'Послание к Титу святого апостола Павла', labelEn: 'The Epistle of St. Paul to Titus', slug: 'tit' },
  { labelRo: 'Epistola către Filimon a Sfântului Apostol Pavel', labelRu: 'Послание к Филимону святого апостола Павла', labelEn: 'The Epistle of St. Paul to Philemon', slug: 'filimon' },
  { labelRo: 'Epistola către Evrei a Sfântului Apostol Pavel', labelRu: 'Послание к Евреям святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Hebrews', slug: 'evrei' },
  { labelRo: 'Epistola Sobornicească a Sfântului Apostol Iacov', labelRu: 'Соборное послание святого апостола Иакова', labelEn: 'The Catholic Epistle of St. James', slug: 'iacov' },
  { labelRo: 'Întâia Epistolă Sobornicească a Sfântului Apostol Petru', labelRu: 'Первое соборное послание святого апостола Петра', labelEn: 'The First Catholic Epistle of St. Peter', slug: '1-petru' },
  { labelRo: 'A doua Epistolă Sobornicească a Sfântului Apostol Petru', labelRu: 'Второе соборное послание святого апостола Петра', labelEn: 'The Second Catholic Epistle of St. Peter', slug: '2-petru' },
  { labelRo: 'Întâia Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Первое соборное послание святого апостола Иоанна', labelEn: 'The First Catholic Epistle of St. John', slug: '1-ioan' },
  { labelRo: 'A doua Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Второе соборное послание святого апостола Иоанна', labelEn: 'The Second Catholic Epistle of St. John', slug: '2-ioan' },
  { labelRo: 'A treia Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Третье соборное послание святого апостола Иоанна', labelEn: 'The Third Catholic Epistle of St. John', slug: '3-ioan' },
  { labelRo: 'Epistola Sobornicească a Sfântului Apostol Iuda', labelRu: 'Соборное послание святого апостола Иуды', labelEn: 'The Catholic Epistle of St. Jude', slug: 'iuda' },
  { labelRo: 'Apocalipsa Sfântului Ioan Teologul', labelRu: 'Откровение святого Иоанна Богослова (Апокалипсис)', labelEn: 'The Revelation of St. John the Theologian (Apocalypse)', slug: 'apocalipsa' },
] // 27 cărți

function matchesQuery(book: { labelRo: string; labelRu: string; labelEn: string }, query: string): boolean {
  return matchesAllWords(query, [book.labelRo, book.labelRu, book.labelEn])
}

export default async function BibliePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const { q } = await searchParams
  const query = q?.trim() || ''

  const vtNumbered = VT_BOOKS.map((book, i) => ({ ...book, num: i + 1 }))
  const ntNumbered = NT_BOOKS.map((book, i) => ({ ...book, num: VT_BOOKS.length + i + 1 }))

  const vtResults = query ? vtNumbered.filter(b => matchesQuery(b, query)) : vtNumbered
  const ntResults = query ? ntNumbered.filter(b => matchesQuery(b, query)) : ntNumbered
  const totalResults = vtResults.length + ntResults.length

  const bookList = (books: typeof vtResults, start?: number) => (
    <ol className="grid grid-cols-1 xl:grid-cols-2 gap-x-6" start={start}>
      {books.map(book => (
        <li key={book.slug} style={{ borderBottom: '1px solid var(--line)' }}>
          <a href={`/biblie/${book.slug}`} className="flex items-baseline gap-3 py-2.5 group">
            <span className="text-[14px] shrink-0 w-6 text-right mute">{book.num}</span>
            <span className="serif text-[20px] leading-snug group-hover:text-gold transition-colors">
              {pick(locale, book.labelRo, book.labelRu, book.labelEn)}
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
  const testament = (title: string, subtitle: string, list: React.ReactNode) => (
    <section className="card" aria-label={title} data-reveal>
      <div className="sec-head">
        <h2 className="eyebrow" style={{ fontSize: 14 }}>{title}</h2>
        <p className="mute text-[15px]">{subtitle}</p>
      </div>
      {list}
    </section>
  )

  return (
    <PageShell aside="compact">
      <PageHead eyebrow={t.bible.pageSubtitle} title={t.bible.title}>
        <div className="mt-2">
          <SearchForm action="/biblie" id="bible-search" placeholder={t.bible.searchPlaceholder} button={t.bible.searchBtn} defaultValue={query} />
        </div>
        {query && (
          <p className="mute text-[16px]">
            {totalResults > 0
              ? `${totalResults} ${totalResults === 1 ? 'carte găsită' : 'cărți găsite'} pentru „${query}"`
              : `Nu s-au găsit cărți pentru „${query}"`}
          </p>
        )}
      </PageHead>

      {query && totalResults === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mt-3 text-[19px]">Nu s-au găsit rezultate pentru &ldquo;{query}&rdquo;</p>
          <p className="mute text-[16px] mt-2">Încercați un alt termen sau răsfoiți lista completă mai jos.</p>
          <a href="/biblie" className="btn mt-5">Vezi toate cărțile</a>
        </div>
      ) : (
        <>
          {vtResults.length > 0 && testament(t.bible.oldTestament, t.bible.oldTestamentBooks, bookList(vtResults))}
          {ntResults.length > 0 && testament(t.bible.newTestament, t.bible.newTestamentBooks, bookList(ntResults, 54))}
        </>
      )}

      <div className="card flex justify-center gap-10 text-center" style={{ padding: '20px 24px' }}>
        <div>
          <p className="h-m" style={{ color: 'var(--rose)' }}>53</p>
          <p className="mute text-[15px]">{t.bible.otBooksLabel}</p>
        </div>
        <div>
          <p className="h-m gold">27</p>
          <p className="mute text-[15px]">{t.bible.ntBooksLabel}</p>
        </div>
        <div>
          <p className="h-m">80</p>
          <p className="mute text-[15px]">{t.bible.totalLabel}</p>
        </div>
      </div>
    </PageShell>
  )
}
