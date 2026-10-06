import type { ChurchLifeCard } from '@/lib/externalFeeds'

/**
 * „Din viața Bisericii" — câte un rând în flux pentru fiecare articol preluat
 * automat de pe un site sursă (mitropolia.md / protopopiatul-criuleni-dubasari.md):
 * pastilă cu domeniul sursă, imagine (dacă există), kicker, titlu, dată, link extern.
 *
 * Dacă `cards` e gol, secțiunea nu se randează (degradare grațioasă —
 * fetch-ul propriu-zis + cache-ul sunt în src/lib/externalFeeds.ts).
 */
export default function ChurchLifeSection({ cards }: { cards: ChurchLifeCard[] }) {
  if (!cards.length) return null

  return (
    <>
      <div className="sec-head" style={{ marginTop: 18, marginBottom: 2 }} data-kind="parohie">
        <div>
          <p className="eyebrow">Împreună în rugăciune</p>
          <h2 className="h-m">
            <span aria-hidden="true" className="gold" style={{ marginRight: '0.4rem' }}>✝</span>
            Din viața Bisericii
          </h2>
        </div>
      </div>
      {cards.map(card => (
        <article key={card.sourceUrl} className="card news-row" data-kind="parohie" data-reveal>
          {card.image && (
            <div className="thumb">
              {/* <img> simplu, nu next/image — imaginile vin de pe domenii externe (mitropolia.md / protopopiatul-criuleni-dubasari.md) neconfigurate în next.config */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1" style={card.image ? undefined : { padding: '6px 10px' }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="kicker">{card.sourceLabel}</span>
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[14px] mute hover:text-gold transition-colors"
              >
                {card.sourceName}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <h3 className="h-s">
              <a href={card.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                {card.title}
              </a>
            </h3>
            <span className="flex flex-wrap items-center gap-x-3 text-[16px]">
              {card.date && <span className="date">{card.date}</span>}
              <a href={card.url} target="_blank" rel="noopener noreferrer" className="link-gold">
                Citește pe site-ul sursă <span aria-hidden="true">↗</span>
              </a>
            </span>
          </div>
        </article>
      ))}
    </>
  )
}
