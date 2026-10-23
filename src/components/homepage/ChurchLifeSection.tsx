import type { ChurchLifeCard } from '@/lib/externalFeeds'
import SectionPanel from '@/components/shell/SectionPanel'

/**
 * „Din viața Bisericii" — un panou cu chenar punctat (sursă externă), cu câte
 * un rând plat pentru fiecare articol preluat automat de pe un site sursă
 * (mitropolia.md / protopopiatul-criuleni-dubasari.md): insigna sursei,
 * imagine (dacă există), kicker, titlu, dată, link extern.
 *
 * Dacă `cards` e gol, secțiunea nu se randează (degradare grațioasă —
 * fetch-ul propriu-zis + cache-ul sunt în src/lib/externalFeeds.ts).
 */
export default function ChurchLifeSection({ cards }: { cards: ChurchLifeCard[] }) {
  if (!cards.length) return null

  return (
    <SectionPanel sec="biserica" kind="parohie" headingId="sec-biserica" eyebrow="Împreună în rugăciune" title="Din viața Bisericii">
      {cards.map(card => (
        <article key={card.sourceUrl} className="sec-row">
          {card.image && (
            <div className="thumb">
              {/* <img> simplu, nu next/image — imaginile vin de pe domenii externe (mitropolia.md / protopopiatul-criuleni-dubasari.md) neconfigurate în next.config */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="kicker">{card.sourceLabel}</span>
              <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="src-badge">
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
    </SectionPanel>
  )
}
