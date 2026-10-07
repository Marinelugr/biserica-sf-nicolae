import Image from 'next/image'
import { getServerT } from '@/lib/i18n/server'
import ProfileAside, { ProfileBar } from './ProfileAside'
import StickyAside from './StickyAside'
import RevealScope from './RevealScope'

interface Props {
  aside: 'full' | 'compact' | 'none'
  children: React.ReactNode
  /** Banner de copertă deasupra (homepage) — aside-ul se suprapune pe el. */
  cover?: boolean
  /** Numele din aside devine h1 (doar pe homepage). */
  nameAsH1?: boolean
}

/**
 * Cadrul „Profil și flux": coloana de profil în stânga (sticky pe desktop),
 * fluxul de conținut în dreapta. Sub 1024px: `full` → cardul de profil
 * deasupra conținutului (rețelele și programul după el); `compact` → bară
 * orizontală subțire; `none` → doar fluxul, pe toată lățimea.
 */
export default async function PageShell({ aside, children, cover, nameAsH1 }: Props) {
  const t = await getServerT()
  const coverEl = cover ? (
    <div className="cover">
      <Image src="/images/12.jpg" alt={t.shell.coverAlt} fill sizes="100vw" preload quality={75} style={{ objectFit: 'cover', objectPosition: '50% 40%' }} />
    </div>
  ) : null

  if (aside === 'none') {
    return (
      <>
        {coverEl}
        <RevealScope className="shell no-aside">
          <div className="shell-flow">{children}</div>
        </RevealScope>
      </>
    )
  }

  return (
    <>
      {coverEl}
      <RevealScope className={`shell aside-${aside} ${cover ? 'with-cover' : ''}`}>
        {aside === 'compact' && <ProfileBar />}
        <div className="shell-row">
          <StickyAside label={t.shell.brand} className={aside === 'compact' ? 'desktop-only' : ''}>
            <ProfileAside variant={aside} nameAsH1={nameAsH1} preloadPhoto={cover} />
          </StickyAside>
          <div className="shell-flow">{children}</div>
        </div>
      </RevealScope>
    </>
  )
}
