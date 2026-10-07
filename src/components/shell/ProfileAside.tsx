import Link from 'next/link'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/href'
import { getProfileData } from '@/lib/profile'
import { getScheduleItems } from '@/lib/schedule'
import { socialLinks } from '@/lib/social'
import { SITE_HOST } from '@/lib/site'
import ProfilePhoto from './ProfilePhoto'
import SocialIcon from './SocialIcon'

export const SOCIAL_ANCHOR = 'retele-sociale'
export const FOOTER_SOCIAL_ANCHOR = 'retele-footer'

interface Props {
  variant: 'full' | 'compact'
  /** Pe homepage numele părintelui este titlul paginii (h1). */
  nameAsH1?: boolean
  /** Poza e deasupra pliului (homepage) — o preîncărcăm. */
  preloadPhoto?: boolean
}

/** Conținutul coloanei de profil (în interiorul <aside>). */
export default async function ProfileAside({ variant, nameAsH1, preloadPhoto }: Props) {
  const [t, locale, profile] = await Promise.all([getServerT(), getServerLocale(), getProfileData()])
  const socials = socialLinks(profile.facebook)
  const schedule = getScheduleItems(t)
  const donateHref = localizedHref('/donatii', locale)
  const NameTag = nameAsH1 ? 'h1' : 'p'

  if (variant === 'compact') {
    return (
      <>
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }} data-intro>
          <Link href={localizedHref('/paroh', locale)} className="flex items-center gap-4 group">
            <span className="block shrink-0" style={{ width: 96 }}>
              <ProfilePhoto src={profile.photoUrl} alt={profile.displayName} width={96} compact />
            </span>
            <span className="flex flex-col gap-1 min-w-0">
              <span className="serif text-[24px] font-semibold leading-tight group-hover:text-gold transition-colors">
                {profile.displayName}
              </span>
              <span className="mute text-[15px] leading-snug">{t.shell.profileRole}</span>
            </span>
          </Link>
          <div id={SOCIAL_ANCHOR} className="flex flex-wrap gap-2" aria-label={t.shell.socialTitle} role="group">
            {socials.map(s => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="soc" aria-label={s.label}>
                <SocialIcon name={s.key} size={20} />
              </a>
            ))}
          </div>
          <div className="flex flex-col">
            <p className="eyebrow" style={{ marginBottom: 6 }}>{t.shell.scheduleTitle}</p>
            {schedule.slice(0, 3).map((s, i) => (
              <div key={s.zi} className="flex justify-between gap-3 py-1.5 text-[17px]" style={i < 2 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                <span>{s.zi}</span>
                <span className="gold">{s.ora}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="card profile-card flex flex-col gap-3.5" style={{ padding: 28 }}>
        <span data-intro-photo className="block">
          <ProfilePhoto src={profile.photoUrl} alt={profile.displayName} width={324} preload={preloadPhoto} />
        </span>
        <NameTag className="h-m" style={{ fontSize: 36, marginTop: 4 }} data-intro-text>
          {profile.displayName}
        </NameTag>
        <p className="mute" data-intro-text>{t.shell.profileRole}</p>
        <p className="lead" style={{ fontSize: 21 }} data-intro-text>{profile.lead}</p>
        <p className="gold" style={{ fontSize: 17 }} data-intro-text>{SITE_HOST}</p>
        <div className="flex flex-wrap gap-2.5" data-intro-text>
          <a className="btn gold" href={`#${SOCIAL_ANCHOR}`}>{t.shell.follow}</a>
          <Link className="btn red" href={donateHref}>{t.nav.donate}</Link>
        </div>
      </div>

      <div id={SOCIAL_ANCHOR} className="card aside-extra flex flex-col" style={{ padding: '10px 26px', scrollMarginTop: 'calc(var(--header-h) + 20px)' }}>
        <p className="sr-only">{t.shell.socialTitle}</p>
        {socials.map((s, i) => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:text-gold"
            style={{ minHeight: 52, ...(i < socials.length - 1 ? { borderBottom: '1px solid var(--line)' } : {}) }}
          >
            <span className="flex items-center gap-3">
              <SocialIcon name={s.key} />
              {s.label}
            </span>
            <span className="gold" aria-hidden="true">→</span>
          </a>
        ))}
      </div>

      <div className="card aside-extra flex flex-col gap-1" style={{ padding: '22px 26px' }}>
        <p className="eyebrow">{t.shell.scheduleTitle}</p>
        {schedule.map((s, i) => (
          <div
            key={s.zi}
            className="flex justify-between gap-3 py-2"
            style={i < schedule.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}
          >
            <span>{s.zi} <span className="mute text-[16px]">· {s.slujba}</span></span>
            <span className="gold">{s.ora}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/** Bara orizontală subțire de pe mobil/tabletă pentru varianta compactă. */
export async function ProfileBar() {
  const [t, locale, profile] = await Promise.all([getServerT(), getServerLocale(), getProfileData()])
  return (
    <div className="aside-bar card flex items-center gap-3.5" style={{ padding: 12, borderRadius: 18 }}>
      <Link href={localizedHref('/paroh', locale)} className="flex items-center gap-3.5 min-w-0 flex-1">
        <span className="block shrink-0" style={{ width: 56 }}>
          <ProfilePhoto src={profile.photoUrl} alt="" width={56} compact />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="serif text-[21px] font-semibold leading-tight truncate">{profile.displayName}</span>
          <span className="mute text-[14px] leading-snug truncate">{SITE_HOST}</span>
        </span>
      </Link>
      <a className="btn gold sm shrink-0" href={`#${FOOTER_SOCIAL_ANCHOR}`}>{t.shell.follow}</a>
    </div>
  )
}
