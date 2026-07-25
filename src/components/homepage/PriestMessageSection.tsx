import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { FALLBACK_MESAJ, FALLBACK_SEMNATURA, firstSentences } from '@/lib/priestMessage'

export default async function PriestMessageSection() {
  const locale = await getServerLocale()
  const mesaj = await prisma.priestMessage.findFirst({ where: { active: true } })

  const photoUrl = mesaj?.photoUrl ?? null
  const mesajText = mesaj ? pick(locale, mesaj.mesajRo, mesaj.mesajRu, mesaj.mesajEn) : FALLBACK_MESAJ
  const semnatura = mesaj ? pick(locale, mesaj.semnaturaRo, mesaj.semnaturaRu, mesaj.semnaturaEn) : FALLBACK_SEMNATURA
  const excerpt = firstSentences(mesajText, 2) + '…'

  return (
    <section style={{ backgroundColor: '#f0ebe2', width: '100%', padding: '3rem 1rem' }}>
      <style>{`
        @media (max-width: 640px) {
          .priest-msg-row { flex-direction: column !important; align-items: center !important; text-align: center; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto priest-msg-row" style={{ display: 'flex', flexDirection: photoUrl ? 'row' : 'column', gap: '1.75rem', alignItems: 'flex-start' }}>
        {photoUrl && (
          <img
            src={photoUrl}
            alt={semnatura}
            style={{ width: '100px', height: '130px', borderRadius: '8px', border: '1px solid #C9A96E', objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3A2A10', fontSize: '1rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
            {excerpt}
          </p>
          <p style={{ fontFamily: 'Georgia, serif', color: '#C9A96E', fontSize: '0.9rem' }}>
            — {semnatura}
          </p>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <Link href="/mesajul-parintelui" style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: '#8A7050', textDecoration: 'none' }}>
              Citește mesajul complet →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
