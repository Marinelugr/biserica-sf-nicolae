import FeedCard from '@/components/shell/FeedCard'

interface AnnouncementCardProps {
  titlu: string
  mesaj: string
  linkArticol?: string | null
  author: string
  kicker: string
  /** Textul butonului spre articol („Citește anunțul"). */
  moreLabel: string
}

/**
 * Anunțul programabil din admin, ca postare în flux (identitatea `anunt`:
 * roșu închis, margine stângă groasă, clopoțel). Dacă `linkArticol` e
 * completat, apare un buton spre acel articol.
 */
export default function AnnouncementCard({ titlu, mesaj, linkArticol, author, kicker, moreLabel }: AnnouncementCardProps) {
  return (
    <FeedCard kind="parohie" sec="anunt" kicker={kicker} author={author}>
      <div className="flex flex-col gap-3 min-w-0">
        <p className="anunt-title">{titlu}</p>
        <p className="anunt-text">{mesaj}</p>
        {linkArticol && (
          <a href={linkArticol} className="btn self-start">{moreLabel}</a>
        )}
      </div>
    </FeedCard>
  )
}
