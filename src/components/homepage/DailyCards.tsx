'use client'

import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/context'

interface DailyData {
  saints: string[]
  gospel: { reference: string; text: string }
  prayer: { title: string; text: string; slug: string | null; day: string }
}

interface DailyCardsProps {
  data: DailyData
  enabled: Record<string, boolean>
  order: string[]
}

const GRID_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1 lg:grid-cols-1 max-w-md',
  2: 'sm:grid-cols-2 lg:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

export default function DailyCards({ data, enabled, order }: DailyCardsProps) {
  const { t } = useI18n()
  const allCards = [
    {
      key: 'sfintii_zilei',
      dot: '#D4AF37',
      icon: '✦',
      label: t.home.saintsToday,
      content: (
        <div>
          {data.saints.length > 0 ? (
            <ul className="space-y-2.5">
              {data.saints.slice(0, 3).map((saint, i) => (
                <li key={i} className="font-body text-sm leading-snug" style={{ color: '#E9EFFA' }}>
                  {saint}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-sm italic" style={{ color: '#828EA8' }}>
              {t.home.noSaints}
            </p>
          )}
          {data.saints.length > 3 && (
            <a
              href="/sfintii"
              className="font-body text-xs mt-4 inline-flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: '#D4AF37' }}
            >
              {t.home.allSaintsLink}
            </a>
          )}
        </div>
      ),
      link: '/sfintii',
      linkLabel: '',
    },
    {
      key: 'evanghelia_zilei',
      dot: '#8B2635',
      icon: '✦',
      label: t.home.gospelToday,
      content: (
        <div>
          <p className="font-heading text-sm font-semibold mb-2" style={{ color: '#C06050' }}>
            {data.gospel.reference}
          </p>
          <p className="font-body text-sm leading-relaxed line-clamp-4" style={{ color: '#E9EFFA' }}>
            &ldquo;{data.gospel.text}&rdquo;
          </p>
        </div>
      ),
      link: '/biblie',
      linkLabel: t.home.readFullGospel,
    },
    {
      key: 'rugaciunea_zilei',
      dot: '#5A8FE8',
      icon: '✦',
      label: t.home.prayerToday,
      content: (
        <div>
          <p className="font-body text-xs uppercase tracking-wide mb-1" style={{ color: '#828EA8' }}>
            {data.prayer.day}
          </p>
          <p className="font-heading text-sm font-semibold mb-2" style={{ color: '#5A8FE8' }}>
            {data.prayer.title}
          </p>
          <p className="font-body text-sm leading-relaxed line-clamp-3 italic" style={{ color: '#E9EFFA' }}>
            {data.prayer.text}
          </p>
        </div>
      ),
      link: data.prayer.slug ? `/carti/${data.prayer.slug}` : '/carti',
      linkLabel: t.home.readFullPrayer,
    },
  ]

  const cards = allCards
    .filter(card => enabled[card.key] !== false)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  if (cards.length === 0) return null

  return (
    <section className="py-14" style={{ position: 'relative', zIndex: 2 }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid carduri */}
        <div className={`grid grid-cols-1 ${GRID_COLS[cards.length] || GRID_COLS[4]} gap-4 ${cards.length === 1 ? 'mx-auto' : ''}`}>
          {cards.map((card, i) => (
            <motion.article
              key={card.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
              className="glass-cobalt p-5 flex flex-col justify-between group"
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
                <div className="h-px mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

                {/* Content */}
                <div className="min-h-[100px]">{card.content}</div>
              </div>

              {/* Link */}
              {card.linkLabel && (
                <a
                  href={card.link}
                  className="font-body text-xs mt-5 inline-flex items-center gap-1 transition-colors group-hover:opacity-80"
                  style={{ color: card.dot }}
                >
                  {card.linkLabel}
                </a>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
