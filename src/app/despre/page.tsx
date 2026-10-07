import type { Metadata } from 'next'
import Link from 'next/link'
import { buildAlternates } from '@/lib/i18n/alternates'
import { getServerT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'

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
    <PageShell aside="compact">
      <PageHead eyebrow="Parohia Ortodoxă" title="Despre Parohie" />

      <section className="card" aria-labelledby="despre-istoria">
        <h2 id="despre-istoria" className="h-m mb-4">Istoria Parohiei</h2>
        <div className="reading flex flex-col gap-4">
          <p>
            Parohia Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, este una dintre
            parohiile ortodoxe cu tradiție îndelungată din inima Moldovei. Comunitatea ortodoxă
            din această localitate a menținut vie credința strămoșească de-a lungul generațiilor.
          </p>
          <p>
            Biserica actuală a fost construită cu osteneala și jertfelnicia credincioșilor
            din parohie, sub îndrumarea spirituală a preoților care au slujit de-a lungul
            timpului la acest sfânt locaș.
          </p>
          <p>
            Sfântul Ierarh Nicolae, ocrotitorul parohiei, este prăznuit în fiecare an pe
            19 decembrie (stil vechi) cu mare evlavie de întreaga comunitate.
          </p>
        </div>
      </section>

      <section className="card" aria-labelledby="despre-paroh" data-reveal>
        <h2 id="despre-paroh" className="h-m mb-5">Parohul</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          {priest?.photoUrl ? (
            <span className="portrait sm shrink-0" style={{ width: 160 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL din DB, gazda poate lipsi din remotePatterns */}
              <img src={priest.photoUrl} alt={priest.nameRo || 'Preot paroh'} width={160} height={200} decoding="async" loading="lazy" />
            </span>
          ) : (
            <span className="portrait sm ph shrink-0" style={{ width: 160 }} aria-hidden="true">
              <span style={{ fontSize: 44 }}>☦</span>
            </span>
          )}
          <div className="flex flex-col gap-2">
            <h3 className="h-s">{priest?.nameRo || 'Preot paroh'}</h3>
            <p className="gold text-[18px]">
              {priest?.titleRo
                ? `${priest.titleRo} · Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic`
                : 'Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic'}
            </p>
            <p className="reading">
              Parohia este păstorită cu dragoste și devoțiune, menținând vie tradiția
              ortodoxă în comunitatea Hîrtopul Mic. Slujbele se țin conform calendarului
              liturgic ortodox, în fiecare duminică și la toate sărbătorile.
            </p>
          </div>
        </div>
      </section>

      <div className="card flex flex-wrap gap-3" style={{ padding: '20px 24px' }}>
        <Link href="/contact" className="btn">Contactează Parohia</Link>
        <Link href="/donatii" className="btn red">Susține parohia</Link>
      </div>
    </PageShell>
  )
}
