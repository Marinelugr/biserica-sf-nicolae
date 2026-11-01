# Biblia: coada de revizuire și raportarea greșelilor (ramura `feat/biblia-revizuire`, 2026-11-01)

Fără niciun verset în acest fișier. Testele, proba din browser și capturile folosesc doar fraze inventate.

## Ce există

- **`/admin/biblia/revizuire`:** un element pe ecran, cu fragmentul evidențiat și versetele vecine; Aplică (A), Editează (E), Ignoră (I), Sari (S), săgeți. Pe `/admin/biblia` există un card cu numărul de elemente în așteptare.
- **`npm run bible:review-import`:** aduce `de-verificat.csv` în coadă. Implicit e dry-run.
- **Pe `/biblie/[carte]/[capitol]` (și en/ru):** o notă care se poate închide și „Raportează” la numărul versetului.

## Ordinea de punere în producție

1. Merge.
2. `docs/biblia-revizuire-schema-productie-prompt.md`: schema, apoi importul. SQL-ul e în `backups/biblie-revizuire-schema-2026-11-01.sql` (anulare: `backups/biblie-revizuire-schema-ROLLBACK-2026-11-01.sql`), local, ignorat de git.
3. `scripts/deploy-tophost.sh`.
4. Se parcurge coada în Admin.

Dacă deploy-ul ajunge înaintea schemei: cititorul merge, formularul răspunde „Momentan nu putem primi raportări”, cardul din Admin lipsește, iar coada explică ce lipsește. Toate patru sunt verificate în proba E2E, cu tabelele șterse.

## Decizii

**Formatul real al CSV-ului.** Cerința descria coloane separate pentru detector și încredere. Fișierul are șase coloane, iar acestea stau în `motiv`: `D | mica | tip | detaliu`. Parserul citește acest format, iar `reason` păstrează partea cu tipul și detaliul.

**Fragmentul.** În fișier are forma `context[[țintă]]context`, cu până la 6 cuvinte de fiecare parte. Se păstrează așa în bază:
- „Apare în verset” înseamnă contextul întreg, fără marcaje. Pe instantaneul local (`baza-2026-11-01.json`), contextul apare exact o dată în toate cele 9.879 de rânduri.
- „Aplică” înlocuiește doar ținta.

**Propuneri cu variante.** 195 de rânduri au forma `a | b`. Acestea primesc câte un buton pentru fiecare variantă, iar tasta A funcționează doar când există o singură propunere. Spațiile de la capete contează (`: `) și se păstrează.

**Unicitatea pentru audit e un index parțial**, `WHERE source = 'audit'`. Un `@@unique` obișnuit ar fi permis o singură raportare de cititor pe verset, fiindcă toate au `detector='R'` și `fragment=''`. Prisma nu poate descrie indexuri parțiale, așa că indexul stă doar în SQL. Proba E2E confirmă că `prisma migrate diff` nu vede nicio diferență.

**`ON DELETE CASCADE` spre `BibleVerse`.** `RESTRICT` ar fi blocat `--replace-book` și `bible:wipe`, care șterg versetele. Consecința: la aceste comenzi se pierd și elementele cozii pentru versetele șterse, inclusiv raportările de cititor. Jurnalul `BibleEdit` rămâne. Elementele de audit se pot reimporta.

**Scrierea e comună cu editorul.** Verset + jurnal + versiunea cache-ului au fost mutate din `actions.ts` în `src/lib/bible/adminWrite.ts`, fără schimbare de comportament (testele editorului au rămas neatinse). Un fișier `'use server'` nu poate exporta funcții ajutătoare fără să le facă endpointuri publice.

**Ordinea.** „cititor” < „medie” < „mica” alfabetic, deci sortarea crescătoare după `confidence` dă și „cititor întâi”. Urmează `orderNum`, capitolul, versetul.

**După o acțiune, coada merge înainte.** Elementele sărite rămân în așteptare, în spate; se ajunge la ele cu ← sau de la început.

**„Ignoră toate pentru acest fragment”** se potrivește pe aceeași țintă (`[[Nume]]`), același detector, doar audit, doar în așteptare. Contextul e aproape mereu unic, deci potrivirea pe fragmentul întreg n-ar fi găsit nimic. Limita e de 500 pe operație; rămășița se ignoră repetând operația. La raportările de cititor nu există această acțiune.

**Trecerea automată la STALE** se face la deschiderea paginii, când elementul ajunge la rând. E o scriere dintr-o pagină GET, dar doar de Admin, și spune un lucru adevărat, indiferent de cine a deschis pagina.

**Dry-run-ul nu ajunge singur la o bază la distanță.** Spre deosebire de `bible:import`, chiar și citirile cer `--allow-remote --yes-host=<gazda>`, fiindcă `.env` indică producția. `--offline` verifică doar formatul.

**Numerele versetelor devin butoane abia în browser**, cu un singur ascultător pe capitol. HTML-ul de pe server păstrează `<sup class="vnum">` neschimbat și primește doar un `div` în jur. Cu mouse-ul: hover. Cu atingere: numărul, apoi „Raportează”. Cu tastatura: Tab pe număr, Enter deschide formularul. Un capitol lung înseamnă multe opriri de Tab (până la 176); o navigare cu săgeți ar fi o îmbunătățire separată.

**Limita de raportări:**
- Cheia e HMAC-SHA256 cu `AUTH_SECRET`/`NEXTAUTH_SECRET` peste IP + user-agent.
- Se folosește **ultima** adresă din `X-Forwarded-For`, fiindcă pe cele dinainte le poate inventa vizitatorul.
- Numărarea nu blochează rândul: câteva cereri perfect simultane pot depăși limita cu puțin. Nu merită complicația la 10 pe oră.
- Capcana răspunde ca la succes și nu scrie nimic.

## Riscuri rămase

- **Elemente vecine în același verset.** 1.266 de versete au mai multe semnalări (2.985 de rânduri). O corecție care atinge unul dintre cele 6 cuvinte de context al altui element îl face STALE, conform regulii din cerință, chiar dacă greșeala lui există încă. Rămân vizibile la filtrul „Învechite”, cu link spre editor; merită o privire după câteva sesiuni de lucru.
- **`X-Forwarded-For` pe TopHost nu a fost verificat.** Dacă Passenger nu trimite adresa, toți vizitatorii cu același navigator împart cele 10 raportări pe oră. Se verifică după deploy (pasul din prompt).

## Cum s-a verificat

Totul a rulat pe o copie a proiectului fără fișiere `.env`, fără `backups/` și fără `bible-data/`. Nicio conexiune la producție.

- `prisma migrate diff --from-schema <schema de pe main> --to-schema prisma/schema.prisma`, fără bază.
- `e2e/biblia-revizuire.e2e.mjs`: PGlite cu schema de pe `main` + SQL-ul nou, `next start`, Chromium. Rândurile CSV-ului sunt generate de script și inventate.
- Parserul a citit și CSV-ul real, cu `--offline`, doar cifre: 9.879 de rânduri valide, 1.844 cu propunere.

```bash
# dintr-o copie fără .env, după `npm run build`
OLD_SCHEMA_SQL=<schema-main.sql> NEW_SCHEMA_SQL=<sql-nou> PLAYWRIGHT_MODULE=<cale>/playwright/index.mjs SHOTS=<folder> node e2e/biblia-revizuire.e2e.mjs
```

Playwright nu e dependență a proiectului; scriptul primește calea lui. Refuză să pornească dacă găsește `.env` în folder.

**Nefăcut:** importul pe baza reală și timpul lui, cele 36.000 de versete și 9.900 de elemente în coadă pe baza reală, adresa clientului pe TopHost.
