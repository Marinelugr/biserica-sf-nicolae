import type { SecIconName } from '@/lib/sectionTheme'

/** Desenele (viewBox 24×24, linie 1,6, `currentColor`). */
const PATHS: Record<SecIconName, React.ReactNode> = {
  // foaie de calendar
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
      <path d="M9.5 14.5h5" />
    </>
  ),
  // clopoțel
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9" />
      <path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0M12 3V1.8" />
    </>
  ),
  // ceas
  clock: (
    <>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8v4.5l3 2M9 2.5h6" />
    </>
  ),
  // pană de scris
  quill: (
    <>
      <path d="M20 3.5c-6.5.5-11 5-12.5 12l-1 4.5" />
      <path d="M20 3.5c.3 5-2.7 9.5-9.3 11.4M7.6 15.4c1.6-.2 3-.5 3.1-.5" />
      <path d="M4 21h7" />
    </>
  ),
  // nimb
  halo: (
    <>
      <circle cx="12" cy="9" r="6.5" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6 21c.8-3.3 3.2-5 6-5s5.2 1.7 6 5" />
    </>
  ),
  // carte deschisă
  book: (
    <>
      <path d="M12 6.5C10.2 5 7.6 4.5 3.5 4.5v14c4.1 0 6.7.5 8.5 2 1.8-1.5 4.4-2 8.5-2v-14c-4.1 0-6.7.5-8.5 2Z" />
      <path d="M12 6.5v14" />
    </>
  ),
  // lumânare
  candle: (
    <>
      <path d="M12 2.5c1.8 2 2.2 3.4 2.2 4.4a2.2 2.2 0 0 1-4.4 0c0-1 .4-2.4 2.2-4.4Z" />
      <rect x="9" y="11" width="6" height="9" rx="1" />
      <path d="M12 9.2V11M6.5 21h11" />
    </>
  ),
  // ziar
  news: (
    <>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Z" />
      <path d="M17 9h3v8a2 2 0 0 1-2 2h-1" />
      <path d="M7 9h7M7 12.5h7M7 16h4" />
    </>
  ),
  // cărți pe raft
  books: (
    <>
      <rect x="3.5" y="4" width="4" height="16" rx="1" />
      <rect x="8.5" y="6" width="4" height="14" rx="1" />
      <path d="m14 7.2 3.8-1 3.4 13-3.8 1Z" />
    </>
  ),
  // biserică cu cruce
  church: (
    <>
      <path d="M12 1.8v4M10.4 3.4h3.2" />
      <path d="M8 21v-9l4-4.2 4 4.2v9" />
      <path d="M3.5 21v-6.5L8 12M20.5 21v-6.5L16 12M2.5 21h19" />
      <path d="M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21" />
    </>
  ),
  // play
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.5 5.5 3.5-5.5 3.5Z" />
    </>
  ),
  // cruce ortodoxă
  cross: (
    <path d="M12 2.5v19M8.5 5.5h7M6.5 9.5h11M9 17.5l6-2" />
  ),
}

export function SectionIcon({ name, size = 22 }: { name: SecIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

/** Medalionul de 40 px cu inel în culoarea accentului secțiunii. */
export function SectionMedal({ name }: { name: SecIconName }) {
  return (
    <span className="sec-medal" aria-hidden="true">
      <SectionIcon name={name} />
    </span>
  )
}

/** Steluța din listele „Sfinții zilei" (în locul caracterului ✦). */
export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M8 0c.5 4.2 3.8 7.5 8 8-4.2.5-7.5 3.8-8 8-.5-4.2-3.8-7.5-8-8 4.2-.5 7.5-3.8 8-8Z" />
    </svg>
  )
}

export default SectionIcon
