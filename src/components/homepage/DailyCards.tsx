import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import FeedCard, { type FeedKind } from '@/components/shell/FeedCard'

interface DailyData {
  saints: string[]
  gospel: { reference: string; text: string }
  prayer: { title: string; text: string; slug: string | null; day: string }
}

interface DailyCardsProps {
  data: DailyData
  enabled: Record<string, boolean>
  order: string[]
}

/** Sfinții / Evanghelia / Rugăciunea zilei — câte o postare, în ordinea și activarea din admin. */
export default async function DailyCards({ data, enabled, order }: DailyCardsProps) {
  const t = await getServerT()
  const allCards: { key: string; kind: FeedKind; label: string; content: React.ReactNode; link: string; linkLabel: string }[] = [
    {
      key: 'sfintii_zilei',
      kind: 'cuvant',
      label: t.home.saintsToday,
      content: (
        <div>
          {data.saints.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.saints.slice(0, 3).map((saint, i) => (
                <li key={i} className="text-[19px] leading-snug flex gap-2.5">
                  <span className="gold" aria-hidden="true">✦</span>
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
      label: t.home.gospelToday,
      content: (
        <div className="flex flex-col gap-2">
          <p className="eyebrow">{data.gospel.reference}</p>
          <p className="lead" style={{ fontSize: 23 }}>
            &ldquo;{data.gospel.text}&rdquo;
          </p>
        </div>
      ),
      link: '/biblie',
      linkLabel: t.home.readFullGospel,
    },
    {
      key: 'rugaciunea_zilei',
      kind: 'biblioteca',
      label: t.home.prayerToday,
      content: (
        <div className="flex flex-col gap-1.5">
          <p className="kicker blue">{data.prayer.day}</p>
          <p className="h-s">{data.prayer.title}</p>
          <p className="italic leading-relaxed line-clamp-3" style={{ color: '#e3dccb' }}>
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
        <FeedCard key={card.key} kind={card.kind} kicker={card.label} author={t.shell.brand}>
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
