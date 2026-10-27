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
  └─ smoke test: GET https://parintelemarin.com/api/health, fixat pe 195.178.106.95 cu --resolve (60 s)
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
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | nu mai sunt folosite de aplicație (pagina Live a fost scoasă, 2026-10-23); pot fi șterse din `~/.config/parohie/env` (de Marin) |
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
prin stdin (`-K -`). Cererea merge la `https://parintelemarin.com` fixat pe `195.178.106.95` cu
`--resolve` (`127.0.0.1` ajunge la vhost-ul implicit, 404), deci nu depinde de DNS și nu trece prin
redirectul `http` → `https`. Rulare manuală:
`ssh tophost-parintel '~/bin/parohie-cron.sh /api/cron/feeds; tail -3 ~/logs/parohie-cron.log'`.

## Sitemap

`src/app/sitemap.ts` are `export const dynamic = 'force-dynamic'`: build-ul CI nu are acces la DB,
iar un sitemap pre-randat ar conține doar rutele fixe. Orice pagină publică nouă care citește din DB
trebuie să fie dinamică (ƒ în tabelul de rute din `next build`), nu statică (○).

## Observații

- Serverul nu are `rsync`; upload-ul se face cu `tar` prin SSH într-un director gol.
- Procesul apare în `ps` ca `next-server (v16.2.9)`, nu `node`: `ssh tophost-parintel 'ps -eo pid,rss,etime,args | grep [n]ext-server'`.
- Măsurat cu mediul real: RSS ~240–480 MB per proces (după `sharp`; Passenger poate porni 2 procese
  sub sarcină), limita LVE a contului 3 GB / 40 Entry Processes; pornire la rece `/` ~2,2 s,
  `/` cald TTFB p50 ~0,2 s.
- **LiteSpeed Cache** păstrează `/_next/image` ignorând `Vary: Accept`, deci primul format generat
  e servit tuturor. De aceea `images.formats` e doar `['image/webp']` în `next.config.ts`: nu
  reintroduce AVIF fără o regulă LSCache. HTML-ul și API-ul nu sunt cache-uite (`no-store`).
  Intrările vechi rămase în cache se golesc din cPanel → LiteSpeed Web Cache Manager → Flush All.
- Static prin LiteSpeed (copiere în `public_html/_next/static`) a fost testat și abandonat: LiteSpeed
  dă `max-age=604800` fără `immutable` și fără compresie. Ar cere reguli în `.htaccess` și
  sincronizare în deploy; Next servește deja `/_next/static` cu cache de 1 an.

## Limite de încărcare

Măsurat pe 2026-10-23, de pe un Mac (rețea de acasă), cu `POST /api/admin/upload` **fără autentificare**
(fișier aleator, `multipart/form-data`). Scopul: să vedem dacă LiteSpeed/Passenger taie cererile mari
înainte de aplicație.

| Mărime | Rezultat |
| --- | --- |
| 1 MB | `401` JSON `{"error":"Neautorizat"}`, 0,7 s |
| 4 MB | `401` JSON, 0,9 s |
| 5 / 6 / 8 MB | `401` JSON, 1,0–1,4 s |
| 12 MB | `401` JSON, 2,5–3,0 s |
| 25 MB | `401` JSON, 4,0 s |

Concluzie: serverul **nu** taie cererile până la 25 MB (fără `413`, `403`, `502` sau HTML); limita
efectivă e cea din aplicație (`MAX_SIZE_MB = 20` în `src/app/api/admin/upload/route.ts`).

La prima rulare, probele de 12 și 25 MB s-au blocat după 4 MB, respectiv 10 MB trimiși (0 octeți
primiți, peste 15 minute); la reluare, câteva minute mai târziu, au trecut în câteva secunde. Pare o
întrerupere de rețea pe partea clientului, nu o limită a serverului, dar arată de ce clientul trebuie
să comprime pozele înainte de trimitere și să reîncerce o dată (vezi `src/lib/mediaUpload.ts`).

Nemăsurat (cere autentificare): timpul de procesare `sharp` pentru o poză reală de telefon și
consumul de memorie cu mai multe încărcări simultane.

## DNS și HTTPS

| Domeniu | Nameservere | Înregistrări |
| --- | --- | --- |
| `parintelemarin.com` | Spaceship (`launch1/2.spaceship.net`) | `A @` → `195.178.106.95`; `www` CNAME → apex; TXT `google-site-verification` |
| `biserica-sf-nicolae.org` | Spaceship (mutate de pe Vercel pe 2026-10-17, DNSSEC activ, DS key id 45193) | `A @`, `A www` → `195.178.106.95`; TXT `google-site-verification`; CAA (letsencrypt, sectigo, pki.goog) |

Certificate: AutoSSL (Let's Encrypt), separat pentru `parintelemarin.com` + `www` și pentru
`biserica-sf-nicolae.org` + `www`, reînnoite automat de cPanel. Avertismentele AutoSSL pentru
`mail.*`, `cpanel.*`, `webmail.*`, `biserica-sf-nicolae.parintelemarin.com` etc. sunt normale: acele
nume nu au DNS.

### Redirecturi (`.htaccess`, în afara blocurilor cPanel/selector)

- `~/public_html/.htaccess`, la început, blocul `parohie-redirects`: `http` → `https` și
  `www.parintelemarin.com` → `https://parintelemarin.com/<cale>`, 301, query păstrat.
- `~/public_html/biserica-sf-nicolae.org/.htaccess` (document root-ul domeniului adițional), blocul
  `parohie-redirect-org`: orice host ≠ `parintelemarin.com` → `https://parintelemarin.com/<cale>`, 301.
- Ambele exceptează `/.well-known/` (validarea AutoSSL). HSTS nu e activat.
- Redirectul `.org` trebuie păstrat **minimum 12 luni** (Search Console → Change of address).
- Next mai are în `next.config.ts` redirecturi (308) pentru aceleași host-uri; nu se ajunge la ele,
  `.htaccess` răspunde primul.

### Depanare AutoSSL

```bash
ssh tophost-parintel 'uapi SSL start_autossl_check'              # pornește o verificare
ssh tophost-parintel 'uapi SSL is_autossl_check_in_progress'     # data: 1 = în curs
ssh tophost-parintel 'uapi SSL get_autossl_problems'             # cauze (DNS, CAA, DCV)
echo | openssl s_client -connect parintelemarin.com:443 -servername parintelemarin.com | openssl x509 -noout -issuer -enddate
```

Cauze tipice: DNS-ul nu arată spre `195.178.106.95`, `CAA` care nu permite `letsencrypt.org`/`sectigo.com`,
o regulă de redirect care prinde `/.well-known/`. Emiterea poate întârzia câteva minute după o
verificare reușită.

### Rollback

- Redirecturi: `cp -p ~/public_html/.htaccess.bak-20261017-220228 ~/public_html/.htaccess` (și
  `~/public_html/biserica-sf-nicolae.org/.htaccess.bak-20261017-220359` pentru `.org`), apoi health.
- DNS `.org` înapoi la Vercel: Spaceship → domeniu → Nameservers → `ns1/ns2.vercel-dns.com`
  (proiectul Vercel e oprit, deci ar da 402).

## Ce NU e încă făcut

- formularul de contact (vezi „Secrete”);
- domeniul vechi în footer/contact (4 fișiere);
- Search Console: sitemap pentru `parintelemarin.com`, Change of address pentru `biserica-sf-nicolae.org`;
- de verificat manual: autentificarea admin, încărcarea de fișiere.
