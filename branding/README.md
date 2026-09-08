# Branding — emblema Parohiei „Sfântul Ierarh Nicolae”

Emblemă: mitră arhierească + scut bleumarin + cruce ortodoxă + banderolă
„SFÂNTUL IERARH NICOLAE”.

## Fișiere

| Fișier | Ce e |
| --- | --- |
| `logo-source.png` | Sursa originală (1254×1254, fundal gri opac). Nu se modifică. |
| `logo-emblema-full.png` | Emblema completă, fundal decupat transparent (master pt. print / social). |
| `logo-mark.png` | Doar marca (mitră + scut + cruce, fără banderolă), fundal transparent. |
| `generate-icons.mjs` | Regenerează toate icon-urile din `logo-source.png`. |

## Regenerare

```bash
node branding/generate-icons.mjs          # scrie în branding/out/
```

Apoi comprimă cu paletă și copiază în poziție:

```bash
# favicon / app-icons (convenție App Router) → src/app/
cp branding/out/favicon.ico      src/app/favicon.ico
sharp: icon.png (512, transparent) → src/app/icon.png       (palette, quality 92)
sharp: apple-icon.png (180, cream #F7F3E9) → src/app/apple-icon.png

# PWA (referite din public/manifest.json) → public/
icon-192.png, icon-512.png, maskable-icon-512.png

# emblema din header / footer / admin → public/logo.png  (marca, 256px, palette)
```

## Unde apare

- **Favicon tab browser** — `src/app/favicon.ico` (16/32/48, doar marca — textul
  banderolei e ilizibil sub ~48px, de aceea favicon-ul folosește marca decupată).
- **`<link rel=icon>` / `apple-touch-icon`** — `src/app/icon.png`, `src/app/apple-icon.png`
  (generate automat de Next din convenția de fișiere; nu mai există bloc `icons`
  în `src/app/layout.tsx`).
- **PWA „Add to Home Screen”** — `public/manifest.json` → `icon-192/512` + `maskable-icon-512`.
- **Header site** (`src/components/layout/Header.tsx`) — marca, 34px, lângă „Sf. Ierarh Nicolae”.
- **Footer site** (`src/components/layout/Footer.tsx`) — marca, 46px.
- **Panou admin** — `AdminSidebar.tsx`, `AdminMobileNav.tsx`, `admin/page.tsx`
  (bara de sus), `admin/login/page.tsx` (ecran de autentificare).

Glifele decorative `☦` din titlurile de pagină NU sunt logo — au rămas neatinse.
