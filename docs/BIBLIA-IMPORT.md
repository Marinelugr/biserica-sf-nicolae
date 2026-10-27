# Biblia — partea 1: cititor, căutare, extragere din Word, import (ramura `feat/biblia-cititor`, 2026-10-26)

Fără niciun verset în acest fișier. Textul Bibliei, fișierele Word și datele extrase **nu se comit niciodată**:
`/bible-source/` și `/bible-data/` sunt în `.gitignore` (repo public). Partea 2 face încărcarea în producție.

## Sursa

- **Fișierele Word ale lui Marin nu au fost găsite** (căutat după nume, fără a deschide nimic, în
  `./bible-source/`, `~/dev`, `~/Documents`, `~/Downloads`, `~/Desktop`, iCloud Drive: niciun `.docx/.doc/.rtf/.pdf/.txt`
  cu „bibli”, „testament”, „facere”, „matei”, „psalm”, „genesis”…; cel mai mare `.docx` de pe Mac are 2 MB și e o teză).
- Deci **formatul real nu e cunoscut**. Parserul (`src/lib/bible/parse.ts`) acoperă formatele obișnuite și
  măsoară tiparele găsite (`detectFormat`) înainte să scrie ceva:
  - titlul cărții = un paragraf care e numele/alias-ul unei cărți (sau îl are între paranteze);
  - capitol = „Capitolul 3”, „Cap. III”, „Psalmul 50” sau (cu `--bare-number-chapters`) un paragraf doar cu numărul;
  - verset = număr la început de paragraf („1.”, „1)”, „1 ”), în interiorul paragrafului (`--verse-style=inline`)
    sau între paranteze drepte (`--verse-style=bracket`);
  - paragraf fără număr: scurt și fără punct final → titlu/pericopă (lăsat deoparte, numărat), altfel → continuarea
    versetului anterior; rânduri care încep cu `*`, `†`, `[a]`, „Notă” → note (lăsate deoparte, numărate);
  - un fișier pentru toată Biblia (împărțit după titluri) sau câte unul pe carte (cartea din numele fișierului);
  - textul dinaintea primei cărți = pagina de titlu: din el se raportează doar rândurile bibliografice.
- Dacă detectarea nu e sigură, `bible:extract` nu scrie nimic și spune ce opțiune să încerci.
- **Nota de sursă** (`src/lib/bible/source.ts`, afișată la sfârșitul fiecărui capitol) e neutră:
  „Biblia — text în limba română”. **Care este ediția? Marin trebuie să confirme înainte de publicare**; apoi se
  scrie exact cum o declară pagina de titlu (ediție, an, editură, aprobări).

## Comenzi (ordinea de lucru)

```bash
npm run bible:extract     # bible-source/*.docx → bible-data/<slug>.json + _raport-extragere.md
npm run bible:validate    # verifică; _raport-validare.md; 6 versete de control DOAR în terminal; cod ≠ 0 la blocante
npm run bible:import      # DOAR planul (dry-run), după validare; nimic scris
npm run bible:import -- --apply                       # scrie (pe localhost)
npm run bible:import -- --apply --allow-remote --yes-host=<gazda exactă>   # pe altă gazdă (partea 2)
npm run bible:wipe        # rollback: arată ce ar șterge; cu --apply (+ aceeași gardă) și confirmarea „STERGE BIBLIA”
npm run bible:verify-live # după deploy: ≤ 130 de capitole de pe https://parintelemarin.com comparate cu bible-data
```

Opțiuni comune: `--source=<folder>`, `--data=<folder>` (pentru teste cu date de probă). `bible:import`:
`--only=<slug,slug>`, `--replace-book=<slug>` (șterge și reimportă o carte), `--offline` (plan fără conexiune).
`bible:extract`: `--verse-style=paragraph|inline|bracket`, `--bare-number-chapters`, `--force`.

Importul citește `DIRECT_URL` (sesiune, nu pooler) sau `DATABASE_URL` prin `dotenv` și afișează **doar numele
gazdei** și cifre: rândurile Biblie, plus articole/video/setări și mărimea bazei (MB), ca dovadă că e baza site-ului.
Pe carte, într-o tranzacție (timeout 5 min): cartea (din `books.ts`), capitolele, versetele în loturi ≤ 1000 cu
`textSearch`; apoi verifică numerele din bază = JSON. O eroare anulează cartea respectivă și oprește importul.
Cărțile care au deja capitole sunt omise (importul se poate rula din nou fără dubluri).

## Normalizare (`normalizeVerseText`)

NFC; ş ţ Ş Ţ (sedilă) → ș ț Ș Ț (virgulă); spațiu nerupt → spațiu; caractere de lățime zero și cratima moale
scoase; spații multiple → unul; fără spații la capete. **Ortografia nu se schimbă** („sînt”/„sunt”, „î”/„â” rămân
ca în sursă). Raportul de extragere numără sedilele transformate și ortografia găsită (sînt/cînd/pămînt față de
sunt/când/pământ, „â” față de „î” în interiorul cuvintelor) — modernizarea ar fi altă decizie, alt PR.

Căutare: `textSearch = normalizeForSearch(textRo)` — litere mici, fără diacritice, punctuația → spațiu, **aceeași
lungime** ca textul (pozițiile găsite se evidențiază în textul original).

## Validare

**Blocante** (importul refuză): carte lipsă din cele 80 / necunoscută / dublă; capitole care nu sunt 1..N la rând;
versete care nu sunt 1..M la rând (la Psalmi se acceptă și 0..M, titlul numerotat 0); verset gol; versete duble;
caracter `�` sau de control; mojibake („Ã” + simbol…); sedilă rămasă; text care începe cu o cifră; **Noul
Testament: număr de capitole ≠ `NT_CHAPTER_COUNTS`** (total 260).

**Avertismente** (de verificat manual, nimic nu se corectează): capitol > 180 de versete; verset > 4000 de
caractere; verset identic cu precedentul; total în afara 30 000–40 000; număr de capitole din Vechiul Testament
diferit de cel obișnuit (`USUAL_VT_CHAPTERS` în `validate.ts` — edițiile diferă, de ex. Psalmii 150/151).

### `bible-data/_exceptii.json` (scris doar de Marin)

```json
{ "exceptii": [
  { "code": "vt-chapter-count", "slug": "psalmi", "motiv": "ediția noastră are 150 de psalmi" },
  { "code": "verses-not-consecutive", "slug": "iov", "chapter": 40, "motiv": "verificat cu Biblia tipărită" }
] }
```

`code` și locul (`slug`, `chapter`, `verse`) trebuie să fie exact ca în raport; `motiv` e obligatoriu. Validatorul
le afișează la fiecare rulare și nu le generează niciodată singur.

## Schema (doar în fișier — o aplică partea 2)

`BibleChapter @@unique([bookId, chapterNum])`, `BibleVerse @@unique([chapterId, verseNum])` și `textSearch`.
SQL obținut cu `prisma migrate diff`, **fără conexiune**:

Față de schema actuală (tabelele există și sunt goale):

```sql
ALTER TABLE "BibleVerse" ADD COLUMN "textSearch" TEXT NOT NULL;
CREATE UNIQUE INDEX "BibleChapter_bookId_chapterNum_key" ON "BibleChapter"("bookId", "chapterNum");
CREATE UNIQUE INDEX "BibleVerse_chapterId_verseNum_key" ON "BibleVerse"("chapterId", "verseNum");
```

De la zero, doar cele 3 tabele:

```sql
CREATE TABLE "BibleBook" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "nameRo" TEXT NOT NULL, "testament" TEXT NOT NULL, "orderNum" INTEGER NOT NULL, CONSTRAINT "BibleBook_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BibleChapter" ("id" TEXT NOT NULL, "bookId" TEXT NOT NULL, "chapterNum" INTEGER NOT NULL, CONSTRAINT "BibleChapter_pkey" PRIMARY KEY ("id"));
CREATE TABLE "BibleVerse" ("id" TEXT NOT NULL, "chapterId" TEXT NOT NULL, "verseNum" INTEGER NOT NULL, "textRo" TEXT NOT NULL, "textSearch" TEXT NOT NULL, CONSTRAINT "BibleVerse_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "BibleBook_slug_key" ON "BibleBook"("slug");
CREATE UNIQUE INDEX "BibleChapter_bookId_chapterNum_key" ON "BibleChapter"("bookId", "chapterNum");
CREATE UNIQUE INDEX "BibleVerse_chapterId_verseNum_key" ON "BibleVerse"("chapterId", "verseNum");
ALTER TABLE "BibleChapter" ADD CONSTRAINT "BibleChapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BibleBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BibleVerse" ADD CONSTRAINT "BibleVerse_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "BibleChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Cheile străine sunt `RESTRICT`: ștergerea se face versete → capitole → cărți (așa fac `--replace-book` și `bible:wipe`).
Căutarea folosește `LIKE '%cuvânt%'` pe `textSearch` cu `LIMIT 25` (~35 000 de rânduri); un index trigram
(`pg_trgm`) ar fi o optimizare ulterioară, doar dacă e nevoie.

## Cititorul

- `/biblie/<carte>`: grila capitolelor; carte fără text în bază → „Textul acestei cărți va fi disponibil în curând.”
  (200, `noindex`), carte necunoscută → 404.
- `/biblie/<carte>/<capitol>`: pergament (`data-sec="evanghelie"`), versete `id="v12" data-verse="12"`, numărul
  din `data-n` (pseudo-element: nu intră niciodată la copiere), `#v12` evidențiat sub antet, anterior/următor peste
  granița cărților, selector `<details>` fără JS, nota sursei, nota „Textul Bibliei este în limba română.” pe ru/en.
  Capitol invalid sau peste N → 404; bază indisponibilă → „în curând”, nu 500.
- `ReaderControls`: 22 / 26 / 30 px, păstrat în `localStorage` (cu rezervă în memorie) — singurul JS nou.
- `/biblie?q=`: referința („Ioan 3:16”, „1 Cor 13”, „Ps 50”) → direct la verset; altfel lista cărților + secțiunea
  „Versete” (toate cuvintele, fără diacritice, 25 pe pagină, evidențiate, `nofollow`, `noindex`).
- Sitemap: toate capitolele existente în bază (tabele goale → nicio intrare).
- Cache în memorie: 1 h, 300 de intrări; rezultatele goale nu se păstrează (o carte importată apare imediat).
- Galeria `/dev/biblia` (și `/dev/biblia/1..3`): doar în dezvoltare, doar text de probă; 404 în producție.

Reparat pe drum: `CookieNotice` și `I18nProvider` accesau `localStorage` fără `try/catch` — cu datele de site
blocate, **orice** pagină a site-ului cădea („This page couldn't load”).

## Verificări (2026-10-26, bază de date fictivă `127.0.0.1:1`)

- `tsc` curat; `npm test` 197/197 (90 existente + 107 noi în `src/lib/bible/`, doar date de probă); lint: aceleași
  16 erori ca pe `main` (o eroare nouă `no-html-link-for-pages`, apărută odată cu rutele imbricate, reparată);
  `next build` reușit.
- Extragere testată cap-coadă pe un `.docx` de probă generat (3 cărți): sedile transformate, verset pe două
  paragrafe unit, pericope lăsate deoparte, date bibliografice raportate. Validare pe o Biblie sintetică completă
  (80 de cărți, 39 210 versete de probă): 0 blocante, 0 avertismente. Import: dry-run și `--offline`; cu o bază
  inexistentă iese cu cod 1 și doar „Can't reach database server”, fără URL/parolă.
- **Cap-coadă pe Postgres real: nefăcut** — pe Mac nu există nici `docker`, nici Postgres; nu s-a instalat nimic.
  Rămâne pentru partea 2, cu rollback (`bible:wipe`). Testele cu client fals acoperă: dry-run fără scrieri,
  omiterea cărților existente, loturile, anularea la eroare, `--only`, `--replace-book`, garda de gazdă.
- `next build && next start` fără bază: `/biblie` 200; `/biblie/ioan` și `/biblie/ioan/3` 200 „în curând” +
  `noindex`; `/biblie/nu-exista`, `/biblie/ioan/0`, `/biblie/ioan/abc` 404; `/dev/biblia` 404; sitemap 200.
- Playwright (Chromium, 11/11): fără scroll orizontal la 390/768/1440 px (8 pagini); `#v120` evidențiat la 91 px
  (antet 71 + 20); derulare 61 cadre/s pe 176 de versete, fără sarcini lungi; copierea a 3 versete nu include
  numerele; mărimea 22 → 26 → 30 px păstrată la reîncărcare; cu `localStorage` blocat pagina merge; toate
  controalele cititorului ating cu Tab, cu contur vizibil; ținte ≥ 44 px; contrast pe pergament (calculat, ambele
  capete + evidențiere): text 8,72:1, numere 4,99:1.
- JS inițial (gzip): `/biblie/<carte>/<capitol>` 224,2 KB, `/biblie` 223,7 KB, prima pagină 225,8 KB.
- **Timpul căutării nemăsurat** (fără bază locală); interogarea are `LIMIT 25` și cel mult 6 cuvinte.

## Următorii pași

1. Marin pune fișierele Word în `bible-source/`, rulează `bible:extract` și `bible:validate`, citește rapoartele
   și compară cele 6 versete de control cu Biblia tipărită.
2. Confirmă ediția pentru nota de sursă.
3. Decide dacă vrea ortografia modernizată (alt PR).
4. Partea 2: schema (SQL de mai sus) + import în producție, apoi deploy. Ordinea recomandată: îmbinare → partea 2
   → deploy.
5. Mai târziu: link de la „Evanghelia zilei” spre capitol; Biblia în `/cautare`; „Continuă lectura” (ultimul
   capitol citit, în `localStorage`, pe `/biblie`) — neintrat în această parte.

## Rollback

`npm run bible:wipe -- --apply --allow-remote --yes-host=<gazda>` + „STERGE BIBLIA” șterge doar cele 3 tabele;
paginile revin la „în curând” (fără 500). O singură carte: `bible:import -- --replace-book=<slug> --apply …`.
