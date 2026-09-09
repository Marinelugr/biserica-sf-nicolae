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
  - **Footer** (`Footer.tsx`), 190px, deasupra adresei, în locul vechiului rând
    „☦ Sfântul Ierarh Nicolae”.
  - **Homepage — card lângă „Calendarul Pascal”** (`src/app/page.tsx`, case
    `pascal_slujbe`): card `glass-cobalt` cu emblema `clamp(172px, 26vw, 224px)`
    centrată, în STÂNGA; cardul „Calendarul Pascal” (`PascalCard`) în DREAPTA;
    `NextServiceWidget` mutat pe rând propriu dedesubt (`md:col-span-2`,
    `[&:empty]:hidden` — dispare complet când e „paused”/gol).

## Hero

`Hero.tsx` — **fără emblemă** (experimentele cu stema deasupra titlului / pe
cusătură au fost revenite complet la `ebe7354`). Doar titlul animat cuvânt-cu-
cuvânt (framer-motion, secvenţa originală), separator ☦, subtitluri, butoane.
`prefers-reduced-motion` respectat.

Glifele decorative `☦` din titlurile de pagină NU sunt logo — au rămas neatinse.
