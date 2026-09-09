# Branding — emblema Parohiei „Sfântul Ierarh Nicolae”

Emblemă: mitră arhierească + scut bleumarin + cruce ortodoxă + banderolă
„SFÂNTUL IERARH NICOLAE”.

## Fișiere

| Fișier | Ce e |
| --- | --- |
| `logo-source.png` | Sursa originală (1254×1254, fundal gri opac). Nu se modifică. |
| `logo-emblema-full.png` | Emblema completă, fundal decupat transparent (master pt. print / social). |
| `logo-mark.png` | Marca (mitră + scut + cruce, fără banderolă), fundal transparent. |
| `generate-icons.mjs` | Regenerează toate icon-urile din `logo-source.png`. |

## Marca (`logo-mark.png`) — reconstrucție

Banderola cu text acoperă vârful scutului și piciorul crucii în sursă, deci un
simplu crop lăsa scutul „amputat” (bază plată). `generate-icons.mjs` § 6:
- păstrează pixelii reali până sub banderolă (`Y_CUT`);
- redesenează vârful scutului (curbă `157·(1−t)^0.85`), bara verticală a crucii
  și troița de la bază, cu un gradient de auriu potrivit ca să dispară cusătura.
Dacă se schimbă sursa, recalibrează constantele geometrice din § 6.

## Regenerare

```bash
node branding/generate-icons.mjs          # scrie în branding/out/
```

Apoi comprimă cu paletă și copiază în poziție (vezi și scriptul din commit):

```
src/app/favicon.ico          ← out/favicon.ico            (16/32/48, marca decupată strâns)
src/app/icon.png             ← out/icon.png    (512, transparent, palette q92)
src/app/apple-icon.png       ← out/apple-icon.png (180, crem #F7F3E9, palette)
public/icon-192/512.png, public/maskable-icon-512.png   (referite din manifest.json)
public/logo.png              ← out/logo-mark-400.png  (256, palette) — marca din UI
public/logo-emblema.png      ← out/logo-emblema-full.png (560px lat, palette) — emblema completă
```

## Unde apare

- **Favicon tab browser** — `src/app/favicon.ico`. 16px = scut + cruce recognoscibil
  dar la limită; ≥32px clar. Banderola cu text nu se folosește sub ~200px.
- **`<link rel=icon>` / `apple-touch-icon`** — `src/app/icon.png`, `src/app/apple-icon.png`
  (convenție de fișiere Next; nu mai există bloc `icons` în `layout.tsx`).
- **PWA „Add to Home Screen”** — `public/manifest.json` → `icon-192/512` + `maskable-icon-512`.
- **Marca** (`/logo.png`) — Header, Footer? nu — vezi mai jos; AdminSidebar,
  AdminMobileNav, `admin/page.tsx` (bara sus), `admin/login/page.tsx`.
- **Header site** (`Header.tsx`) — marca, ~34px, lângă „Sf. Ierarh Nicolae”.
- **Emblema completă** (`/logo-emblema.png`, cu banderola) — **doar în Footer**
  (`Footer.tsx`), 190px, deasupra adresei, în locul vechiului rând „☦ Sfântul
  Ierarh Nicolae”.
- **Hero homepage** (`components/homepage/Hero.tsx`) — **`/logo-mark.png`** (marca,
  FĂRĂ banderolă), poziţionată ca **medalion pe cusătura hero/conţinut**: jumătate
  pe fotografie, jumătate pe fundalul navy `#04080F` de dedesubt. `height:
  clamp(150px, 24vw, 206px)`, drop-shadow în 3 straturi (contur `0 0 7px` + 2 umbre
  difuze — contează doar pt. jumătatea de sus, pe poză).
  - Wrapper `absolute bottom-20` + `translate(-50%,50%)`; secţiunea are `pb-20`
    ca „zonă de aterizare" navy (jumătatea de jos să nu cadă peste primul card).
    **`bottom-20` şi `pb-20` sunt cuplate** — se schimbă împreună.
  - Secţiunea NU mai are `overflow-hidden` (l-am mutat pe div-ul interior, care
    ţine parallax-ul); `z-20` ca jumătatea de jos să treacă peste secţiunea de sub ea.

## Animația din hero

`Hero.tsx` foloseşte **framer-motion** (deja în proiect — NU s-a adăugat GSAP),
nu keyframes CSS. Secvenţă strict succesivă (fiecare etapă porneşte după ce
precedenta e ~aşezată; delay-urile scalează cu nr. de cuvinte al titlului):

Stema stă acum pe cusătura de JOS → nu mai porneşte prima. Titlul/subtitlurile/
butoanele cascadează normal la încărcare; **stema animă ULTIMA**, ca un sigiliu.

| Etapă | transform | durată | easing | delay (RO, 4 cuv.) |
| --- | --- | --- | --- | --- |
| Titlu (per cuvânt) | `opacity 0→1, y 35→0` | 0.6s | `ease` `[.25,.1,.25,1]` | 0.15 + i·0.13 |
| Linie decorativă | `scaleX 0→1` (2×70px ≈ 150px) | 0.8s | `ease` | ≈0.93s |
| ☦ din linie | `opacity 0→1, scale .4→1` | 0.5s | bounce | ≈1.03s |
| Subtitlu ×2 | `opacity 0→1, y -15→0` | 0.7s | `ease` | ≈1.41 / 1.55s |
| Butoane | `opacity 0→1, y 18→0` | 0.6s | `ease` | ≈1.97s |
| **Stema** | `opacity 0→1, scale .6→1, y -20→0` | 1.0s | `cubic-bezier(.34,1.56,.64,1)` | ≈2.39s |

Total ≈ 3.4s. `prefers-reduced-motion: reduce` ⇒ tot vizibil instant
(`initial={false}`, `duration:0`).

Glifele decorative `☦` din titlurile de pagină NU sunt logo — au rămas neatinse.
