const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biserica-sf-nicolae.org'

export function buildAlternates(path: string) {
  const clean = path === '/' ? '' : path
  return {
    canonical: `${SITE_URL}${clean}`,
    languages: {
      ro: `${SITE_URL}${clean}`,
      ru: `${SITE_URL}/ru${clean}`,
      en: `${SITE_URL}/en${clean}`,
    },
  }
}
