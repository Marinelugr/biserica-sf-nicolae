# Biblia: „Continuă lectura”

Ramura `feat/biblia-continua`, noiembrie 2026. Cititorul își regăsește locul cu un clic, fără cont și fără server.

## Ce face

- **Pagina de capitol** (`ReadingTracker`, nu afișează nimic) ține minte cel mai de sus verset din ecran. Salvează la 800 ms după ultima schimbare și imediat la `visibilitychange` sau `pagehide`.
- **`/biblie`, `/en/bible`, `/ru/bibliya`** (`ContinueReading`) arată cardul cu linkul de reluare, „Citite recent” și „Șterge istoricul”.
- **Logica** stă în `src/lib/bible/readingPosition.ts`, fără React.

| Cheie în `localStorage` | Conținut |
|---|---|
| `biblia:pozitie` | `{carte, capitol, verset, ts}` |
| `biblia:recente` | ultimele 5 capitole distincte, `[{carte, capitol, ts}]`, cel mai recent primul |

## Decizii

**Ce înseamnă „de la o căutare”.** Poziția nu se salvează până la o derulare de cel puțin 48 px dacă pagina s-a deschis:
- cu ancoră `#v<N>`: rezultat de căutare, referință „Ioan 3:16”, link trimis de cineva sau chiar linkul de reluare;
- cu `q` în referrer;
- după o redirecționare (`redirectCount > 0`): referința „Ioan 3” ajunge la capitol fără ancoră, iar referrerul nu mai are `q`.

Mișcările din prima secundă după montare nu se pun, fiindcă pot fi derularea lină spre ancoră.

**Versetul de sus.** Zona observată începe cu 24 px sub antet. Altfel, după reluare, marginea versetului anterior ar conta drept vizibilă și poziția ar da înapoi cu un verset la fiecare revenire.

**Cazuri la margine.**
- Versetul 0 (titlul unor psalmi) se salvează ca 1, fiindcă poziția cere verset ≥ 1.
- Dacă niciun verset nu e în ecran, rămâne ultimul citit (la subsol) sau 1 (antet înalt pe telefon, la plecare).

**Derularea la reluare.** Ancora se ocupă de ea, cum s-a cerut. Excepția: mărimea textului salvată se aplică după hidratare și poate împinge versetul afară din ecran. Doar atunci `ReadingTracker` îl readuce, o singură dată. Fără asta, Safari, care nu are scroll anchoring, ar rata versetul.

**Evidențierea.** Apare doar când ancora coincide cu poziția salvată și nu se vine de la căutare. Regula existentă `.verse:target` ar fi lăsat evidențierea permanent, de aceea e anulată după 2 s prin `data-resume="off"`. Rezultatele căutării își păstrează evidențierea ca până acum. Cu `prefers-reduced-motion`, evidențierea apare și dispare fără tranziție. Culoarea e aceeași ca la `:target`, deci contrastul măsurat rămâne valabil.

**Validare.** O valoare invalidă se șterge. La `biblia:recente`, o singură intrare invalidă șterge toată lista. O listă de recente coruptă nu ascunde o poziție validă. Fără poziție validă, cardul nu apare, chiar dacă lista există. Capitolul nu se verifică față de numărul real din bază, deci după un reimport care scoate capitole linkul ar duce la 404.

**Afișare.**
- Pe `/biblie?q=…` cardul nu apare, ca să nu stea între căutare și rezultate.
- Linkurile sunt `<a>` simple, ca în restul Bibliei, iar ancora și `:target` merg nativ.
- Linkurile din „Citite recent” duc la începutul capitolului, fiindcă lista ține capitole, nu versete. Deschiderea unuia mută poziția acolo.
- Fraza de confidențialitate e în card. Pagina de confidențialitate și bannerul nu s-au schimbat.

**SEO.** Cardul folosește `useSyncExternalStore` cu instantaneu `null` pe server. Poziția nu ajunge în URL-uri indexabile.

**Dependențe.** `jsdom` e adăugat în `devDependencies`, pentru testele unitare. Playwright nu intră în proiect: `e2e/biblia-continua.mjs` îl ia dintr-un folder extern, ca la verificările anterioare. `e2e/` nu rulează în `npm test`.

## Verificare

Pe un build standalone local, fără `.env`, cu PGlite în memorie și versete inventate. Nu s-a folosit baza de producție și nu s-a făcut nicio cerere către site-ul live.

```bash
BASE_URL=http://127.0.0.1:3417 PLAYWRIGHT_DIR=<folder cu playwright-core> \
CHROMIUM_PATH=<executabil Chromium> SHOTS_DIR=<folder> node e2e/biblia-continua.mjs
```

Serverul se pornește cu `HOSTNAME=0.0.0.0` (vezi `docs/BIBLIA-SEO.md`). Baza trebuie să aibă Ioan 1–21 (Ioan 3 cu 60 de versete), Matei și Psalmii.

| Comparație cu `main`, pe aceeași bază | Rezultat |
|---|---|
| Titlu, meta, canonical, hreflang (10 pagini ale Bibliei, ro/en/ru) | identice |
| HTML-ul din `<body>`, fără scripturi | identic |
| `/sitemap.xml` (77 de adrese pe baza sintetică) | identic, în afară de `lastmod`, care vine din `new Date()` |
| JS inițial, gzip, `/biblie` | 260,6 → 267,5 KB |
| JS inițial, gzip, capitol | 261,2 → 267,1 KB |
| JS inițial, gzip, prima pagină | 261,9 → 262,2 KB |

Creșterea vine din lista celor 80 de cărți, necesară în client pentru validare și pentru numele cărților.

**Limite:** E2E a rulat doar în Chromium. Safari și revenirea din aplicație pe un telefon real nu sunt testate; de aceea rămâne verificarea de pe telefon după deploy. Ieșirea din browser e simulată prin navigare (`pagehide`) și, în testele unitare, prin `visibilitychange`.

Capturile, cu text de probă, sunt în `docs/design/biblia-continua/`.
