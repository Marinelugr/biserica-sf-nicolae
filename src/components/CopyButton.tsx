'use client'

import { useState } from 'react'

interface Props {
  value: string
  copyLabel: string
  copiedLabel: string
}

export default function CopyButton({ value, copyLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard API unavailable — silently ignore, value is already visible as text
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="font-body text-xs px-3 py-1 rounded-full border transition-all"
      style={{
        borderColor: copied ? '#2F6B3A' : '#8B1A1A',
        color: copied ? '#2F6B3A' : '#8B1A1A',
        backgroundColor: 'transparent',
      }}
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  )
}
