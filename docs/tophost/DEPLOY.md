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
| `~/.config/parohie/env` | variabilele de runtime (700/600), vezi „Secrete” |
| `~/bin/parohie-cron.sh` | rulează un cron al aplicației (700), vezi „Cron-uri” |
| `~/logs/parohie-cron.log` | o linie per rulare: dată UTC, cale, cod HTTP, success (trunchiat peste 1 MB) |

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
setate și nu loghează valori.

Instalate (doar nume):

| Variabilă | Note |
| --- | --- |
| `DATABASE_URL` | Supabase **pooler** IPv4 (`aws-0-eu-west-1.pooler.supabase.com:6543`); hostul direct `db.<ref>.supabase.co` e doar IPv6 |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | storage |
| `NEXTAUTH_SECRET` | sesiunile admin (Auth.js citește `AUTH_SECRET ?? NEXTAUTH_SECRET`) |
| `AUTH_URL=https://parintelemarin.com`, `AUTH_TRUST_HOST=true` | ne-secrete; fără ele Auth.js respinge gazda (`UntrustedHost`) în afara Vercel |
| `NEXT_PUBLIC_SITE_URL=https://parintelemarin.com` | ne-secret |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | pagina Live |
| `CRON_SECRET` | generat nou pentru TopHost (cel din Vercel nu mai e folosit) |

Nu se pun pe server: `DIRECT_URL` (doar pentru CLI Prisma). Lipsesc intenționat: `RESEND_API_KEY`,
`CONTACT_EMAIL_TO` — **formularul de contact nu trimite email** (nici pe Vercel nu trimitea), de reparat
separat (SMTP cu nodemailer + căsuță cPanel, plus eroare vizibilă în loc de „ok” fals).

**`DATABASE_URL` trebuie să existe mereu.** `src/proxy.ts` importă `@/auth`, care importă
`@/lib/prisma`; fără `DATABASE_URL`, `new PrismaClient()` aruncă eroare la încărcarea modulului și
**orice** cerere (inclusiv `/api/health`) dă 500.

### Rotirea unui secret

Valoarea nu trece prin argumente de comandă (le-ar arăta `ps`) și nu se lipește în chat:

```bash
ssh tophost-parintel            # apoi, pe server:
nano ~/.config/parohie/env      # editezi linia KEY=VALUE
chmod 600 ~/.config/parohie/env
touch ~/parohie/tmp/restart.txt
curl -s -H 'Host: parintelemarin.com' http://195.178.106.95/api/health   # {"ok":true}
```

La rotirea `CRON_SECRET` nu e nimic altceva de schimbat: `parohie-cron.sh` îl citește din același fișier.

## Cron-uri

Înlocuiesc `vercel.json`. Crontab-ul contului `parintel` (bloc între `# BEGIN parohie-cron` și
`# END parohie-cron`), cu `CRON_TZ=UTC` (serverul e pe `Europe/Chisinau`, cu oră de vară):

| Oră (UTC) | Cale |
| --- | --- |
| 00:00 | `/api/cron/sfinti` (adaugă sfinții pe azi + 3 zile, idempotent) |
| 04:00 | `/api/cron/feeds` (mitropolia.md, protopopiatul-criuleni-dubasari.md) |

`~/bin/parohie-cron.sh <cale>` citește `CRON_SECRET` din `~/.config/parohie/env` și îl dă lui `curl`
prin stdin (`-K -`). Cererea merge la `http://195.178.106.95` cu `Host: parintelemarin.com`
(`127.0.0.1` ajunge la vhost-ul implicit, 404), deci nu depinde de DNS. Rulare manuală:
`ssh tophost-parintel '~/bin/parohie-cron.sh /api/cron/feeds; tail -3 ~/logs/parohie-cron.log'`.

## Sitemap

`src/app/sitemap.ts` are `export const dynamic = 'force-dynamic'`: build-ul CI nu are acces la DB,
iar un sitemap pre-randat ar conține doar rutele fixe. Orice pagină publică nouă care citește din DB
trebuie să fie dinamică (ƒ în tabelul de rute din `next build`), nu statică (○).

## Observații

- Serverul nu are `rsync`; upload-ul se face cu `tar` prin SSH într-un director gol.
- Procesul apare în `ps` ca `next-server (v16.2.9)`, nu `node`: `ssh tophost-parintel 'ps -eo pid,rss,etime,args | grep [n]ext-server'`.
- Măsurat cu mediul real: RSS ~240–365 MB (după `sharp`), pornire la rece `/` ~2,2 s, `/` cald TTFB p50 ~0,2 s.
- **LiteSpeed Cache** păstrează `/_next/image` ignorând `Vary: Accept`: primul format generat (AVIF)
  e servit tuturor. Browserele fără AVIF ar primi imagini pe care nu le pot afișa. HTML-ul și API-ul
  nu sunt cache-uite (`no-store`). Remediere propusă, de aplicat manual (bloc separat, la finalul
  `~/public_html/.htaccess`, după blocurile selectorului):

  ```apache
  # BEGIN parohie-lscache
  <IfModule LiteSpeed>
  RewriteEngine On
  RewriteRule ^_next/image - [E=Cache-Control:no-cache]
  </IfModule>
  # END parohie-lscache
  ```
- Static prin LiteSpeed (copiere în `public_html/_next/static`) a fost testat și abandonat: LiteSpeed
  dă `max-age=604800` fără `immutable` și fără compresie. Ar cere reguli în `.htaccess` și
  sincronizare în deploy; Next servește deja `/_next/static` cu cache de 1 an.

## Ce NU e încă făcut

- DNS și certificatul SSL (AutoSSL) pentru `parintelemarin.com`;
- redirect-ul `biserica-sf-nicolae.org` → `parintelemarin.com` (domeniul nu e încă pe cont);
- Google Search Console (proprietate nouă + sitemap) după mutarea DNS;
- formularul de contact (vezi „Secrete”);
- remedierea LiteSpeed Cache pentru `/_next/image` (vezi „Observații”);
- de verificat manual: autentificarea admin, încărcarea de fișiere, formularul de contact.
