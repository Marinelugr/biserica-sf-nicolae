const MAX_DIMENSION = 1920
const THUMBNAIL_DIMENSION = 480
const WEBP_QUALITY = 0.82
const THUMB_QUALITY = 0.78

export interface OptimizeResult {
  blob: Blob
  thumbnailBlob: Blob
  originalSize: number
  optimizedSize: number
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function resizeCanvas(img: HTMLImageElement, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let { width, height } = img
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) { reject(new Error('Canvas 2D not supported')); return }
    ctx.drawImage(img, 0, 0, width, height)
    canvas.toBlob(
      blob => { if (blob) resolve(blob); else reject(new Error('Canvas toBlob failed')) },
      'image/webp',
      quality
    )
  })
}

export async function optimizeImage(file: File): Promise<OptimizeResult> {
  const originalSize = file.size
  const url = URL.createObjectURL(file)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })

    const [blob, thumbnailBlob] = await Promise.all([
      resizeCanvas(img, MAX_DIMENSION, WEBP_QUALITY),
      resizeCanvas(img, THUMBNAIL_DIMENSION, THUMB_QUALITY),
    ])

    return { blob, thumbnailBlob, originalSize, optimizedSize: blob.size }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function blobToFile(blob: Blob, name: string): File {
  const baseName = name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
}
