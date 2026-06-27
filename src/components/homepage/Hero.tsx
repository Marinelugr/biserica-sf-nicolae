'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/context'

export default function Hero() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { t } = useI18n()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/cautare?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/12.jpg"
          alt="Vedere aeriană a Bisericii Sfântul Ierarh Nicolae, Hîrtopul Mic"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(7, 4, 1, 0.73)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-heading italic leading-tight mb-5"
          style={{ color: '#C9A84C', fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 400 }}
        >
          {t.home.heroTitle}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <span className="h-px w-16 block" style={{ backgroundColor: '#5A4020' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#5A4020' }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-body mb-2"
          style={{ color: '#C9A84C', fontSize: '20px' }}
        >
          {t.home.heroSubtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="font-body mb-10"
          style={{ color: '#9B8050', fontSize: '20px' }}
        >
          {t.home.heroMitropolia}
        </motion.p>

        {/* Bara de căutare globală */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          onSubmit={handleSearch}
          className="flex gap-0 max-w-lg mx-auto rounded-md overflow-hidden shadow-2xl"
        >
          <label htmlFor="site-search" className="sr-only">{t.home.searchPlaceholder}</label>
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="flex-1 px-4 py-3 text-sm font-body outline-none"
            style={{
              backgroundColor: 'rgba(13, 9, 5, 0.85)',
              color: '#F2EBD9',
              border: '1px solid #3A2010',
              borderRight: 'none',
            }}
          />
          <button
            type="submit"
            className="px-5 py-3 text-sm font-body font-medium transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
            aria-label={t.home.searchBtn}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd" />
            </svg>
            {t.home.searchBtn}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-10 flex justify-center gap-6"
          style={{ paddingBottom: '40px' }}
        >
          <a
            href="/despre"
            className="font-body text-sm px-6 py-2.5 rounded border transition-all hover:bg-white/5"
            style={{ color: '#C9A84C', borderColor: '#5A4020' }}
          >
            {t.home.aboutBtn}
          </a>
          <a
            href="/donatii"
            className="font-body text-sm px-6 py-2.5 rounded transition-all hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
          >
            {t.home.donateBtn}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
