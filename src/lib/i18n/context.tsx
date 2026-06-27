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

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ro'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'ro' || stored === 'ru' || stored === 'en') return stored
  return 'ro'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ro')

  useEffect(() => {
    setLocaleState(readStoredLocale())
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
