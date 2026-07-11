'use client'

import { useState, useEffect } from 'react'

interface TimeLeft {
  zile: number
  ore: number
  minute: number
  secunde: number
}

interface ServiceInfo {
  titlu: string
  data: string
  ora: string
}

interface FallbackEntry {
  day: number
  hour: number
  minute: number
  titlu: string
  dayName: string
}

const FALLBACK_SCHEDULE: FallbackEntry[] = [
  { day: 0, hour: 9, minute: 0, titlu: 'Sfânta Liturghie', dayName: 'Duminică' },
  { day: 5, hour: 8, minute: 0, titlu: 'Utrenia', dayName: 'Vineri' },
  { day: 6, hour: 17, minute: 0, titlu: 'Vecernia și Utrenia', dayName: 'Sâmbătă' },
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getDayLabel(date: Date): string {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000)
  if (diffDays === 0) return 'Astăzi'
  if (diffDays === 1) return 'Mâine'
  return capitalize(date.toLocaleDateString('ro-RO', { weekday: 'long' }))
}

function getFullDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getFallbackService(): ServiceInfo | null {
  const now = new Date()
  let minDiff = Infinity
  let next: (FallbackEntry & { date: Date }) | null = null

  for (const entry of FALLBACK_SCHEDULE) {
    let daysUntil = entry.day - now.getDay()
    if (daysUntil < 0) daysUntil += 7
    if (daysUntil === 0 && (entry.hour < now.getHours() || (entry.hour === now.getHours() && entry.minute <= now.getMinutes()))) {
      daysUntil = 7
    }

    const date = new Date(now)
    date.setDate(now.getDate() + daysUntil)
    date.setHours(entry.hour, entry.minute, 0, 0)

    const diff = date.getTime() - now.getTime()
    if (diff < minDiff) {
      minDiff = diff
      next = { ...entry, date }
    }
  }

  if (!next) return null
  return {
    titlu: next.titlu,
    data: next.date.toISOString(),
    ora: `${String(next.hour).padStart(2, '0')}:${String(next.minute).padStart(2, '0')}`,
  }
}

export default function NextServiceWidget() {
  const [service, setService] = useState<ServiceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    async function fetchNextService() {
      try {
        const res = await fetch('/api/next-service')
        const result = await res.json()
        if (result.found) {
          setService({ titlu: result.titlu, data: result.data, ora: result.ora })
        } else {
          setService(getFallbackService())
        }
      } catch {
        setService(getFallbackService())
      } finally {
        setLoading(false)
      }
    }
    fetchNextService()
  }, [])

  useEffect(() => {
    if (!service) return
    function tick() {
      if (!service) return
      const diff = new Date(service.data).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      const totalSeconds = Math.floor(diff / 1000)
      setTimeLeft({
        zile: Math.floor(totalSeconds / 86400),
        ore: Math.floor((totalSeconds % 86400) / 3600),
        minute: Math.floor((totalSeconds % 3600) / 60),
        secunde: totalSeconds % 60,
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [service])

  if (loading) return <div className="next-service-widget skeleton max-w-md mx-auto" />
  if (!service || !timeLeft) return null

  const serviceDate = new Date(service.data)

  return (
    <div className="next-service-widget max-w-md mx-auto">
      <div className="widget-label">⛪ Următoarea slujbă</div>
      <div className="widget-service-name">{service.titlu}</div>
      <div className="widget-service-time">
        {getDayLabel(serviceDate)} · {getFullDate(serviceDate)} · {service.ora}
      </div>
      <div className="widget-countdown">
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.zile).padStart(2, '0')}</span>
          <span className="countdown-label">zile</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.ore).padStart(2, '0')}</span>
          <span className="countdown-label">ore</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.minute).padStart(2, '0')}</span>
          <span className="countdown-label">min</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-number">{String(timeLeft.secunde).padStart(2, '0')}</span>
          <span className="countdown-label">sec</span>
        </div>
      </div>
    </div>
  )
}
