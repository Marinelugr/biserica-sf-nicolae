'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n, type Locale } from '@/lib/i18n/context'

const LOCALES: Locale[] = ['ro', 'ru', 'en']

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, locale, setLocale } = useI18n()

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/biblie', label: t.nav.bible },
    { href: '/calendar', label: t.nav.calendar },
    { href: '/carti', label: t.nav.books },
    { href: '/istoria-bisericii', label: t.nav.churchHistory },
    { href: '/sfantul-nicolae', label: t.nav.saintNicholas },
    { href: '/paroh', label: t.nav.priest },
    { href: '/video', label: t.nav.video },
    { href: '/magazin', label: t.nav.shop },
  ]

  return (
    <header
      style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — DOAR cruce + titlu */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Acasă">
            <span
              aria-hidden="true"
              style={{ color: '#C9A84C', fontSize: '26px', lineHeight: 1 }}
            >
              ☦
            </span>
            <span
              className="font-heading font-semibold leading-none"
              style={{ color: '#C9A84C', fontSize: '18px', fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              Sfântul Ierarh Nicolae
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-5 ml-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body whitespace-nowrap transition-colors duration-200 hover:text-amber-400"
                style={{ color: '#9B8050', fontSize: '16px' }}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/donatii"
              className="font-body whitespace-nowrap px-4 py-2 rounded border transition-all duration-200 hover:bg-red-950"
              style={{
                color: '#C06050',
                borderColor: '#6B1A1A',
                fontSize: '16px',
                borderWidth: '1.5px',
              }}
            >
              {t.nav.donate}
            </Link>

            {/* Selector limbă */}
            <div className="flex items-center gap-1 border-l pl-4" style={{ borderColor: '#2A1A0A' }}>
              {LOCALES.map((l, i) => (
                <span key={l} className="flex items-center">
                  <button
                    onClick={() => setLocale(l)}
                    className="font-body uppercase transition-colors duration-200 hover:text-amber-400"
                    style={{
                      color: locale === l ? '#C9A84C' : '#5A4020',
                      fontSize: '13px',
                      fontWeight: locale === l ? 600 : 400,
                      letterSpacing: '0.05em',
                    }}
                    aria-pressed={locale === l}
                    aria-label={`Limba ${l.toUpperCase()}`}
                  >
                    {l.toUpperCase()}
                  </button>
                  {i < LOCALES.length - 1 && (
                    <span style={{ color: '#2A1A0A', fontSize: '12px', margin: '0 3px' }}>|</span>
                  )}
                </span>
              ))}
            </div>
          </nav>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
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

        {/* Nav mobile */}
        {menuOpen && (
          <nav className="lg:hidden pb-4 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid #1E1208' }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body py-2.5 px-3 rounded transition-colors hover:bg-stone-900"
                style={{ color: '#C9A84C', fontSize: '16px' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/donatii"
              onClick={() => setMenuOpen(false)}
              className="font-body mt-2 py-2.5 px-4 rounded border text-center transition-colors hover:bg-red-950"
              style={{ color: '#C06050', borderColor: '#6B1A1A', fontSize: '16px', borderWidth: '1.5px' }}
            >
              {t.nav.donate}
            </Link>

            {/* Selector limbă mobile */}
            <div className="flex items-center gap-3 px-3 pt-3 pb-1">
              <span className="font-body" style={{ color: '#5A4020', fontSize: '13px' }}>Limbă:</span>
              {LOCALES.map(l => (
                <button
                  key={l}
                  onClick={() => { setLocale(l); setMenuOpen(false) }}
                  className="font-body uppercase transition-colors"
                  style={{
                    color: locale === l ? '#C9A84C' : '#5A4020',
                    fontSize: '14px',
                    fontWeight: locale === l ? 600 : 400,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
