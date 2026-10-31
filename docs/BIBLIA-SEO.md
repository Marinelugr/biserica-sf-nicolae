# Biblia: canonical, Open Graph și titluri

Audit și reparații pentru paginile publice ale Bibliei, ramura `feat/biblia-seo` (octombrie 2026).

## Concluzii

- **`og:url` era greșit pe toate paginile Bibliei.** Indica prima pagină, iar `og:title` și `og:description` erau cele implicite ale site-ului. Paginile aveau `generateMetadata`, dar fără `openGraph`, iar Next combină metadata superficial, deci valorile veneau din `src/app/layout.tsx`.
- **`<link rel="canonical">` era deja corect pe paginile în română.** Câmpul „Canonical URL” din Facebook Sharing Debugger arată `og:url`, nu eticheta `<link>`, de aici diferența față de observația inițială. Riscul ca Google să trateze capitolele ca duplicate ale primei pagini nu apare în codul auditat.
- **Variantele `/en` și `/ru` aveau canonicul spre pagina în română**, prin `buildAlternates`.
- **Descrierile capitolelor copiau primele versete.** Acum sunt generice.
- **Căutarea avea `noindex, nofollow`.** Acum are `noindex, follow`.

## Cum s-a făcut auditul

- Build de producție și `next start` pe o copie izolată a depozitului, fără fișiere `.env`.
- Bază de date: PGlite local, în memorie, cu date sintetice (cele 80 de cărți; capitole doar la Ioan, Psalmi, 1 Corinteni; o știre și o carte de probă). Nu s-a folosit baza de producție și nu s-a făcut nicio cerere către site-ul live.
- HTML-ul s-a extras cu User-Agent de Facebook și de browser; canonicul și `og:url` au ieșit la fel în ambele cazuri, iar eticheta canonical e în `<head>`.
- Valorile din tabele provin din acest build local, nu din producție. Căile sunt relative la `https://parintelemarin.com`.

## Rute greșite înainte de reparație

| Rute | Problema |
|---|---|
| `/biblie`, `/biblie/ioan`, toate capitolele, `/biblie?q=…` | `og:url` spre prima pagină; `og:title` și `og:description` implicite |
| Capitolele (toate limbile) | Descriere cu text biblic copiat |
| `/biblie?q=…` | `nofollow` în loc de `follow` |
| `/en/bible…`, `/ru/bibliya…` | Canonical spre varianta în română și `og:url` spre prima pagină |

## Decizii

- **Numele cărții în română** este numele scurt folosit deja la referințe (`aliases[0]`): „Ioan 3 — Biblia”, nu „Sfânta Evanghelie după Ioan 3 — Biblia”. În engleză și rusă rămâne eticheta existentă.
- **Titlurile sunt absolute**, fără sufixul cu numele site-ului din layout, ca să fie exact formatul cerut.
- **`og:type`** este `article` la capitole și `website` la index și cărți, ca în restul site-ului (`carti/[slug]` și `carti/categorie/[slug]`).
- **Hreflang:** site-ul îl folosește deja, deci paginile Bibliei îl păstrează, iar canonicul e propriu în limba paginii.
- **Fără text încă:** cărțile și capitolele neimportate rămân `noindex, follow`, ca înainte.
- **Fișier nou `src/lib/bible/seo.ts`:** textele și construcția metadata stau aici pentru că un `page.tsx` nu poate exporta funcții auxiliare și ca să poată fi testate. Dicționarele din `src/lib/i18n` și layoutul nu s-au schimbat.
- **`versesDescription`** a fost scoasă din `src/lib/bible/viewModel.ts`, fiindcă nu o mai folosește nimeni.

## Sitemap

`src/app/sitemap.ts` nu s-a schimbat. Pe baza sintetică are 206 adrese înainte și 206 după, cu XML identic (fără `lastmod`), iar URL-urile `/biblie` și `/biblie/ioan/3` din sitemap coincid cu canonicele paginilor.

După deploy, sitemap-ul live are 13.157 de adrese unice, dintre care 1.347 de capitole.

## Înainte și după

### `/biblie`

| Câmp | Înainte | După |
|---|---|---|
| title | Sfânta Scriptură — Biblia Ortodoxă \| Biserica Sfântul Ierarh Nicolae | Biblia — text în limba română |
| description | Citește Sfânta Scriptură online. Biblia Ortodoxă — Vechiul Testament și Noul Testament, în limba română, conform ediției Sfântului Sinod. | Citește Biblia în limba română: Vechiul și Noul Testament, pe cărți și capitole. |
| canonical | /biblie | /biblie |
| og:url | **/** (prima pagină) | /biblie |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | Biblia — text în limba română |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește Biblia în limba română: Vechiul și Noul Testament, pe cărți și capitole. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | ro_RO | ro_RO |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/biblie/ioan`

| Câmp | Înainte | După |
|---|---|---|
| title | Sfânta Evanghelie după Ioan \| Biblia Ortodoxă | Ioan — Biblia |
| description | Sfânta Evanghelie după Ioan — Cartea 57 din 80 · Noul Testament. | Citește Ioan în limba română, capitol cu capitol. |
| canonical | /biblie/ioan | /biblie/ioan |
| og:url | **/** (prima pagină) | /biblie/ioan |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | Ioan — Biblia |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește Ioan în limba română, capitol cu capitol. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | ro_RO | ro_RO |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/biblie/ioan/3`

| Câmp | Înainte | După |
|---|---|---|
| title | Sfânta Evanghelie după Ioan 3 \| Biblia Ortodoxă | Ioan 3 — Biblia |
| description | (primele versete: text biblic copiat) | Citește Ioan, capitolul 3, în limba română. |
| canonical | /biblie/ioan/3 | /biblie/ioan/3 |
| og:url | **/** (prima pagină) | /biblie/ioan/3 |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | Ioan 3 — Biblia |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește Ioan, capitolul 3, în limba română. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | article |
| og:locale | ro_RO | ro_RO |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/biblie/psalmi/50`

| Câmp | Înainte | După |
|---|---|---|
| title | Psalmii 50 \| Biblia Ortodoxă | Psalmii 50 — Biblia |
| description | (primele versete: text biblic copiat) | Citește Psalmii, capitolul 50, în limba română. |
| canonical | /biblie/psalmi/50 | /biblie/psalmi/50 |
| og:url | **/** (prima pagină) | /biblie/psalmi/50 |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | Psalmii 50 — Biblia |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește Psalmii, capitolul 50, în limba română. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | article |
| og:locale | ro_RO | ro_RO |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/biblie/1-corinteni/13`

| Câmp | Înainte | După |
|---|---|---|
| title | Epistola întâi către Corinteni a Sfântului Apostol Pavel 13 \| Biblia Ortodoxă | 1 Corinteni 13 — Biblia |
| description | (primele versete: text biblic copiat) | Citește 1 Corinteni, capitolul 13, în limba română. |
| canonical | /biblie/1-corinteni/13 | /biblie/1-corinteni/13 |
| og:url | **/** (prima pagină) | /biblie/1-corinteni/13 |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | 1 Corinteni 13 — Biblia |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește 1 Corinteni, capitolul 13, în limba română. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | article |
| og:locale | ro_RO | ro_RO |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/biblie?q=dumnezeu`

| Câmp | Înainte | După |
|---|---|---|
| title | Sfânta Scriptură — Biblia Ortodoxă \| Biserica Sfântul Ierarh Nicolae | Biblia — text în limba română |
| description | Citește Sfânta Scriptură online. Biblia Ortodoxă — Vechiul Testament și Noul Testament, în limba română, conform ediției Sfântului Sinod. | Citește Biblia în limba română: Vechiul și Noul Testament, pe cărți și capitole. |
| canonical | /biblie | /biblie |
| og:url | **/** (prima pagină) | /biblie |
| og:title | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | Biblia — text în limba română |
| og:description | Parohia Ortodoxă din Hîrtopul Mic, Criuleni, Republica Moldova. | Citește Biblia în limba română: Vechiul și Noul Testament, pe cărți și capitole. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | ro_RO | ro_RO |
| robots | noindex, nofollow | noindex, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/en/bible`

| Câmp | Înainte | După |
|---|---|---|
| title | Holy Scripture — Orthodox Bible \| Saint Nicholas Church | The Bible — text in Romanian |
| description | Read the Holy Scripture online. Orthodox Bible — Old and New Testament. | Read the Bible in Romanian: the Old and New Testament, by book and chapter. |
| canonical | /biblie | /en/bible |
| og:url | **/** (prima pagină) | /en/bible |
| og:title | Saint Nicholas Church — Hîrtopul Mic, Moldova | The Bible — text in Romanian |
| og:description | Orthodox Parish in Hîrtopul Mic, Criuleni, Republic of Moldova. | Read the Bible in Romanian: the Old and New Testament, by book and chapter. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | en_US | en_US |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/en/bible/ioan/3`

| Câmp | Înainte | După |
|---|---|---|
| title | The Holy Gospel according to John 3 \| Orthodox Bible | The Holy Gospel according to John 3 — The Bible |
| description | (primele versete: text biblic copiat) | Read The Holy Gospel according to John, chapter 3, in Romanian. |
| canonical | /biblie/ioan/3 | /en/bible/ioan/3 |
| og:url | **/** (prima pagină) | /en/bible/ioan/3 |
| og:title | Saint Nicholas Church — Hîrtopul Mic, Moldova | The Holy Gospel according to John 3 — The Bible |
| og:description | Orthodox Parish in Hîrtopul Mic, Criuleni, Republic of Moldova. | Read The Holy Gospel according to John, chapter 3, in Romanian. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | article |
| og:locale | en_US | en_US |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/en/bible?q=dumnezeu`

| Câmp | Înainte | După |
|---|---|---|
| title | Holy Scripture — Orthodox Bible \| Saint Nicholas Church | The Bible — text in Romanian |
| description | Read the Holy Scripture online. Orthodox Bible — Old and New Testament. | Read the Bible in Romanian: the Old and New Testament, by book and chapter. |
| canonical | /biblie | /en/bible |
| og:url | **/** (prima pagină) | /en/bible |
| og:title | Saint Nicholas Church — Hîrtopul Mic, Moldova | The Bible — text in Romanian |
| og:description | Orthodox Parish in Hîrtopul Mic, Criuleni, Republic of Moldova. | Read the Bible in Romanian: the Old and New Testament, by book and chapter. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | en_US | en_US |
| robots | noindex, nofollow | noindex, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/ru/bibliya`

| Câmp | Înainte | După |
|---|---|---|
| title | Священное Писание — Православная Библия \| Церковь Святителя Николая | Библия — текст на румынском языке |
| description | Читайте Священное Писание онлайн. Православная Библия — Ветхий и Новый Завет. | Читайте Библию на румынском языке: Ветхий и Новый Завет, по книгам и главам. |
| canonical | /biblie | /ru/bibliya |
| og:url | **/** (prima pagină) | /ru/bibliya |
| og:title | Церковь Святителя Николая — Хыртопул Мик, Молдова | Библия — текст на румынском языке |
| og:description | Православный приход в селе Хыртопул Мик, Криуляны, Республика Молдова. | Читайте Библию на румынском языке: Ветхий и Новый Завет, по книгам и главам. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | website |
| og:locale | ru_RU | ru_RU |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

### `/ru/bibliya/ioan/3`

| Câmp | Înainte | După |
|---|---|---|
| title | Евангелие от Иоанна 3 \| Православная Библия | Евангелие от Иоанна 3 — Библия |
| description | (primele versete: text biblic copiat) | Читайте: Евангелие от Иоанна, глава 3, на румынском языке. |
| canonical | /biblie/ioan/3 | /ru/bibliya/ioan/3 |
| og:url | **/** (prima pagină) | /ru/bibliya/ioan/3 |
| og:title | Церковь Святителя Николая — Хыртопул Мик, Молдова | Евангелие от Иоанна 3 — Библия |
| og:description | Православный приход в селе Хыртопул Мик, Криуляны, Республика Молдова. | Читайте: Евангелие от Иоанна, глава 3, на румынском языке. |
| og:image | /images/12.jpg | /images/12.jpg |
| og:type | website | article |
| og:locale | ru_RU | ru_RU |
| robots | index, follow | index, follow |
| hreflang | ro, ro-MD, ru, ru-MD, en, x-default | ro, ro-MD, ru, ru-MD, en, x-default |

## Martori (neschimbați)

Valorile sunt identice înainte și după reparație.

| Rută | title | canonical | og:url | og:title | og:image | og:type | og:locale | robots | hreflang |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Criuleni | **/** (prima pagină) | **/** (prima pagină) | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | /images/12.jpg | website | ro_RO | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |
| `/contact` | Contact \| Biserica Sfântul Ierarh Nicolae | /contact | **/** (prima pagină) | Biserica Sfântul Ierarh Nicolae — Hîrtopul Mic, Moldova | /images/12.jpg | website | ro_RO | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |
| `/en/contact` | Contact \| Saint Nicholas Church | /contact | **/** (prima pagină) | Saint Nicholas Church — Hîrtopul Mic, Moldova | /images/12.jpg | website | en_US | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |
| `/ru/kontakt` | Контакты \| Церковь Святителя Николая | /contact | **/** (prima pagină) | Церковь Святителя Николая — Хыртопул Мик, Молдова | /images/12.jpg | website | ru_RU | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |
| `/stiri/stire-proba` | Știre de probă \| Biserica Sfântul Ierarh Nicolae | /stiri/stire-proba | /stiri/stire-proba | Știre de probă | — | article | ro_RO | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |
| `/carti/carte-proba` | Carte de probă \| Bibliotecă Ortodoxă \| Biserica Sfântul Ierarh Nicolae | /carti/carte-proba | /carti/carte-proba | Carte de probă | — | article | ro_RO | index, follow | ro, ro-MD, ru, ru-MD, en, x-default |

## Alte probleme găsite (nemodificate)

1. **Rezolvat: `og:url` spre prima pagină, în afara Bibliei.** Toate paginile publice își declară acum `og:url`, în limba paginii. `og:title` și `og:description` rămân cele implicite ale site-ului pe paginile care nu au valori proprii.
2. **Canonical spre română pe variantele `/en` și `/ru`, în tot site-ul.** Vine din `buildAlternates`; confirmat la `/en/contact`, `/ru/kontakt` și `/en/stiri/stire-proba`. Dacă paginile traduse trebuie indexate separat, trebuie reparat acolo.
3. **`og:locale` fixat pe `ro_RO`** pe știri, cărți, sfinți, video, paroh și mesajul părintelui, inclusiv pe variantele `/en` și `/ru`. `og:url` e deja reparat acolo. Tot aici, `/despre` nu are `og:locale` și `og:type`.
4. **Fără `og:image` la știri și cărți fără imagine proprie.** Confirmat la știrea și cartea de probă.
5. **Eroare 500 la `/biblie?q=a&q=b`.** Parametrul repetat ajunge ca listă și `q?.trim()` eșuează. Codul exista și înainte; nu e o problemă de SEO, deci nu s-a schimbat.
6. **`twitter:title` și `twitter:description` rămân cele implicite ale site-ului pe paginile Bibliei.** Nu erau cerute.
7. **`themeColor` în metadata** din `src/app/layout.tsx` produce avertismente la rulare; Next îl vrea în `viewport`.
8. **`npm test` cade fără `DATABASE_URL`.** Suita `src/lib/bible/adminCore.test.ts` importă Prisma și nu pornește fără variabilă, inclusiv pe `main` nemodificat. Cu un URL fictiv (`postgresql://x:x@127.0.0.1:1/x`) trec toate cele 30 de suite (378 de teste).
9. **`/og-default.jpg` lipsește din `public/`.** `src/app/paroh/page.tsx` îl folosește ca imagine când parohul nu are fotografie.
