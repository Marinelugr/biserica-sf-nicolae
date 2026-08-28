import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FALLBACK_MESAJ, FALLBACK_SEMNATURA, FALLBACK_PHOTO_URL, firstSentences } from '@/lib/priestMessage'

export default async function PriestMessageSection() {
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })

  const photoUrl = mesaj?.photoUrl ?? FALLBACK_PHOTO_URL
  const mesajText = mesaj?.mesajRo || FALLBACK_MESAJ
  const semnatura = mesaj?.semnaturaRo || FALLBACK_SEMNATURA
  const excerpt = firstSentences(mesajText, 2) + '…'

  return (
    <section style={{ width: '100%', padding: '3rem 1rem', position: 'relative', zIndex: 2 }}>
      <style>{`
        @media (max-width: 640px) {
          .priest-msg-row { flex-direction: column !important; align-items: center !important; text-align: center; }
        }
      `}</style>
      <div className="glass-cobalt max-w-4xl mx-auto priest-msg-row" style={{ display: 'flex', flexDirection: photoUrl ? 'row' : 'column', gap: '1.75rem', alignItems: 'center', padding: '2.5rem' }}>
        {photoUrl && (
          <Link href="/paroh" aria-label="Vezi pagina Parohul Bisericii" style={{ flexShrink: 0, display: 'block' }}>
            <img
              src={photoUrl}
              alt={semnatura}
              style={{
                width: '190px',
                height: '230px',
                borderRadius: '10px',
                border: '2px solid rgba(212,175,55,0.4)',
                objectFit: 'cover',
                display: 'block',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
            />
          </Link>
        )}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', color: '#E9EFFA', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
            {excerpt}
          </p>
          <p style={{ fontFamily: 'Georgia, serif', color: '#C9A84C', fontSize: '0.9rem', fontWeight: 600 }}>
            — {semnatura}
          </p>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <Link href="/mesajul-parintelui" style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: '#828EA8', textDecoration: 'none' }}>
              Citește mesajul complet →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
