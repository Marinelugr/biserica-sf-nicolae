import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { buildAlternates } from '@/lib/i18n/alternates'
import ShareButtons from '@/components/shared/ShareButtons'
import { FALLBACK_MESAJ, FALLBACK_SEMNATURA, FALLBACK_PHOTO_URL } from '@/lib/priestMessage'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biserica-sf-nicolae.org'
const SHARE_URL = `${SITE_URL}/mesajul-parintelui`
const SHARE_TEXT = 'Mesajul Părintelui Marin Grigoriță, Parohul Bisericii Sfântul Ierarh Nicolae din Hîrtopul Mic'

export async function generateMetadata(): Promise<Metadata> {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })
  const mesajRo = mesaj?.mesajRo || FALLBACK_MESAJ
  const description = mesajRo.slice(0, 160)

  return {
    title: 'Mesajul Părintelui | Sf. Nicolae Hîrtopul Mic',
    description,
    alternates: buildAlternates('/mesajul-parintelui'),
    openGraph: {
      title: 'Mesajul Părintelui',
      description,
      type: 'article',
      url: '/mesajul-parintelui',
      siteName: 'Biserica Sfântul Ierarh Nicolae',
      locale: 'ro_RO',
      ...(mesaj?.photoUrl ? { images: [{ url: mesaj.photoUrl }] } : {}),
    },
  }
}

export default async function MesajulParinteluiPage() {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })

  const photoUrl = mesaj?.photoUrl ?? FALLBACK_PHOTO_URL
  const mesajText = mesaj?.mesajRo || FALLBACK_MESAJ
  const semnatura = mesaj?.semnaturaRo || FALLBACK_SEMNATURA
  const updatedAt = mesaj ? mesaj.updatedAt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <div>
      {/* Hero dark */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 400 }}>
          Mesajul Părintelui
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'Georgia, serif', fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: '#8A7050', textDecoration: 'none' }}>Acasă</Link>
          <span style={{ color: '#C9A96E' }}>›</span>
          <span style={{ color: '#6A5030' }}>Mesajul Părintelui</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={semnatura}
              style={{ width: '250px', aspectRatio: '3/4', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #C9A96E' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3A2A10', fontSize: '1.05rem', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {mesajText}
            </p>
            <p style={{ fontFamily: 'Georgia, serif', color: '#C9A96E', fontSize: '0.95rem', marginTop: '1.5rem' }}>
              — {semnatura}
            </p>
            {updatedAt && (
              <p style={{ fontFamily: 'Georgia, serif', color: '#9B8050', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Actualizat la {updatedAt}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E8DFC8', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '0.875rem', color: '#8A7050', textDecoration: 'none' }}>
            ← Înapoi
          </Link>
          <ShareButtons url={SHARE_URL} title={SHARE_TEXT} />
        </div>
      </div>
    </div>
  )
}
