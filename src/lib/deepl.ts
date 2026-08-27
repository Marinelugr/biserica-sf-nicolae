const DEEPL_API_KEY = process.env.DEEPL_API_KEY
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

export async function translateText(
  text: string,
  targetLang: 'RU' | 'EN-GB',
  sourceLang: 'RO' = 'RO'
): Promise<string> {
  if (!text || text.trim() === '') return ''
  if (!DEEPL_API_KEY) {
    throw new Error('Cheia DEEPL_API_KEY lipsește din variabilele de mediu ale serverului.')
  }
  const response = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceLang,
      target_lang: targetLang,
      preserve_formatting: true,
      tag_handling: 'html',
    }),
  })
  if (!response.ok) {
    // DeepL răspunde de obicei cu { message: "..." } — includem mesajul lor real,
    // nu doar codul HTTP, ca eroarea afișată în admin să spună exact ce nu merge.
    let detail = ''
    try {
      const body = await response.json() as { message?: string }
      detail = body.message || ''
    } catch {
      /* corpul răspunsului nu era JSON — ignorăm, rămânem doar cu statusul */
    }
    throw new Error(
      detail
        ? `Eroare DeepL ${response.status}: ${detail}`
        : `Eroare DeepL (cod ${response.status})`
    )
  }
  const data = await response.json() as { translations: { text: string }[] }
  return data.translations[0].text
}

export async function translateToAllLanguages(textRo: string): Promise<{ ru: string; en: string }> {
  const [ru, en] = await Promise.all([
    translateText(textRo, 'RU'),
    translateText(textRo, 'EN-GB'),
  ])
  return { ru, en }
}
