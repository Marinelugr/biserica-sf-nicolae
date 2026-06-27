import type { Metadata } from 'next'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Video Ortodox',
  description: 'Filme ortodoxe, acatiste video, conferințe, predici și rugăciuni. Colecția video a Parohiei Sfântul Ierarh Nicolae.',
}

type VideoItem = { id: string; title: string; duration: string; thumb: null }

function VideoCard({ video }: { video: VideoItem }) {
  return (
    <div
      className="group rounded-lg overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      style={{ border: '1px solid #E8E5E0' }}
    >
      <div
        className="w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', backgroundColor: '#1C1B3A', position: 'relative' }}
      >
        <span style={{ color: '#C9A84C', fontSize: '40px' }} aria-hidden="true">▶</span>
        {video.duration && (
          <span
            className="absolute bottom-2 right-2 font-body text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#F2EBD9', fontSize: '11px' }}
          >
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-3" style={{ backgroundColor: '#FAFAF8' }}>
        <p className="font-body text-sm leading-snug group-hover:underline" style={{ color: '#1C1B3A', textDecorationColor: '#C9A84C' }}>
          {video.title}
        </p>
      </div>
    </div>
  )
}

export default async function VideoPage() {
  const t = await getServerT()

  const CATEGORIES = [
    {
      key: 'orthodoxFilms' as const,
      icon: '🎬',
      videos: [
        { id: 'placeholder-1', title: 'Film despre viața Sfântului Nicolae', duration: '1:24:00', thumb: null },
        { id: 'placeholder-2', title: 'Documentar: Mânăstirile Moldovei', duration: '52:30', thumb: null },
      ],
    },
    {
      key: 'akathists' as const,
      icon: '☦',
      videos: [
        { id: 'placeholder-3', title: 'Acatistul Sfântului Ierarh Nicolae', duration: '45:00', thumb: null },
        { id: 'placeholder-4', title: 'Acatistul Maicii Domnului', duration: '38:20', thumb: null },
      ],
    },
    {
      key: 'conferences' as const,
      icon: '🎙',
      videos: [
        { id: 'placeholder-5', title: 'Conferință despre tradiția ortodoxă', duration: '1:10:00', thumb: null },
      ],
    },
    {
      key: 'prayers' as const,
      icon: '🕯',
      videos: [
        { id: 'placeholder-6', title: 'Rugăciunile dimineții', duration: '15:00', thumb: null },
        { id: 'placeholder-7', title: 'Rugăciunile serii', duration: '18:00', thumb: null },
      ],
    },
    {
      key: 'sermons' as const,
      icon: '📖',
      videos: [
        { id: 'placeholder-8', title: 'Predică la Duminica Floriilor', duration: '22:00', thumb: null },
      ],
    },
  ]

  return (
    <div>
      {/* Hero dark */}
      <div
        className="py-16 px-4 text-center"
        style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}
      >
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Parohia Sfântul Ierarh Nicolae
        </p>
        <h1
          className="font-heading italic leading-tight mb-5"
          style={{ color: '#C9A84C', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 400 }}
        >
          {t.video.title}
        </h1>
        <p className="font-body" style={{ color: '#6A5030', fontSize: '16px' }}>
          {t.video.subtitle}
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '18px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Notă placeholder */}
        <div
          className="mb-12 p-5 rounded-lg text-center"
          style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}
        >
          <span style={{ color: '#C9A84C', fontSize: '24px' }} aria-hidden="true">☦</span>
          <p className="font-body text-sm mt-3" style={{ color: '#6A5030' }}>
            {t.video.comingSoon}
          </p>
        </div>

        {/* Categorii video */}
        <div className="space-y-14">
          {CATEGORIES.map(cat => (
            <section key={cat.key}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>
                  {t.video.categories[cat.key]}
                </h2>
                <span className="flex-1 h-px" style={{ backgroundColor: '#E8E5E0' }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cat.videos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}

                {/* Card adăugare admin */}
                <div
                  className="rounded-lg flex items-center justify-center"
                  style={{ aspectRatio: '16/9', border: '2px dashed #E8E5E0', backgroundColor: '#F8F7F5', cursor: 'default' }}
                >
                  <div className="text-center p-4">
                    <span style={{ color: '#D4C8A0', fontSize: '24px' }} aria-hidden="true">+</span>
                    <p className="font-body text-xs mt-1" style={{ color: '#C0B090' }}>
                      {t.video.addVideoHint}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
