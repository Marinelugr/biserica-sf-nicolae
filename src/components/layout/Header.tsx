'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n, type Locale } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/href'
import { untranslatePath } from '@/lib/i18n/slugs'
import { useLiveStatus } from '@/lib/hooks/useLiveStatus'

const LOCALES: Locale[] = ['ro', 'ru', 'en']

function LocaleSwitcher({ locale, onChange, fontSize = '13px' }: { locale: Locale; onChange: (l: Locale) => void; fontSize?: string }) {
  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center">
          <button
            onClick={() => onChange(l)}
            className="font-body uppercase transition-opacity duration-200 hover:opacity-100"
            style={{
              color: '#C9A84C',
              opacity: locale === l ? 1 : 0.6,
              fontSize,
              fontWeight: locale === l ? 700 : 400,
              letterSpacing: '0.03em',
              textDecoration: locale === l ? 'underline' : 'none',
              textUnderlineOffset: '3px',
            }}
            aria-pressed={locale === l}
            aria-label={`Limba ${l.toUpperCase()}`}
          >
            {l.toUpperCase()}
          </button>
          {i < LOCALES.length - 1 && (
            <span style={{ color: '#C9A84C', opacity: 0.3, fontSize: '11px', margin: '0 3px' }}>|</span>
          )}
        </span>
      ))}
    </div>
  )
}

function DonateButton({ href, label, compact = false, block = false, onClick }: { href: string; label: string; compact?: boolean; block?: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`font-body whitespace-nowrap rounded border transition-all duration-200 hover:bg-red-950 ${block ? 'block text-center' : ''}`}
      style={{
        color: '#C06050',
        borderColor: '#6B1A1A',
        fontSize: block ? '1.05rem' : compact ? '12px' : '16px',
        borderWidth: '1.5px',
        padding: block ? '0.75rem 1rem' : compact ? '0.3rem 0.7rem' : '0.5rem 1rem',
      }}
    >
      {label}
    </Link>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, locale } = useI18n()
  const isLive = useLiveStatus()?.isLive ?? false

  function changeLocale(l: Locale) {
    if (l === locale) return
    const currentPath = window.location.pathname
    const localizedRest = currentPath.replace(/^\/(ro|ru|en)(?=\/|$)/, '') || '/'
    const canonicalPath = untranslatePath(localizedRest, locale)
    window.location.href = localizedHref(canonicalPath, l)
  }

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/biblie', label: t.nav.bible },
    { href: '/calendar', label: t.nav.calendar },
    { href: '/calendar-pascal', label: t.nav.pascalCalendar },
    { href: '/carti', label: t.nav.books },
    { href: '/video', label: t.nav.video },
    { href: '/stiri', label: t.nav.news },
    { href: '/istoria-bisericii', label: t.nav.churchHistory },
    { href: '/sfantul-nicolae', label: t.nav.saintNicholas },
    { href: '/paroh', label: t.nav.priest },
    { href: '/magazin', label: t.nav.shop },
    { href: '/contact', label: t.nav.contact },
  ].map(link => ({ ...link, href: localizedHref(link.href, locale) }))

  const liveHref = localizedHref('/live', locale)
  const donateHref = localizedHref('/donatii', locale)
  const homeHref = localizedHref('/', locale)

  return (
    <header
      style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">

          {/* Logo — DOAR cruce + titlu — stânga */}
          <Link href={homeHref} className="flex items-center gap-2 shrink-0 group xl:absolute xl:left-0" aria-label="Acasă">
            <span
              aria-hidden="true"
              style={{ color: '#C9A84C', fontSize: '26px', lineHeight: 1 }}
            >
              ☦
            </span>
            <span
              className="font-heading font-semibold leading-none whitespace-nowrap hidden xl:inline 2xl:hidden"
              style={{ color: '#C9A84C', fontSize: '15px', fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              Sf. Ierarh Nicolae
            </span>
            <span
              className="font-heading font-semibold leading-none whitespace-nowrap xl:hidden 2xl:inline"
              style={{ color: '#C9A84C', fontSize: '18px', fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              Sfântul Ierarh Nicolae
            </span>
          </Link>

          {/* Nav desktop — centrat, doar >=1280px */}
          <nav className="hidden xl:flex items-center gap-2.5 mx-auto min-w-0">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body whitespace-nowrap transition-colors duration-200 hover:text-amber-400"
                style={{ color: '#9B8050', fontSize: '12px' }}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href={liveHref}
              className="font-body whitespace-nowrap flex items-center gap-1 transition-colors duration-200 hover:text-amber-400"
              style={{ color: '#9B8050', fontSize: '12px' }}
            >
              {t.nav.live}
              {isLive && (
                <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.6rem' }} aria-label="LIVE">●</span>
              )}
            </Link>
          </nav>

          {/* Donații + Limbi — dreapta, doar >=1280px */}
          <div className="hidden xl:flex items-center gap-3 xl:absolute xl:right-0">
            <DonateButton href={donateHref} label={t.nav.donate} compact />
            <div className="border-l pl-3 shrink-0" style={{ borderColor: '#2A1A0A' }}>
              <LocaleSwitcher locale={locale} onChange={changeLocale} fontSize="12px" />
            </div>
          </div>

          {/* Bara tabletă (768–1280px): Donații + Limbi rămân vizibile, restul intră în hamburger */}
          <div className="hidden md:flex xl:hidden items-center gap-3 ml-auto">
            <DonateButton href={donateHref} label={t.nav.donate} compact />
            <div className="border-l pl-3" style={{ borderColor: '#2A1A0A' }}>
              <LocaleSwitcher locale={locale} onChange={changeLocale} fontSize="12px" />
            </div>
          </div>

          {/* Hamburger — vizibil sub 1280px */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="xl:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 shrink-0 ml-auto"
            aria-label="Meniu"
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-0.5 transition-all duration-300"
              style={{ backgroundColor: '#9B8050', transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none' }} />
            <span className="block w-5 h-0.5 transition-all duration-300"
              style={{ backgroundColor: '#9B8050', opacity: menuOpen ? 0 : 1 }} />
            <span className="block w-5 h-0.5 transition-all duration-300"
              style={{ backgroundColor: '#9B8050', transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Overlay meniu — tabletă + mobil (sub 1280px) */}
      {menuOpen && (
        <div
          className="xl:hidden fixed inset-0 overflow-y-auto"
          style={{ backgroundColor: '#0A0704', top: '64px', zIndex: 60 }}
        >
          <nav className="flex flex-col gap-1 px-4 py-4 max-w-md mx-auto md:max-w-lg">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body py-3.5 px-3 rounded transition-colors hover:bg-stone-900"
                style={{ color: '#C9A84C', fontSize: '1.1rem' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={liveHref}
              onClick={() => setMenuOpen(false)}
              className="font-body py-3.5 px-3 rounded transition-colors hover:bg-stone-900 flex items-center gap-2"
              style={{ color: '#C9A84C', fontSize: '1.1rem' }}
            >
              {t.nav.live}
              {isLive && (
                <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.75rem' }} aria-label="LIVE">●</span>
              )}
            </Link>

            {/* Donații + Limbi — doar sub 768px (pe tabletă sunt deja vizibile în bară) */}
            <div className="md:hidden mt-3 px-3">
              <DonateButton
                href={donateHref}
                label={t.nav.donate}
                block
                onClick={() => setMenuOpen(false)}
              />
            </div>
            <div className="md:hidden flex items-center gap-3 px-3 pt-4 pb-2">
              <span className="font-body" style={{ color: '#9B8050', fontSize: '0.85rem' }}>Limbă:</span>
              <LocaleSwitcher locale={locale} onChange={changeLocale} fontSize="1rem" />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
