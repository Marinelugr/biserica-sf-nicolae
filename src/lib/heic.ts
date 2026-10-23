// Pozele de iPhone (HEIC/HEIF, codec HEVC) nu se pot decoda nici în Chrome (canvas),
// nici de sharp pe server (binarele precompilate n-au HEVC). Le convertim în browser
// cu heic-to (WASM, ~3 MB), încărcat doar când chiar apare un HEIC.

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

// Unele browsere dau `type` gol pentru .heic, deci ne uităm și la extensie.
export function isHeic(file: { name: string; type: string }): boolean {
  return HEIC_TYPES.has(file.type.toLowerCase()) || /\.hei[cf]$/i.test(file.name)
}

export function heicErrorMessage(name: string): string {
  return `Poza ${name} este în format HEIC și nu a putut fi convertită. Exportă-o ca JPG din Fotografii (Fișier → Exportă) și încearcă din nou.`
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const { heicTo } = await import('heic-to')
    const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 })
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
  } catch {
    throw new Error(heicErrorMessage(file.name))
  }
}
