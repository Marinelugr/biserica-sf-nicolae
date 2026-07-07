'use client'

import { useState, useEffect } from 'react'

interface TimeLeft {
  zile: number
  ore: number
  minute: number
  secunde: number
}

interface NextServiceInfo {
  name: string
  time: string
  day: string
}

interface ScheduleEntry {
  day: number
  hour: number
  minute: number
  name: string
  dayName: string
}

const SCHEDULE: ScheduleEntry[] = [
  { day: 0, hour: 9, minute: 0, name: 'Sfânta Liturghie', dayName: 'Duminică' },
  { day: 5, hour: 8, minute: 0, name: 'Utrenia', dayName: 'Vineri' },
  { day: 6, hour: 17, minute: 0, name: 'Vecernia și Utrenia', dayName: 'Sâmbătă' },
]

export default function NextServiceWidget() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [nextService, setNextService] = useState<NextServiceInfo | null>(null)

  useEffect(() => {
    function getNextService() {
      const now = new Date()
      const currentDay = now.getDay()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      let minDiff = Infinity
      let nextSvc: (ScheduleEntry & { nextDate: Date; diff: number }) | null = null

      for (const svc of SCHEDULE) {
        let daysUntil = svc.day - currentDay
        if (daysUntil < 0) daysUntil += 7
        if (daysUntil === 0) {
          if (svc.hour < currentHour || (svc.hour === currentHour && svc.minute <= currentMinute)) {
            daysUntil = 7
          }
        }

        const nextDate = new Date(now)
        nextDate.setDate(now.getDate() + daysUntil)
        nextDate.setHours(svc.hour, svc.minute, 0, 0)

        const diff = nextDate.getTime() - now.getTime()
        if (diff < minDiff) {
          minDiff = diff
          nextSvc = { ...svc, nextDate, diff }
        }
      }

      if (!nextSvc) return

      const totalSeconds = Math.floor(nextSvc.diff / 1000)
      const zile = Math.floor(totalSeconds / 86400)
      const ore = Math.floor((totalSeconds % 86400) / 3600)
      const minute = Math.floor((totalSeconds % 3600) / 60)
      const secunde = totalSeconds % 60

      setTimeLeft({ zile, ore, minute, secunde })
      setNextService({
        name: nextSvc.name,
        time: `${String(nextSvc.hour).padStart(2, '0')}:${String(nextSvc.minute).padStart(2, '0')}`,
        day: nextSvc.dayName,
      })
    }

    getNextService()
    const interval = setInterval(getNextService, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!timeLeft || !nextService) return null

  return (
    <div className="next-service-widget max-w-md mx-auto">
      <div className="widget-label">⛪ Următoarea slujbă</div>
      <div className="widget-service-name">{nextService.name}</div>
      <div className="widget-service-time">{nextService.day} · {nextService.time}</div>
      <div className="widget-countdown">
        {timeLeft.zile > 0 && (
          <div className="countdown-unit">
            <span className="countdown-number">{timeLeft.zile}</span>
            <span className="countdown-label">zile</span>
          </div>
        )}
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
