import { cookies } from 'next/headers'
import ro, { type Translations } from './ro'
import ru from './ru'
import en from './en'

type Locale = 'ro' | 'ru' | 'en'
const dicts: Record<Locale, Translations> = { ro, ru, en }

export async function getServerT(): Promise<Translations> {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? 'ro') as Locale
  return dicts[locale] ?? ro
}
