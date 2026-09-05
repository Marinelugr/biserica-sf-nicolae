/**
 * Configurarea secțiunilor de pe homepage (toggle activ/inactiv + ordine).
 *
 * Sursa de adevăr pentru:
 *  - ce secțiuni pot fi controlate din „Admin → Configurare homepage"
 *  - ordinea implicită (identică cu layout-ul istoric al paginii)
 *
 * Persistența se face în tabelul `HomepageWidget` (o linie / secțiune).
 * Secțiunile noi adăugate aici apar automat în panoul admin la poziția lor
 * canonică, fără migrare de date — vezi `mergeHomepageWidgets`.
 */

export interface HomepageWidgetCfg {
  section: string
  enabled: boolean
  order: number
}

/** Ordinea canonică = ordinea vizuală implicită a homepage-ului. */
export const HOMEPAGE_SECTIONS = [
  'hero',
  'astazi_calendar',
  'pascal_slujbe',
  'mesajul_parintelui',
  'sfintii_zilei',
  'evanghelia_zilei',
  'rugaciunea_zilei',
  'stiri_recente',
  'biblioteca_ortodoxa',
] as const

export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number]

export const DEFAULT_HOMEPAGE_WIDGETS: HomepageWidgetCfg[] = HOMEPAGE_SECTIONS.map(
  (section, i) => ({ section, enabled: true, order: i }),
)

/**
 * Combină liniile salvate în DB cu setul canonic de secțiuni.
 * Secțiunile lipsă (adăugate ulterior în cod) sunt inserate imediat după
 * predecesorul lor canonic, deci un site existent păstrează exact layout-ul
 * de dinainte, iar noile controale apar la locul potrivit.
 */
export function mergeHomepageWidgets(
  stored: { section: string; enabled: boolean; order: number }[],
): HomepageWidgetCfg[] {
  if (!stored.length) return DEFAULT_HOMEPAGE_WIDGETS.map(w => ({ ...w }))

  const result: HomepageWidgetCfg[] = [...stored]
    .sort((a, b) => a.order - b.order)
    .map(w => ({ section: w.section, enabled: w.enabled, order: 0 }))

  const present = new Set(result.map(w => w.section))

  HOMEPAGE_SECTIONS.forEach((section, idx) => {
    if (present.has(section)) return

    let insertAt = result.length
    if (idx === 0) {
      insertAt = 0
    } else {
      for (let j = idx - 1; j >= 0; j--) {
        const pos = result.findIndex(w => w.section === HOMEPAGE_SECTIONS[j])
        if (pos !== -1) { insertAt = pos + 1; break }
        if (j === 0) insertAt = 0
      }
    }

    result.splice(insertAt, 0, { section, enabled: true, order: 0 })
    present.add(section)
  })

  return result.map((w, i) => ({ ...w, order: i }))
}
