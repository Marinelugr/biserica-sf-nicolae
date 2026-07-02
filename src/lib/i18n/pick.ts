export type Locale = 'ro' | 'ru' | 'en'

export function pick(locale: Locale, ro: string, ru?: string | null, en?: string | null): string {
  if (locale === 'ru' && ru) return ru
  if (locale === 'en' && en) return en
  return ro
}

export function localeToIntl(locale: Locale): string {
  if (locale === 'ru') return 'ru-RU'
  if (locale === 'en') return 'en-US'
  return 'ro-MD'
}
