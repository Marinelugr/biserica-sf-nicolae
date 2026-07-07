'use client'

import dynamic from 'next/dynamic'

const LoadingScreen = dynamic(() => import('@/components/LoadingScreen'), { ssr: false })

export default function LoadingScreenLoader() {
  return <LoadingScreen />
}
