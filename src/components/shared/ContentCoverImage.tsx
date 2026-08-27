'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  /** Înălțimea maximă a casetei, pentru ambele orientări. */
  maxHeight?: string
}

/**
 * Container pentru imaginea principală a unui articol/carte/sfânt.
 *
 * Problema rezolvată: containerul avea lățime 100% fixă + fundal auriu/crem,
 * gândit pentru imagini de tip peisaj. La o imagine portret (verticală),
 * object-fit: contain o micșora ca să încapă în lățime, lăsând fundalul auriu
 * vizibil ca "chenar" în stânga/dreapta imaginii.
 *
 * Fix: detectăm orientarea reală la încărcare (naturalWidth vs naturalHeight)
 * și comutăm layout-ul — portret nu mai forțează lățimea 100% și nu mai
 * afișează fundalul, ci ocupă natural spațiul vertical disponibil, centrat.
 */
export default function ContentCoverImage({
  src,
  alt,
  className,
  priority,
  sizes = '(max-width: 768px) 100vw, 768px',
  maxHeight = '70vh',
}: Props) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait' | null>(null)
  const isPortrait = orientation === 'portrait'

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        maxHeight,
        // Fundalul auriu/crem rămâne doar pentru peisaj (unde e nevoie de el ca
        // "letterbox" discret); pentru portret e transparent, ca să nu mai apară
        // chenarul lateral.
        backgroundColor: isPortrait ? 'transparent' : '#F2EBD9',
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        sizes={sizes}
        priority={priority}
        onLoad={e => {
          const img = e.currentTarget
          setOrientation(img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape')
        }}
        style={
          isPortrait
            ? { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight, objectFit: 'contain' }
            : { width: '100%', height: 'auto', maxHeight, objectFit: 'contain' }
        }
      />
    </div>
  )
}
