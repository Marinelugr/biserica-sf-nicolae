import type { Locale } from './context'
import { translatePath } from './slugs'

export function localizedHref(path: string, locale: Locale): string {
  const translated = translatePath(path, locale)
  if (locale === 'ro') return translated
  return translated === '/' ? `/${locale}` : `/${locale}${translated}`
}
