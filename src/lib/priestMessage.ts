export const FALLBACK_MESAJ = 'Bine ați venit la pagina oficială a bisericii cu hramul Sfântul Ierarh Nicolae din Hîrtopul Mic, raionul Criuleni, Republica Moldova. Îmi doresc ca toată informația care o găsiți aici să fie izvor de lumină și de întărire duhovnicească pentru sufletele voastre. Dragi creștini, vă punem la dispoziție Sfânta Scriptură, calendarul ortodox, rugăciuni pentru toate trebuințele, cărți ortodoxe, filme ortodoxe, noutăți din viața parohiei și din viața Bisericii lui Hristos din toată lumea. Hristos în mijlocul nostru!'
export const FALLBACK_SEMNATURA = 'Pr. Marin Grigoriță, Parohul Bisericii'
export const FALLBACK_PHOTO_URL = '/images/parinte-marin.jpg'

export function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.slice(0, count).join(' ').trim()
}
