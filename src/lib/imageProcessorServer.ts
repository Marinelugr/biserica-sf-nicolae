import sharp from 'sharp'

// Server-side (Node/sharp) counterpart to imageOptimizer.ts (browser/Canvas).
// Runs on every upload through /api/admin/upload — the single funnel used by
// MediaGallery, ImageUploadButton and the retroactive recompress script — so
// it's the one place that guarantees a compressed, correctly-oriented result
// regardless of what the client sent (already-optimized WebP, a raw phone
// photo, or a file fetched directly by the retro script).
export const MAX_DIMENSION = 2000
const WEBP_QUALITY = 80

// Vector/animated formats: resizing+recompressing them the same way as
// photos either breaks them (GIF animation collapses to one frame under
// sharp unless explicitly kept animated) or makes no sense (SVG is already
// tiny and resolution-independent). Store as-is.
const SKIP_TYPES = new Set(['image/svg+xml', 'image/gif'])

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export function extFromContentType(contentType: string): string {
  return EXT_BY_CONTENT_TYPE[contentType] || 'jpg'
}

export interface ProcessedImage {
  buffer: Buffer
  contentType: string
  ext: string
  originalSize: number
  finalSize: number
  wasOptimized: boolean
}

export async function processImageBuffer(input: Buffer, contentType: string): Promise<ProcessedImage> {
  const originalSize = input.length

  if (SKIP_TYPES.has(contentType)) {
    return { buffer: input, contentType, ext: extFromContentType(contentType), originalSize, finalSize: originalSize, wasOptimized: false }
  }

  try {
    const optimized = await sharp(input, { failOn: 'none' })
      .rotate() // aplică orientarea EXIF (poze verticale de telefon) apoi o "coace" în pixeli
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    if (optimized.length >= originalSize) {
      // deja mai mic/egal (ex. rulare a doua oară pe un fișier deja optimizat) — păstrăm originalul
      return { buffer: input, contentType, ext: extFromContentType(contentType), originalSize, finalSize: originalSize, wasOptimized: false }
    }

    return { buffer: optimized, contentType: 'image/webp', ext: 'webp', originalSize, finalSize: optimized.length, wasOptimized: true }
  } catch {
    // format neprocesabil de build-ul curent de sharp (ex. unele variante HEIC) — păstrăm originalul
    return { buffer: input, contentType, ext: extFromContentType(contentType), originalSize, finalSize: originalSize, wasOptimized: false }
  }
}
