import { getServerT } from '@/lib/i18n/server'
import DailyCardsView, { type DailyCardsViewProps } from './DailyCardsView'

/** Sfinții / Evanghelia / Rugăciunea zilei — în ordinea și activarea din admin. */
export default async function DailyCards(props: Omit<DailyCardsViewProps, 't'>) {
  const t = await getServerT()
  return <DailyCardsView {...props} t={t} />
}
