export interface DonationLocalAccount {
  bankName: string
  accountLabel: string
  accountNumber: string
  holder: string
}

export interface DonationIbanAccount {
  bankName: string
  iban: string
  swift: string
  beneficiary: string
}

export interface DonationVideoLink {
  url: string
  caption?: string
}

export interface DonationConfigData {
  localAccounts: DonationLocalAccount[]
  ibanAccounts: DonationIbanAccount[]
  paypalEmail: string
  paypalLink: string
  contactName: string
  contactPhone: string
  facebookUrl: string
  tiktokUrl: string
  instagramUrl: string
  safetyNote: string
  videoLinks: DonationVideoLink[]
}

export const DONATII_DEFAULTS: DonationConfigData = {
  localAccounts: [
    { bankName: 'MIA', accountLabel: 'Cont', accountNumber: '067 306 191', holder: 'Marin Grigoriță' },
    { bankName: 'MAIB', accountLabel: 'Card', accountNumber: '5246 3900 7224 1233', holder: 'Marin Grigoriță' },
    { bankName: 'MICB', accountLabel: 'Card', accountNumber: '5188 9403 0218 1987', holder: 'Marin Grigoriță' },
    { bankName: 'FinComBank', accountLabel: 'Card', accountNumber: '4326 1700 1312 8715', holder: 'Marin Grigoriță' },
  ],
  ibanAccounts: [
    { bankName: 'MAIB', iban: 'MD15 AG00 0000 0225 9514 5877', swift: 'AGRNMD2X', beneficiary: 'Marin Grigorita' },
    { bankName: 'MICB', iban: 'MD56 ML00 0002 259A 2861 9081', swift: 'MOLDMD2X', beneficiary: 'Marin Grigorita' },
    { bankName: 'FinComBank', iban: 'MD40 FT22 5950 3003 4201 4498', swift: 'FTMDMD2XXXX', beneficiary: 'Marin Grigorita' },
  ],
  paypalEmail: 'inimaortodoxiei@gmail.com',
  paypalLink: 'https://www.paypal.me/inimaortodoxiei',
  contactName: 'Părintele Marin Grigoriță',
  contactPhone: '+373 67 306 191',
  facebookUrl: 'https://www.facebook.com/PreotMarin',
  tiktokUrl: 'https://www.tiktok.com/@parintelemarin',
  instagramUrl: 'https://www.instagram.com/parintelemarin.official/',
  safetyNote: 'Donați doar prin această pagină oficială sau la numărul de mai sus.',
  videoLinks: [],
}
