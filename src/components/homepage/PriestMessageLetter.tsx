import { decorateLetter } from '@/lib/priestMessage'

interface Props {
  /** Mesajul complet, deja HTML (`messageToHtml`). */
  html: string
  signature: string
  /** „Actualizat la …", dacă există. */
  updatedLabel?: string | null
}

/** Mesajul complet, ca scrisoare: salut auriu, literă mare, semnătură. Folosit de pagină și de admin. */
export default function PriestMessageLetter({ html, signature, updatedLabel }: Props) {
  return (
    <article className="card letter-page" data-sec="cuvant">
      <div className="rich letter" dangerouslySetInnerHTML={{ __html: decorateLetter(html) }} />
      <footer className="letter-foot">
        <p className="letter-sign">— {signature}</p>
        {updatedLabel && <p className="mute text-[16px]">{updatedLabel}</p>}
      </footer>
    </article>
  )
}
