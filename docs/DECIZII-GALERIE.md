# Galerie cu mai multe poze — decizii (ramura `fix/galerie-multi-poze`, 2026-10-23)

## T0. Serverul real

Detalii în `docs/tophost/DEPLOY.md` → „Limite de încărcare”. Pe scurt: 1–25 MB primesc `401` JSON în
0,7–4 s; LiteSpeed/Passenger nu taie cererile. Prima rulare a blocat 12 și 25 MB (rețea), reluarea a trecut.
Limita reală rămâne cea din aplicație (20 MB).

## T1. `src/lib/mediaUpload.ts`

- Răspunsul se citește ca text și se parsează doar dacă e JSON (LiteSpeed dă HTML la 502/503/413).
- O reîncercare după 1,5 s doar pentru `POST /api/admin/upload` (502/503/504, eroare de rețea).
  Fișierul ajunge în Storage cu nume unic, deci o reîncercare poate lăsa cel mult un fișier orfan.
- **Fără reîncercare** pentru `POST /api/admin/media`: un 502 după ce baza de date a scris deja ar
  dubla poza în galerie.
- 401 și 413 au mesaj propriu chiar dacă serverul trimite `{error}` (al nostru trimite „Neautorizat”,
  mai puțin util pentru părintele Marin).

## T2. `MediaGallery`

- Principala, apoi miniatura. Miniatura e opțională: dacă doar ea eșuează, poza se păstrează
  (galeria și pagina publică folosesc atunci poza principală).
- Dacă optimizarea în browser eșuează (HEIC în Chrome), se trimite originalul fără miniatură; serverul
  îl comprimă cu `sharp`. Înainte, poza respectivă eșua cu totul.
- Toate butoanele au `type="button"`: galeria stă acum într-un `<form>` (Știre nouă) și altfel ar fi
  trimis formularul la „Adaugă poze”.
- Pozele peste limită (`maxPhotos`) sunt raportate în rezumat, nu ignorate.

## T3. Modul „în așteptare”

- `entityId={null}` → nicio cerere `GET/POST /api/admin/media`; pozele merg în Storage și stau în
  starea părintelui (`pending`/`onPendingChange`). Funcțiile pure sunt în `src/lib/pendingMedia.ts`.
- `onUploadingChange` (prop nou, opțional): butonul de salvare e dezactivat („Se încarcă pozele...”)
  cât timp galeria încarcă, ca să nu se salveze știrea fără ultimele poze.
- `pendingNote` (prop nou): textul diferă la sfânt („...odată cu sfântul.”).
- Ștergerea unei poze în așteptare o scoate din listă, dar fișierul rămâne în Storage (ca la orice
  formular abandonat). Acceptat: costul e neglijabil, iar o rută de ștergere din Storage ar fi o
  suprafață nouă de atac.
- `POST /api/admin/media` cu `items`: 1–100 elemente, `entityType` din `article`, `saint`, `priest`,
  `history`, `donatii` (toate valorile din `src`, admin și public), `url`/`thumbnailUrl` obligatoriu cu
  prefixul `${SUPABASE_URL}/storage/v1/object/public/` și fără `..`; `order` renumerotat de la 0 pe
  server; o singură operație `createMany`. Cererea veche cu un singur `url` e neschimbată (inclusiv
  fără validarea prefixului — n-am vrut să schimb comportamentul existent; de discutat separat).
- Dacă atașarea eșuează după salvare: știrea/sfântul rămân salvate, mesaj explicit; la știre trecem
  la editare după 3 s.

### Verificarea tuturor `<MediaGallery`

| Fișier | `entityId` | Poate fi gol? |
| --- | --- | --- |
| `admin/istoria-bisericii/page.tsx` | `"church-history"` (constant) | nu |
| `admin/donatii/page.tsx` | `"main"` (constant) | nu |
| `admin/sfantul-nicolae/page.tsx` | `"sfantul-nicolae"` (constant) | nu |
| `admin/stiri/[id]/EditArticolClient.tsx` | `article.id` (pagina dă `notFound()` dacă lipsește) | nu |
| `admin/paroh/page.tsx` | `form.id` | da, la primul paroh; deja protejat (`form.id ? … : „Salvați datele mai întâi…”`), iar după salvare `form.id` se setează și galeria apare imediat. Lăsat așa: există un singur paroh. |
| `admin/sfinti/page.tsx` | `editSaint.id` / `null` la sfânt nou | acum mod „în așteptare” |
| `admin/stiri/nou/page.tsx` (nou) | `null` | mod „în așteptare” |

## T4. `ImageUploadButton`

- Compresie cu `optimizeImage` (doar poza principală, miniatura nu se folosește aici). Se trimite
  originalul dacă optimizarea eșuează sau nu micșorează fișierul. SVG și GIF nu se ating (canvas-ul
  le-ar rasteriza / le-ar opri animația).
- API-ul (`onUpload`, `label`, `accept`, `style`) e identic; mesajele de eroare au acum numele pozei.

## T5. Server

- `sharp.cache(false)` + `sharp.concurrency(1)` la nivel de modul. Afectează și scriptul
  `db:recompress-images` (rulează mai încet, dar e unealtă ocazională).
- `/api/admin/upload`: `formData()` întrerupt → `400` JSON; orice altă excepție → `500` JSON generic,
  detaliile doar în `~/logs/parohie-passenger.log` (`[upload]`).

## T6. Propuneri (neimplementate)

Galeria e generică (`MediaItem` cu `entityType`/`entityId`), deci niciunul nu cere schimbare de schemă;
doar o valoare nouă în `ENTITY_TYPES` din `src/app/api/admin/media/route.ts`.

| Formular | Admin | Pagină publică | Estimare |
| --- | --- | --- | --- |
| `carti` (LibraryBook) | `MediaGallery` în dialogul de editare + mod „în așteptare” la carte nouă | `PublicGallery` pe `/carti/[slug]` | ~2 h |
| `mesaj-parinte` (PriestMessage) | o înregistrare, `MediaGallery` cu `id`-ul ei | `PublicGallery` pe `/mesajul-parintelui` | ~1,5 h |
| `magazin` (Product) | ca la cărți | nu există pagină de produs: trebuie creată `/magazin/[slug]` (sau o fereastră pe listă) | ~4 h |
| `anunturi` (Anunt) | ușor de adăugat | anunțul e un mesaj scurt, nu are pagină proprie; o galerie are sens doar cu legătura către o știre (deja posibilă) | nerecomandat |

## T7. Teste

`npm test` (vitest, fără rețea și fără bază de date): `mediaUpload` (13), `pendingMedia` (5),
`media-route` (8), `upload-route` (3).

Dovada că testele pot pica (fiecare mutație aplicată temporar, testele roșii, apoi protecția readusă,
29/29 verzi):

| Protecție scoasă | Teste roșii |
| --- | --- |
| reîncercarea la 502/503/504 și la eroare de rețea | 4 din `mediaUpload` |
| citirea ca text → `res.json()` direct | 4 din `mediaUpload` (inclusiv 413 HTML și 200 HTML) |
| validarea prefixului Storage | „adresă din afara Storage-ului nostru → 400” |
| `try/catch` din ruta de upload | ambele teste 400/500 din `upload-route` |

`npx tsc --noEmit` și `npm run build` trec. `npm run lint` dă 16 erori și 33 de avertismente, **aceleași
ca pe `main`** (cod existent); în fișierele modificate aici rămâne doar eroarea veche din
`admin/sfinti/page.tsx` (`setState` în `useEffect` la `fetchSaints`), pe care n-am atins-o.

---

# Poze HEIC, erori vizibile, curățare și text curat (ramura `fix/galerie-heic-complet`, 2026-10-23)

## A0. Cauza, reprodusă local (Mac, arm64)

- `sips -s format heic public/images/12.jpg --out /tmp/test.heic` → 141 556 octeți,
  `ISO Media, HEIF Image HEVC Main or Main Still Picture Profile`.
- `sharp` **0.34.5** (din `package-lock.json`; libvips 8.17.3, libheif 1.20.2).
  `sharp.format.heif.input.fileSuffix` = `['.avif']`: binarul precompilat citește doar AVIF.
- `sharp('/tmp/test.heic').webp().toBuffer()` (și varianta din cod, cu buffer + `failOn: 'none'`) →
  eroare:
  `heif: Error while loading plugin: Support for this compression format has not been built in (11.6003)`
  (precedată de câteva rânduri `bad seek to …`).
- Eșuează și pe Mac; binarul linux-x64 de pe server e construit la fel (fără HEVC, lovell/sharp#3740),
  dar nu l-am rulat acolo — concluzia despre server rămâne „foarte probabil la fel”, nu „verificat”.

## A1. Serverul refuză ce nu poate decoda

- `processImageBuffer` întoarce `failed: true` din `catch` (înainte: păstra originalul). „Deja mai mic”
  rămâne `wasOptimized: false` fără `failed`. GIF/SVG neschimbate.
- `/api/admin/upload`: `failed` → `415` JSON, **înainte** de Storage. HEIC/HEIF: „Formatul HEIC nu poate fi
  procesat pe server. Exportă poza ca JPG și încearcă din nou.”; altceva: „Fișierul nu pare o poză validă.”
  `mediaUpload.messageFor` afișează deja `body.error` pentru 4xx, deci mesajul ajunge la părinte.
- `db:recompress-images` nu e afectat (sare peste tot ce are `wasOptimized: false`).
- Teste: `upload-decode.test.ts` (5; `processImageBuffer` real, `sharp` simulat să arunce, Supabase simulat).
  Cu vechiul `catch` readus: 3 roșii (HEIC, HEIF, text redenumit .jpg).

## A2. HEIC → JPEG în browser

- `heic-to` **1.6.6** (fixată exact; libheif 1.23.6 compilat în WASM), licență **LGPL-3.0**, notată în
  `docs/LICENTE-TERTE.md`. Încărcată doar prin `await import('heic-to')` din `convertHeicToJpeg`.
- `src/lib/heic.ts`: `isHeic` (tip `image/heic|heif[-sequence]` sau extensie `.heic/.heif`, orice
  majuscule; tipul poate fi gol), `convertHeicToJpeg` (JPEG 0,9, nume `.jpg`), `heicErrorMessage`.
- `MediaGallery.uploadOne` și `ImageUploadButton.compress`: conversia **înainte** de `optimizeImage`.
  Conversie eșuată → poza e **refuzată** (apare în rezumat cu mesajul „Poza X este în format HEIC…”),
  originalul nu mai pleacă spre server. Dacă doar `optimizeImage` eșuează după conversie, se trimite
  JPEG-ul (serverul îl poate procesa).
- Am folosit importul implicit (`heic-to`), care cere `unsafe-eval`. Site-ul nu are CSP; dacă se adaugă
  una, se trece la `heic-to/csp` (același API).
- Pachet: chunk separat de **3,0 MB** (necomprimat), cerut doar la primul HEIC; nu e referit de niciun
  manifest de pagină (`.next/server`). Restul chunk-urilor: +~8 KB în total față de `main`
  (2 122 879 → 2 131 135 octeți fără chunk-ul `heic-to`).
- Verificat în Chromium headless (HeadlessChrome 153, script necomis, esbuild + playwright-core):
  `/tmp/test.heic` (141 KB, 940×664) → `test.jpg`, `image/jpeg`, **168 217 octeți**, 940×664, 265 ms.
  Un fișier text numit `proba.heic` → mesajul de refuz în română.
- `accept` și textul „JPG, PNG, WebP, HEIC” rămân neschimbate (acum sunt adevărate).

## A3 + B3. Cardurile rupte se văd și se pot șterge (admin)

- `GalleryImage` (în `MediaGallery.tsx`): miniatura → poza principală → chenar punctat de 120 px
  „Poza nu se poate afișa” + `describeLoadFailure` (extensia din adresă și, dacă `HEAD` reușește cu
  2xx, `content-type`). `HEAD` eșuat sau 404 → doar extensia, fără nimic în consolă din partea noastră
  (browserul poate loga singur un eșec de rețea/CORS).
- „Nefuncțională” = starea de eroare raportată de `GalleryImage` (un `Set` de id-uri), **nu** extensia.
  Bannerul numără doar pozele încă afișate, deci scade live la ✕.
- „🗑 Șterge pozele nefuncționale”: `confirm()` (ca în restul admin-ului) → editare: `DELETE
  /api/admin/media/[id]` pe rând, progres „Se șterg i din N…”, apoi `load()`; eșecurile se numără și se
  raportează la final. „În așteptare”: `removePending` pentru fiecare. Doar înregistrările din baza de date;
  fișierele din Storage rămân.
- Verificat în Chromium headless (componenta reală, `fetch` simulat, script necomis), ambele moduri,
  4 poze (JPG bun, `.HEIC`, text numit `.jpg`, `.webp` lipsă): 3 chenare cu `.heic · image/heic`,
  `.jpg · image/jpeg`, `.webp`; banner „3 poze…”; după buton: „în așteptare” rămâne 1 poză; editare cu un
  `DELETE` forțat la 500 → „1 din 3 poze nu au putut fi șterse”, banner „1 poză…”; zero erori JS.

## B1. Text curat din HTML

- `htmlToPlainText` în `src/lib/utils.ts`, cu `decode` din `he` (deja dependență, folosit de
  `externalFeeds.ts` și `sfinti-scraper.ts`). Acceptă și `null`/`undefined` (→ `''`).
- Înlocuit în: `app/page.tsx` (fragment știre + rugăciune, `stripHtml` șters), `app/magazin/page.tsx`
  (`stripHtml` șters), descrierile `meta` din `stiri/[slug]`, `paroh`, `carti/[slug]`, `sfintii/[slug]`
  (înainte lipeau cuvintele: etichetele erau înlocuite cu `''`), `readingTime` din `utils.ts`.
- Neatins: `src/lib/sfinti-scraper.ts` (decodează deja cu `he`; nu era pe listă).
- `utils.ts` e importat și de un component client (`admin/video`, doar `slugify`). `he` e CommonJS, deci
  Turbopack nu-l elimină: după build, tabela de entități (93 KB necomprimat) apare într-un chunk cerut
  **doar** de `/admin/video` (verificat în `*_client-reference-manifest.js`); nicio pagină publică.
  Acceptat: e o pagină de admin. Dacă deranjează, `slugify` se mută într-un fișier propriu.
- Teste: `utils.test.ts` (7). Cu vechea metodă în corpul funcției: 4 roșii (`&nbsp;`, entități,
  `<script>/<style>`, `readingTime`).

## B2. HEIC salvate deja: omise pe paginile publice

- `src/lib/imageLoad.ts`: `isDisplayableImageUrl` (fals pentru `.heic`/`.heif` după ce se scot `?…`/`#…`,
  orice majuscule, și pentru `null`/gol) și `onlyDisplayable` (filtrează galeriile; o miniatură HEIC la o
  poză bună devine `null`). Teste în `imageLoad.test.ts`.
- `grep -rn "imageUrl\|mediaItem\|PublicGallery" src` (fără admin/api), locurile modificate:

| Fișier | Ce |
| --- | --- |
| `components/homepage/NewsAndLibrary.tsx` | cardul știrii: aspectul fără imagine (☦) dacă adresa nu e afișabilă |
| `app/page.tsx` | `imageUrl` trimis la `NewsAndLibrary` → `null` dacă e HEIC (dublă protecție) |
| `app/stiri/page.tsx` | lista de știri: aspectul fără imagine |
| `app/stiri/[slug]/page.tsx` | imaginea mare (omisă), `og:image`/`twitter:image` (omise), galeria (`onlyDisplayable`; secțiunea dispare dacă rămâne goală) |
| `app/sfintii/[slug]/page.tsx` | galeria |
| `app/istoria-bisericii/page.tsx` | galeria (mesajul „galerie goală” existent dacă nu rămâne nimic) |
| `app/paroh/page.tsx` | galeria |
| `app/donatii/page.tsx` | galeria |
| `app/sfantul-nicolae/page.tsx` | galeria |

- Neatinse (alt model decât `Article`/`MediaItem`): `magazin` (`Product.imageUrl`), `carti/[slug]`
  (`LibraryBook.imageUrl` + `galleryUrls`). Pot primi HEIC doar prin `ImageUploadButton`, care acum
  convertește sau refuză.

## C. Verificări

`npx tsc --noEmit` OK; `npm run lint` 16 erori / 33 avertismente, aceleași ca pe `main`; `npm test` 53/53
(29 existente + 24 noi: `upload-decode` 5, `heic` 4, `imageLoad` 8, `utils` 7); `npm run build` OK. Pachet: `heic-to` 3,0 MB într-un chunk separat, încărcat
doar la primul HEIC; restul chunk-urilor de client +~8 KB față de `main`; `he` +93 KB doar pe `/admin/video`.
