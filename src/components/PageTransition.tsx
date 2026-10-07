'use client'

import { usePathname } from 'next/navigation'

/**
 * Tranziție de rută: un fade scurt pe conținut la fiecare schimbare de pagină
 * (pur CSS, `.page-fade` în globals.css). Remontarea pe `pathname` păstrează
 * comportamentul de dinainte; fără JS și cu reduced-motion conținutul e vizibil direct.
 * `backwards` (nu `both`): după fade nu rămâne niciun stil care să creeze stacking context.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Admin-ul e un strat `position: fixed; z-index: 100` peste layout; animația
  // (opacity) ar crea un stacking context care l-ar pune sub header — fără fade aici.
  if (pathname.startsWith('/admin')) return <div key={pathname}>{children}</div>
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  )
}
