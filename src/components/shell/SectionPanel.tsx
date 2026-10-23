import type { SecId } from '@/lib/sectionTheme'
import { SEC_ICON } from '@/lib/sectionTheme'
import type { FeedKind } from './FeedCard'
import { SectionMedal } from './SectionIcon'

interface Props {
  sec: SecId
  kind: FeedKind
  /** id-ul titlului (aria-labelledby). */
  headingId: string
  eyebrow?: React.ReactNode
  title: React.ReactNode
  /** Linkul din dreapta antetului („Toate →"). */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * O secțiune de grup din flux (Știri, Bibliotecă, Din viața Bisericii): un singur
 * panou cu antetul înăuntru; rândurile din interior sunt plate. `data-kind` și
 * `data-reveal` stau pe panou, ca filtrele și animația să-l trateze ca un întreg.
 */
export default function SectionPanel({ sec, kind, headingId, eyebrow, title, action, children, className = '' }: Props) {
  return (
    <section className={`panel ${className}`} data-sec={sec} data-kind={kind} data-reveal aria-labelledby={headingId}>
      <header className="sec-head">
        <SectionMedal name={SEC_ICON[sec]} />
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={headingId} className="h-m sec-title">{title}</h2>
        </div>
        {action}
        <span className="sec-rule" aria-hidden="true" />
      </header>
      {children}
    </section>
  )
}
