import type { Translations } from '@/lib/i18n/ro'

export interface ScheduleItem {
  zi: string
  ora: string
  slujba: string
}

/** Programul slujbelor — sursă unică pentru Footer și aside-ul de profil. */
export function getScheduleItems(t: Translations): ScheduleItem[] {
  return [
    { zi: t.footer.schedule.sunday,   ora: '09:00', slujba: t.footer.schedule.liturgy },
    { zi: t.footer.schedule.saturday, ora: '17:00', slujba: t.footer.schedule.vespers },
    { zi: t.footer.schedule.friday,   ora: '08:00', slujba: t.footer.schedule.matins },
    { zi: t.footer.schedule.feasts,   ora: '09:00', slujba: t.footer.schedule.liturgy },
  ]
}
