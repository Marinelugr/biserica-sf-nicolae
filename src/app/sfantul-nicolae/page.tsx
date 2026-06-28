import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PublicGallery from '@/components/PublicGallery'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sfântul Ierarh Nicolae',
  description:
    'Viața Sfântului Ierarh Nicolae — Arhiepiscopul Mirelor Lichiei. Tropar, Condac, date ale prăznuirii și Acatistul Sfântului Nicolae.',
}

const FALLBACK_TROPAR = `Regulă a credinței și chip al blândeții, / învățătorule al înfrânării, / te-a arătat pe tine turmei tale adevărul lucrurilor. / Pentru aceasta ai câștigat cu smerenia cele înalte, / cu sărăcia cele bogate. / Părinte Ierarhe Nicolae, / roagă pe Hristos Dumnezeu să mântuiască sufletele noastre.`

const FALLBACK_CONDAC = `În Mireele Lichiei, sfinte, sfințitor te-ai arătat; / că Evanghelia lui Hristos plinind-o, / sufletul tău ți-ai pus pentru poporul tău, / și pe nevinovați i-ai mântuit de moarte. / Pentru aceasta te-ai sfințit / ca un mare înțelegător al harului lui Dumnezeu.`

const FALLBACK_VIATA = [
  { titlu: 'Nașterea și tinerețea', text: `Sfântul Ierarh Nicolae s-a născut în jurul anului 270 d.Hr. în orașul Patara din Licia (Asia Mică, actuala Turcie). Părinții săi, Epifanie și Ana, erau oameni evlavioși și înstăriți, care l-au crescut în frica de Dumnezeu. Rămas orfan de timpuriu, Nicolae a moștenit averea părinților, pe care a împărțit-o celor săraci.` },
  { titlu: 'Arhiepiscopul Mirelor Lichiei', text: `Ales în chip minunat ca arhiepiscop al Mirelor Lichiei, Sfântul Nicolae a păstorit cu înțelepciune și smerenie turma sa. Era cunoscut pentru blândețea sa, pentru dragostea față de cei săraci și pentru darul făcerii de minuni. A participat la Sinodul I Ecumenic de la Niceea (325 d.Hr.), apărând cu fervoare dreapta credință împotriva ereziei lui Arie.` },
  { titlu: 'Faptele milostiviei', text: `Dintre nenumăratele sale fapte de milostenie, cea mai renumită este ajutorarea unui om sărac cu trei fete. Neputând să le înzestreze pentru căsătorie, tatăl era în mare strâmtorare. Sfântul Nicolae, auzind de aceasta, a aruncat noaptea, pe fereastră, câte un sac cu aur pentru fiecare fată.` },
  { titlu: 'Adormirea și prăznuirea', text: `Sfântul Nicolae a adormit întru Domnul în jurul anului 345 d.Hr., la o vârstă înaintată. Sfintele sale moaște au rămas la Mireele Lichiei până în anul 1087, când, din cauza amenințărilor islamice, au fost aduse la Bari (Italia), unde se găsesc și astăzi în Bazilica San Nicola. Sfântul este prăznuit de două ori pe an: pe 19 Decembrie și pe 22 Mai.` },
]

function renderPoem(text: string) {
  return text.split('/').map((line, i, arr) => (
    <span key={i}>{line.trim()}{i < arr.length - 1 && <br />}</span>
  ))
}

export default async function SfantulNicolaePage() {
  let dynLife: string | null = null
  let dynTropar: string | null = null
  let dynCondac: string | null = null
  let iconUrl: string | null = null
  let feast1 = '19 Decembrie — Adormirea Sfântului Nicolae'
  let feast1Desc = 'Ziua principală de prăznuire. Sfântul s-a săvârșit din viață în jurul anului 345 d.Hr.'
  let feast2 = '22 Mai — Aducerea Sfintelor Moaște la Bari'
  let feast2Desc = 'Comemorarea transferului moaștelor din Mireele Lichiei la Bari (Italia) în 1087.'

  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'saint_nicholas_content' } })
    if (setting) {
      const data = JSON.parse(setting.value)
      dynLife = data.life || null
      dynTropar = data.tropar || null
      dynCondac = data.condac || null
      iconUrl = data.iconUrl || null
      if (data.feast1) feast1 = data.feast1
      if (data.feast1Desc) feast1Desc = data.feast1Desc
      if (data.feast2) feast2 = data.feast2
      if (data.feast2Desc) feast2Desc = data.feast2Desc
    }
  } catch { /* use fallback */ }

  const tropar = dynTropar || FALLBACK_TROPAR
  const condac = dynCondac || FALLBACK_CONDAC

  const saintGallery = await prisma.mediaItem.findMany({
    where: { entityType: 'saint', entityId: 'sfantul-nicolae' },
    orderBy: { order: 'asc' },
  })

  return (
    <div>
      {/* Dark hero */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#0D0905', borderBottom: '1px solid #1E1208' }}>
        <p className="font-body text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#8A7050' }}>
          Hramul Parohiei
        </p>
        <h1 className="font-heading italic leading-tight mb-5" style={{ color: '#C9A84C', fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 400 }}>
          Sfântul Ierarh Nicolae
        </h1>
        <p className="font-body mb-6" style={{ color: '#6A5030', fontSize: '15px' }}>
          Arhiepiscopul Mirelor Lichiei, Făcătorul de minuni
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
          <span style={{ color: '#C9A84C', fontSize: '20px' }} aria-hidden="true">☦</span>
          <span className="h-px w-16 block" style={{ backgroundColor: '#3A2010' }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Icoana + Date prăznuire */}
        <div className="flex flex-col md:flex-row gap-10 mb-16 items-start">
          {/* Icoana */}
          <div className="w-full md:w-64 shrink-0 rounded-lg overflow-hidden" style={{ minHeight: '280px', border: '1px solid #E8DFC8' }}>
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="Icoana Sfântului Ierarh Nicolae" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '280px' }} />
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-16" style={{ backgroundColor: '#F7F3EC', minHeight: '280px' }}>
                <span style={{ color: '#D4C8A0', fontSize: '64px' }} aria-hidden="true">☦</span>
                <p className="font-body text-xs mt-4 text-center px-4" style={{ color: '#B0A080' }}>
                  Icoana Sfântului Ierarh Nicolae
                  <br />
                  <span style={{ color: '#C9A84C' }}>(în curs de adăugare)</span>
                </p>
              </div>
            )}
          </div>

          {/* Informații */}
          <div className="flex-1">
            <h2 className="font-heading text-2xl mb-6" style={{ color: '#1C1B3A' }}>Date prăznuire</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
                <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 font-heading font-semibold" style={{ backgroundColor: '#8B1A1A', color: '#F2EBD9', fontSize: '16px' }}>
                  <div className="text-center leading-tight">
                    <div>19</div>
                    <div style={{ fontSize: '9px' }}>DEC</div>
                  </div>
                </div>
                <div>
                  <p className="font-heading text-base" style={{ color: '#1C1B3A' }}>
                    {feast1}
                  </p>
                  <p className="font-body text-sm mt-1" style={{ color: '#8A7050' }}>
                    {feast1Desc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8' }}>
                <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 font-heading font-semibold" style={{ backgroundColor: '#C9A84C', color: '#1C1B3A', fontSize: '16px' }}>
                  <div className="text-center leading-tight">
                    <div>22</div>
                    <div style={{ fontSize: '9px' }}>MAI</div>
                  </div>
                </div>
                <div>
                  <p className="font-heading text-base" style={{ color: '#1C1B3A' }}>
                    {feast2}
                  </p>
                  <p className="font-body text-sm mt-1" style={{ color: '#8A7050' }}>
                    {feast2Desc}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/carti"
              className="font-body text-sm px-5 py-2.5 rounded border inline-flex items-center gap-2 transition-all hover:bg-amber-50"
              style={{ color: '#8B6014', borderColor: '#C9A84C' }}
            >
              <span>☦</span>
              <span>Acatistul Sfântului Nicolae — Bibliotecă</span>
            </Link>
          </div>
        </div>

        {/* Viața sfântului */}
        <section className="mb-16">
          <h2 className="font-heading text-3xl mb-8" style={{ color: '#1C1B3A' }}>
            Viața Sfântului Ierarh Nicolae
          </h2>
          <div className="h-px mb-8" style={{ backgroundColor: '#E8E5E0' }} />

          {dynLife ? (
            <div className="tiptap-prose" dangerouslySetInnerHTML={{ __html: dynLife }} />
          ) : (
            <div className="space-y-10">
              {FALLBACK_VIATA.map((sectiune, i) => (
                <article key={i}>
                  <h3 className="font-heading text-xl mb-3" style={{ color: '#4A2010' }}>{sectiune.titlu}</h3>
                  <p className="font-body text-base leading-relaxed" style={{ color: '#3A2010', lineHeight: '1.8' }}>{sectiune.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Tropar */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Tropar</h2>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <blockquote
            className="font-body text-base leading-relaxed italic text-center mx-auto max-w-2xl p-6 rounded-lg"
            style={{ color: '#3A1A1A', backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', lineHeight: '1.9' }}
          >
            {renderPoem(tropar)}
          </blockquote>
          <p className="font-body text-xs text-center mt-2" style={{ color: '#8A7050' }}>Glasul al 4-lea</p>
        </section>

        {/* Condac */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
            <h2 className="font-heading text-2xl" style={{ color: '#1C1B3A' }}>Condac</h2>
            <span className="h-px flex-1" style={{ backgroundColor: '#E8E5E0' }} />
          </div>
          <blockquote
            className="font-body text-base leading-relaxed italic text-center mx-auto max-w-2xl p-6 rounded-lg"
            style={{ color: '#3A1A1A', backgroundColor: '#F7F3EC', border: '1px solid #E8DFC8', lineHeight: '1.9' }}
          >
            {renderPoem(condac)}
          </blockquote>
          <p className="font-body text-xs text-center mt-2" style={{ color: '#8A7050' }}>Glasul al 3-lea</p>
        </section>

        {/* Galerie imagini */}
        {saintGallery.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px flex-1 block" style={{ backgroundColor: '#3A2010' }} />
              <h2 className="font-heading text-xl" style={{ color: '#C9A84C' }}>Galerie imagini</h2>
              <span className="h-px flex-1 block" style={{ backgroundColor: '#3A2010' }} />
            </div>
            <PublicGallery items={saintGallery} />
          </section>
        )}

        {/* Link Acatist */}
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#0D0905', border: '1px solid #1E1208' }}>
          <span style={{ color: '#C9A84C', fontSize: '28px' }} aria-hidden="true">☦</span>
          <h3 className="font-heading text-xl mt-3 mb-2" style={{ color: '#C9A84C' }}>
            Acatistul Sfântului Ierarh Nicolae
          </h3>
          <p className="font-body text-sm mb-5" style={{ color: '#6A5030' }}>
            Citiți Acatistul Sfântului Nicolae din Biblioteca Ortodoxă digitală a parohiei.
          </p>
          <Link
            href="/carti"
            className="font-body text-sm px-6 py-2.5 rounded border inline-block transition-all hover:bg-white/10"
            style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
          >
            Mergi la Bibliotecă
          </Link>
        </div>
      </div>
    </div>
  )
}
