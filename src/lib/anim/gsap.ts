'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Înregistrare unică (modulul se evaluează o singură dată în bundle-ul client)
gsap.registerPlugin(useGSAP, ScrollTrigger)
gsap.defaults({ ease: 'power2.out', duration: 0.6 })

export { gsap, ScrollTrigger, useGSAP }
