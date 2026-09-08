import type { ChurchLifeCard } from '@/lib/externalFeeds'

/**
 * „Din viața Bisericii" — replică a widget-ului de pe
 * protopopiatul-criuleni-dubasari.md: două carduri, unul lângă altul pe
 * desktop, stivuite pe mobil. Fiecare card = un articol preluat automat de pe
 * un site sursă (mitropolia.md / protopopiatul-criuleni-dubasari.md):
 *   - pastilă cu domeniul sursă + iconiță link extern, deasupra imaginii;
 *   - imagine (sau variantă text-only dacă sursa nu oferă imagine);
 *   - titlu, dată, link „Citește pe site-ul sursă →".
 *
 * Structura/layout-ul cardurilor e preluat de pe sursă; paleta e cea a
 * parohiei (Cobalt v3, accente aurii #C9A84C).
 *
 * Dacă `cards` e gol, secțiunea nu se randează (degradare grațioasă —
 * fetch-ul propriu-zis + cache-ul sunt în src/lib/externalFeeds.ts).
 */
export default function ChurchLifeSection({ cards }: { cards: ChurchLifeCard[] }) {
  if (!cards.length) return null

  return (
    <section style={{ width: '100%', padding: '4rem 1rem', position: 'relative', zIndex: 2 }}>
      <style>{`
        .church-life-card { transition: transform 0.25s ease, border-color 0.25s ease; }
        .church-life-card:hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.5); }
        .church-life-card:hover .church-life-img { transform: scale(1.04); }
        .church-life-card:hover .church-life-arrow { transform: translateX(3px); }
        .church-life-pill:hover { background: #B89A44; }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p
            className="font-body"
            style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#828EA8', marginBottom: '0.35rem' }}
          >
            Împreună în rugăciune
          </p>
          <h2 className="font-heading" style={{ fontSize: '2rem', color: '#E9EFFA', margin: 0 }}>
            <span aria-hidden="true" style={{ color: '#C9A84C', marginRight: '0.4rem' }}>✝</span>
            Din viața Bisericii
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'stretch',
          }}
        >
          {cards.map(card => (
            <div key={card.sourceUrl} style={{ display: 'flex', flexDirection: 'column' }}>
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="church-life-pill font-body"
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.85rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  background: '#C9A84C',
                  color: '#0D0905',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease',
                }}
              >
                {card.sourceName}
                <span aria-hidden="true" style={{ fontSize: '0.8rem', lineHeight: 1 }}>↗</span>
              </a>

              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="church-life-card glass-cobalt"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderLeft: card.image ? undefined : '3px solid #C9A84C',
                }}
              >
                {card.image && (
                  <div style={{ height: '190px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
                    {/* <img> simplu, nu next/image — imaginile vin de pe domenii externe (mitropolia.md / protopopiatul-criuleni-dubasari.md) neconfigurate în next.config */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="church-life-img"
                      src={card.image}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.15rem 1.25rem', flex: 1 }}>
                  <p
                    className="font-body"
                    style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C06050', margin: 0 }}
                  >
                    {card.sourceLabel}
                  </p>
                  <h3
                    className="font-heading"
                    style={{ fontSize: '1.15rem', fontWeight: 600, color: '#E9EFFA', lineHeight: 1.4, margin: 0 }}
                  >
                    {card.title}
                  </h3>
                  {card.date && (
                    <span className="font-body" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#C9A84C' }}>
                      📅 {card.date}
                    </span>
                  )}
                  <span
                    className="font-body"
                    style={{ marginTop: 'auto', paddingTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: '#C9A84C' }}
                  >
                    Citește pe site-ul sursă
                    <span className="church-life-arrow" aria-hidden="true" style={{ transition: 'transform 0.2s ease' }}>↗</span>
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
