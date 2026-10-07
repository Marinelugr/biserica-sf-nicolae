'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/anim/gsap'

/**
 * Animațiile discrete ale paginii (GSAP):
 *  - intrarea cardului de profil: poza cu un scale fin, textul în cascadă;
 *  - [data-reveal] pe postările din flux: fade + 24px, stagger .08, o singură dată.
 * Starea inițială ascunsă e dată de CSS (globals.css) doar când motion e permis;
 * fără JS, <noscript> din layout o anulează. Cu prefers-reduced-motion: zero animații.
 */
export default function RevealScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        root.setAttribute('data-reveal-ready', '')

        // după animație: marcăm elementul și ștergem stilurile inline (hover-ul CSS rămâne activ)
        const done = (els: Element[]) => {
          els.forEach(el => el.setAttribute('data-revealed', ''))
          gsap.set(els, { clearProps: 'opacity,transform' })
        }

        const photo = root.querySelector('[data-intro-photo] img')
        const intro = gsap.utils.toArray<HTMLElement>('[data-intro-text]', root)
        if (photo) gsap.fromTo(photo, { scale: 1.06 }, { scale: 1, duration: 0.9, ease: 'power2.out' })
        if (intro.length) {
          gsap.fromTo(intro, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, delay: 0.1, onComplete: () => done(intro) })
        }

        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
        // opacity (nu autoAlpha): elementele rămân focusabile cu tastatura înainte de a apărea
        gsap.set(items, { opacity: 0, y: 24 })
        ScrollTrigger.batch(items, {
          start: 'top 92%',
          once: true,
          onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, overwrite: true, onComplete: () => done(batch) }),
        })
        // Elemente ascunse de filtre (display:none) apar fără animație când redevin vizibile
        const refresh = () => ScrollTrigger.refresh()
        // focus cu tastatura pe un element încă neanimat → îl afișăm imediat
        const onFocus = (e: FocusEvent) => {
          const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-reveal]')
          if (el && !el.hasAttribute('data-revealed')) gsap.to(el, { opacity: 1, y: 0, duration: 0.3, overwrite: true, onComplete: () => done([el]) })
        }
        window.addEventListener('feed:filter', refresh)
        root.addEventListener('focusin', onFocus)
        return () => {
          window.removeEventListener('feed:filter', refresh)
          root.removeEventListener('focusin', onFocus)
          root.removeAttribute('data-reveal-ready')
        }
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
