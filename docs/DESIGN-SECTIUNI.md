# Mesajul o singură dată + identitate vizuală pe secțiuni — decizii (ramura `feat/design-sectiuni-mesaj`, 2026-10-23)

Cererea Părintelui Marin (2026-10-23, 21:22): mesajul să nu apară de două ori, textul mesajului să fie
formatat ca la Știri, fiecare secțiune să se deosebească vizual de celelalte.

## A. Mesajul

- **Conversia se face la citire** (`src/lib/priestMessage.ts`), baza de date nu se rescrie. Mesajul vechi
  (text cu `**`) devine HTML: întâi `he.escape`, apoi paragrafe, `<br>`, `<strong>`, `<em>`; `**` fără
  pereche se șterge. HTML-ul nou (din editor) trece neschimbat. Testul pică dacă se scoate escaparea
  (verificat prin mutație, apoi readus).
- **Admin**: `TipTapEditor` în loc de `<textarea>`. Mesajul de azi se încarcă deja convertit; prima
  apăsare pe **Salvează** îl trece în formatul nou. Un mesaj inexistent rămâne gol în editor (nu se
  pune textul implicit). Previzualizarea folosește `PriestMessageCard` și `PriestMessageLetter`, aceleași
  componente ca site-ul, într-un container `inert` (linkurile nu se apasă).
- **Server**: refuză textul gol după `htmlToPlainText` (inclusiv `<p></p>`) și HTML-ul peste 30.000 de
  caractere. HTML-ul nu e curățat (sanitizat) pe server, la fel ca la Știri/Cărți/Sfinți: îl scrie doar
  administratorul autentificat. De discutat separat dacă se dorește.
- **O singură apariție pe prima pagină**: `profile.lead` eliminat. Din mesaj se mai citește doar
  `photoUrl`, ca rezervă pentru poza parohului (comportament neschimbat).
- **Extrasul** (`messageExcerptHtml`, 420 de caractere): blocuri întregi; salutul scurt (≤ 60 de
  caractere, terminat în `,` `:` `!`) nu se numără. Mesajul real de azi dă salutul + primul paragraf;
  restul îl estompează CSS-ul (`mask-image`, ~9 rânduri).

## B. Identitățile

Mecanism: `data-sec` pe rădăcina fiecărei secțiuni (separat de `data-kind`, care rămâne pentru filtre).
Culorile stau **numai** în `src/app/sections.css`, câte un bloc pe secțiune. Pentru antetul paginilor
interioare se folosește `data-head` (doar bara de sus, ornamentul și eyebrow-ul).

`sections.css` **nu** e în `@layer`: regulile mobile din `globals.css` sunt în afara straturilor și ar fi
suprascris forma secțiunilor sub 760 px (ex. `.card { border-radius: 20px }`).

### Valorile finale (toate au trecut testul de contrast din prima; contrastul minim, pe ambele capete ale gradientului)

| `data-sec` | Accent | Fundal | Ornament / formă | Text | Secundar | Accent-text | Accent grafic | Pe antet |
|---|---|---|---|---|---|---|---|---|
| `astazi` | `#e0b84a` | `#33230f → #0d1631` | bandă aurie 4 px, bloc de dată, colț 18 | 13,1 | 9,1 | 10,0 | 8,0 | 8,9 |
| `anunt` | `#e58a8a` | `#5c1117 → #22070a` | margine stângă 6 px, clopoțel, colț 10 | 12,1 | 8,9 | 8,0 | 5,4 | 8,6 |
| `slujbe` | `#8fb0ff` | `#182f78 → #0a1438` | chenar dublu (6 px), cifre în căsuțe, colț 14 | 10,9 | 7,7 | 7,2 | 5,7 | 7,8 |
| `cuvant` | `#d0566c` (text `#f0a0ab`) | `#3a0f1c → #1b0810` | dublă linie aurie sus/jos, ghilimele, colț 6 | 14,5 | 9,9 | 8,2 | 4,1 | 8,2 |
| `sfinti` | `#f0c060` | `#43300f → #150f08` | nimb rotitor + strălucire, colț 28 | 7,8 | 5,5 | 6,0 | 5,2 | 9,9 |
| `evanghelie` | `#9b1c1c` pe pergament | `#efe4cc → #e2d1ab` | chenar fin roșu-aur, inițială roșie, colț 4 | 10,8 | 5,9 | 6,2 | 5,4 | 13,3 |
| `rugaciune` | `#b3a8ff` | `#1a1640 → #0b0a24` | lumânare pâlpâind, cruce-filigran, arc sus 56 | 9,9 | 6,5 | 6,7 | 5,3 | 7,9 |
| `stiri` | `#e8c15a` (+ azuriu la dată) | `#161b2b → #0b0e19` | linie groasă + subțire, numere, colț 8 | 14,6 | 9,7 | 11,1 | 10,0 | 9,7 |
| `biblioteca` | `#62c3b5` | `#0f2a2a → #0a1a1c` | raft cu cotor de 8 px pe tip, colț 16 | 13,7 | 9,4 | 9,0 | 7,2 | 8,0 |
| `biserica` | `#9db8d9` | `#0d1b33 → #091326` | chenar punctat, insigna sursei, colț 20 | 15,3 | 10,3 | 10,4 | 8,4 | 8,2 |
| `video` | `#ff6b6b` | `#120d10 → #050406` | bară roșie sus, play, colț 12 | 16,4 | 10,8 | 9,6 | 6,9 | 7,4 |
| `profil` | `#e0b84a` | `#18264f → #080e24` | linie aurie fină sus, colț 24 | 12,5 | 8,2 | 9,0 | 7,8 | 8,9 |

Pragurile: text ≥ 4,5:1, accent-text ≥ 4,5:1, accent grafic / text mare ≥ 3:1, accentul pe antetul
paginilor interioare ≥ 4,5:1 pe fundalul implicit `.card`. Cu lumina decorativă (`--sec-glow`) peste fundal
se verifică și varianta luminată. Cotoarele bibliotecii: acatiste `#62c3b5`, rugăciuni `#e0b84a`,
teologie `#b3a8ff`, altele `#9fb0c8`. Accente noi față de paleta „noapte”: vișiniu, verde-petrol, violet,
pergament (plus nuanțe de aur și azuriu din paletă).

### Alte decizii

- **Calendar Pascal + Următoarea slujbă = un singur card `slujbe`** (`ServicesCard`, două coloane; pe
  mobil, una sub alta). Ca două carduri ar fi fost vecine cu același accent. Titlu nou: „Slujbe și
  Calendar Pascal” (ro/en/ru).
- **Anunțul**: titlu mare, text, buton „Citește anunțul” (text nou, ro/en/ru) când are link; titlul nu
  mai e link, iar eticheta „Anunț” dublată din corp a dispărut (e în antet).
- **Știri**: prima știre mare (poză + rezumat, „01”), celelalte rânduri plate numerotate 02–04; eticheta
  de categorie lipită pe poză (și pe `/stiri`). „Număr de ordine” = numerotarea știrilor.
- **Programul din coloana de profil**: tonul `slujbe` fără chenarul dublu (`sec-lite`); rețelele rămân
  neutre.
- **`[hidden]`**: Preflight (Tailwind) avea deja regula, în `@layer base`; am pus-o și în afara straturilor.
- Paginile interioare: pe lângă cele din listă, au primit accentul și subpaginile aceleiași familii
  (`/stiri/[slug]`, `/carti/[slug]`, `/carti/categorie/[slug]`, `/sfintii/[slug]`, `/video/...`).
- Emoji înlocuite în secțiunile atinse (🕯 la post, ⛪ la slujbă, ✦ la sfinți) cu SVG.
- Textele românești deja existente scrise direct în componente (ex. „Din viața Bisericii”, „Următoarea
  slujbă”) au rămas cum erau; nu am adăugat text nou fără traducere.

## C. Mișcare

- GSAP: linia ornamentală (`.sec-rule`) din antet face `scaleX 0→1` o singură dată, odată cu apariția
  panoului; doar `transform`.
- CSS: `sec-candle` (lumânarea, 3,6 s) și `sec-halo` (nimbul, 120 s), doar `transform`/`opacity`,
  definite numai în `@media (prefers-reduced-motion: no-preference)`.

## D. Verificări (2026-10-23)

- `npm test`: 90/90 (53 existente + 37 noi: mesaj, rută, contrast). `tsc` curat. Lint: aceleași 16 erori
  ca pe `main`, avertismente 33 → 31. `next build` reușit.
- **JS inițial al primei pagini** (rootMainFiles + layout + page, gzip): `main` 225,0 KB → ramura
  224,8 KB (−0,2 KB). CSS: 48,5 → 64,8 KB necomprimat.
- `/dev/sectiuni` și `/dev/sectiuni/scrisoare`: 200 cu `next dev`, **404** cu `next build && next start`
  (ambele cu `noindex`). Nu sunt în `sitemap.ts`.
- Playwright (Chromium headless, 1440 și 390 px), 36/36: semnături unice pentru cele 12 identități;
  vecinii din flux au accente diferite; fără `**`; fraza de început a mesajului apare o singură dată;
  cardul de profil fără text din mesaj; fiecare filtru ascunde/afișează corect (`hidden` + `display:none`);
  fără scroll orizontal; ordinea pe mobil profil → flux → rețele + program; animații noi doar
  `sec-candle` + `sec-halo`, niciuna cu `reduce`; CLS 0,0000; un singur `h1`.
- Toate rulările locale au folosit o bază **fictivă** (`127.0.0.1:1`), nu cea din `.env*`.
- **Neverificat cu date reale**: `/mesajul-parintelui` cu baza reală (verificat cu aceeași compoziție în
  `/dev/sectiuni/scrisoare`), editorul din admin în browser, telefon real.

### Capturi

| | |
|---|---|
| Galeria, 1440 px | [galerie-1440.jpg](design/galerie-1440.jpg) |
| Galeria, 390 px | [galerie-390.jpg](design/galerie-390.jpg) |
| Mesajul Părintelui, 1440 px | [mesajul-parintelui-1440.jpg](design/mesajul-parintelui-1440.jpg) |
| Mesajul Părintelui, 390 px | [mesajul-parintelui-390.jpg](design/mesajul-parintelui-390.jpg) |
