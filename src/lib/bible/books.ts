/**
 * Cele 80 de cărți ale Bibliei (canonul ortodox: 53 Vechiul Testament + 27 Noul
 * Testament), într-un singur loc — pagina /biblie, cititorul, sitemap-ul și
 * scripturile din prisma/bible/ le iau de aici.
 *
 * Fără importuri din React/Next și fără aliasul `@/`: modulul e folosit și de
 * scripturile rulate cu ts-node (CommonJS).
 */

export type Testament = 'VT' | 'NT'

export interface BibleBookInfo {
  /** Folosit în URL (/biblie/<slug>) — nu se schimbă. */
  slug: string
  /** 1–80, ordinea din Biblia ortodoxă. */
  orderNum: number
  testament: Testament
  labelRo: string
  labelRu: string
  labelEn: string
  /** Denumiri vechi/alternative și abrevieri, pentru potrivirea referințelor („Mt 5", „1 Cor 13"). */
  aliases: string[]
}

export const BIBLE_BOOKS: readonly BibleBookInfo[] = [
  { slug: 'facerea', orderNum: 1, testament: 'VT', labelRo: 'Facerea (Întâia Carte a lui Moise)', labelRu: 'Бытие (Первая книга Моисеева)', labelEn: 'Genesis (The First Book of Moses)', aliases: ['Facerea', 'Facere', 'Geneza', 'Fc', 'Fac', 'Gen'] },
  { slug: 'iesirea', orderNum: 2, testament: 'VT', labelRo: 'Ieșirea (A doua Carte a lui Moise)', labelRu: 'Исход (Вторая книга Моисеева)', labelEn: 'Exodus (The Second Book of Moses)', aliases: ['Ieșirea', 'Exodul', 'Ies', 'Ieș', 'Ex'] },
  { slug: 'leviticul', orderNum: 3, testament: 'VT', labelRo: 'Leviticul (A treia Carte a lui Moise)', labelRu: 'Левит (Третья книга Моисеева)', labelEn: 'Leviticus (The Third Book of Moses)', aliases: ['Leviticul', 'Lev', 'Lv'] },
  { slug: 'numerii', orderNum: 4, testament: 'VT', labelRo: 'Numerii (A patra Carte a lui Moise)', labelRu: 'Числа (Четвёртая книга Моисеева)', labelEn: 'Numbers (The Fourth Book of Moses)', aliases: ['Numerii', 'Numeri', 'Num', 'Nm'] },
  { slug: 'deuteronomul', orderNum: 5, testament: 'VT', labelRo: 'Deuteronomul (A cincea Carte a lui Moise)', labelRu: 'Второзаконие (Пятая книга Моисеева)', labelEn: 'Deuteronomy (The Fifth Book of Moses)', aliases: ['Deuteronomul', 'Deut', 'Dt'] },
  { slug: 'iosua-navi', orderNum: 6, testament: 'VT', labelRo: 'Cartea lui Iosua Navi', labelRu: 'Книга Иисуса Навина', labelEn: 'The Book of Joshua', aliases: ['Iosua', 'Iosua Navi', 'Ios'] },
  { slug: 'judecatorii', orderNum: 7, testament: 'VT', labelRo: 'Cartea Judecătorilor', labelRu: 'Книга Судей израилевых', labelEn: 'The Book of Judges', aliases: ['Judecătorii', 'Judecători', 'Jud', 'Jdc'] },
  { slug: 'rut', orderNum: 8, testament: 'VT', labelRo: 'Cartea Rut', labelRu: 'Книга Руфь', labelEn: 'The Book of Ruth', aliases: ['Rut', 'Rt'] },
  { slug: '1-regi', orderNum: 9, testament: 'VT', labelRo: 'Cartea întâi a Regilor', labelRu: 'Первая книга Царств', labelEn: '1 Kingdoms (1 Samuel)', aliases: ['1 Regi', '1 Rg', '1 Reg', '1 Samuel', '1 Sam'] },
  { slug: '2-regi', orderNum: 10, testament: 'VT', labelRo: 'Cartea a doua a Regilor', labelRu: 'Вторая книга Царств', labelEn: '2 Kingdoms (2 Samuel)', aliases: ['2 Regi', '2 Rg', '2 Reg', '2 Samuel', '2 Sam'] },
  { slug: '3-regi', orderNum: 11, testament: 'VT', labelRo: 'Cartea a treia a Regilor', labelRu: 'Третья книга Царств', labelEn: '3 Kingdoms (1 Kings)', aliases: ['3 Regi', '3 Rg', '3 Reg'] },
  { slug: '4-regi', orderNum: 12, testament: 'VT', labelRo: 'Cartea a patra a Regilor', labelRu: 'Четвёртая книга Царств', labelEn: '4 Kingdoms (2 Kings)', aliases: ['4 Regi', '4 Rg', '4 Reg'] },
  { slug: '1-paralipomena', orderNum: 13, testament: 'VT', labelRo: 'Cartea întâi Paralipomena (întâi a Cronicilor)', labelRu: 'Первая книга Паралипоменон', labelEn: '1 Chronicles (Paralipomenon)', aliases: ['1 Paralipomena', '1 Par', '1 Cronici', '1 Cron'] },
  { slug: '2-paralipomena', orderNum: 14, testament: 'VT', labelRo: 'Cartea a doua Paralipomena (a doua a Cronicilor)', labelRu: 'Вторая книга Паралипоменон', labelEn: '2 Chronicles (Paralipomenon)', aliases: ['2 Paralipomena', '2 Par', '2 Cronici', '2 Cron'] },
  { slug: '1-ezdra', orderNum: 15, testament: 'VT', labelRo: 'Cartea întâi a lui Ezdra', labelRu: 'Первая книга Ездры', labelEn: '1 Esdras', aliases: ['1 Ezdra', '1 Ezr'] },
  { slug: 'neemia', orderNum: 16, testament: 'VT', labelRo: 'Cartea lui Neemia (a doua Ezdra)', labelRu: 'Книга Неемии (Вторая книга Ездры)', labelEn: 'Nehemiah (2 Esdras)', aliases: ['Neemia', 'Neem', 'Ne', '2 Ezdra', '2 Ezr'] },
  { slug: '3-ezdra', orderNum: 17, testament: 'VT', labelRo: 'Cartea a treia a lui Ezdra', labelRu: 'Третья книга Ездры', labelEn: '3 Esdras', aliases: ['3 Ezdra', '3 Ezr'] },
  { slug: 'tobit', orderNum: 18, testament: 'VT', labelRo: 'Cartea lui Tobit', labelRu: 'Книга Товита', labelEn: 'The Book of Tobit', aliases: ['Tobit', 'Tob'] },
  { slug: 'iudita', orderNum: 19, testament: 'VT', labelRo: 'Cartea Iuditei', labelRu: 'Книга Иудифи', labelEn: 'The Book of Judith', aliases: ['Iudita', 'Idt'] },
  { slug: 'estera', orderNum: 20, testament: 'VT', labelRo: 'Cartea Esterei', labelRu: 'Книга Есфирь', labelEn: 'The Book of Esther', aliases: ['Estera', 'Est'] },
  { slug: 'iov', orderNum: 21, testament: 'VT', labelRo: 'Cartea lui Iov', labelRu: 'Книга Иова', labelEn: 'The Book of Job', aliases: ['Iov'] },
  { slug: 'psalmi', orderNum: 22, testament: 'VT', labelRo: 'Psalmii', labelRu: 'Псалтирь', labelEn: 'The Psalms', aliases: ['Psalmii', 'Psalmi', 'Psalm', 'Psalmul', 'Psaltirea', 'Ps'] },
  { slug: 'pilde', orderNum: 23, testament: 'VT', labelRo: 'Pildele lui Solomon', labelRu: 'Притчи Соломона', labelEn: 'The Proverbs of Solomon', aliases: ['Pildele', 'Pilde', 'Pildele lui Solomon', 'Pld', 'Prov'] },
  { slug: 'eclesiastul', orderNum: 24, testament: 'VT', labelRo: 'Ecclesiastul', labelRu: 'Книга Екклесиаста', labelEn: 'Ecclesiastes', aliases: ['Ecclesiastul', 'Eclesiastul', 'Ecl', 'Ecc'] },
  { slug: 'cantarea-cantarilor', orderNum: 25, testament: 'VT', labelRo: 'Cântarea Cântărilor', labelRu: 'Песнь Песней Соломона', labelEn: 'The Song of Songs', aliases: ['Cântarea Cântărilor', 'Cânt', 'Cant', 'Cc'] },
  { slug: 'intelepciunea-lui-solomon', orderNum: 26, testament: 'VT', labelRo: 'Cartea înțelepciunii lui Solomon', labelRu: 'Книга Премудрости Соломона', labelEn: 'The Wisdom of Solomon', aliases: ['Înțelepciunea lui Solomon', 'Înțelepciunea', 'Înț', 'Int', 'Sol'] },
  { slug: 'sirah', orderNum: 27, testament: 'VT', labelRo: 'Cartea înțelepciunii lui Isus, fiul lui Sirah', labelRu: 'Книга Премудрости Иисуса, сына Сирахова', labelEn: 'The Wisdom of Sirach', aliases: ['Sirah', 'Isus Sirah', 'Înțelepciunea lui Isus Sirah', 'Sir'] },
  { slug: 'isaia', orderNum: 28, testament: 'VT', labelRo: 'Isaia', labelRu: 'Книга пророка Исаии', labelEn: 'Isaiah', aliases: ['Isaia', 'Is'] },
  { slug: 'ieremia', orderNum: 29, testament: 'VT', labelRo: 'Ieremia', labelRu: 'Книга пророка Иеремии', labelEn: 'Jeremiah', aliases: ['Ieremia', 'Ier'] },
  { slug: 'plangerile', orderNum: 30, testament: 'VT', labelRo: 'Plângerile lui Ieremia', labelRu: 'Плач Иеремии', labelEn: 'Lamentations of Jeremiah', aliases: ['Plângerile', 'Plângerile lui Ieremia', 'Plg', 'Plang'] },
  { slug: 'baruh', orderNum: 31, testament: 'VT', labelRo: 'Baruh', labelRu: 'Книга пророка Варуха', labelEn: 'Baruch', aliases: ['Baruh', 'Bar'] },
  { slug: 'epistola-lui-ieremia', orderNum: 32, testament: 'VT', labelRo: 'Epistola lui Ieremia', labelRu: 'Послание Иеремии', labelEn: 'The Epistle of Jeremiah', aliases: ['Epistola lui Ieremia', 'Ep Ier'] },
  { slug: 'iezechiel', orderNum: 33, testament: 'VT', labelRo: 'Iezechiel', labelRu: 'Книга пророка Иезекииля', labelEn: 'Ezekiel', aliases: ['Iezechiel', 'Iez'] },
  { slug: 'daniel', orderNum: 34, testament: 'VT', labelRo: 'Daniel', labelRu: 'Книга пророка Даниила', labelEn: 'Daniel', aliases: ['Daniel', 'Dan', 'Dn'] },
  { slug: 'cei-trei-tineri', orderNum: 35, testament: 'VT', labelRo: 'Cântarea celor trei tineri', labelRu: 'Песнь трёх отроков', labelEn: 'The Song of the Three Young Men', aliases: ['Cântarea celor trei tineri', 'Cei trei tineri', '3 Tin'] },
  { slug: 'susana', orderNum: 36, testament: 'VT', labelRo: 'Istoria Susanei', labelRu: 'История Сусанны', labelEn: 'The History of Susanna', aliases: ['Susana', 'Istoria Susanei', 'Sus'] },
  { slug: 'balaur', orderNum: 37, testament: 'VT', labelRo: 'Istoria omorârii balaurului', labelRu: 'История о Виле и драконе', labelEn: 'Bel and the Dragon', aliases: ['Balaurul', 'Istoria omorârii balaurului', 'Bel'] },
  { slug: 'osea', orderNum: 38, testament: 'VT', labelRo: 'Osea', labelRu: 'Книга пророка Осии', labelEn: 'Hosea', aliases: ['Osea', 'Os'] },
  { slug: 'ioil', orderNum: 39, testament: 'VT', labelRo: 'Ioil', labelRu: 'Книга пророка Иоиля', labelEn: 'Joel', aliases: ['Ioil', 'Il'] },
  { slug: 'amos', orderNum: 40, testament: 'VT', labelRo: 'Amos', labelRu: 'Книга пророка Амоса', labelEn: 'Amos', aliases: ['Amos', 'Am'] },
  { slug: 'avdie', orderNum: 41, testament: 'VT', labelRo: 'Avdie', labelRu: 'Книга пророка Авдия', labelEn: 'Obadiah', aliases: ['Avdie', 'Avd', 'Abd'] },
  { slug: 'iona', orderNum: 42, testament: 'VT', labelRo: 'Iona', labelRu: 'Книга пророка Ионы', labelEn: 'Jonah', aliases: ['Iona', 'Ion'] },
  { slug: 'miheia', orderNum: 43, testament: 'VT', labelRo: 'Miheia', labelRu: 'Книга пророка Михея', labelEn: 'Micah', aliases: ['Miheia', 'Mih', 'Mi'] },
  { slug: 'naum', orderNum: 44, testament: 'VT', labelRo: 'Naum', labelRu: 'Книга пророка Наума', labelEn: 'Nahum', aliases: ['Naum', 'Na'] },
  { slug: 'avacum', orderNum: 45, testament: 'VT', labelRo: 'Avacum', labelRu: 'Книга пророка Аввакума', labelEn: 'Habakkuk', aliases: ['Avacum', 'Avc', 'Hab'] },
  { slug: 'sofonie', orderNum: 46, testament: 'VT', labelRo: 'Sofonie', labelRu: 'Книга пророка Софонии', labelEn: 'Zephaniah', aliases: ['Sofonie', 'Sof'] },
  { slug: 'agheu', orderNum: 47, testament: 'VT', labelRo: 'Agheu', labelRu: 'Книга пророка Аггея', labelEn: 'Haggai', aliases: ['Agheu', 'Ag'] },
  { slug: 'zaharia', orderNum: 48, testament: 'VT', labelRo: 'Zaharia', labelRu: 'Книга пророка Захарии', labelEn: 'Zechariah', aliases: ['Zaharia', 'Zah', 'Za'] },
  { slug: 'maleahi', orderNum: 49, testament: 'VT', labelRo: 'Maleahi', labelRu: 'Книга пророка Малахии', labelEn: 'Malachi', aliases: ['Maleahi', 'Mal'] },
  { slug: '1-macabei', orderNum: 50, testament: 'VT', labelRo: 'Cartea întâi a Macabeilor', labelRu: 'Первая книга Маккавейская', labelEn: '1 Maccabees', aliases: ['1 Macabei', '1 Mac'] },
  { slug: '2-macabei', orderNum: 51, testament: 'VT', labelRo: 'Cartea a doua a Macabeilor', labelRu: 'Вторая книга Маккавейская', labelEn: '2 Maccabees', aliases: ['2 Macabei', '2 Mac'] },
  { slug: '3-macabei', orderNum: 52, testament: 'VT', labelRo: 'Cartea a treia a Macabeilor', labelRu: 'Третья книга Маккавейская', labelEn: '3 Maccabees', aliases: ['3 Macabei', '3 Mac'] },
  { slug: 'rugaciunea-manase', orderNum: 53, testament: 'VT', labelRo: 'Rugăciunea regelui Manase', labelRu: 'Молитва Манассии', labelEn: 'The Prayer of Manasseh', aliases: ['Rugăciunea lui Manase', 'Manase', 'Man'] },
  { slug: 'matei', orderNum: 54, testament: 'NT', labelRo: 'Sfânta Evanghelie după Matei', labelRu: 'Евангелие от Матфея', labelEn: 'The Holy Gospel according to Matthew', aliases: ['Matei', 'Mt', 'Mat', 'Evanghelia după Matei', 'Evanghelia lui Matei'] },
  { slug: 'marcu', orderNum: 55, testament: 'NT', labelRo: 'Sfânta Evanghelie după Marcu', labelRu: 'Евангелие от Марка', labelEn: 'The Holy Gospel according to Mark', aliases: ['Marcu', 'Mc', 'Mar', 'Evanghelia după Marcu', 'Evanghelia lui Marcu'] },
  { slug: 'luca', orderNum: 56, testament: 'NT', labelRo: 'Sfânta Evanghelie după Luca', labelRu: 'Евангелие от Луки', labelEn: 'The Holy Gospel according to Luke', aliases: ['Luca', 'Lc', 'Evanghelia după Luca', 'Evanghelia lui Luca'] },
  { slug: 'ioan', orderNum: 57, testament: 'NT', labelRo: 'Sfânta Evanghelie după Ioan', labelRu: 'Евангелие от Иоанна', labelEn: 'The Holy Gospel according to John', aliases: ['Ioan', 'In', 'Evanghelia după Ioan', 'Evanghelia lui Ioan'] },
  { slug: 'faptele-apostolilor', orderNum: 58, testament: 'NT', labelRo: 'Faptele Sfinților Apostoli', labelRu: 'Деяния святых Апостолов', labelEn: 'The Acts of the Holy Apostles', aliases: ['Faptele Apostolilor', 'Faptele', 'Fapte', 'Fap', 'FA'] },
  { slug: 'romani', orderNum: 59, testament: 'NT', labelRo: 'Epistola către Romani a Sfântului Apostol Pavel', labelRu: 'Послание к Римлянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Romans', aliases: ['Romani', 'Rom', 'Rm'] },
  { slug: '1-corinteni', orderNum: 60, testament: 'NT', labelRo: 'Epistola întâi către Corinteni a Sfântului Apostol Pavel', labelRu: 'Первое послание к Коринфянам святого апостола Павла', labelEn: 'The First Epistle of St. Paul to the Corinthians', aliases: ['1 Corinteni', '1 Cor', '1 Co'] },
  { slug: '2-corinteni', orderNum: 61, testament: 'NT', labelRo: 'Epistola a doua către Corinteni a Sfântului Apostol Pavel', labelRu: 'Второе послание к Коринфянам святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to the Corinthians', aliases: ['2 Corinteni', '2 Cor', '2 Co'] },
  { slug: 'galateni', orderNum: 62, testament: 'NT', labelRo: 'Epistola către Galateni a Sfântului Apostol Pavel', labelRu: 'Послание к Галатам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Galatians', aliases: ['Galateni', 'Gal', 'Ga'] },
  { slug: 'efeseni', orderNum: 63, testament: 'NT', labelRo: 'Epistola către Efeseni a Sfântului Apostol Pavel', labelRu: 'Послание к Ефесянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Ephesians', aliases: ['Efeseni', 'Ef'] },
  { slug: 'filipeni', orderNum: 64, testament: 'NT', labelRo: 'Epistola către Filipeni a Sfântului Apostol Pavel', labelRu: 'Послание к Филиппийцам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Philippians', aliases: ['Filipeni', 'Fil', 'Flp'] },
  { slug: 'coloseni', orderNum: 65, testament: 'NT', labelRo: 'Epistola către Coloseni a Sfântului Apostol Pavel', labelRu: 'Послание к Колоссянам святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Colossians', aliases: ['Coloseni', 'Col'] },
  { slug: '1-tesaloniceni', orderNum: 66, testament: 'NT', labelRo: 'Epistola întâi către Tesaloniceni a Sfântului Apostol Pavel', labelRu: 'Первое послание к Фессалоникийцам святого апостола Павла', labelEn: 'The First Epistle of St. Paul to the Thessalonians', aliases: ['1 Tesaloniceni', '1 Tes', '1 Ts'] },
  { slug: '2-tesaloniceni', orderNum: 67, testament: 'NT', labelRo: 'Epistola a doua către Tesaloniceni a Sfântului Apostol Pavel', labelRu: 'Второе послание к Фессалоникийцам святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to the Thessalonians', aliases: ['2 Tesaloniceni', '2 Tes', '2 Ts'] },
  { slug: '1-timotei', orderNum: 68, testament: 'NT', labelRo: 'Epistola întâi către Timotei a Sfântului Apostol Pavel', labelRu: 'Первое послание к Тимофею святого апостола Павла', labelEn: 'The First Epistle of St. Paul to Timothy', aliases: ['1 Timotei', '1 Tim', '1 Tm'] },
  { slug: '2-timotei', orderNum: 69, testament: 'NT', labelRo: 'Epistola a doua către Timotei a Sfântului Apostol Pavel', labelRu: 'Второе послание к Тимофею святого апостола Павла', labelEn: 'The Second Epistle of St. Paul to Timothy', aliases: ['2 Timotei', '2 Tim', '2 Tm'] },
  { slug: 'tit', orderNum: 70, testament: 'NT', labelRo: 'Epistola către Tit a Sfântului Apostol Pavel', labelRu: 'Послание к Титу святого апостола Павла', labelEn: 'The Epistle of St. Paul to Titus', aliases: ['Tit'] },
  { slug: 'filimon', orderNum: 71, testament: 'NT', labelRo: 'Epistola către Filimon a Sfântului Apostol Pavel', labelRu: 'Послание к Филимону святого апостола Павла', labelEn: 'The Epistle of St. Paul to Philemon', aliases: ['Filimon', 'Flm'] },
  { slug: 'evrei', orderNum: 72, testament: 'NT', labelRo: 'Epistola către Evrei a Sfântului Apostol Pavel', labelRu: 'Послание к Евреям святого апостола Павла', labelEn: 'The Epistle of St. Paul to the Hebrews', aliases: ['Evrei', 'Evr'] },
  { slug: 'iacov', orderNum: 73, testament: 'NT', labelRo: 'Epistola Sobornicească a Sfântului Apostol Iacov', labelRu: 'Соборное послание святого апостола Иакова', labelEn: 'The Catholic Epistle of St. James', aliases: ['Iacov', 'Iac'] },
  { slug: '1-petru', orderNum: 74, testament: 'NT', labelRo: 'Întâia Epistolă Sobornicească a Sfântului Apostol Petru', labelRu: 'Первое соборное послание святого апостола Петра', labelEn: 'The First Catholic Epistle of St. Peter', aliases: ['1 Petru', '1 Pt', '1 Pet'] },
  { slug: '2-petru', orderNum: 75, testament: 'NT', labelRo: 'A doua Epistolă Sobornicească a Sfântului Apostol Petru', labelRu: 'Второе соборное послание святого апостола Петра', labelEn: 'The Second Catholic Epistle of St. Peter', aliases: ['2 Petru', '2 Pt', '2 Pet'] },
  { slug: '1-ioan', orderNum: 76, testament: 'NT', labelRo: 'Întâia Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Первое соборное послание святого апостола Иоанна', labelEn: 'The First Catholic Epistle of St. John', aliases: ['1 Ioan', '1 In'] },
  { slug: '2-ioan', orderNum: 77, testament: 'NT', labelRo: 'A doua Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Второе соборное послание святого апостола Иоанна', labelEn: 'The Second Catholic Epistle of St. John', aliases: ['2 Ioan', '2 In'] },
  { slug: '3-ioan', orderNum: 78, testament: 'NT', labelRo: 'A treia Epistolă Sobornicească a Sfântului Apostol Ioan', labelRu: 'Третье соборное послание святого апостола Иоанна', labelEn: 'The Third Catholic Epistle of St. John', aliases: ['3 Ioan', '3 In'] },
  { slug: 'iuda', orderNum: 79, testament: 'NT', labelRo: 'Epistola Sobornicească a Sfântului Apostol Iuda', labelRu: 'Соборное послание святого апостола Иуды', labelEn: 'The Catholic Epistle of St. Jude', aliases: ['Iuda', 'Ida'] },
  { slug: 'apocalipsa', orderNum: 80, testament: 'NT', labelRo: 'Apocalipsa Sfântului Ioan Teologul', labelRu: 'Откровение святого Иоанна Богослова (Апокалипсис)', labelEn: 'The Revelation of St. John the Theologian (Apocalypse)', aliases: ['Apocalipsa', 'Apoc', 'Ap', 'Apocalipsa lui Ioan'] },
]

export const VT_COUNT = 53
export const NT_COUNT = 27

const BY_SLUG = new Map(BIBLE_BOOKS.map(b => [b.slug, b]))

export function getBook(slug: string): BibleBookInfo | undefined {
  return BY_SLUG.get(slug)
}

export function bookLabel(book: BibleBookInfo, locale: string): string {
  if (locale === 'ru') return book.labelRu
  if (locale === 'en') return book.labelEn
  return book.labelRo
}

/** Cartea anterioară și următoare din ordinea canonică (null la capete). */
export function neighbors(slug: string): { prev: BibleBookInfo | null; next: BibleBookInfo | null } {
  const book = BY_SLUG.get(slug)
  if (!book) return { prev: null, next: null }
  return {
    prev: BIBLE_BOOKS[book.orderNum - 2] ?? null,
    next: BIBLE_BOOKS[book.orderNum] ?? null,
  }
}

/** Numărul de capitole din Noul Testament — strict, folosit de validator. Total 260. */
export const NT_CHAPTER_COUNTS: Readonly<Record<string, number>> = {
  'matei': 28, 'marcu': 16, 'luca': 24, 'ioan': 21, 'faptele-apostolilor': 28,
  'romani': 16, '1-corinteni': 16, '2-corinteni': 13, 'galateni': 6, 'efeseni': 6,
  'filipeni': 4, 'coloseni': 4, '1-tesaloniceni': 5, '2-tesaloniceni': 3,
  '1-timotei': 6, '2-timotei': 4, 'tit': 3, 'filimon': 1, 'evrei': 13,
  'iacov': 5, '1-petru': 5, '2-petru': 3, '1-ioan': 5, '2-ioan': 1, '3-ioan': 1,
  'iuda': 1, 'apocalipsa': 22,
}
