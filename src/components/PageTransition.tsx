'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Overlay cruce la tranziție */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.6, times: [0, 0.3, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.15) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: [0, 1.2, 0], rotate: [-45, 0, 45] }}
            transition={{ duration: 0.6 }}
            style={{ color: '#C9A96E', fontSize: '48px', opacity: 0.6 }}
          >
            ✝
          </motion.div>
        </motion.div>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
