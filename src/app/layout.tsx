import type { Metadata } from 'next'
import { Cormorant_Garamond, EB_Garamond } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { I18nProvider } from '@/lib/i18n/context'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import LoadingScreenLoader from '@/components/LoadingScreenLoader'
import PageTransition from '@/components/PageTransition'
import ScrollToTop from '@/components/ScrollToTop'
import CookieNotice from '@/components/CookieNotice'

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-eb-garamond',
  display: 'swap',
})

const OG_LOCALE: Record<'ro' | 'ru' | 'en', string> = { ro: 'ro_RO', ru: 'ru_RU', en: 'en_US' }

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getServerLocale(), getServerT()])
  const m = t.meta.site

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://biserica-sf-nicolae.org'),
    title: {
      default: m.title,
      template: `%s | ${m.twitterTitle}`,
    },
    description: m.description,
    keywords: ['biserică ortodoxă', 'Moldova', 'Criuleni', 'Hîrtopul Mic', 'Sfântul Nicolae', 'parohie', 'biblie online', 'transmisiune live'],
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: '/favicon.svg',
    },
    manifest: '/manifest.json',
    appleWebApp: { capable: true, title: 'Sf. Nicolae', statusBarStyle: 'black-translucent' },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      url: 'https://biserica-sf-nicolae.org',
      siteName: m.twitterTitle,
      title: m.ogTitle,
      description: m.ogDescription,
      images: [{ url: '/images/12.jpg', width: 1200, height: 800, alt: m.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
    robots: { index: true, follow: true },
    themeColor: '#0D0905',
    alternates: {
      canonical: 'https://biserica-sf-nicolae.org',
      languages: {
        'ro': 'https://biserica-sf-nicolae.org',
        'ro-MD': 'https://biserica-sf-nicolae.org',
        'ru': 'https://biserica-sf-nicolae.org/ru',
        'ru-MD': 'https://biserica-sf-nicolae.org/ru',
        'en': 'https://biserica-sf-nicolae.org/en',
        'x-default': 'https://biserica-sf-nicolae.org',
      },
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocale()
  return (
    <html
      lang={initialLocale}
      className={`${cormorant.variable} ${ebGaramond.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Church',
              name: 'Parohia Sfântul Ierarh Nicolae',
              alternateName: 'Biserica Sfântul Nicolae, Hîrtopul Mic',
              url: 'https://biserica-sf-nicolae.org',
              telephone: '+373-67-306-191',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Hîrtopul Mic',
                addressLocality: 'Raionul Criuleni',
                addressRegion: 'Criuleni',
                addressCountry: 'MD',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 47.2469,
                longitude: 28.9283,
              },
              denomination: 'Eastern Orthodox',
              openingHours: ['Su 09:00-12:00', 'Sa 17:00-19:00'],
            }),
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ fontFamily: 'var(--font-eb-garamond), Georgia, serif' }}
      >
        <I18nProvider initialLocale={initialLocale}>
          <LoadingScreenLoader />
          <Header />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <ScrollToTop />
          <CookieNotice />
        </I18nProvider>
      </body>
    </html>
  )
}
