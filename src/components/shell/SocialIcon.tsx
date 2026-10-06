import type { SocialKey } from '@/lib/social'

const PATHS: Record<SocialKey, React.ReactNode> = {
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="4" />
      <path d="M10.3 9.6v4.8l4.2-2.4z" fill="currentColor" />
    </>
  ),
  tiktok: <path d="M13.5 4v10.2a3.2 3.2 0 1 1-3.2-3.2M13.5 4c.3 2.3 1.9 3.9 4.5 4.1" />,
  facebook: <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V8.5z" />,
  telegram: (
    <>
      <path d="M21 4 3 11l5.2 2L10 19l3-3.6L17.5 19z" />
      <path d="M8.2 13 21 4" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
    </>
  ),
}

export default function SocialIcon({ name, size = 22 }: { name: SocialKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
