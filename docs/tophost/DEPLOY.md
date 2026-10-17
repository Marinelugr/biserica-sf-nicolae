# Deploy pe TopHost (cPanel, CloudLinux, LiteSpeed + Passenger)

Contul cPanel `parintel` pe `ulitrahost.tophost.md` (IP `195.178.106.95`), SSH pe portul **49786**
cu cheia `~/.ssh/tophost_parintel` (alias `tophost-parintel` în `~/.ssh/config`).

## Arhitectura

```
push (main / infra/tophost)
  └─ GitHub Actions: .github/workflows/build-standalone.yml
       npm ci → next build (output: 'standalone', fără secrete)
       bundle/ = .next/standalone + public/ + .next/static  → parohie-standalone.tar.gz (artefact, 7 zile)
scripts/deploy-tophost.sh (pe Mac)
  └─ gh run watch → gh run download
  └─ upload prin SSH (tar; serverul nu are rsync) în ~/parohie/app.new (director gol = echivalent --delete)
  └─ swap: app → app.prev, app.new → app; touch ~/parohie/tmp/restart.txt
  └─ smoke test: GET http://195.178.106.95/api/health cu `Host: parintelemarin.com` (60 s)
       eșec → rollback automat la app.prev, cod de ieșire ≠ 0
```

Pe server:

| Cale | Ce este |
| --- | --- |
| `~/parohie/` | app root pentru Passenger (cPanel → Setup Node.js App), Node 22, mod Production, URL rădăcină `parintelemarin.com` |
| `~/parohie/server.js` | startup file (wrapper): încarcă `~/.config/parohie/env`, setează `HOSTNAME=0.0.0.0`, pornește `./app/server.js` |
| `~/parohie/package.json` | minimal, fără dependențe (selectorul nu instalează nimic) |
| `~/parohie/app/` | bundle-ul Next standalone activ (`app/REVISION` = commit-ul) |
| `~/parohie/app.prev/` | versiunea anterioară (pentru rollback) |
| `~/parohie/tmp/restart.txt` | `touch` = restart Passenger |
| `~/nodevenv/parohie/22/` | mediul Node creat de selector |
| `~/public_html/.htaccess` | conține blocul `CLOUDLINUX PASSENGER CONFIGURATION`, generat de selector; nu se editează manual |
| `~/logs/parohie-passenger.log` | stdout/stderr ale aplicației |

`.next/static` primește `cache-control: public, max-age=31536000, immutable` direct de la Next.

## Comenzi

```bash
scripts/deploy-tophost.sh              # deploy commit-ul curent (working tree curat, HEAD împins)
scripts/deploy-tophost.sh --run <id>   # deploy un run anume al build-standalone
scripts/rollback-tophost.sh            # app ↔ app.prev, restart, smoke test (încă o rulare = înapoi)
ssh tophost-parintel 'touch ~/parohie/tmp/restart.txt'   # restart manual
```

Cerințe locale: `gh` autentificat, `ssh`, `curl`, `tar`.

## Secrete

Nu sunt în repo, în CI sau în artefact. Build-ul CI folosește doar `NEXT_PUBLIC_SITE_URL` și un
`DATABASE_URL` fictiv (`127.0.0.1:1`), necesar doar pentru ca `PrismaClient` să poată fi construit.

Variabilele de runtime stau în `~/.config/parohie/env` (director 700, fișier 600), format
`KEY=VALUE` (ghilimele opționale, comentarii cu `#`). Wrapper-ul nu suprascrie variabile deja
setate și nu loghează valori. Fișierul se completează în pasul următor.

**Important:** `DATABASE_URL` trebuie să existe mereu. `src/proxy.ts` importă `@/auth`, care importă
`@/lib/prisma`; fără `DATABASE_URL`, `new PrismaClient()` aruncă eroare la încărcarea modulului și
**orice** cerere (inclusiv `/api/health`) dă 500. Până la pasul cu secrete, fișierul conține doar un
placeholder nefuncțional (`127.0.0.1:1`).

## Observații

- Serverul nu are `rsync`; upload-ul se face cu `tar` prin SSH într-un director gol.
- Procesul apare în `ps` ca `next-server (v16.2.9)`, nu `node`: `ssh tophost-parintel 'ps -eo pid,rss,etime,args | grep [n]ext-server'`.
- Măsurat: RSS ~125–140 MB, pornire la rece ~1,2 s.
- Static prin LiteSpeed (copiere în `public_html/_next/static`) a fost testat și abandonat: LiteSpeed
  dă `max-age=604800` fără `immutable` și fără compresie. Ar cere reguli în `.htaccess` și
  sincronizare în deploy; Next servește deja `/_next/static` cu cache de 1 an.

## Ce NU e încă făcut

- secretele (`DATABASE_URL`, `AUTH_SECRET`, Supabase, Resend, YouTube, `CRON_SECRET` etc.) în `~/.config/parohie/env`;
- cron-urile (`/api/cron/feeds`, `/api/cron/sfinti`), azi definite în `vercel.json`;
- DNS și certificatul SSL pentru `parintelemarin.com`;
- redirect-ul `biserica-sf-nicolae.org` → `parintelemarin.com` (domeniul nu e încă pe cont);
- `/sitemap.xml` e pre-randat static la build; fără DB la build conține doar rutele fixe
  (necesită o decizie separată: build cu DB sau sitemap dinamic);
- `/` și `/admin` netestate (cer DB și `AUTH_SECRET`).
