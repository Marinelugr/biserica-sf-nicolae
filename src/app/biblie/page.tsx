import type { Metadata } from 'next'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sfânta Scriptură — Biblia Ortodoxă',
  description: 'Citește Sfânta Scriptură online. Biblia Ortodoxă — Vechiul Testament și Noul Testament, în limba română, conform ediției Sfântului Sinod.',
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

export default async function BibliePage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])

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
                  {pick(locale, book.labelRo, book.labelRu, book.labelEn)}
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
                  {pick(locale, book.labelRo, book.labelRu, book.labelEn)}
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
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>{t.bible.otBooksLabel}</p>
        </div>
        <div>
          <p className="font-heading text-2xl" style={{ color: '#8B6014' }}>27</p>
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>{t.bible.ntBooksLabel}</p>
        </div>
        <div>
          <p className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>80</p>
          <p className="font-body text-xs" style={{ color: '#8A7050' }}>{t.bible.totalLabel}</p>
        </div>
      </div>
    </div>
  )
}
