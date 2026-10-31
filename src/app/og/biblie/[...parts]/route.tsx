import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { bibleOgText, OG_SIZE, ogSubtitleSize, parseBibleOgParts } from '@/lib/bible/seo'
import { SITE_HOST } from '@/lib/site'

// Paleta site-ului: --ink, --gold, --bg și gradientul cardurilor din globals.css.
const INK = '#f4ecda'
const GOLD = '#e0b84a'
const BACKGROUND = 'radial-gradient(ellipse 100% 120% at 50% 0%, #17295f 0%, #0a1330 60%, #050a1a 100%)'

// Stema din antet (src/components/layout/Header.tsx), păstrată proporțional la 150 px înălțime.
const MARK = { file: 'logo-mark.png', width: 73, height: 150 }

const FOOTER_SPACING = 5.6 // 0,2 em la 28 px

// Câte un nume pentru fiecare subset: Satori păstrează un singur font per nume, greutate și stil,
// iar o glifă negăsită duce la fontul de rezervă, descărcat de @vercel/og de pe rețea.
const FAMILY: Record<string, string> = { latin: 'Cormorant', 'latin-ext': 'Cormorant Ext', cyrillic: 'Cormorant Cyrillic' }
const FONT_STACK = Object.values(FAMILY).map(name => `"${name}"`).join(', ')
const FONT_FILES = [
  { subset: 'latin', weight: 600, style: 'normal' },
  { subset: 'latin-ext', weight: 600, style: 'normal' },
  { subset: 'cyrillic', weight: 600, style: 'normal' },
  { subset: 'latin', weight: 500, style: 'normal' },
  { subset: 'latin-ext', weight: 500, style: 'normal' },
  { subset: 'cyrillic', weight: 500, style: 'normal' },
  { subset: 'latin', weight: 500, style: 'italic' },
  { subset: 'cyrillic', weight: 500, style: 'italic' },
] as const

// Citite o singură dată; în standalone, public/ stă lângă server.js, care face chdir acolo.
let assets: ReturnType<typeof loadAssets> | undefined
async function loadAssets() {
  const pub = (name: string) => readFile(join(process.cwd(), 'public', name))
  const [mark, ...fonts] = await Promise.all([
    pub(MARK.file),
    ...FONT_FILES.map(f => pub(`og/CormorantGaramond-${f.weight}-${f.style}-${f.subset}.ttf`)),
  ])
  return {
    mark: `data:image/png;base64,${mark.toString('base64')}`,
    fonts: FONT_FILES.map((f, i) => ({ name: FAMILY[f.subset], data: fonts[i], weight: f.weight, style: f.style })),
  }
}

/** Un rând centrat, poziționat de sus. */
function Line({ top, children, style }: { top: number; children: React.ReactNode; style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...style }}>{children}</div>
}

export async function GET(_request: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const target = parseBibleOgParts((await params).parts)
  if (!target) return new Response('Not found', { status: 404 })

  assets ??= loadAssets()
  const { mark, fonts } = await assets
  const { scripture, bible, subtitle } = bibleOgText(target.locale, target.book, target.chapter)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundImage: BACKGROUND, fontFamily: FONT_STACK, color: INK }}>
        <div style={{ position: 'absolute', top: 26, left: 26, width: OG_SIZE.width - 52, height: OG_SIZE.height - 52, border: `2px solid ${GOLD}`, borderRadius: 6 }} />
        <div style={{ position: 'absolute', top: 38, left: 38, width: OG_SIZE.width - 76, height: OG_SIZE.height - 76, border: '1px solid rgba(224,184,74,.4)' }} />
        <Line top={62} style={{}}>
          {/* eslint-disable-next-line @next/next/no-img-element -- randat de ImageResponse, nu de browser */}
          <img src={mark} alt="" width={MARK.width} height={MARK.height} />
        </Line>
        <Line top={228} style={{ fontSize: 104, fontWeight: 600, lineHeight: 1 }}>{scripture}</Line>
        <Line top={340} style={{ fontSize: 58, fontWeight: 500, fontStyle: 'italic', lineHeight: 1, color: GOLD }}>{bible}</Line>
        <Line top={428} style={{}}>
          <div style={{ width: 440, height: 1, background: GOLD, opacity: 0.6 }} />
        </Line>
        <Line top={446} style={{ fontSize: ogSubtitleSize(subtitle), fontWeight: 500, lineHeight: 1.1 }}>{subtitle}</Line>
        <Line top={546} style={{ fontSize: 28, fontWeight: 500, lineHeight: 1, letterSpacing: FOOTER_SPACING, paddingLeft: FOOTER_SPACING, color: GOLD }}>
          {SITE_HOST.toUpperCase()}
        </Line>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  )
}
