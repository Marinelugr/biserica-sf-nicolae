import { prisma } from '@/lib/prisma'

export const SETTING_KEYS = {
  phone: 'contact_phone',
  email: 'contact_email',
  address: 'contact_address',
  facebook: 'contact_facebook',
  schedule: 'contact_schedule',
  message: 'contact_message',
  mapEmbed: 'contact_map_embed',
} as const

export type ContactField = keyof typeof SETTING_KEYS
export type ContactInfo = Record<ContactField, string>

export const DEFAULT_CONTACT: ContactInfo = {
  phone: '+373 67 306 191',
  email: 'parinte.marin@biserica-sf-nicolae.org',
  address: 'Hîrtopul Mic\nRaionul Criuleni\nRepublica Moldova',
  facebook: 'https://www.facebook.com/PreotMarin',
  schedule: 'Duminică - 09:00 - Sfânta Liturghie\nSâmbătă - 17:00 - Vecernia și Utrenia\nVineri - 08:00 - Utrenia\nSărbători - 09:00 - Sfânta Liturghie',
  message: '',
  mapEmbed: 'https://www.google.com/maps?q=47.2469,28.9283&z=15&output=embed',
}

export async function getContactInfo(): Promise<ContactInfo> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: Object.values(SETTING_KEYS) } },
    })
    const byKey = new Map(rows.map(r => [r.key, r.value]))
    const result = {} as ContactInfo
    for (const field of Object.keys(SETTING_KEYS) as ContactField[]) {
      result[field] = byKey.get(SETTING_KEYS[field]) ?? DEFAULT_CONTACT[field]
    }
    return result
  } catch {
    return { ...DEFAULT_CONTACT }
  }
}
