interface AnnouncementCardProps {
  titlu: string
  mesaj: string
  linkArticol?: string | null
}

const CARD_STYLE: React.CSSProperties = {
  borderRadius: '20px',
  background: 'linear-gradient(160deg, rgba(139, 26, 26, 0.22), rgba(139, 26, 26, 0.10))',
  border: '1px solid rgba(139, 26, 26, 0.55)',
  boxShadow: '0 8px 32px rgba(139, 26, 26, 0.18)',
}

/**
 * Cardul de anunț afișat lângă banda cu data curentă pe homepage.
 * Stil evidențiat cu roșul folosit la Donații / Susține Biserica (#8B1A1A),
 * spre deosebire de restul cardurilor bleumarin din secțiune.
 *
 * Dacă `linkArticol` e completat, tot cardul devine link către acel articol;
 * altfel rămâne un simplu container, needitabil.
 */
export default function AnnouncementCard({ titlu, mesaj, linkArticol }: AnnouncementCardProps) {
  const inner = (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '999px',
          background: 'rgba(139, 26, 26, 0.28)',
          border: '1px solid rgba(139, 26, 26, 0.55)',
        }}
      >
        {/* clopoțel */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0C9C4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <div className="min-w-0">
        <p
          className="font-body text-[0.7rem] tracking-[0.22em] uppercase mb-1"
          style={{ color: '#E0908A' }}
        >
          Anunț
        </p>
        <p
          className="font-heading text-xl sm:text-2xl leading-snug mb-2"
          style={{ color: '#F7EFEE' }}
        >
          {titlu}
        </p>
        <p className="font-body text-sm sm:text-base leading-relaxed" style={{ color: '#E9D9D7' }}>
          {mesaj}
        </p>
      </div>
    </div>
  )

  if (linkArticol) {
    return (
      <a
        href={linkArticol}
        className="block p-6 sm:p-8 h-full transition-opacity hover:opacity-90"
        style={{ ...CARD_STYLE, textDecoration: 'none' }}
      >
        {inner}
      </a>
    )
  }

  return (
    <div className="block p-6 sm:p-8 h-full" style={CARD_STYLE}>
      {inner}
    </div>
  )
}
