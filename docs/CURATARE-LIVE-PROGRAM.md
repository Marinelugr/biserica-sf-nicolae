# Fără program de slujbe, live și contor; poza profilului = poza de la Mesaj — decizii (ramura `chore/curatare-live-program`, 2026-10-23)

Cererea Părintelui Marin (2026-10-23, 22:17): „programul de slujbe eliminăm, scoatem live-ul de pe site,
nu mă ajută cu nimic. Nu este poza de la mesajul părintelui, scoatem contorul care arată cât timp mai
este până la următoarea slujbă.”

## A. Programul de slujbe

- Scos din coloana de profil (ambele variante), subsol (rămân 3 coloane: emblemă/adresă, pagini,
  contact), `/contact`, câmpul din Admin → Contact, `contact-info.ts` (cheia `schedule`), datele
  structurate (`openingHours`), descrierea meta a paginii Contact. `src/lib/schedule.ts` șters.
- Ruta `PUT /api/admin/contact` scrie doar cheile din `SETTING_KEYS`; un `schedule` trimis de un client
  vechi e ignorat (testat).
- `/contact` păstrează accentul `slujbe` (albastru, pictograma ceas) din PR #11; nu era cerut altfel.

## B. Live-ul

- Șterse: `LiveStreamCard`, `LiveStreamView`, `src/app/live/*` (+ imaginea OG), `src/components/live/*`,
  `useLiveStatus`, `/api/live-status`, `src/lib/live-stream.ts`, `/api/admin/live-archive`, zona de live
  manual din Admin → Prima pagină, linkul „Live”, punctul roșu și pastila LIVE din antet, chip-ul „Video”
  (singurul element `kind="video"` din flux era cardul live; `FeedKind` păstrează `video`).
- `/live`, `/ru/live`, `/en/live` → **308** spre `/video`, `/ru/video`, `/en/video` (în `next.config.ts`;
  `/video` are același slug în toate limbile).
- Traduceri scoase (zero utilizări): `nav.live`, `home.liveNow/watchLiveService/openOnYoutube/
  liveStreamTitle/liveFooterNote`, `shell.liveBadge`, plus `shell.feedVideo` și `shell.kindVideo`
  (rămase fără folos odată cu chip-ul și cardul live).
- Descrierea meta a site-ului: „transmisiuni live” → „cărți și video ortodox” (ro/en/ru); cuvântul-cheie
  meta „transmisiune live” scos.
- CSS `.live-pill`, `.live-dot`, `@keyframes live-pulse` șterse (nimeni altcineva nu le folosea).
- Neatinse: categoria video „Sfânta Liturghie Live” (conținut), `api/admin/video`, identitatea
  `data-sec="video"` (o folosesc `/video` și subpaginile).

## C. Contorul

- Șterse: `NextServiceWidget`, `/api/next-service`, Admin → Slujbe (pagina, rutele, linkul din meniu).
- `ServicesCard` = cardul simplu „Calendar Pascal” (`t.nav.pascalCalendar`, `sec="slujbe"`), pe toată
  lățimea. Cheia `pascal_slujbe` din `HomepageWidget` e neschimbată; în admin eticheta e „Calendar
  Pascal”, descrierea „Cardul cu numărătoarea până la Paști”. Cheia `shell.kindServices` scoasă.
- CSS scos: `.slujbe-grid`, `.digits`, `.digit` (doar contorul le folosea).
- `/admin/slujbe` dă acum redirect la autentificare (ca orice cale `/admin/*`), apoi 404.

## D. Poza

- `pickProfilePhoto`: poza mesajului activ → poza parohului → `/images/parinte-marin.jpg`; spațiile nu
  contează. Cu datele de azi: cardul de profil arată poza de la Mesaj (`…/1792779630594-1.webp`).
- **`/paroh` își păstrează poza proprie** (`…/1782677881028-123.jpg`): site-ul arată acum două poze
  diferite până când Marin le aliniază (sau le lasă intenționat diferite). În admin, câte o notă sub
  „Fotografia” spune unde apare fiecare.
- `.webp` vs `.jpg` în `ProfilePhoto`: aceeași cale (`<img>`, `.portrait img` cu `object-fit: cover`,
  `object-position: 50% 18%`, raport 4:5). Verificat în Chromium: dimensiuni și decupaj identice.

## Rămase în baza de date (orfane, de curățat separat)

- Modelul `ServiceSchedule` (toate rândurile).
- `Video.isLive`, `Video.archivedAt`, `Video.serviceType` (câmpurile încă se pot scrie din
  `api/admin/video`, dar nimic public nu le mai citește pentru live).
- `Setting`: `contact_schedule`, `countdown_hidden_until`, `live_stream_active`, `live_stream_url`,
  `live_stream_title`.
- Pe server: `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` din `~/.config/parohie/env` (nefolosite).

## Verificări (2026-10-23, bază de date fictivă `127.0.0.1:1`)

- `tsc` curat; `npm test` 96/96 (90 + 2 Contact + 4 poză); lint 16 → 11 erori (toate cele 5 dispărute
  erau în fișierele șterse), 31 → 29 avertismente; `next build` reușit.
- `grep` fără rezultate pentru `live-status`, `next-service`, `useLiveStatus`, `getScheduleItems`,
  `NextServiceWidget`, `LiveStream`, `openingHours`, `contact_schedule` în `src/`, `next.config.ts`,
  `docs/` (în afara acestui fișier).
- JS inițial al primei pagini (gzip): 224,8 KB → **222,8 KB** (−2,0 KB); necomprimat 731,5 → 726,3 KB.
- `next build && next start`: `/live`, `/ru/live`, `/en/live` → 308 spre `/video`, `/ru/video`,
  `/en/video`; `/api/live-status`, `/api/next-service` → 404.
- Playwright (Chromium headless), 34/34: fără „Live”, „Program slujbe”, „următoarea slujbă” în flux,
  coloana de profil, antet, subsol, Contact și alte 5 pagini; niciun link spre `/live`; nicio cerere spre
  `/api/live-status` sau `/api/next-service` în 30 s; chip-uri Tot · Cuvânt · Parohie · Bibliotecă,
  toate funcționale; subsol cu 3 coloane la 1440 și 1 la 390; fără scroll orizontal; „Calendar Pascal”
  pe toată lățimea, selectorul de ani schimbă data (2026 → 2027).
- **Neverificat**: cu datele reale (poza de la Mesaj pe site, salvarea din Admin → Contact cu sesiune
  reală), pe un telefon real.
