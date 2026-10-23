import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { messageExcerptHtml } from '@/lib/priestMessage'
import { MESAJ_VECHI } from '@/lib/fixtures/mesajVechi'
import PageShell from '@/components/shell/PageShell'
import FeedFilter from '@/components/shell/FeedFilter'
import LiturgicalTodayView from '@/components/homepage/LiturgicalTodayView'
import AnnouncementCard from '@/components/homepage/AnnouncementCard'
import ServicesCard from '@/components/homepage/ServicesCard'
import PriestMessageCard from '@/components/homepage/PriestMessageCard'
import DailyCardsView from '@/components/homepage/DailyCardsView'
import NewsAndLibraryView from '@/components/homepage/NewsAndLibraryView'
import ChurchLifeSection from '@/components/homepage/ChurchLifeSection'

/*
 * Galeria de verificare a secțiunilor — doar în dezvoltare (`next dev`), fără
 * bază de date: toate secțiunile primei pagini, în ordinea implicită, cu date
 * de probă (inclusiv mesajul real vechi, cu `**`). În producție: 404.
 * Nu apare în sitemap.ts; are robots noindex.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Galeria secțiunilor (dezvoltare)',
  robots: { index: false, follow: false },
}

const ARTICLES = [
  { slug: 'hram-2026', title: 'Hramul bisericii Sfântul Ierarh Nicolae — programul zilei de prăznuire', imageUrl: '/images/12.jpg', publishedAt: new Date('2026-10-20T09:00:00Z'), category: 'Viața parohiei', excerpt: 'Vă așteptăm cu drag la Sfânta Liturghie, urmată de procesiunea în jurul bisericii și de agapa frățească pregătită de credincioșii parohiei' },
  { slug: 'cateheza', title: 'Cateheză pentru tineri, în fiecare sâmbătă după Vecernie', imageUrl: null, publishedAt: new Date('2026-10-14T09:00:00Z'), category: 'Cateheză', excerpt: '' },
  { slug: 'reparatii', title: 'Lucrările de la acoperișul bisericii s-au încheiat — mulțumim tuturor donatorilor', imageUrl: '/images/parinte-marin.jpg', publishedAt: new Date('2026-10-02T09:00:00Z'), category: null, excerpt: '' },
  { slug: 'pelerinaj', title: 'Pelerinaj la mănăstirile din nordul Moldovei', imageUrl: null, publishedAt: new Date('2026-09-21T09:00:00Z'), category: 'Pelerinaje', excerpt: '' },
]

const BOOKS = [
  { slug: 'acatistul-sf-nicolae', title: 'Acatistul Sfântului Ierarh Nicolae', type: 'ACATIST' },
  { slug: 'rugaciunile-diminetii', title: 'Rugăciunile dimineții', type: 'RUGACIUNE' },
  { slug: 'canon-de-pocainta', title: 'Canonul de pocăință către Domnul nostru Iisus Hristos', type: 'CANON' },
  { slug: 'viata-sf-paisie', title: 'Viața Sfântului Paisie Aghioritul', type: 'VIATA' },
  { slug: 'predica-duminica', title: 'Predică la Duminica a XXI-a după Rusalii', type: 'PREDICA' },
  { slug: 'sfanta-liturghie', title: 'Rânduiala Sfintei Liturghii', type: 'SLUJBA' },
  { slug: 'acatistul-maicii', title: 'Acatistul Maicii Domnului', type: 'ACATIST' },
  { slug: 'sfaturi', title: 'Sfaturi duhovnicești pentru familie', type: 'ALTELE' },
]

const CHURCH = [
  { title: 'Înaltpreasfințitul Mitropolit Vladimir a săvârșit Sfânta Liturghie la Catedrala Mitropolitană', date: '18 octombrie 2026', url: 'https://mitropolia.md/', image: '', sourceUrl: 'https://mitropolia.md/', sourceName: 'mitropolia.md', sourceLabel: 'Mitropolia Chișinăului' },
  { title: 'Adunarea preoților din Protopopiatul Criuleni–Dubăsari', date: '12 octombrie 2026', url: 'https://protopopiatul-criuleni-dubasari.md/', image: '', sourceUrl: 'https://protopopiatul-criuleni-dubasari.md/', sourceName: 'protopopiatul-criuleni-dubasari.md', sourceLabel: 'Protopopiatul Criuleni' },
]

const DAILY = {
  saints: ['Sfântul Apostol Iacob, ruda Domnului', 'Sfântul Ierarh Ignatie, Patriarhul Constantinopolului', 'Cuviosul Iacob Postitorul', 'Sfântul Mucenic Teodot'],
  gospel: { reference: 'Ioan 1:1', text: 'La început era Cuvântul și Cuvântul era la Dumnezeu și Dumnezeu era Cuvântul.' },
  prayer: { title: 'Rugăciune de vineri', text: 'Doamne Iisuse Hristoase, Fiul lui Dumnezeu, Care ai pătimit pentru noi pe Cruce, miluiește-ne pe noi și ne mântuiește, că bun și iubitor de oameni ești.', slug: 'vineri', day: 'vineri' },
}

const ALL_DAILY = { sfintii_zilei: true, evanghelia_zilei: true, rugaciunea_zilei: true }

export default async function SectiuniGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const excerpt = messageExcerptHtml(MESAJ_VECHI)

  return (
    <PageShell aside="full" cover nameAsH1>
      <FeedFilter
        label={t.shell.feedFilter}
        emptyLabel={t.shell.feedEmpty}
        options={[
          { kind: 'all', label: t.shell.feedAll },
          { kind: 'cuvant', label: t.shell.feedWord },
          { kind: 'parohie', label: t.shell.feedParish },
          { kind: 'biblioteca', label: t.shell.feedLibrary },
        ]}
      />
      <div data-feed className="flex flex-col gap-5">
        <LiturgicalTodayView
          t={t}
          data={{
            day: 23, month: 'octombrie', julianLabel: '10 octombrie', dateLabel: 'Vineri, 23 octombrie 2026',
            feastName: 'Sfântul Apostol Iacob, ruda Domnului', fastInfo: 'Zi de post (miercuri și vineri)',
            calendarHref: '/calendar', prayerHref: '/carti',
          }}
        />
        <AnnouncementCard
          titlu="Spovedanie și Sfânta Împărtășanie înainte de hram"
          mesaj="Sâmbătă, 5 decembrie, de la ora 16:00, părintele va spovedi pe toți cei care doresc să se împărtășească la hramul bisericii."
          linkArticol="/stiri/hram-2026"
          author={t.shell.brand}
          kicker={t.shell.kindAnnouncement}
          moreLabel={t.shell.readAnnouncement}
        />
        <ServicesCard kicker={t.nav.pascalCalendar} />
        <PriestMessageCard
          html={excerpt.html}
          truncated={excerpt.truncated}
          signature="Pr. Marin Grigoriță, Parohul Bisericii"
          kicker={t.shell.kindWord}
          author={t.shell.brand}
          readMoreLabel={t.shell.readFullMessage}
        />
        <DailyCardsView data={DAILY} enabled={ALL_DAILY} order={Object.keys(ALL_DAILY)} t={t} />
        <NewsAndLibraryView articles={ARTICLES} libraryBooks={BOOKS} showNews showLibrary t={t} locale={locale} />
        <ChurchLifeSection cards={CHURCH} />
      </div>
    </PageShell>
  )
}
