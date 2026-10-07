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
      type="button"
      className="chip"
      style={{
        minHeight: 36, padding: '4px 14px', fontSize: 15,
        borderColor: copied ? '#6fbf86' : 'var(--gold-d)',
        color: copied ? '#8fe0a5' : 'var(--gold)',
      }}
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  )
}
