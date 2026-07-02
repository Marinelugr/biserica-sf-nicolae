import { cookies } from 'next/headers'
import ro, { type Translations } from './ro'
import ru from './ru'
import en from './en'

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
