import FeedCard from '@/components/shell/FeedCard'

interface AnnouncementCardProps {
  titlu: string
  mesaj: string
  linkArticol?: string | null
  author: string
  kicker: string
}

/**
 * Anunțul programabil din admin, ca postare în flux (accent roșu, ca la Donații).
 * Dacă `linkArticol` e completat, titlul devine link către acel articol.
 */
export default function AnnouncementCard({ titlu, mesaj, linkArticol, author, kicker }: AnnouncementCardProps) {
  return (
    <FeedCard kind="parohie" kicker={kicker} author={author} className="red-grad">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(155, 28, 28, 0.35)', border: '1px solid rgba(229, 138, 138, 0.5)' }}
        >
          {/* clopoțel */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4D3CF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </span>
        <div className="min-w-0 flex flex-col gap-2">
          <p className="kicker" style={{ color: '#f2b0aa' }}>Anunț</p>
          {linkArticol ? (
            <a href={linkArticol} className="h-s hover:text-gold transition-colors">{titlu}</a>
          ) : (
            <p className="h-s">{titlu}</p>
          )}
          <p className="text-[18px] leading-relaxed" style={{ color: '#f1e3e0' }}>{mesaj}</p>
        </div>
      </div>
    </FeedCard>
  )
}
