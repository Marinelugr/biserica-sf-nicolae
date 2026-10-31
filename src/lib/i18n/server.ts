import { cookies } from 'next/headers'
import ro, { type Translations } from './ro'
import ru from './ru'
import en from './en'
import { localeUrl } from './alternates'
import { siteOpenGraph } from '../openGraph'

export type Locale = 'ro' | 'ru' | 'en'
const dicts: Record<Locale, Translations> = { ro, ru, en }

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value as Locale | undefined
  return locale && dicts[locale] ? locale : 'ro'
}

export async function getServerT(): Promise<Translations> {
  const locale = await getServerLocale()
  return dicts[locale]
}

/** URL-ul absolut al paginii în limba cererii (calea românească → /en/…, /ru/…). */
export async function pageUrl(path: string): Promise<string> {
  return localeUrl(path, await getServerLocale())
}

/** Open Graph-ul implicit al site-ului, cu og:url al paginii. */
export async function pageOpenGraph(path: string) {
  const [t, locale, url] = await Promise.all([getServerT(), getServerLocale(), pageUrl(path)])
  return siteOpenGraph(t, locale, url)
}
