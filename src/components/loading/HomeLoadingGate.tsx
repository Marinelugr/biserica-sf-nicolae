'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Schimbă varianta din singurul loc: LoadingV1 | LoadingV2 | LoadingV3 | LoadingV4
const LoadingScreen = dynamic(() => import('@/components/loading/LoadingV4'), { ssr: false })

const SESSION_KEY = 'sf_nicolae_loading_shown'

export default function HomeLoadingGate() {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) setShowLoading(true)
  }, [])

  const handleDone = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setShowLoading(false)
  }, [])

  if (!showLoading) return null
  return <LoadingScreen onDone={handleDone} />
}
