'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Schimbă varianta din singurul loc: LoadingV1 | LoadingV2 | LoadingV3
const LoadingScreen = dynamic(() => import('@/components/loading/LoadingV1'), { ssr: false })

export default function LoadingScreenLoader() {
  const [loaded, setLoaded] = useState(false)
  if (loaded) return null
  return <LoadingScreen onDone={() => setLoaded(true)} />
}
