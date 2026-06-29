export interface Translations {
  nav: {
    home: string; bible: string; calendar: string; books: string
    churchHistory: string; saintNicholas: string; priest: string; video: string; shop: string; donate: string
  }
  home: {
    heroTitle: string; heroSubtitle: string; heroMitropolia: string
    searchPlaceholder: string; searchBtn: string; aboutBtn: string; donateBtn: string
    liturgicalLife: string; saintsToday: string; gospelToday: string
    prayerToday: string; serviceSchedule: string; latestNews: string; allNews: string
    orthodoxLibrary: string; allBooks: string; noSchedule: string; noSaints: string
  }
  bible: {
    pageSubtitle: string; title: string; searchPlaceholder: string; searchBtn: string
    oldTestament: string; newTestament: string
    oldTestamentBooks: string; newTestamentBooks: string
    chapter: string; verse: string
  }
  calendar: {
    title: string; subtitle: string
    day: string; month: string; year: string; show: string
    saintsTitle: string; feastsTitle: string
    noSaints: string; dbInProgress: string; noFeasts: string
    easterLabel: string; apostlesFast: string; greatLent: string
    months: [string,string,string,string,string,string,string,string,string,string,string,string]
    feastTypes: { great: string; fast: string; normal: string }
    feastNames: {
      christmas: string; epiphany: string; annunciation: string; transfiguration: string
      dormition: string; nativityMary: string; exaltationCross: string
      entryTemple: string; saintNicholas: string; meetingLord: string
      peterPaul: string; birthJohnBaptist: string; circumcision: string
      archangels: string; palmSunday: string; easter: string; ascension: string
      pentecost: string; allSaints: string
    }
    fastNames: {
      greatLent: string; apostlesFast: string; dormitionFast: string; christmasFast: string
      inFast: string
    }
  }
  books: {
    subtitle: string; title: string; searchPlaceholder: string; searchBtn: string
    inProgress: string; comingSoon: string; recentlyAdded: string
    categories: {
      ACATIST: string; CANON: string; RUGACIUNE: string; SLUJBA: string
      VIATA: string; PREDICA: string; ALTELE: string
    }
  }
  video: {
    title: string; subtitle: string; comingSoon: string; addVideoHint: string
    categories: {
      orthodoxFilms: string; akathists: string; conferences: string
      prayers: string; sermons: string
    }
  }
  donate: {
    badge: string; title: string; verse: string; verseRef: string
    projectsTitle: string; projectsSubtitle: string
    methodsTitle: string; methodsSubtitle: string
    blessing: string; thanks: string; contactTitle: string; contactBtn: string
    bankTransfer: string; directDonation: string; anyAmount: string
    progress: string; target: string
  }
  footer: {
    parish: string; address: string; country: string; metropolis: string
    pagesTitle: string; scheduleTitle: string; contactTitle: string
    support: string; contact: string; blessing: string; copyright: string
    phone: string; email: string
    pages: {
      about: string; bible: string; books: string; calendar: string
      history: string; saint: string; news: string; video: string
    }
    schedule: {
      sunday: string; saturday: string; friday: string; feasts: string
      liturgy: string; vespers: string; matins: string
    }
  }
  search: {
    title: string; placeholder: string; btn: string; results: string
    noResults: string; noResultsHint: string
    searchInBible: string; searchInLibrary: string; enterTerm: string
  }
  common: { loading: string; backToTop: string }
}

const ro: Translations = {
  nav: {
    home: 'Acasă', bible: 'Biblie', calendar: 'Calendar', books: 'Bibliotecă',
    churchHistory: 'Istoria Bisericii', saintNicholas: 'Sfântul Nicolae', priest: 'Parohul Bisericii',
    video: 'Video', shop: 'Magazin', donate: 'Donații',
  },
  home: {
    heroTitle: 'Biserica Sfântul Ierarh Nicolae',
    heroSubtitle: 'Hîrtopul Mic · Raionul Criuleni · Republica Moldova',
    heroMitropolia: 'Mitropolia Chișinăului și a întregii Moldove',
    searchPlaceholder: 'Caută pe site...', searchBtn: 'Caută',
    aboutBtn: 'Despre Biserică', donateBtn: 'Susține Biserica',
    liturgicalLife: 'Viața liturgică a zilei',
    saintsToday: 'Sfinții zilei', gospelToday: 'Evanghelia zilei',
    prayerToday: 'Rugăciunea zilei', serviceSchedule: 'Program slujbe',
    latestNews: 'Ultimele știri', allNews: 'Toate știrile →',
    orthodoxLibrary: 'Bibliotecă Ortodoxă', allBooks: 'Toate cărțile →',
    noSchedule: 'Nu există slujbe programate pentru astăzi.',
    noSaints: 'Nu sunt sfinți înregistrați pentru astăzi.',
  },
  bible: {
    pageSubtitle: 'Cuvântul lui Dumnezeu', title: 'Sfânta Scriptură',
    searchPlaceholder: 'Caută în Biblie...', searchBtn: 'Caută',
    oldTestament: 'VECHIUL TESTAMENT', newTestament: 'NOUL TESTAMENT',
    oldTestamentBooks: '(53 de cărți)', newTestamentBooks: '(27 de cărți)',
    chapter: 'Capitol', verse: 'Verset',
  },
  calendar: {
    title: 'Calendarul Sfinților', subtitle: 'Ortodox',
    day: 'Ziua', month: 'Luna', year: 'Anul', show: 'Afișează',
    saintsTitle: 'Sfinții zilei', feastsTitle: 'Sărbători',
    noSaints: 'Nu sunt sfinți înregistrați pentru această zi.',
    dbInProgress: 'Baza de date liturgică este în curs de completare.',
    noFeasts: 'Nicio sărbătoare sau post în această zi.',
    easterLabel: 'SFINTELE PAȘTI', apostlesFast: 'Postul Sfinților Apostoli (Petru și Pavel)',
    greatLent: 'Postul Mare',
    months: ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
    feastTypes: { great: 'Praznic Împărătesc', fast: 'Perioadă de post', normal: 'Zi obișnuită' },
    feastNames: {
      christmas: 'Nașterea Domnului (Crăciun)', epiphany: 'Botezul Domnului (Boboteaza)',
      annunciation: 'Buna Vestire', transfiguration: 'Schimbarea la Față a Domnului',
      dormition: 'Adormirea Maicii Domnului', nativityMary: 'Nașterea Maicii Domnului',
      exaltationCross: 'Înălțarea Sfintei Cruci', entryTemple: 'Intrarea în Biserică a Maicii Domnului',
      saintNicholas: 'Sfântul Ierarh Nicolae, Arhiepiscopul Mirelor Lichiei',
      meetingLord: 'Întâmpinarea Domnului', peterPaul: 'Sfinții Apostoli Petru și Pavel',
      birthJohnBaptist: 'Nașterea Sfântului Ioan Botezătorul',
      circumcision: 'Tăierea împrejur a Domnului · Sf. Vasile cel Mare',
      archangels: 'Soborul Sfinților Arhangheli Mihail și Gavriil',
      palmSunday: 'Duminica Floriilor', easter: 'Sfintele Paști',
      ascension: 'Înălțarea Domnului', pentecost: 'Rusaliile — Pogorârea Sfântului Duh',
      allSaints: 'Duminica Tuturor Sfinților',
    },
    fastNames: {
      greatLent: 'Postul Mare', apostlesFast: 'Postul Sfinților Apostoli',
      dormitionFast: 'Postul Adormirii Maicii Domnului',
      christmasFast: 'Postul Crăciunului', inFast: 'Zi de post',
    },
  },
  books: {
    subtitle: 'Texte sacre', title: 'Bibliotecă Ortodoxă',
    searchPlaceholder: 'Caută în bibliotecă...', searchBtn: 'Caută',
    inProgress: 'Biblioteca este în curs de completare.', comingSoon: 'Reveniți curând',
    recentlyAdded: 'Adăugate recent',
    categories: {
      ACATIST: 'Acatiste', CANON: 'Canoane', RUGACIUNE: 'Rugăciuni',
      SLUJBA: 'Slujbe', VIATA: 'Vieți de Sfinți', PREDICA: 'Predici', ALTELE: 'Altele',
    },
  },
  video: {
    title: 'Video Ortodox', subtitle: 'Filme, acatiste, conferințe, rugăciuni și predici',
    comingSoon: 'Secțiunea video este în curs de configurare. Videoclipurile vor fi adăugate de parohie.',
    addVideoHint: 'Admin: adaugă video',
    categories: {
      orthodoxFilms: 'Filme Ortodoxe', akathists: 'Acatiste',
      conferences: 'Conferințe', prayers: 'Rugăciuni', sermons: 'Predici',
    },
  },
  donate: {
    badge: 'Jertfă de bună voie', title: 'Susțineți lucrările Bisericii',
    verse: '„Cel ce seamănă cu dărnicie, cu dărnicie va și secera."',
    verseRef: '(2 Corinteni 9:6)',
    projectsTitle: 'Pentru ce se fac donațiile',
    projectsSubtitle: 'Contribuția dumneavoastră susține lucrările de restaurare ale lăcașului sfânt',
    methodsTitle: 'Modalități de donație',
    methodsSubtitle: 'Alegeți metoda care vă este cea mai convenabilă',
    blessing: 'Orice donație, oricât de mică, este binecuvântată.',
    thanks: 'Dumnezeu să vă răsplătească dragostea și jertfelnicia!',
    contactTitle: 'Aveți întrebări?', contactBtn: 'Contactează parohia',
    bankTransfer: 'Transfer bancar', directDonation: 'Donație directă',
    anyAmount: 'Orice sumă, oricât de mică, ajută la restaurarea lăcașului sfânt.',
    progress: 'Realizat', target: 'Țintă',
  },
  footer: {
    parish: 'Parohia Ortodoxă', address: 'Hîrtopul Mic, Raionul Criuleni',
    country: 'Republica Moldova', metropolis: 'Mitropolia Chișinăului și a întregii Moldove',
    pagesTitle: 'PAGINI', scheduleTitle: 'PROGRAM SLUJBE', contactTitle: 'CONTACT & SOCIAL',
    support: '❤ Susține parohia', contact: 'Formular contact',
    blessing: 'Site realizat cu binecuvântare',
    copyright: 'Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic',
    phone: 'Telefon', email: 'Email',
    pages: {
      about: 'Despre Biserică', bible: 'Sfânta Scriptură', books: 'Bibliotecă Ortodoxă',
      calendar: 'Calendar Liturgic', history: 'Istoria Bisericii', saint: 'Sfântul Nicolae',
      news: 'Știri & Articole', video: 'Video Ortodox',
    },
    schedule: {
      sunday: 'Duminică', saturday: 'Sâmbătă', friday: 'Vineri', feasts: 'Sărbători',
      liturgy: 'Sf. Liturghie', vespers: 'Vecernie', matins: 'Utrenie',
    },
  },
  search: {
    title: 'Căutare', placeholder: 'Caută pe site...', btn: 'Caută',
    results: 'rezultate pentru', noResults: 'Nu s-au găsit rezultate pentru',
    noResultsHint: 'Încercați cu Sfânta Scriptură sau navigați prin categorii.',
    searchInBible: 'Caută în Biblie', searchInLibrary: 'Caută în Bibliotecă',
    enterTerm: 'Introduceți un termen pentru a căuta în întregul site.',
  },
  common: { loading: 'Se încarcă...', backToTop: 'Sus' },
}

export default ro
