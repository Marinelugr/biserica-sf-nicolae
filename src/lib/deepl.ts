const DEEPL_API_KEY = process.env.DEEPL_API_KEY!
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

export async function translateText(
  text: string,
  targetLang: 'RU' | 'EN-GB',
  sourceLang: 'RO' = 'RO'
): Promise<string> {
  if (!text || text.trim() === '') return ''
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
    }),
  })
  if (!response.ok) throw new Error(`DeepL error: ${response.status}`)
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
