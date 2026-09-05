import type { Metadata } from 'next'
import Image from 'next/image'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getServerT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getPriest() {
  try {
    return await prisma.priest.findFirst({ select: { nameRo: true, titleRo: true, photoUrl: true } })
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  const m = t.meta.despre
  return {
    title: m.title,
    description: m.description,
    alternates: buildAlternates('/despre'),
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      images: ['/images/12.jpg'],
    },
  }
}

export default async function DesprePage() {
  const priest = await getPriest()

  return (
    <>
      {/* ─── Banda panoramică 21:9 ─── */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '21/9', maxHeight: '480px' }}>
        <Image
          src="/images/12.jpg"
          alt="Vedere aeriană a Bisericii Sfântul Ierarh Nicolae, Hîrtopul Mic"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
      </div>

      {/* ─── Conținut principal ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Titlu secțiune */}
        <div className="text-center mb-14">
          <p className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: '#8A7050' }}>
            Parohia Ortodoxă
          </p>
          <h1 className="font-heading mb-4" style={{ color: '#1C1B3A', fontSize: 'clamp(42px, 6vw, 68px)' }}>
            Despre Parohie
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
            <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
            <span className="h-px w-20 block" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
        </div>

        {/* ─── Istoricul ─── */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl mb-6" style={{ color: '#1C1B3A' }}>
            Istoria Parohiei
          </h2>
          <div className="prose prose-lg max-w-none" style={{ color: '#3A1A1A' }}>
            <p className="font-body text-lg leading-relaxed mb-4">
              Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, este una dintre
              parohiile ortodoxe cu tradiție îndelungată din inima Moldovei. Comunitatea ortodoxă
              din această localitate a menținut vie credința strămoșească de-a lungul generațiilor.
            </p>
            <p className="font-body text-lg leading-relaxed mb-4">
              Biserica actuală a fost construită cu osteneala și jertfelnicia credincioșilor
              din parohie, sub îndrumarea spirituală a preoților care au slujit de-a lungul
              timpului la acest sfânt locaș.
            </p>
            <p className="font-body text-lg leading-relaxed">
              Sfântul Ierarh Nicolae, ocrotitorul parohiei, este prăznuit în fiecare an pe
              19 decembrie (stil vechi) cu mare evlavie de întreaga comunitate.
            </p>
          </div>
        </section>

        {/* ─── Divider ─── */}
        <div className="h-px my-12" style={{ backgroundColor: '#E8E5E0' }} />

        {/* ─── Parohul ─── */}
        <section className="mb-14">
          <h2 className="font-heading text-2xl mb-8" style={{ color: '#1C1B3A' }}>
            Parohul
          </h2>
          <div
            className="flex flex-col sm:flex-row gap-8 p-8 rounded-lg"
            style={{ backgroundColor: '#F8F7F5', border: '1px solid #E8E5E0' }}
          >
            {priest?.photoUrl ? (
              <img
                src={priest.photoUrl}
                alt={priest.nameRo || 'Preot paroh'}
                className="shrink-0"
                style={{
                  width: '190px',
                  height: '230px',
                  borderRadius: '10px',
                  border: '2px solid rgba(212,175,55,0.4)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: '190px',
                  height: '230px',
                  borderRadius: '10px',
                  border: '2px solid rgba(212,175,55,0.4)',
                  backgroundColor: '#F2EBD9',
                }}
              >
                <span style={{ color: '#C9A84C', fontSize: '48px' }} aria-hidden="true">☦</span>
              </div>
            )}
            <div>
              <h3 className="font-heading text-xl mb-1" style={{ color: '#1C1B3A' }}>
                {priest?.nameRo || 'Preot paroh'}
              </h3>
              <p className="font-body text-base mb-4" style={{ color: '#8A7050' }}>
                {priest?.titleRo
                  ? `${priest.titleRo} · Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic`
                  : 'Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic'}
              </p>
              <p className="font-body text-base leading-relaxed" style={{ color: '#3A1A1A' }}>
                Parohia este păstorită cu dragoste și devoțiune, menținând vie tradiția
                ortodoxă în comunitatea Hîrtopul Mic. Slujbele se țin conform calendarului
                liturgic ortodox, în fiecare duminică și la toate sărbătorile.
              </p>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="text-center">
          <a
            href="/contact"
            className="font-body inline-flex items-center gap-2 px-8 py-3 rounded transition-all hover:opacity-90"
            style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
          >
            Contactează Parohia
          </a>
          <a
            href="/donatii"
            className="font-body inline-flex items-center gap-2 px-8 py-3 rounded border ml-4 transition-all hover:bg-red-900/10"
            style={{ borderColor: '#8B1A1A', color: '#8B1A1A' }}
          >
            Susține parohia
          </a>
        </div>
      </div>
    </>
  )
}
