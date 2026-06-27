import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Istoria Bisericii',
  description:
    'Istoria Bisericii Sfântul Ierarh Nicolae din Hîrtopul Mic, Criuleni, Moldova. Ctitorii, etapele de construcție și restaurare a lăcașului de cult de la întemeierea sa în secolul al XIX-lea.',
}

const FALLBACK_SECTIONS = [
  {
    title: 'Întemeierea (sec. XIX)',
    text: `Prima atestare documentară a parohiei datează din a doua jumătate a secolului al XIX-lea. Conform mărturiilor orale și arhivelor ecleziastice, prima structură de lemn a fost ridicată de ctitorii din sat, cu sprijinul comunității locale. Hramul Sfântului Ierarh Nicolae — arhiepiscopul Mirelor Lichiei, ocrotitorul celor în nevoi — a fost ales de la bun început, reflectând evlavia deosebită a locuitorilor față de acest sfânt.`,
  },
  {
    title: 'Construcția edificiului actual',
    text: `La sfârșitul secolului al XIX-lea și începutul celui de-al XX-lea, comunitatea parohială a decis ridicarea unei noi biserici din piatră și cărămidă, mai trainice și mai încăpătoare. Lucrările s-au desfășurat în mai mulți ani, cu contribuția materială și fizică a credincioșilor din Hîrtopul Mic și din localitățile vecine. Arhitectura îmbină elemente ale stilului ecleziastic moldovenesc cu influențe neo-bizantine.`,
  },
  {
    title: 'Perioadele de restriște',
    text: `Ca toate lăcașurile de cult din Moldova, Biserica Sfântul Ierarh Nicolae a traversat perioade de restriște în secolul al XX-lea. În timpul regimului sovietic, activitatea religioasă a fost limitată, iar edificiul a suferit din lipsa întreținerii corespunzătoare. Cu toate acestea, credincioșii au păstrat vie tradiția ortodoxă, transmițindu-o din generație în generație.`,
  },
  {
    title: 'Renașterea după 1991',
    text: `Odată cu obținerea independenței Republicii Moldova, viața parohială a înflorit din nou. Au fost reluate slujbele regulate, comunitatea s-a reunit în jurul lăcașului sfânt, iar primele lucrări de renovare au putut fi efectuate. În deceniile următoare, cu sprijinul enoriașilor din țară și din diasporă, biserica a primit o serie de îmbunătățiri.`,
  },
  {
    title: 'Proiecte actuale de restaurare',
    text: `Parohia se află în prezent în mijlocul unui amplu program de restaurare și înfrumusețare. Prioritățile includ renovarea completă a acoperișului, restaurarea turnului clopotniță, realizarea picturii murale în interior și modernizarea instalațiilor. Aceste lucrări sunt posibile datorită jertfelnicitei contribuții a credincioșilor și a binecuvântării ierarhilor Mitropoliei Chișinăului și a întregii Moldove.`,
  },
]

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default async function IstoriaBisericiiPage() {
  let dynContent: string | null = null
  let gallery: { url: string; alt: string }[] = []
  let videos: { url: string; title: string }[] = []

  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'church_history_content' } })
    if (setting) {
      const data = JSON.parse(setting.value)
      dynContent = data.content || null
      gallery = data.gallery || []
      videos = data.videos || []
    }
  } catch { /* use fallback */ }

  return (
    <div>
      {/* Banda panoramică 21:9 */}
      <div className="w-full overflow-hidden" style={{ aspectRatio: '21/9', position: 'relative', maxHeight: '420px' }}>
        <Image
          src="/images/12.jpg"
          alt="Vedere aeriană a Bisericii Sfântul Ierarh Nicolae, Hîrtopul Mic"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,4,1,0.1) 0%, rgba(7,4,1,0.45) 100%)' }} />
      </div>

      {/* Dark header */}
      <div className="py-14 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Parohia Sfântul Ierarh Nicolae
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400 }}>
          Istoria Bisericii
        </h1>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
        <p className="font-body text-sm" style={{ color: '#6A5030' }}>
          Hîrtopul Mic · Raionul Criuleni · Republica Moldova
          <br />
          Mitropolia Chișinăului și a întregii Moldove
        </p>
      </div>

      {/* Conținut articol */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {dynContent ? (
          <div
            className="tiptap-prose"
            dangerouslySetInnerHTML={{ __html: dynContent }}
          />
        ) : (
          <>
            <p className="font-body text-lg leading-relaxed mb-12 text-center italic" style={{ color: '#4A3020' }}>
              Biserica Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, este unul dintre lăcașurile de cult cu o istorie îndelungată din ținuturile Moldovei. Întemeiată în secolul al XIX-lea, biserica a fost martoră a nenumărate generații de credincioși care și-au botezat pruncii, și-au cununat tinerii și și-au odihnit pe cei adormiți.
            </p>
            <div className="h-px mb-12" style={{ backgroundColor: '#E8E5E0' }} />
            <div className="space-y-12">
              {FALLBACK_SECTIONS.map((section, i) => (
                <article key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#C9A84C' }} aria-hidden="true" />
                    <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>{section.title}</h2>
                  </div>
                  <p className="font-body text-base leading-relaxed pl-5" style={{ color: '#3A2010', lineHeight: '1.8' }}>
                    {section.text}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ GALERIE FOTO ══ */}
      <section style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E8DFC8', borderBottom: '1px solid #E8DFC8' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-4 mb-8">
            <span className="flex-1 h-px" style={{ backgroundColor: '#D4C8A0' }} />
            <h2 className="font-body text-xs uppercase tracking-[0.35em]" style={{ color: '#8A7050' }}>Galerie Foto</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: '#D4C8A0' }} />
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-10">
              <span style={{ color: '#D4C8A0', fontSize: '40px' }} aria-hidden="true">📷</span>
              <p className="font-body text-sm mt-3" style={{ color: '#8A7050' }}>
                Imaginile vor fi adăugate de administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || 'Fotografie Biserică'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ SECȚIUNEA VIDEO ══ */}
      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-4 mb-8">
            <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-body text-xs uppercase tracking-[0.35em]" style={{ color: '#8A7050' }}>Video</h2>
            <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
          </div>

          {videos.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#F7F3EC', border: '2px dashed #D4C8A0' }}>
              <span style={{ color: '#D4C8A0', fontSize: '40px' }} aria-hidden="true">▶</span>
              <p className="font-body text-sm mt-3" style={{ color: '#8A7050' }}>
                Videoclipurile vor fi adăugate de administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v, i) => {
                const ytId = extractYouTubeId(v.url)
                return (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid #E8E5E0' }}>
                    <div style={{ aspectRatio: '16/9' }}>
                      {ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={v.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F7F3EC' }}>
                          <span style={{ color: '#8A7050', fontSize: '2rem' }}>▶</span>
                        </a>
                      )}
                    </div>
                    <p className="font-body text-sm p-3" style={{ color: '#3A1A1A' }}>{v.title}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Donații */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
          <span style={{ color: '#C9A84C', fontSize: '32px' }} aria-hidden="true">☦</span>
          <p className="font-body text-base mt-4 mb-6" style={{ color: '#4A3020' }}>
            Susținerea lucrărilor de restaurare ale acestui lăcaș sfânt este un act de binecuvântare pentru generațiile viitoare.
          </p>
          <a
            href="/donatii"
            className="font-body text-sm px-6 py-2.5 rounded inline-block transition-all hover:opacity-90"
            style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9' }}
          >
            Susțineți restaurarea bisericii
          </a>
        </div>
      </div>
    </div>
  )
}
