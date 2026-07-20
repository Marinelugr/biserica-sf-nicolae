import { localeToIntl, type Locale } from '@/lib/i18n/pick'

export default function ViewBadge({ value, locale }: { value: number; locale: Locale }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {value.toLocaleString(localeToIntl(locale))} vizualizări
    </span>
  )
}
