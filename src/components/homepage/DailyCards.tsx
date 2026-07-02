'use client'

import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/context'

interface DailyData {
  saints: string[]
  gospel: { reference: string; text: string }
  prayer: { title: string; text: string }
  schedule: { time: string; service: string }[]
}

interface DailyCardsProps {
  data: DailyData
  todayLabel: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

export default function DailyCards({ data, todayLabel }: DailyCardsProps) {
  const { t } = useI18n()
  const cards = [
    {
      dot: '#8B6014',
      icon: '✦',
      label: t.home.saintsToday,
      content: (
        <ul className="space-y-1.5">
          {data.saints.length > 0 ? (
            data.saints.map((saint, i) => (
              <li key={i} className="font-body text-sm leading-snug" style={{ color: '#3A1A1A' }}>
                {saint}
              </li>
            ))
          ) : (
            <li className="font-body text-sm italic" style={{ color: '#8A7050' }}>
              {t.home.noSaints}
            </li>
          )}
        </ul>
      ),
      link: '/sfintii',
      linkLabel: t.home.allSaintsLink,
    },
    {
      dot: '#8B1A1A',
      icon: '✦',
      label: t.home.gospelToday,
      content: (
        <div>
          <p className="font-heading text-sm font-semibold mb-2" style={{ color: '#8B1A1A' }}>
            {data.gospel.reference}
          </p>
          <p className="font-body text-sm leading-relaxed line-clamp-4" style={{ color: '#3A1A1A' }}>
            &ldquo;{data.gospel.text}&rdquo;
          </p>
        </div>
      ),
      link: '/biblie',
      linkLabel: t.home.readFullGospel,
    },
    {
      dot: '#6B4A2A',
      icon: '✦',
      label: t.home.prayerToday,
      content: (
        <div>
          <p className="font-heading text-sm font-semibold mb-2" style={{ color: '#6B4A2A' }}>
            {data.prayer.title}
          </p>
          <p className="font-body text-sm leading-relaxed line-clamp-4 italic" style={{ color: '#3A1A1A' }}>
            {data.prayer.text}
          </p>
        </div>
      ),
      link: '/carti',
      linkLabel: t.home.allPrayersLink,
    },
    {
      dot: '#4A6A2A',
      icon: '✦',
      label: t.home.serviceSchedule,
      content: (
        <div>
          {data.schedule.length > 0 ? (
            <ul className="space-y-2">
              {data.schedule.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="font-heading text-sm font-semibold shrink-0 mt-0.5"
                    style={{ color: '#4A6A2A', minWidth: '3.5rem' }}
                  >
                    {item.time}
                  </span>
                  <span className="font-body text-sm" style={{ color: '#3A1A1A' }}>
                    {item.service}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-sm italic" style={{ color: '#8A7050' }}>
              {t.home.noSchedule}
            </p>
          )}
        </div>
      ),
      link: '/calendar',
      linkLabel: t.home.fullCalendarLink,
    },
  ]

  return (
    <section style={{ backgroundColor: '#F2EBD9' }} className="py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header secțiune */}
        <div className="text-center mb-10">
          <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: '#8A7050' }}>
            {todayLabel}
          </p>
          <h2 className="font-heading text-3xl" style={{ color: '#3A1A1A' }}>
            {t.home.liturgicalLife}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-px w-20 block" style={{ backgroundColor: '#D4C8A0' }} />
            <span style={{ color: '#C9A84C', fontSize: '16px' }} aria-hidden="true">☦</span>
            <span className="h-px w-20 block" style={{ backgroundColor: '#D4C8A0' }} />
          </div>
        </div>

        {/* Grid carduri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <motion.article
              key={card.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
              className="card-parchment p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Card header */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: card.dot }}
                    aria-hidden="true"
                  />
                  <h3
                    className="font-heading text-sm font-semibold tracking-wide uppercase"
                    style={{ color: card.dot }}
                  >
                    {card.label}
                  </h3>
                </div>

                {/* Separator */}
                <div className="h-px mb-4" style={{ backgroundColor: '#D4C8A0' }} />

                {/* Content */}
                <div className="min-h-[100px]">{card.content}</div>
              </div>

              {/* Link */}
              <a
                href={card.link}
                className="font-body text-xs mt-5 inline-flex items-center gap-1 transition-colors group-hover:opacity-80"
                style={{ color: card.dot }}
              >
                {card.linkLabel}
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
