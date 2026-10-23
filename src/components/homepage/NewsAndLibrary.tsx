import { getServerLocale, getServerT } from '@/lib/i18n/server'
import NewsAndLibraryView, { type NewsAndLibraryViewProps } from './NewsAndLibraryView'

/** Știrile recente și Biblioteca, ca panouri în flux (datele vin de la prima pagină). */
export default async function NewsAndLibrary(props: Omit<NewsAndLibraryViewProps, 't' | 'locale'>) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  return <NewsAndLibraryView {...props} t={t} locale={locale} />
}
