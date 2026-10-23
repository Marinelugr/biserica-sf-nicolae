import Link from 'next/link'
import type { Translations } from '@/lib/i18n/ro'
import type { SecId } from '@/lib/sectionTheme'
import FeedCard, { type FeedKind } from '@/components/shell/FeedCard'
import { StarIcon } from '@/components/shell/SectionIcon'

export interface DailyData {
  saints: string[]
  gospel: { reference: string; text: string }
  prayer: { title: string; text: string; slug: string | null; day: string }
}

export interface DailyCardsViewProps {
  data: DailyData
  enabled: Record<string, boolean>
  order: string[]
  t: Translations
}

/** Sfinții / Evanghelia / Rugăciunea zilei — prezentare pură, câte o identitate pe card. */
export default function DailyCardsView({ data, enabled, order, t }: DailyCardsViewProps) {
  const allCards: { key: string; kind: FeedKind; sec: SecId; label: string; content: React.ReactNode; link: string; linkLabel: string }[] = [
    {
      key: 'sfintii_zilei',
      kind: 'cuvant',
      sec: 'sfinti',
      label: t.home.saintsToday,
      content: (
        <div>
          {data.saints.length > 0 ? (
            <ul className="star-list">
              {data.saints.slice(0, 3).map((saint, i) => (
                <li key={i}>
                  <StarIcon />
                  <span>{saint}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mute italic">{t.home.noSaints}</p>
          )}
          {data.saints.length > 3 && (
            <Link href="/sfintii" className="link-gold inline-block mt-3 text-[17px]">
              {t.home.allSaintsLink}
            </Link>
          )}
        </div>
      ),
      link: '/sfintii',
      linkLabel: '',
    },
    {
      key: 'evanghelia_zilei',
      kind: 'cuvant',
      sec: 'evanghelie',
      label: t.home.gospelToday,
      content: (
        <div className="flex flex-col gap-2">
          <p className="eyebrow">{data.gospel.reference}</p>
          <p className="rubric">{data.gospel.text}</p>
        </div>
      ),
      link: '/biblie',
      linkLabel: t.home.readFullGospel,
    },
    {
      key: 'rugaciunea_zilei',
      kind: 'biblioteca',
      sec: 'rugaciune',
      label: t.home.prayerToday,
      content: (
        <div className="prayer">
          <p className="kicker">{data.prayer.day}</p>
          <p className="h-s">{data.prayer.title}</p>
          <p className="italic leading-relaxed line-clamp-3">
            {data.prayer.text}
          </p>
        </div>
      ),
      link: data.prayer.slug ? `/carti/${data.prayer.slug}` : '/carti',
      linkLabel: t.home.readFullPrayer,
    },
  ]

  const cards = allCards
    .filter(card => enabled[card.key] !== false)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  if (cards.length === 0) return null

  return (
    <>
      {cards.map(card => (
        <FeedCard key={card.key} kind={card.kind} sec={card.sec} kicker={card.label}>
          <h2 className="sr-only">{card.label}</h2>
          {card.content}
          {card.linkLabel && (
            <Link href={card.link} className="link-gold inline-block mt-4 text-[17px]">
              {card.linkLabel}
            </Link>
          )}
        </FeedCard>
      ))}
    </>
  )
}
