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
