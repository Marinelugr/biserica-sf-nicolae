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
- **Emblema completă** (`/logo-emblema.png`, cu banderola):
  - **Footer** (`Footer.tsx`) — 190px, deasupra adresei, înlocuiește vechiul rând
    „☦ Sfântul Ierarh Nicolae”.
  - **Hero homepage** (`components/homepage/Hero.tsx`) — stema deasupra titlului,
    `clamp(128px, 20vw, 170px)`, animată (bounce) — vezi mai jos.

## Animația din hero

`Hero.tsx` folosește **framer-motion** (deja în proiect — NU s-a adăugat GSAP),
nu keyframes CSS. Secvența (calculată din nr. de cuvinte al titlului):
stema (bounce `cubic-bezier(0.34,1.56,0.64,1)`, delay 0.2s) → titlul cuvânt cu
cuvânt (de la 0.9s, pas 0.12s) → linia decorativă „se trage” → subtitluri →
butoane. `prefers-reduced-motion: reduce` ⇒ tot vizibil instant (`initial={false}`).

Glifele decorative `☦` din titlurile de pagină NU sunt logo — au rămas neatinse.
