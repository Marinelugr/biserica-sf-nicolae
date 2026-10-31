import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { bibleOgText, OG_SIZE, parseBibleOgParts } from '@/lib/bible/seo'
import { SITE_HOST } from '@/lib/site'

const BG = '#050a1a'
const GOLD = '#e0b84a'
const INK = '#f4ecda'
const MARK = { width: 225, height: 463 }
// Câte un nume pentru fiecare subset: Satori păstrează un singur font per nume, iar o glifă
// negăsită duce la fontul de rezervă, descărcat de @vercel/og de pe rețea.
const FONT_FILES = { 'EB Garamond': 'latin', 'EB Garamond Ext': 'latin-ext', 'EB Garamond Cyrillic': 'cyrillic' }
const FONT_STACK = Object.keys(FONT_FILES).map(name => `"${name}"`).join(', ')

// Citite o singură dată; în standalone, public/ stă lângă server.js, care face chdir acolo.
let assets: ReturnType<typeof loadAssets> | undefined
async function loadAssets() {
  const pub = (name: string) => readFile(join(process.cwd(), 'public', name))
  const [mark, ...fonts] = await Promise.all([
    pub('logo-mark.png'),
    ...Object.values(FONT_FILES).map(subset => pub(`og/EBGaramond-500-${subset}.ttf`)),
  ])
  return {
    mark: `data:image/png;base64,${mark.toString('base64')}`,
    fonts: Object.keys(FONT_FILES).map((name, i) => ({ name, data: fonts[i], weight: 500 as const, style: 'normal' as const })),
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const target = parseBibleOgParts((await params).parts)
  if (!target) return new Response('Not found', { status: 404 })

  assets ??= loadAssets()
  const { mark, fonts } = await assets
  const { scripture, bible, reference } = bibleOgText(target.locale, target.book, target.chapter)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: BG, color: INK, fontFamily: FONT_STACK, padding: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: `2px solid ${GOLD}`, padding: '0 70px', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- randat de ImageResponse, nu de browser */}
          <img src={mark} alt="" width={MARK.width} height={MARK.height} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 64, paddingBottom: 30 }}>
            <div style={{ fontSize: 84, lineHeight: 1.1, color: GOLD }}>{scripture}</div>
            <div style={{ fontSize: 52, lineHeight: 1.2, marginTop: 6 }}>{bible}</div>
            {reference && <div style={{ width: 120, height: 2, background: GOLD, marginTop: 28 }} />}
            {reference && <div style={{ fontSize: 62, lineHeight: 1.15, marginTop: 24 }}>{reference}</div>}
          </div>
          <div style={{ position: 'absolute', right: 70, bottom: 32, fontSize: 30, color: GOLD }}>{SITE_HOST}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  )
}
