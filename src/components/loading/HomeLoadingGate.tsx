'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// `loading` acoperă golul dintre primul paint și încărcarea chunk-ului LoadingV4 —
// fără el, homepage-ul e vizibil nescris câteva sute de ms înainte de animație.
const LoadingScreen = dynamic(() => import('@/components/loading/LoadingV4'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0D0905' }} />,
})

const SESSION_KEY = 'sf_nicolae_loading_shown'

export default function HomeLoadingGate() {
  // Implicit TRUE: presupunem că animația trebuie arătată, ca să nu apară
  // homepage-ul înainte. useLayoutEffect (nu useEffect) o ascunde ÎNAINTE
  // de primul paint dacă a fost deja arătată în sesiunea curentă.
  const [showLoading, setShowLoading] = useState(true)

  useLayoutEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) setShowLoading(false)
  }, [])

  const handleDone = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setShowLoading(false)
  }, [])

  if (!showLoading) return null
  return <LoadingScreen onDone={handleDone} />
}
