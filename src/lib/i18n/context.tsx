'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import ro, { type Translations } from './ro'
import ru from './ru'
import en from './en'

export type Locale = 'ro' | 'ru' | 'en'

const dictionaries: Record<Locale, Translations> = { ro, ru, en }

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'ro',
  setLocale: () => {},
  t: ro,
})

const STORAGE_KEY = 'sfnicOlae_lang'
const COOKIE_NAME = 'locale'

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'ro' || stored === 'ru' || stored === 'en') return stored
  return null
}

export function I18nProvider({ children, initialLocale = 'ro' }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const stored = readStoredLocale()
    if (stored && stored !== initialLocale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable client-side, this reconciles it with the SSR-provided cookie locale on mount
      setLocaleState(stored)
    } else if (!stored) {
      localStorage.setItem(STORAGE_KEY, initialLocale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.cookie = `${COOKIE_NAME}=${l};path=/;max-age=31536000;SameSite=Lax`
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
