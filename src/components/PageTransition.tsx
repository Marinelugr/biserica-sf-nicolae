'use client'

import { usePathname } from 'next/navigation'

/**
 * Tranziție de rută: un fade scurt pe conținut la fiecare schimbare de pagină
 * (pur CSS, `.page-fade` în globals.css). Remontarea pe `pathname` păstrează
 * comportamentul de dinainte; fără JS și cu reduced-motion conținutul e vizibil direct.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  )
}
