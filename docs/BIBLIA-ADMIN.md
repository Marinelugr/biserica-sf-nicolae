# Biblia în Admin — coordonare și editare (ramura `feat/biblia-admin`, 2026-10-31)

Fără niciun verset în acest fișier. Testele și proba din browser au folosit doar fraze inventate.

## Ordinea de punere în producție

1. **Schema întâi** (`backups/biblie-admin-schema-2026-10-31.sql`, local, ignorat de git), apoi deploy.
   Cu ordinea inversă Adminul Bibliei pică, dar cititorul public merge. Verificat în browser pe schema veche.
2. După ce începi să editezi o carte în Admin, nu rula `--replace-book` pe ea fără export
   (importatorul refuză; vezi `docs/BIBLIA-IMPORT.md`).

## Pagini

| Rută | Ce face |
| --- | --- |
| `/admin/biblia` | cele 80 de cărți: capitole, versete, % revizuite, goluri, editate; căutare după nume |
| `/admin/biblia/[carte]` | grila capitolelor, cu marcaj pentru goluri și pentru 100% revizuit |
| `/admin/biblia/[carte]/[capitol]` | editorul: salvare per verset, „Revizuit”, „Adaugă versetul N” |
| `/admin/biblia/cauta` | căutare în text, cu link direct la verset în editor |
| `/admin/biblia/inlocuieste` | găsește și înlocuiește pe o carte, cu previzualizare și confirmare |
| `/admin/biblia/jurnal` | ultimele modificări, 50 pe pagină |
| `/admin/biblia/export/[carte]`, `/export/toate` | JSON în formatul `bible-data`, `Cache-Control: no-store` |

Accesul se verifică în fiecare pagină, acțiune și export (`src/lib/bible/adminAuth.ts`), nu doar în `src/proxy.ts`.
Neautentificat: pagină → `/admin/login`, export → 401, acțiune → respinsă. Alt rol decât `admin`: pagină → 404, export → 401.

## Decizii

- **Cache-ul cititorului.** Cititorul ține capitolele într-un `TtlCache` în memorie (1 h), pe care `revalidatePath`
  nu îl atinge, iar Passenger poate porni 2 procese (`docs/tophost/DEPLOY.md`). Soluția:
  - cache-ul e pe `globalThis`, comun pachetelor aceluiași proces;
  - acțiunea îl golește local și apelează `revalidatePath`;
  - în aceeași tranzacție schimbă rândul `Setting.bible_cache_version`, iar cititorul îl verifică cel mult o dată
    la 5 secunde și își golește cache-ul dacă s-a schimbat.
  `Setting` există deja, deci cititorul nu depinde de schema nouă. Măsurat cu două procese: imediat în cel care a
  salvat, 5,2 secunde în celălalt.
- **`BibleEdit.verseId` e opțional, cu `ON DELETE SET NULL`.** Cu `RESTRICT`, `--force-overwrite-edits` și
  `bible:wipe` ar eșua; cu `CASCADE` s-ar pierde jurnalul. Locul (carte, capitol, verset) e copiat în rând.
- **Concurență.** `updateMany where { id, editedAt: văzut }` e o comparare atomică: din două salvări simultane
  trece una. Mesajul de conflict arată versiunea actuală, iar textul scris de tine rămâne în câmp.
- **Bifa „Revizuit”** nu schimbă `editedAt`, nu scrie în jurnal (acțiunile lui sunt EDIT, CREATE, BULK) și nu atinge
  cache-ul. E respinsă dacă textul s-a schimbat între timp: bifa înseamnă „am citit această versiune”. Editarea
  textului nu scoate bifa.
- **Validări suplimentare față de cerință:** codare greșită („Ã” + simbol) și text care începe cu o cifră. Le
  blochează și `bible:validate`; fără ele, un export din Admin n-ar mai putea fi reimportat.
- **Versetul 0 de la Psalmi** (titlul numerotat 0, acceptat de validator) rămâne editabil. Regula „număr ≤ 0” se
  aplică la creare. Nu se numără drept gol, nici când lipsește.
- **Goluri.** Se detectează doar între 1 și ultimul verset. Un verset lipsă de la sfârșit nu se poate deduce, așa
  că editorul are și „Adaugă versetul M+1”. Numărul maxim la creare e 999.
- **Găsește și înlocuiește:**
  - **Cuvinte întregi implicit**, cu litere românești: `intru` nu schimbă `dintru`. Se poate debifa.
  - **Exact, cu majuscule:** `Intru` și `intru` sunt două operații.
  - **Peste limită:** dacă sunt peste 500 de versete, se schimbă primele 500 în ordinea cărții, iar previzualizarea
    o spune; restul se fac cu o nouă operație. Așa rămâne o cale de lucru și pe cărțile mari.
  - **Confirmarea** e legată de o amprentă SHA-256 a previzualizării. Dacă un verset s-a schimbat între timp, nu se
    scrie nimic. O singură tranzacție, cu limită de 120 de secunde.
  - **Rezultat nevalid** la orice verset (de ex. gol după ștergere): operația e blocată.
- **Exportul `toate`** e un tablou de cărți, în fișierul `_biblia-toate.json`; importatorul ignoră numele cu „_”.
  Împărțirea în `bible-data/`:
  ```bash
  node -e 'const fs=require("fs");for(const b of JSON.parse(fs.readFileSync("_biblia-toate.json")))fs.writeFileSync(`bible-data/${b.slug}.json`,JSON.stringify(b,null,2)+"\n")'
  ```
- **`bible:verify-live`** compară site-ul cu `bible-data`: după editări raportează diferențe până la export.
- **`normalizeVerseText`:** caracterele de lățime zero se scot acum înainte de NFC. Altfel `s` + lățime zero + sedilă
  combinată scăpa de transformare, iar `textSearch` își putea pierde lungimea 1:1. Se aplică și la import.
- **Erorile de bază** se scriu în consolă doar cu codul lor, fiindcă mesajele Prisma pot conține textul versetului.

## Lint

`npm run lint` avea erori și pe `main`. Acum e verde, fără schimbări de comportament:
- `backups/` și `.claude/` (locale, neversionate) sunt ignorate;
- 8 erori `set-state-in-effect` din 6 pagini de Admin existente sunt dezactivate pe linia respectivă. **Tiparul a
  rămas; e o datorie tehnică amânată, nu o reparație.**
- două ghilimele au fost scrise ca `&quot;` în `admin/video`.

## Verificări (2026-10-31)

Nicio conexiune la producție: build, teste și `prisma migrate diff` au rulat cu un URL de bază fictiv.

- `tsc`, `npm run lint` (0 erori), `npm test`, `npm run build`: vezi descrierea PR-ului.
- Proba în Chromium (37/37) pe o bază PGlite temporară din afara proiectului, cu date inventate: schema de pe `main`,
  apoi SQL-ul generat aplicat peste ea. Acoperă toate paginile, salvarea, conflictul, golurile, înlocuirea, jurnalul,
  exporturile, utilizatorul non-admin, telefonul (390 px) și focusul.
- **Nefăcut:** `--replace-book` cap-coadă cu scriptul real (regula PR-ului interzice `bible:import`; logica e acoperită
  de teste, cu client fals) și timpul unei înlocuiri de 500 de versete pe baza reală.
