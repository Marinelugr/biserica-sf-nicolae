import { highlightParts } from '@/lib/bible/search'

export interface VerseResultItem { href: string; reference: string; text: string }

interface Props {
  title: string
  summary: string
  items: VerseResultItem[]
  words: string[]
  empty: string
  pager?: { prevHref: string | null; nextHref: string | null; label: string; prev: string; next: string }
}

/** Secțiunea „Versete" din căutarea /biblie?q= — cuvintele găsite evidențiate în textul original. */
export default function VerseResults({ title, summary, items, words, empty, pager }: Props) {
  return (
    <section className="card" aria-labelledby="versete-gasite" data-reveal>
      <div className="sec-head">
        <h2 id="versete-gasite" className="eyebrow" style={{ fontSize: 14 }}>{title}</h2>
        <p className="mute text-[15px]">{summary}</p>
      </div>
      {items.length === 0 ? (
        <p className="mute">{empty}</p>
      ) : (
        <ol className="verse-hits">
          {items.map(h => (
            <li key={h.href}>
              <a href={h.href} rel="nofollow" className="link-gold serif text-[19px]">{h.reference}</a>
              <p className="text-[18px] leading-relaxed">
                {highlightParts(h.text, words).map((part, i) => part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>)}
              </p>
            </li>
          ))}
        </ol>
      )}
      {pager && (pager.prevHref || pager.nextHref) && (
        <nav className="chapter-nav mt-5" aria-label={pager.label}>
          {pager.prevHref ? <a href={pager.prevHref} rel="nofollow" className="btn sm">{pager.prev}</a> : <span />}
          <span className="mute text-[15px]">{pager.label}</span>
          {pager.nextHref ? <a href={pager.nextHref} rel="nofollow" className="btn sm">{pager.next}</a> : <span />}
        </nav>
      )}
    </section>
  )
}
