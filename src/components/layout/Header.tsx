'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/href'
import { useLiveStatus } from '@/lib/hooks/useLiveStatus'

function SearchIcon({ size = 18 }: { size?: number }) {
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LiveDot() {
  return (
    <span className="live-dot" style={{ color: '#ff5a5a', fontSize: '0.6rem' }} aria-hidden="true">●</span>
  )
}

interface NavItem { href: string; label: string; live?: boolean }

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [parishOpen, setParishOpen] = useState(false)
  const [mobileParishOpen, setMobileParishOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const isLive = useLiveStatus()?.isLive ?? false
  const searchInputRef = useRef<HTMLInputElement>(null)
  const parishRef = useRef<HTMLDivElement>(null)
  const parishBtnRef = useRef<HTMLButtonElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const parishMenuId = useId()
  const mobileParishId = useId()

  // Blochează scroll-ul paginii cât timp panoul lateral e deschis
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Închide meniurile la schimbarea rutei
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setParishOpen(false)
    setMenuOpen(false)
  }

  // „Parohia ▾": se închide la click în afară și cu Esc (focusul revine pe buton)
  useEffect(() => {
    if (!parishOpen) return
    const onDown = (e: PointerEvent) => {
      if (!parishRef.current?.contains(e.target as Node)) setParishOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setParishOpen(false)
        parishBtnRef.current?.focus()
      }
    }
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget && !parishRef.current?.contains(e.relatedTarget as Node)) setParishOpen(false)
    }
    const node = parishRef.current
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    node?.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      node?.removeEventListener('focusout', onFocusOut)
    }
  }, [parishOpen])

  // Panoul mobil se închide cu Esc
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    setMenuOpen(false)
    router.push(localizedHref(`/cautare?q=${encodeURIComponent(q)}`, locale))
  }

  const L = (href: string) => localizedHref(href, locale)
  const isCurrent = (href: string) => {
    if (href === '/' || href === `/${locale}`) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const primary: NavItem[] = [
    { href: L('/mesajul-parintelui'), label: t.shell.navWord },
    { href: L('/video'), label: t.nav.video },
    { href: L('/calendar'), label: t.nav.calendar },
    { href: L('/carti'), label: t.nav.books },
  ]
  const parish: NavItem[] = [
    { href: L('/stiri'), label: t.nav.news },
    { href: L('/despre'), label: t.shell.navAbout },
    { href: L('/istoria-bisericii'), label: t.nav.churchHistory },
    { href: L('/sfantul-nicolae'), label: t.nav.saintNicholas },
    { href: L('/paroh'), label: t.shell.navFather },
    { href: L('/live'), label: t.nav.live, live: true },
  ]
  const contact: NavItem = { href: L('/contact'), label: t.nav.contact }
  const mobileTop: NavItem[] = [
    { href: L('/'), label: t.nav.home },
    primary[0],
    primary[1],
    primary[2],
    { href: L('/calendar-pascal'), label: t.nav.pascalCalendar },
    primary[3],
    { href: L('/biblie'), label: t.shell.navBible },
  ]

  const donateHref = L('/donatii')
  const homeHref = L('/')
  const liveHref = L('/live')
  const parishActive = parish.some(p => isCurrent(p.href))
  const mobileParishExpanded = mobileParishOpen || parishActive

  const linkCls = 'relative inline-flex items-center min-h-[44px] transition-colors hover:text-gold aria-[current=page]:text-gold'

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(5, 10, 26, 0.86)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="flex items-center gap-3 lg:gap-5 xl:gap-7 px-4 sm:px-6 xl:px-10" style={{ minHeight: 70 }}>
          {/* Siglă + nume */}
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 min-h-[44px] shrink-0"
            aria-label={`${t.shell.brand} — ${t.nav.home}`}
          >
            <Image src="/logo-mark.png" alt="" width={20} height={42} preload style={{ height: 42, width: 'auto' }} />
            <span className="serif italic font-medium leading-none whitespace-nowrap text-gold text-[21px] sm:text-[25px]">
              {t.shell.brand}
            </span>
          </Link>

          {/* Linkuri desktop */}
          <nav className="hidden lg:flex items-center gap-[18px] xl:gap-[26px] ml-auto text-[17px] xl:text-[18px]" aria-label={t.shell.mainMenu}>
            {primary.map(link => (
              <Link key={link.href} href={link.href} className={linkCls} aria-current={isCurrent(link.href) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}

            <div className="relative" ref={parishRef}>
              <button
                ref={parishBtnRef}
                type="button"
                className={`${linkCls} gap-1.5 cursor-pointer ${parishActive ? 'text-gold' : ''}`}
                aria-expanded={parishOpen}
                aria-controls={parishMenuId}
                aria-haspopup="true"
                onClick={() => setParishOpen(o => !o)}
              >
                {t.shell.navParish}
                <Chevron open={parishOpen} />
              </button>
              <div
                id={parishMenuId}
                data-parish-menu
                hidden={!parishOpen}
                className="absolute right-0 top-full mt-2 min-w-[240px] card"
                style={{ padding: 8, background: 'rgba(8, 14, 36, 0.98)', borderRadius: 18, boxShadow: '0 18px 50px rgba(0,0,0,.45)' }}
              >
                <ul className="flex flex-col">
                  {parish.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 px-4 rounded-xl min-h-[44px] transition-colors hover:bg-white/5 hover:text-gold aria-[current=page]:text-gold"
                        aria-current={isCurrent(link.href) ? 'page' : undefined}
                        onClick={() => setParishOpen(false)}
                      >
                        {link.label}
                        {link.live && isLive && <LiveDot />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href={contact.href} className={linkCls} aria-current={isCurrent(contact.href) ? 'page' : undefined}>
              {contact.label}
            </Link>
          </nav>

          {/* Dreapta: LIVE, căutare, Donații, hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto lg:ml-0">
            {isLive && (
              <Link href={liveHref} className="live-pill" aria-label={`${t.shell.liveBadge} — ${t.nav.live}`}>
                <span className="live-dot" aria-hidden="true">●</span>
                {t.shell.liveBadge}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(o => !o)}
              className="soc"
              style={{ width: 44, height: 44, borderColor: 'rgba(255,255,255,0.22)' }}
              aria-label={t.home.searchBtn}
              aria-expanded={searchOpen}
              aria-controls="site-search-row"
            >
              <SearchIcon />
            </button>
            <Link href={donateHref} className="btn red sm hidden min-[440px]:inline-flex">
              {t.nav.donate}
            </Link>
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-11 h-11 -mr-1.5 rounded-full transition-colors hover:bg-white/5"
              aria-label={t.shell.openMenu}
              aria-expanded={menuOpen}
              aria-controls="site-menu-panel"
            >
              <span className="block w-5 h-0.5 rounded-full bg-gold" />
              <span className="block w-5 h-0.5 rounded-full bg-gold" />
              <span className="block w-5 h-0.5 rounded-full bg-gold" />
            </button>
          </div>
        </div>

        {/* Rând de căutare — se expandează sub bara principală (desktop + mobil) */}
        <div id="site-search-row" hidden={!searchOpen} className="px-4 sm:px-6 xl:px-10 pb-3">
          <form
            onSubmit={submitSearch}
            role="search"
            className="flex items-center gap-2 mx-auto max-w-[640px]"
            style={{ border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 5px 5px 18px', background: 'rgba(5,10,26,.6)' }}
          >
            <label htmlFor="site-search" className="sr-only">{t.home.searchPlaceholder}</label>
            <input
              id="site-search"
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              className="flex-1 min-w-0 bg-transparent outline-none text-[17px] text-ink placeholder:text-[#8d97b0]"
            />
            <button type="submit" className="btn red sm">
              <SearchIcon size={16} />
              <span>{t.home.searchBtn}</span>
            </button>
          </form>
        </div>
      </header>

      {/* Fundal panou mobil */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(2, 4, 12, 0.66)' }}
        aria-hidden="true"
      />

      {/* Panou lateral (mobil/tabletă) */}
      <aside
        id="site-menu-panel"
        className={`lg:hidden fixed inset-y-0 right-0 z-[70] w-[310px] max-w-[88vw] flex flex-col transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'rgba(6, 11, 28, 0.98)', borderLeft: '1px solid var(--gold-d)' }}
        aria-label={t.shell.mainMenu}
        inert={!menuOpen}
      >
        <div className="flex items-center justify-between px-5 shrink-0" style={{ minHeight: 70, borderBottom: '1px solid var(--line)' }}>
          <span className="flex items-center gap-2.5 serif italic font-medium text-gold text-[22px]">
            <Image src="/logo-mark.png" alt="" width={17} height={36} style={{ height: 36, width: 'auto' }} />
            {t.shell.brand}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-gold text-[22px] hover:bg-white/5"
            aria-label={t.shell.closeMenu}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 text-[18px]" aria-label={t.shell.mainMenu}>
          {mobileTop.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-6 min-h-[48px] transition-colors hover:bg-white/5 hover:text-gold aria-[current=page]:text-gold"
              aria-current={isCurrent(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            className="w-full flex items-center justify-between px-6 min-h-[48px] transition-colors hover:bg-white/5 hover:text-gold"
            aria-expanded={mobileParishExpanded}
            aria-controls={mobileParishId}
            onClick={() => setMobileParishOpen(!mobileParishExpanded)}
          >
            {t.shell.navParish}
            <Chevron open={mobileParishExpanded} />
          </button>
          <div id={mobileParishId} hidden={!mobileParishExpanded} style={{ borderLeft: '1px solid var(--gold-d)', marginLeft: 24 }}>
            {parish.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-5 min-h-[44px] text-[17px] transition-colors hover:bg-white/5 hover:text-gold aria-[current=page]:text-gold"
                aria-current={isCurrent(link.href) ? 'page' : undefined}
              >
                {link.label}
                {link.live && isLive && <LiveDot />}
              </Link>
            ))}
          </div>

          <Link
            href={contact.href}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-6 min-h-[48px] transition-colors hover:bg-white/5 hover:text-gold aria-[current=page]:text-gold"
            aria-current={isCurrent(contact.href) ? 'page' : undefined}
          >
            {contact.label}
          </Link>
        </nav>

        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
          <Link href={donateHref} onClick={() => setMenuOpen(false)} className="btn red w-full">
            {t.nav.donate}
          </Link>
        </div>
      </aside>
    </>
  )
}
