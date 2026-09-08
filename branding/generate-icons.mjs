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

// ---- 6. no-text mark: crop crown+shield, drop banderole ----
const markCropH = Math.round(fH * 0.762)
// recompute horizontal bbox within the cropped region
const { data: fd, info: fi } = await sharp(fullBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
let mMinX = fW, mMaxX = 0, mMaxY = 0
for (let y = 0; y < markCropH; y++) for (let x = 0; x < fW; x++) {
  if (fd[(y * fW + x) * 4 + 3] > 12) { if (x < mMinX) mMinX = x; if (x > mMaxX) mMaxX = x; if (y > mMaxY) mMaxY = y }
}
const markBuf = await sharp(fullBuf)
  .extract({ left: mMinX, top: 0, width: mMaxX - mMinX + 1, height: Math.min(markCropH, mMaxY + 1) })
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

// ---- 7. icons ----
await out(markSq, 512).toFile(path.join(OUT, 'icon.png'))               // app/icon.png (transparent)
await out(markSq, 180, CREAM).toFile(path.join(OUT, 'apple-icon.png'))  // app/apple-icon.png (opaque)
await out(markSq, 192).toFile(path.join(OUT, 'icon-192.png'))           // PWA any
await out(fullSq, 512).toFile(path.join(OUT, 'icon-512.png'))           // PWA any (full lockup)
await sharp(await squarePad(markBuf, 0.5)).resize(512, 512, { fit: 'contain', background: CREAM })
  .flatten({ background: CREAM }).png().toFile(path.join(OUT, 'maskable-icon-512.png')) // PWA maskable
await out(markSq, 400).toFile(path.join(OUT, 'logo-mark-400.png'))      // header/footer/admin @2-3x
for (const s of [16, 32, 48]) await out(markSq, s).toFile(path.join(OUT, `favicon-${s}.png`))

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
for (const s of [16, 32, 48]) ico.push({ size: s, buf: await out(markSq, s).toBuffer() })
fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(ico))

console.log('done ->', OUT)
