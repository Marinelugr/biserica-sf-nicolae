'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/href'
import { useLiveStatus } from '@/lib/hooks/useLiveStatus'

function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { t, locale } = useI18n()
  const isLive = useLiveStatus()?.isLive ?? false
  const mobileInputRef = useRef<HTMLInputElement>(null)

  // Blochează scroll-ul paginii cât timp panoul lateral e deschis
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (mobileSearchOpen) mobileInputRef.current?.focus()
  }, [mobileSearchOpen])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setMobileSearchOpen(false)
    setMenuOpen(false)
    router.push(localizedHref(`/cautare?q=${encodeURIComponent(q)}`, locale))
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
    { href: '/contact', label: t.nav.contact },
    { href: '/live', label: t.nav.live, live: true },
  ].map(link => ({ ...link, href: localizedHref(link.href, locale) }))

  const donateHref = localizedHref('/donatii', locale)
  const homeHref = localizedHref('/', locale)

  return (
    <>
      <header
        style={{
          backgroundColor: 'rgba(4, 8, 15, 0.72)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        className="sticky top-0 z-50"
      >
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 h-16">

            {/* Stânga: hamburger + logo */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex flex-col justify-center gap-[5px] p-2 -ml-2 shrink-0 transition-opacity hover:opacity-80"
                aria-label="Deschide meniul"
                aria-expanded={menuOpen}
                aria-controls="site-menu-panel"
              >
                <span className="block w-5 h-0.5 rounded-full" style={{ backgroundColor: '#E9CE7A' }} />
                <span className="block w-5 h-0.5 rounded-full" style={{ backgroundColor: '#E9CE7A' }} />
                <span className="block w-5 h-0.5 rounded-full" style={{ backgroundColor: '#E9CE7A' }} />
              </button>

              <Link href={homeHref} className="flex items-center gap-2 min-w-0 group" aria-label={t.nav.home}>
                <span aria-hidden="true" style={{ color: '#E9CE7A', fontSize: '22px', lineHeight: 1 }}>☦</span>
                <span
                  className="font-heading italic font-semibold leading-none truncate"
                  style={{
                    color: '#E9CE7A',
                    fontSize: '19px',
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                  }}
                >
                  <span className="hidden sm:inline">Sf. Ierarh Nicolae</span>
                  <span className="sm:hidden">Sf. Nicolae</span>
                </span>
              </Link>
            </div>

            {/* Centru: bară de căutare (desktop/tabletă) */}
            <form
              onSubmit={submitSearch}
              role="search"
              className="hidden md:flex items-center gap-2 w-[270px] justify-self-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '7px 7px 7px 16px',
              }}
            >
              <label htmlFor="site-search" className="sr-only">{t.home.searchPlaceholder}</label>
              <input
                id="site-search"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.home.searchPlaceholder}
                className="flex-1 min-w-0 bg-transparent outline-none font-body text-[13px]"
                style={{ color: '#F2EBD9' }}
              />
              <button
                type="submit"
                aria-label={t.home.searchBtn}
                className="shrink-0 flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#9B1C1C', color: '#fff', width: '28px', height: '28px' }}
              >
                <SearchIcon />
              </button>
            </form>

            {/* Dreapta: căutare-iconiță (mobil) + Donații */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0 justify-self-end">
              <button
                onClick={() => setMobileSearchOpen(o => !o)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                style={{ color: '#E9CE7A', border: '1px solid rgba(255,255,255,0.18)' }}
                aria-label={t.home.searchBtn}
                aria-expanded={mobileSearchOpen}
              >
                <SearchIcon size={16} />
              </button>

              <Link
                href={donateHref}
                className="cobalt-donate-pulse font-body font-bold whitespace-nowrap rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#9B1C1C',
                  color: '#fff',
                  fontSize: '13px',
                  padding: '9px 18px',
                }}
              >
                {t.nav.donate}
              </Link>
            </div>
          </div>

          {/* Căutare mobil — se expandează sub rândul principal */}
          {mobileSearchOpen && (
            <form
              onSubmit={submitSearch}
              role="search"
              className="md:hidden flex items-center gap-2 pb-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '8px 8px 8px 16px',
                marginBottom: '10px',
              }}
            >
              <label htmlFor="site-search-mobile" className="sr-only">{t.home.searchPlaceholder}</label>
              <input
                id="site-search-mobile"
                ref={mobileInputRef}
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.home.searchPlaceholder}
                className="flex-1 min-w-0 bg-transparent outline-none font-body text-sm"
                style={{ color: '#F2EBD9' }}
              />
              <button
                type="submit"
                aria-label={t.home.searchBtn}
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{ backgroundColor: '#9B1C1C', color: '#fff', width: '30px', height: '30px' }}
              >
                <SearchIcon size={16} />
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(2, 4, 9, 0.6)' }}
        aria-hidden="true"
      />

      {/* Panou lateral — glisează din stânga */}
      <aside
        id="site-menu-panel"
        className={`fixed inset-y-0 left-0 z-[70] w-[290px] max-w-[85vw] flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'rgba(6, 10, 20, 0.98)',
          borderRight: '1px solid rgba(212, 175, 55, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        aria-hidden={!menuOpen}
      >
        <div
          className="flex items-center justify-between px-5 h-16 shrink-0"
          style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}
        >
          <span
            className="font-heading italic font-semibold"
            style={{ color: '#E9CE7A', fontSize: '18px', fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            ☦ Sf. Ierarh Nicolae
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-9 h-9 -mr-2 transition-opacity hover:opacity-70"
            style={{ color: '#E9CE7A', fontSize: '22px', lineHeight: 1 }}
            aria-label="Închide meniul"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-6 py-3 font-body transition-colors hover:bg-white/5"
              style={{ color: '#D9C48A', fontSize: '1.02rem' }}
            >
              {link.label}
              {link.live && isLive && (
                <span className="live-dot" style={{ color: '#EF4444', fontSize: '0.6rem' }} aria-label="LIVE">
                  ●
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <Link
            href={donateHref}
            onClick={() => setMenuOpen(false)}
            className="block text-center font-body font-bold rounded-lg py-3 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#9B1C1C', color: '#fff', fontSize: '0.95rem' }}
          >
            {t.nav.donate}
          </Link>
        </div>
      </aside>
    </>
  )
}
