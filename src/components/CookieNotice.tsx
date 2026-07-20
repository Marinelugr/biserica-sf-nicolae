'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/href'

const STORAGE_KEY = 'sfnicOlae_cookieConsent'

export default function CookieNotice() {
  const { t, locale } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // One-time read of an external system (localStorage) on mount to decide
    // whether to show the banner; there is no pre-mount way to know this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 sm:px-6"
      style={{ backgroundColor: '#0D0905', borderTop: '1px solid #2A1A0A' }}
      role="region"
      aria-label={t.cookieBanner.policyLink}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="font-body text-sm flex-1 text-center sm:text-left" style={{ color: '#8A7050' }}>
          {t.cookieBanner.message}{' '}
          <Link
            href={localizedHref('/politica-de-confidentialitate', locale)}
            className="underline hover:opacity-80"
            style={{ color: '#C9A84C' }}
          >
            {t.cookieBanner.policyLink}
          </Link>
        </p>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1')
            setVisible(false)
          }}
          className="font-body text-sm px-6 py-2 rounded transition-all hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
        >
          {t.cookieBanner.acceptBtn}
        </button>
      </div>
    </div>
  )
}
