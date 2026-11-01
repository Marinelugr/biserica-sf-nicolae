# „Continuă lectura” la cărțile din Bibliotecă

Ramura `feat/carti-continua`, noiembrie 2026. Cititorul își regăsește locul în orice carte din Bibliotecă, inclusiv în cele adăugate mai târziu, fără cod nou. Mecanismul de la Biblie e descris în `docs/BIBLIA-CONTINUA.md`.

## Audit

**Cum sunt publicate cărțile.** Rutele sunt `/carti` (lista), `/carti/categorie/<slug>` și `/carti/<slug>`, cu variantele `/en/library` și `/ru/biblioteka`. Sursa e tabelul `LibraryBook`. Toate cărțile trec prin aceeași cale: HTML din editorul TipTap (`contentRo`), într-un singur `.rich.reading`. **Nu există vizualizator de PDF, pagini-imagine, EPUB sau cărți doar cu link extern**, nici în cod, nici în date. Singurul `iframe` e videoclipul YouTube opțional de deasupra textului.

**De unde vine tabelul.** Din copia locală `backups/backup-inainte-eliminare-ru-en-2026-08-27.sql`, citită doar pentru rândurile `LibraryBook` și doar coloana `contentRo`. Nu m-am conectat la producție și nu am făcut cereri către site-ul live.

**Limită:** copia e din 27 august și are **20 de cărți**, iar în sitemap sunt aproximativ 22. Cărțile mai noi nu sunt în tabel. Nu e nevoie de o listă în cod: unitatea se alege în browser, pentru fiecare carte, din textul ei.

| Carte (slug) | Afișare | Titluri | Mărime HTML | Unitate |
|---|---|---:|---:|---|
| `acatistul-sfintei-treimi` | text HTML | 31 | 38.3 KB | secțiune |
| `acatistul-maicii-domnului-bucuria-tuturor-celor-necajiti` | text HTML | 29 | 25.5 KB | secțiune |
| `acatistul-maicii-domnului-grabnic-ajutatoare` | text HTML | 5 | 24.9 KB | secțiune |
| `acatistul-maicii-domnului-potirul-nesecat` | text HTML | 28 | 21.1 KB | secțiune |
| `acatistul-sfantului-ierarh-spiridon-episcopul-trimitundei` | text HTML | 27 | 20.1 KB | secțiune |
| `acatistul-sfantului-stelian-ocrotitorul-copiilor` | text HTML | 28 | 18.7 KB | secțiune |
| `acatistul-sfantului-ierarh-nicolae-arhiepiscopul-de-mira-lichia` | text HTML | 28 | 18.7 KB | secțiune |
| `acatistul-de-multumire-slava-lui-dumnezeu-pentru-toate` | text HTML | 27 | 18.1 KB | secțiune |
| `acatistul-sfantului-ioan-botezatorul` | text HTML | 27 | 16.3 KB | secțiune |
| `prohodul-maicii-domnului` | text HTML | 0 | 24.9 KB | procent |
| `tatina-sfantului-botez` | text HTML | 0 | 14.5 KB | procent |
| `talcuirea-evangheliei-inmultii-celor-5-paini-si-2-pesti-de-catre-mantuitorul-nostru-iisus-hristos` | text HTML | 1 | 12.8 KB | procent |
| `rugaciunea-preasfintitului-eremei-schimnicul-catre-sfantul-mare-mucenic-pantelimon-vindecatorul-de-boli` | text HTML | 0 | 3.3 KB | procent |
| `vineri` | text HTML | 0 | 2.7 KB | procent |
| `sambata` | text HTML | 0 | 1.9 KB | procent |
| `duminica` | text HTML | 0 | 1.8 KB | procent |
| `marti` | text HTML | 0 | 1.7 KB | procent |
| `luni` | text HTML | 0 | 1.4 KB | procent |
| `joi` | text HTML | 0 | 1.4 KB | procent |
| `miercuri` | text HTML | 0 | 1.2 KB | procent |

| Tip de afișare | Unitate | Cărți |
|---|---|---:|
| Text cu cel puțin 3 titluri | secțiune | 9 |
| Text fără titluri suficiente | procent | 11 |
| PDF sau pagini-imagine | număr de pagină | 0 |
| Link extern sau descărcare | nesuportat | 0 |

Din cele 11 cărți cu procent, 7 sunt rugăciunile zilelor săptămânii, de sub 3 KB. Un text scurt, citit până la capăt sau care încape în ecran, nu lasă un loc de reluat și apare doar la „Citite recent”.

**Ce era legat de Biblie.** Modulul `src/lib/bible/readingPosition.ts` amesteca stocarea cu regulile Bibliei. Am separat partea generică în `src/lib/reading-position.ts`.

## Decizii

**Ce e o secțiune.** Niciuna dintre cele 20 de cărți nu are ancore, iar doar una are un titlu `h2`. Acatistele au însă „Condac 1”, „Icos 1” ca paragrafe doar îngroșate. `findSections` ia drept titlu un `h1–h4` sau un paragraf care conține numai `<strong>`, de cel mult 80 de caractere. Sub 3 titluri, poziția e procentul.

**Ancorele se pun în client.** `id="s<N>"` se adaugă după montare, deci HTML-ul servit rămâne la fel.

**Secțiunea curentă e ultima depășită, nu cea mai de sus vizibilă.** Aici e o abatere de la cerință: între titluri, textul poate fi mai lung decât ecranul, iar atunci niciun titlu nu e vizibil. `IntersectionObserver` urmărește o zonă de la începutul paginii până la linia de lectură (15% din ecran).

**Când se salvează.**
- Deschiderea pune cartea la „Citite recent”, dar nu scrie un loc. Altfel, simpla deschidere ar șterge locul salvat, iar butonul „Continuă de la…” ar dispărea.
- Locul se scrie abia după o derulare de cel puțin 48 px și peste 3% din text.
- La sfârșitul textului locul se șterge, iar cartea rămâne citită recent. Un „Continuă de la 100%” n-ar ajuta. Costul: dacă cineva derulează până la capăt doar ca să ajungă la subsol, își pierde locul.

**Unde stă locul fiecărei cărți.** `lectura:carte:poz` ține ultimul loc, pentru card. `lectura:carte:recente` ține și locul fiecărei intrări, ca butonul să apară la ultimele 5 cărți, nu doar la ultima. O carte care iese din listă își pierde locul.

**Reluarea.** Cardul trimite la `/carti/<slug>#s<N>` sau `#p<procent>`. Fragmentul nu ajunge la server și nu se indexează, iar ancora se scoate din URL imediat după derulare, ca să nu se repete la reîncărcare. O deschidere fără ancoră nu derulează niciodată. Imaginea de copertă se încarcă după derulare, de aceea locul se refăce cât se așază pagina (1 s).

**Titlurile și cărțile șterse.** Pe `/carti`, interogarea existentă `findMany` nu mai are `take: 6`: aduce toate cărțile, iar lista „Adăugate recent” taie primele 6. Numărul de interogări rămâne același. Astfel, titlurile sunt mereu cele curente și o carte ștearsă se poate recunoaște. Costul: titlurile și slugurile ajung în datele paginii (aproximativ 1,3 KB la 10 cărți), nu și în HTML-ul vizibil.

**Valori invalide.**
- Formă greșită (JSON stricat, procent negativ, ancoră nevalidă): cheia se șterge.
- Carte care nu mai există: dispare doar acea carte, iar lista celorlalte rămâne. Dacă baza nu răspunde, nu se șterge nimic.
- Ancoră care nu mai corespunde (alt titlu sau inexistentă, după o editare): locul se șterge, iar cartea rămâne citită recent.

**Chei.** Biblia folosește acum `lectura:biblia:poz` și `lectura:biblia:recente`. Cheile `biblia:*` se mută la prima citire și apoi se șterg. Dacă scrierea eșuează (stocare plină), cheia veche rămâne.

**Fără hook `useReadingPosition`.** Biblia și cărțile urmăresc lucruri diferite, deci un hook comun ar fi fost plin de opțiuni. Comune sunt depozitul (`createReadingStore`), momentul salvării (`createPositionSaver`) și cardul (`ContinueCard`).

**Ce nu intră.** Biblia rămâne cum e. Viețile sfinților și știrile sunt pagini scurte; pot primi „Citite recent” ulterior, dar nu sunt implementate.

**Traduceri.** Textele cardului sunt reutilizate de la Biblie; s-au adăugat doar `books.continueBook` și `books.continueFrom`. Titlurile cărților sunt doar în română, ca în restul Bibliotecii.

## Cum conectezi o carte sau o secțiune nouă

1. **O carte nouă în Bibliotecă:** nimic de făcut. Pentru secțiuni, folosește titluri sau paragrafe doar îngroșate în editor, cel puțin 3.
2. **Un alt tip de conținut în text:** adaugă `createReadingStore({ tip, parsePosition, parseRecent, select })`, după modelul din `src/lib/carti/readingPosition.ts`. Validează tot ce citești.
3. **Pe pagină:** urmărește locul cu `createPositionSaver`, ca în `src/components/carti/BookReading.tsx`. Pe lista secțiunii, folosește `ContinueCard`.
4. **Un vizualizator de PDF:** adaugă `pagina` în `BookLocation` și în `toRecentBook`, plus eticheta în `placeLabel`. Salvează pagina doar dacă vizualizatorul expune un eveniment; un PDF într-un `iframe` rămâne doar la „Citite recent”.

## Verificare

Pe un build standalone local, fără `.env`, cu PGlite în memorie și cărți inventate.

```bash
BASE_URL=http://127.0.0.1:3417 PLAYWRIGHT_DIR=<folder cu playwright-core> \
CHROMIUM_PATH=<executabil Chromium> SHOTS_DIR=<folder> node e2e/carti-continua.mjs
```

Cărțile așteptate sunt enumerate în antetul fișierului. Serverul se pornește cu `HOSTNAME=0.0.0.0`.

| Comparație cu `main`, pe aceeași bază | Rezultat |
|---|---|
| Titlu, meta, canonical, hreflang (17 pagini: Bibliotecă, Biblie, prima pagină; ro/en/ru) | identice |
| HTML-ul din `<body>`, fără scripturi, aceleași pagini | identic |
| `/sitemap.xml` (87 de adrese pe baza sintetică) | identic, în afară de `lastmod`, care vine din `new Date()` |
| JS inițial, gzip, `/carti` | 262,7 → 265,5 KB |
| JS inițial, gzip, pagina unei cărți | 264,9 → 267,7 KB |
| JS inițial, gzip, `/biblie` | 269,2 → 270,0 KB |
| JS inițial, gzip, capitol | 270,8 → 271,4 KB |

**Limite:**
- E2E a rulat doar în Chromium. Safari și revenirea din aplicație pe un telefon real nu sunt testate.
- Unitatea de lectură a celor aproximativ 2 cărți mai noi decât copia nu e verificată.
- Locul reluat prin procent se poate muta ușor dacă imaginea de copertă se încarcă după mai mult de o secundă, pe browserele fără scroll anchoring.
- Tipurile „PDF” și „nesuportat” nu au fost testate, fiindcă nu există. Cazul lor de afișare („doar la Citite recent”) e acoperit de o carte scurtă de probă.

Capturile, cu text de probă, sunt în `docs/design/carti-continua/`.
