import Image from 'next/image'

interface Props {
  src: string
  alt: string
  /** Lățimea maximă afișată (px), pentru `sizes`. */
  width: number
  compact?: boolean
  preload?: boolean
  className?: string
}

/**
 * Poza părintelui — dreptunghi rotunjit 4:5 (22px, compact 14px), bordură aurie,
 * fața în treimea de sus (object-position 50% 18%). Niciodată cerc sau arc.
 * Căile locale (`/…`) trec prin next/image; URL-urile din DB pot fi pe gazde
 * care nu sunt în `remotePatterns`, deci folosesc <img> simplu.
 */
export default function ProfilePhoto({ src, alt, width, compact, preload, className = '' }: Props) {
  const height = Math.round((width * 5) / 4)
  return (
    <span className={`portrait ${compact ? 'sm' : ''} ${className}`} data-portrait>
      {src.startsWith('/') ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${width}px`}
          preload={preload}
          style={{ objectFit: 'cover', objectPosition: '50% 18%' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- gazda pozei din DB poate lipsi din remotePatterns (next.config.ts nu se modifică)
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          loading={preload ? 'eager' : 'lazy'}
          fetchPriority={preload ? 'high' : undefined}
        />
      )}
    </span>
  )
}
