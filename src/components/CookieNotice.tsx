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
      style={{ backgroundColor: 'rgba(5, 10, 26, 0.96)', borderTop: '1px solid var(--gold-d)', backdropFilter: 'blur(12px)' }}
      role="region"
      aria-label={t.cookieBanner.policyLink}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-[16px] flex-1 text-center sm:text-left mute">
          {t.cookieBanner.message}{' '}
          <Link
            href={localizedHref('/politica-de-confidentialitate', locale)}
            className="underline underline-offset-2 gold hover:opacity-80"
          >
            {t.cookieBanner.policyLink}
          </Link>
        </p>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1')
            setVisible(false)
          }}
          className="btn red sm shrink-0"
        >
          {t.cookieBanner.acceptBtn}
        </button>
      </div>
    </div>
  )
}
