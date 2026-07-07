import { translatePath } from './slugs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biserica-sf-nicolae.org'

function localeUrl(path: string, locale: 'ro' | 'ru' | 'en'): string {
  const translated = translatePath(path, locale)
  const clean = translated === '/' ? '' : translated
  if (locale === 'ro') return `${SITE_URL}${clean}`
  return `${SITE_URL}/${locale}${clean}`
}

export function buildAlternates(path: string) {
  const roUrl = localeUrl(path, 'ro')
  return {
    canonical: roUrl,
    languages: {
      ro: roUrl,
      'ro-MD': roUrl,
      ru: localeUrl(path, 'ru'),
      'ru-MD': localeUrl(path, 'ru'),
      en: localeUrl(path, 'en'),
      'x-default': roUrl,
    },
  }
}
