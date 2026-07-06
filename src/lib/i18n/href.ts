import type { Locale } from './context'

export function localizedHref(path: string, locale: Locale): string {
  if (locale === 'ro') return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}
