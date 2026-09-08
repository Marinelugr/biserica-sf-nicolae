// Regenerates every favicon / app-icon / PWA icon + the UI emblem from the
// single source file below. Run from the project root:  node branding/generate-icons.mjs
// then palette-compress + copy the outputs into place (see branding/README.md).
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BRANDING = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(BRANDING, 'logo-source.png')
const OUT = process.argv[2] || path.join(BRANDING, 'out')
fs.mkdirSync(OUT, { recursive: true })

// ---- 1. load raw RGB ----
const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, N = W * H
const REF = [249, 249, 250]
const isBg = (i) => {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
  return Math.min(r, g, b) > 224 &&
    Math.abs(r - REF[0]) < 27 && Math.abs(g - REF[1]) < 27 && Math.abs(b - REF[2]) < 27
}
const bgDist = (i) => {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
  return Math.sqrt((r - REF[0]) ** 2 + (g - REF[1]) ** 2 + (b - REF[2]) ** 2)
}

// ---- 2. flood fill background from borders ----
const outside = new Uint8Array(N)
const st = []
for (let x = 0; x < W; x++) { st.push(x, (H - 1) * W + x) }
for (let y = 0; y < H; y++) { st.push(y * W, y * W + W - 1) }
while (st.length) {
  const i = st.pop()
  if (outside[i] || !isBg(i)) continue
  outside[i] = 1
  const x = i % W, y = (i / W) | 0
  if (x > 0) st.push(i - 1)
  if (x < W - 1) st.push(i + 1)
  if (y > 0) st.push(i - W)
  if (y < H - 1) st.push(i + W)
}

// ---- 3. alpha buffer with feathered edges ----
const alpha = new Uint8Array(N)
for (let i = 0; i < N; i++) {
  if (outside[i]) continue
  const x = i % W, y = (i / W) | 0
  let touch = false
  for (let dy = -1; dy <= 1 && !touch; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      if (outside[ny * W + nx]) { touch = true; break }
    }
  if (touch) {
    let a = Math.round(Math.max(0, Math.min(1, (bgDist(i) - 12) / 24)) * 255)
    alpha[i] = a < 24 ? 0 : a
  } else {
    alpha[i] = 255
  }
}

// ---- 4. keep only the largest connected blob (kills stray specks) ----
const label = new Int32Array(N).fill(-1)
let best = -1, bestSize = 0
for (let s = 0; s < N; s++) {
  if (alpha[s] < 40 || label[s] !== -1) continue
  const q = [s]; label[s] = s; let cnt = 0
  while (q.length) {
    const i = q.pop(); cnt++
    const x = i % W, y = (i / W) | 0
    const nb = []
    if (x > 0) nb.push(i - 1)
    if (x < W - 1) nb.push(i + 1)
    if (y > 0) nb.push(i - W)
    if (y < H - 1) nb.push(i + W)
    for (const j of nb) if (alpha[j] >= 40 && label[j] === -1) { label[j] = s; q.push(j) }
  }
  if (cnt > bestSize) { bestSize = cnt; best = s }
}
for (let i = 0; i < N; i++) if (alpha[i] > 0 && label[i] !== best) alpha[i] = 0

// ---- 5. compose RGBA, bbox, write full emblem ----
const rgba = Buffer.alloc(N * 4)
let minX = W, minY = H, maxX = 0, maxY = 0
for (let i = 0; i < N; i++) {
  rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]
  rgba[i * 4 + 3] = alpha[i]
  if (alpha[i] > 12) {
    const x = i % W, y = (i / W) | 0
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
}
const fW = maxX - minX + 1, fH = maxY - minY + 1
const fullBuf = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: minX, top: minY, width: fW, height: fH }).png().toBuffer()
await sharp(fullBuf).toFile(path.join(OUT, 'logo-emblema-full.png'))
console.log('full:', fW, 'x', fH)

// ---- 6. no-text mark: crown + shield + cross, banderole removed, shield point
//         + vertical-bar foot reconstructed (they are occluded by the banderole
//         in the source, so cropping alone leaves an amputated shield). ----
const { data: fd, info: fi } = await sharp(fullBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const FW = fi.width, FH = fi.height

// geometry measured from logo-source.png (see branding/README.md)
const CX = 401              // shield / cross centre x
const Y_CUT = 889           // last clean shield row before the banderole
const Y_NAVY_TIP = 1021     // where the navy shield point vanishes
const Y_GOLD_TIP = 1027     // where the gold outline point vanishes
const H2 = 1032
const NAVY = [6, 34, 84]
// real gold carries a soft top-light gradient; match it so the reconstruction seam disappears
const goldAt = (y) => {
  const k = Math.max(0, Math.min(1, (y - Y_CUT) / (Y_GOLD_TIP - Y_CUT)))
  return [Math.round(233 - 19 * k), Math.round(188 - 18 * k), Math.round(51 - 12 * k)]
}

const canvas = Buffer.alloc(FW * H2 * 4)         // transparent
// keep every real pixel above the banderole
for (let y = 0; y < Y_CUT; y++)
  fd.copy(canvas, y * FW * 4, y * FW * 4, (y + 1) * FW * 4)

const put = (x, y, rgb, a = 255) => {
  if (x < 0 || x >= FW || y < 0 || y >= H2) return
  const i = (y * FW + x) * 4
  if (a >= canvas[i + 3]) { canvas[i] = rgb[0]; canvas[i + 1] = rgb[1]; canvas[i + 2] = rgb[2]; canvas[i + 3] = a }
}
const navyHW = (y) => {                          // navy half-width of the shield
  const t = Math.min(1, (y - (Y_CUT - 5)) / (Y_NAVY_TIP - (Y_CUT - 5)))
  return t >= 1 ? 0 : 157 * Math.pow(1 - t, 0.85)
}
const inTrefoil = (x, y) => {                    // budded foot of the vertical bar
  const lobes = [[CX, 998, 14], [CX - 19, 1004, 12], [CX + 19, 1004, 12], [CX, 1016, 11]]
  return lobes.some(([lx, ly, r]) => (x - lx) ** 2 + (y - ly) ** 2 <= r * r)
}
for (let y = Y_CUT - 10; y < H2; y++) {
  const blend = Math.max(0, Math.min(1, (y - (Y_CUT - 10)) / 12))   // ramp drawn pixels in over the seam
  const t = Math.min(1, (y - (Y_CUT - 5)) / (Y_NAVY_TIP - (Y_CUT - 5)))
  const hwN = navyHW(y)
  const border = 17 - 7 * t
  let hwG = t < 1 ? hwN + border : Math.max(0, 10 - (y - Y_NAVY_TIP) * (10 / (Y_GOLD_TIP - Y_NAVY_TIP)))
  for (let x = Math.floor(CX - hwG - 2); x <= Math.ceil(CX + hwG + 2); x++) {
    const ad = Math.abs(x - CX)
    const gold = goldAt(y)
    let rgb = null, a = 255
    if (ad <= hwG - 1) rgb = (ad <= hwN && t < 1) ? NAVY : gold
    else if (ad <= hwG + 1) { rgb = gold; a = Math.round(255 * (hwG + 1 - ad) / 2) }
    // cross vertical bar + budded foot (gold, on top of the navy field)
    if (ad <= 16 && y <= 994 && ad <= hwG) rgb = gold, a = 255
    if (inTrefoil(x, y) && ad <= hwG + 1) rgb = gold, a = 255
    if (rgb) {
      if (y >= Y_CUT) put(x, y, rgb, a)
      else {
        // seam zone: blend drawn colour over the (banderole-contaminated) real pixel
        const i = (y * FW + x) * 4
        const ba = (a / 255) * blend
        canvas[i] = Math.round(canvas[i] * (1 - ba) + rgb[0] * ba)
        canvas[i + 1] = Math.round(canvas[i + 1] * (1 - ba) + rgb[1] * ba)
        canvas[i + 2] = Math.round(canvas[i + 2] * (1 - ba) + rgb[2] * ba)
        canvas[i + 3] = Math.max(canvas[i + 3], Math.round(255 * ba))
      }
    }
  }
}

// trim transparent margins
let mMinX = FW, mMaxX = 0, mMinY = H2, mMaxY = 0
for (let y = 0; y < H2; y++) for (let x = 0; x < FW; x++)
  if (canvas[(y * FW + x) * 4 + 3] > 12) {
    if (x < mMinX) mMinX = x; if (x > mMaxX) mMaxX = x
    if (y < mMinY) mMinY = y; if (y > mMaxY) mMaxY = y
  }
const markBuf = await sharp(canvas, { raw: { width: FW, height: H2, channels: 4 } })
  .extract({ left: mMinX, top: mMinY, width: mMaxX - mMinX + 1, height: mMaxY - mMinY + 1 })
  .png().toBuffer()
await sharp(markBuf).toFile(path.join(OUT, 'logo-mark.png'))
const mm = await sharp(markBuf).metadata()
console.log('mark:', mm.width, 'x', mm.height)

// ---- helpers ----
const squarePad = async (buf, pad = 0) => {
  const m = await sharp(buf).metadata()
  const s = Math.round(Math.max(m.width, m.height) * (1 + pad))
  return sharp(buf).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
}
const out = (buf, size, bg) => {
  let p = sharp(buf).resize(size, size, { fit: 'contain', background: bg || { r: 0, g: 0, b: 0, alpha: 0 } })
  if (bg) p = p.flatten({ background: bg })
  return p.png()
}
const CREAM = { r: 247, g: 243, b: 233 }
const markSq = await squarePad(markBuf, 0.06)
const fullSq = await squarePad(fullBuf, 0.04)
// tighter framing for small icons: drop the pointed top of the crown (invisible < 48px
// anyway) so the shield fills the square and stays legible in a browser tab
const topCrop = Math.round(mm.height * 0.24)
const iconBuf = await sharp(markBuf)
  .extract({ left: 0, top: topCrop, width: mm.width, height: mm.height - topCrop })
  .png().toBuffer()
const iconSq = await squarePad(iconBuf, 0.05)

// ---- 7. icons ----
await out(iconSq, 512).toFile(path.join(OUT, 'icon.png'))               // app/icon.png (transparent)
await out(iconSq, 180, CREAM).toFile(path.join(OUT, 'apple-icon.png'))  // app/apple-icon.png (opaque)
await out(iconSq, 192).toFile(path.join(OUT, 'icon-192.png'))           // PWA any
await out(fullSq, 512).toFile(path.join(OUT, 'icon-512.png'))           // PWA any (full lockup)
await sharp(await squarePad(iconBuf, 0.5)).resize(512, 512, { fit: 'contain', background: CREAM })
  .flatten({ background: CREAM }).png().toFile(path.join(OUT, 'maskable-icon-512.png')) // PWA maskable
await out(markSq, 400).toFile(path.join(OUT, 'logo-mark-400.png'))      // header/footer/admin @2-3x
for (const s of [16, 32, 48]) await out(iconSq, s).toFile(path.join(OUT, `favicon-${s}.png`))

// ---- 8. favicon.ico (16/32/48, PNG-compressed) ----
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + dir.length
  const bufs = [header, dir]
  entries.forEach((e, i) => {
    dir.writeUInt8(e.size, i * 16); dir.writeUInt8(e.size, i * 16 + 1)
    dir.writeUInt16LE(1, i * 16 + 4); dir.writeUInt16LE(32, i * 16 + 6)
    dir.writeUInt32LE(e.buf.length, i * 16 + 8); dir.writeUInt32LE(offset, i * 16 + 12)
    offset += e.buf.length; bufs.push(e.buf)
  })
  return Buffer.concat(bufs)
}
const ico = []
for (const s of [16, 32, 48]) ico.push({ size: s, buf: await out(iconSq, s).toBuffer() })
fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(ico))

console.log('done ->', OUT)
