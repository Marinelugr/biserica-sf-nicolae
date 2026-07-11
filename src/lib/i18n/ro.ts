export interface Translations {
  nav: {
    home: string; bible: string; calendar: string; pascalCalendar: string; books: string
    churchHistory: string; saintNicholas: string; priest: string; video: string; news: string; live: string; shop: string; donate: string
    contact: string
  }
  home: {
    heroTitle: string; heroSubtitle: string; heroMitropolia: string; heroImageAlt: string
    searchPlaceholder: string; searchBtn: string; aboutBtn: string; donateBtn: string
    liturgicalLife: string; saintsToday: string; gospelToday: string
    prayerToday: string; latestNews: string; allNews: string
    orthodoxLibrary: string; allBooks: string; noSaints: string
    liveNow: string; watchLiveService: string; openOnYoutube: string
    liveStreamTitle: string; liveFooterNote: string
    allSaintsLink: string; readFullGospel: string; allPrayersLink: string; readFullPrayer: string; fullCalendarLink: string
    ourParish: string; noNews: string; sacredTexts: string; libraryLabel: string
    libraryInProgress: string; viewAllLink: string
    searchInScripture: string; orthodoxBibleBtn: string
    openCalendarLink: string
  }
  bible: {
    pageSubtitle: string; title: string; searchPlaceholder: string; searchBtn: string
    oldTestament: string; newTestament: string
    oldTestamentBooks: string; newTestamentBooks: string
    chapter: string; verse: string
    otBooksLabel: string; ntBooksLabel: string; totalLabel: string
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
      archangels: string; palmSunday: string; holyThursday: string; holyFriday: string
      easter: string; thomasSunday: string; ascension: string
      pentecost: string; allSaints: string
    }
    fastNames: {
      greatLent: string; apostlesFast: string; dormitionFast: string; christmasFast: string
      inFast: string
    }
    weeklyTone: string
    julianDate: string
    todayWidget: string
    julianSuffix: string; gaussFooter: string
  }
  books: {
    subtitle: string; title: string; searchPlaceholder: string; searchBtn: string
    inProgress: string; comingSoon: string; recentlyAdded: string
    textSingular: string; textPlural: string; noTextsInCategory: string
    categories: {
      ACATIST: string; CANON: string; RUGACIUNE: string; SLUJBA: string
      VIATA: string; PREDICA: string; ALTELE: string; BIBLIE: string
    }
    categoryDescriptions: {
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
    galleryTitle: string; gallerySubtitle: string; galleryEmpty: string
    videosTitle: string; videosEmpty: string
    bankAccountsTitle: string; ibanAccountsTitle: string; paypalTitle: string; beneficiaryLabel: string
    copyLabel: string; copiedLabel: string
    contactSocialTitle: string; viberWhatsappTelegram: string
  }
  priest: {
    badge: string; pageTitle: string; biography: string; education: string
    galleryTitle: string; contactTitle: string
    phoneLabel: string; emailLabel: string; facebookLabel: string; facebookPageLabel: string
    notAvailable: string
  }
  newsPage: { badge: string; title: string; noArticles: string }
  historyPage: {
    pageTitle: string; fallbackIntro: string
    sections: { title: string; text: string }[]
    galleryEmpty: string; videosEmpty: string; ctaText: string; ctaBtn: string
  }
  saintNicholasPage: {
    badge: string; pageTitle: string; subtitle: string
    feastDatesTitle: string
    feast1: string; feast1Desc: string; feast2: string; feast2Desc: string
    acatistLink: string
    lifeTitle: string
    fallbackViata: { titlu: string; text: string }[]
    troparTitle: string; troparTone: string; fallbackTropar: string
    condacTitle: string; condacTone: string; fallbackCondac: string
    iconAlt: string; iconMissing: string
    galleryTitle: string
    acatistCtaTitle: string; acatistCtaText: string; goToLibrary: string
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
  saints: {
    subtitle: string; title: string
    searchPlaceholder: string; searchBtn: string
    noSaintsInMonth: string; inProgress: string
    feastTypes: { MARE: string; MIJLOCIE: string; MIC: string }
    readLife: string; backToList: string; noLifeText: string
  }
  shop: {
    subtitle: string; title: string
    inProgress: string; comingSoon: string
    inStock: string; outOfStock: string
    contactToOrder: string; priceLabel: string
  }
  common: { loading: string; backToTop: string; gallery: string; backTo: string; allCategories: string }
  contactPage: {
    title: string; subtitle: string
    addressLabel: string; hramLabel: string; hramValue: string
    phoneLabel: string; emailLabel: string; facebookLabel: string
    scheduleTitle: string
    mapTitle: string
    formTitle: string; nameLabel: string; emailLabel2: string; messageLabel: string
    namePlaceholder: string; emailPlaceholder: string; messagePlaceholder: string
    submitBtn: string; sendingBtn: string
    successMsg: string; errorMsg: string
  }
}

const ro: Translations = {
  nav: {
    home: 'Acasă', bible: 'Biblie', calendar: 'Calendar', pascalCalendar: 'Calendar Pascal', books: 'Bibliotecă',
    churchHistory: 'Istoria Bisericii', saintNicholas: 'Sfântul Nicolae', priest: 'Parohul Bisericii',
    video: 'Video', news: 'Știri', live: 'Live', shop: 'Magazin', donate: 'Donații',
    contact: 'Contact',
  },
  home: {
    heroTitle: 'Biserica Sfântul Ierarh Nicolae',
    heroSubtitle: 'Hîrtopul Mic · Raionul Criuleni · Republica Moldova',
    heroMitropolia: 'Mitropolia Chișinăului și a întregii Moldove',
    heroImageAlt: 'Vedere aeriană a Bisericii Sfântul Ierarh Nicolae, Hîrtopul Mic',
    searchPlaceholder: 'Caută pe site...', searchBtn: 'Caută',
    aboutBtn: 'Despre Biserică', donateBtn: 'Susține Biserica',
    liturgicalLife: 'Viața liturgică a zilei',
    saintsToday: 'Sfinții zilei', gospelToday: 'Evanghelia zilei',
    prayerToday: 'Rugăciunea zilei',
    latestNews: 'Ultimele știri', allNews: 'Toate știrile →',
    orthodoxLibrary: 'Bibliotecă Ortodoxă', allBooks: 'Toate cărțile →',
    noSaints: 'Nu sunt sfinți înregistrați pentru astăzi.',
    liveNow: 'Live acum', watchLiveService: 'Urmărește slujba în direct',
    openOnYoutube: 'Deschide pe YouTube ↗',
    liveStreamTitle: 'Transmisiune live — Parohia Sfântul Ierarh Nicolae',
    liveFooterNote: '☦ Parohia Sfântul Ierarh Nicolae, Hîrtopul Mic — transmisiune în direct',
    allSaintsLink: 'Toți sfinții zilei →', readFullGospel: 'Citește integral →',
    allPrayersLink: 'Toate rugăciunile →', readFullPrayer: 'Citește integral →',
    fullCalendarLink: 'Calendar complet →',
    ourParish: 'Parohia noastră', noNews: 'Nu există știri publicate momentan.',
    sacredTexts: 'Texte sacre', libraryLabel: 'Bibliotecă',
    libraryInProgress: 'Biblioteca este în curs de completare.', viewAllLink: 'Toate →',
    searchInScripture: 'Caută în Sfânta Scriptură', orthodoxBibleBtn: '☦ Biblia Ortodoxă',
    openCalendarLink: 'Deschide calendarul →',
  },
  bible: {
    pageSubtitle: 'Cuvântul lui Dumnezeu', title: 'Sfânta Scriptură',
    searchPlaceholder: 'Caută în Biblie...', searchBtn: 'Caută',
    oldTestament: 'VECHIUL TESTAMENT', newTestament: 'NOUL TESTAMENT',
    oldTestamentBooks: '(53 de cărți)', newTestamentBooks: '(27 de cărți)',
    chapter: 'Capitol', verse: 'Verset',
    otBooksLabel: 'cărți VT', ntBooksLabel: 'cărți NT', totalLabel: 'total',
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
      palmSunday: 'Duminica Floriilor', holyThursday: 'Joia Mare (Joia Patimirilor)',
      holyFriday: 'Vinerea Mare (Vinerea Patimirilor)', easter: 'Sfintele Paști',
      thomasSunday: 'Duminica Tomii (Antipascha)', ascension: 'Înălțarea Domnului',
      pentecost: 'Rusaliile — Pogorârea Sfântului Duh', allSaints: 'Duminica Tuturor Sfinților',
    },
    fastNames: {
      greatLent: 'Postul Mare', apostlesFast: 'Postul Sfinților Apostoli',
      dormitionFast: 'Postul Adormirii Maicii Domnului',
      christmasFast: 'Postul Crăciunului', inFast: 'Zi de post',
    },
    weeklyTone: 'Glasul săptămânii', julianDate: 'Stil vechi', todayWidget: 'Astăzi în calendar',
    julianSuffix: '(iulian)', gaussFooter: 'Stil vechi · Algoritmul Gauss Julian',
  },
  books: {
    subtitle: 'Texte sacre', title: 'Bibliotecă Ortodoxă',
    searchPlaceholder: 'Caută în bibliotecă...', searchBtn: 'Caută',
    inProgress: 'Biblioteca este în curs de completare.', comingSoon: 'Reveniți curând',
    recentlyAdded: 'Adăugate recent', textSingular: 'text', textPlural: 'texte',
    noTextsInCategory: 'Nu sunt texte adăugate în această categorie.',
    categories: {
      ACATIST: 'Acatiste', CANON: 'Canoane', RUGACIUNE: 'Rugăciuni',
      SLUJBA: 'Slujbe', VIATA: 'Vieți de Sfinți', PREDICA: 'Predici', ALTELE: 'Altele',
      BIBLIE: 'Biblie',
    },
    categoryDescriptions: {
      ACATIST: 'Acatistele sfinților și ale Maicii Domnului',
      CANON: 'Canoane de rugăciune și pocăință',
      RUGACIUNE: 'Rugăciuni de dimineață, seară și speciale',
      SLUJBA: 'Tipicul slujbelor liturgice ortodoxe',
      VIATA: 'Prologul și vieținele sfinților',
      PREDICA: 'Cuvântări și predici duhovnicești',
      ALTELE: 'Alte texte liturgice și duhovnicești',
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
    galleryTitle: 'Galerie foto', gallerySubtitle: 'Imagini din viața și lucrările parohiei',
    galleryEmpty: 'Fotografiile lucrărilor vor fi adăugate în curând.',
    videosTitle: 'Cuvântul părintelui', videosEmpty: 'Video-urile vor fi adăugate în curând.',
    bankAccountsTitle: 'Conturi în țară', ibanAccountsTitle: 'Conturi din străinătate (IBAN)',
    paypalTitle: 'PayPal', beneficiaryLabel: 'Beneficiar',
    copyLabel: 'Copiază', copiedLabel: 'Copiat ✓',
    contactSocialTitle: 'Contact și rețele sociale', viberWhatsappTelegram: 'Viber · WhatsApp · Telegram',
  },
  priest: {
    badge: 'Parohia Sfântul Ierarh Nicolae', pageTitle: 'Parohul Bisericii',
    biography: 'Biografie', education: 'Educație și formare',
    galleryTitle: 'Galerie foto', contactTitle: 'Contact',
    phoneLabel: 'Telefon', emailLabel: 'Email', facebookLabel: 'Facebook', facebookPageLabel: 'Pagina Facebook',
    notAvailable: 'Informații despre preotul paroh nu sunt disponibile momentan.',
  },
  newsPage: {
    badge: 'Parohia noastră', title: 'Știri & Articole',
    noArticles: 'Nu există articole publicate momentan.',
  },
  historyPage: {
    pageTitle: 'Istoria Bisericii',
    fallbackIntro: 'Biserica Sfântul Ierarh Nicolae din Hîrtopul Mic, Raionul Criuleni, este unul dintre lăcașurile de cult cu o istorie îndelungată din ținuturile Moldovei. Întemeiată în secolul al XIX-lea, biserica a fost martoră a nenumărate generații de credincioși care și-au botezat pruncii, și-au cununat tinerii și și-au odihnit pe cei adormiți.',
    sections: [
      {
        title: 'Întemeierea (sec. XIX)',
        text: 'Prima atestare documentară a parohiei datează din a doua jumătate a secolului al XIX-lea. Conform mărturiilor orale și arhivelor ecleziastice, prima structură de lemn a fost ridicată de ctitorii din sat, cu sprijinul comunității locale. Hramul Sfântului Ierarh Nicolae — arhiepiscopul Mirelor Lichiei, ocrotitorul celor în nevoi — a fost ales de la bun început, reflectând evlavia deosebită a locuitorilor față de acest sfânt.',
      },
      {
        title: 'Construcția edificiului actual',
        text: 'La sfârșitul secolului al XIX-lea și începutul celui de-al XX-lea, comunitatea parohială a decis ridicarea unei noi biserici din piatră și cărămidă, mai trainice și mai încăpătoare. Lucrările s-au desfășurat în mai mulți ani, cu contribuția materială și fizică a credincioșilor din Hîrtopul Mic și din localitățile vecine. Arhitectura îmbină elemente ale stilului ecleziastic moldovenesc cu influențe neo-bizantine.',
      },
      {
        title: 'Perioadele de restriște',
        text: 'Ca toate lăcașurile de cult din Moldova, Biserica Sfântul Ierarh Nicolae a traversat perioade de restriște în secolul al XX-lea. În timpul regimului sovietic, activitatea religioasă a fost limitată, iar edificiul a suferit din lipsa întreținerii corespunzătoare. Cu toate acestea, credincioșii au păstrat vie tradiția ortodoxă, transmițindu-o din generație în generație.',
      },
      {
        title: 'Renașterea după 1991',
        text: 'Odată cu obținerea independenței Republicii Moldova, viața parohială a înflorit din nou. Au fost reluate slujbele regulate, comunitatea s-a reunit în jurul lăcașului sfânt, iar primele lucrări de renovare au putut fi efectuate. În deceniile următoare, cu sprijinul enoriașilor din țară și din diasporă, biserica a primit o serie de îmbunătățiri.',
      },
      {
        title: 'Proiecte actuale de restaurare',
        text: 'Parohia se află în prezent în mijlocul unui amplu program de restaurare și înfrumusețare. Prioritățile includ renovarea completă a acoperișului, restaurarea turnului clopotniță, realizarea picturii murale în interior și modernizarea instalațiilor. Aceste lucrări sunt posibile datorită jertfelnicitei contribuții a credincioșilor și a binecuvântării ierarhilor Mitropoliei Chișinăului și a întregii Moldove.',
      },
    ],
    galleryEmpty: 'Imaginile vor fi adăugate de administrator.',
    videosEmpty: 'Videoclipurile vor fi adăugate de administrator.',
    ctaText: 'Susținerea lucrărilor de restaurare ale acestui lăcaș sfânt este un act de binecuvântare pentru generațiile viitoare.',
    ctaBtn: 'Susțineți restaurarea bisericii',
  },
  saintNicholasPage: {
    badge: 'Hramul Parohiei', pageTitle: 'Sfântul Ierarh Nicolae',
    subtitle: 'Arhiepiscopul Mirelor Lichiei, Făcătorul de minuni',
    feastDatesTitle: 'Date prăznuire',
    feast1: '19 Decembrie — Adormirea Sfântului Nicolae',
    feast1Desc: 'Ziua principală de prăznuire. Sfântul s-a săvârșit din viață în jurul anului 345 d.Hr.',
    feast2: '22 Mai — Aducerea Sfintelor Moaște la Bari',
    feast2Desc: 'Comemorarea transferului moaștelor din Mireele Lichiei la Bari (Italia) în 1087.',
    acatistLink: 'Acatistul Sfântului Nicolae — Bibliotecă',
    lifeTitle: 'Viața Sfântului Ierarh Nicolae',
    fallbackViata: [
      { titlu: 'Nașterea și tinerețea', text: 'Sfântul Ierarh Nicolae s-a născut în jurul anului 270 d.Hr. în orașul Patara din Licia (Asia Mică, actuala Turcie). Părinții săi, Epifanie și Ana, erau oameni evlavioși și înstăriți, care l-au crescut în frica de Dumnezeu. Rămas orfan de timpuriu, Nicolae a moștenit averea părinților, pe care a împărțit-o celor săraci.' },
      { titlu: 'Arhiepiscopul Mirelor Lichiei', text: 'Ales în chip minunat ca arhiepiscop al Mirelor Lichiei, Sfântul Nicolae a păstorit cu înțelepciune și smerenie turma sa. Era cunoscut pentru blândețea sa, pentru dragostea față de cei săraci și pentru darul făcerii de minuni. A participat la Sinodul I Ecumenic de la Niceea (325 d.Hr.), apărând cu fervoare dreapta credință împotriva ereziei lui Arie.' },
      { titlu: 'Faptele milostiviei', text: 'Dintre nenumăratele sale fapte de milostenie, cea mai renumită este ajutorarea unui om sărac cu trei fete. Neputând să le înzestreze pentru căsătorie, tatăl era în mare strâmtorare. Sfântul Nicolae, auzind de aceasta, a aruncat noaptea, pe fereastră, câte un sac cu aur pentru fiecare fată.' },
      { titlu: 'Adormirea și prăznuirea', text: 'Sfântul Nicolae a adormit întru Domnul în jurul anului 345 d.Hr., la o vârstă înaintată. Sfintele sale moaște au rămas la Mireele Lichiei până în anul 1087, când, din cauza amenințărilor islamice, au fost aduse la Bari (Italia), unde se găsesc și astăzi în Bazilica San Nicola. Sfântul este prăznuit de două ori pe an: pe 19 Decembrie și pe 22 Mai.' },
    ],
    troparTitle: 'Tropar', troparTone: 'Glasul al 4-lea',
    fallbackTropar: 'Regulă a credinței și chip al blândeții, / învățătorule al înfrânării, / te-a arătat pe tine turmei tale adevărul lucrurilor. / Pentru aceasta ai câștigat cu smerenia cele înalte, / cu sărăcia cele bogate. / Părinte Ierarhe Nicolae, / roagă pe Hristos Dumnezeu să mântuiască sufletele noastre.',
    condacTitle: 'Condac', condacTone: 'Glasul al 3-lea',
    fallbackCondac: 'În Mireele Lichiei, sfinte, sfințitor te-ai arătat; / că Evanghelia lui Hristos plinind-o, / sufletul tău ți-ai pus pentru poporul tău, / și pe nevinovați i-ai mântuit de moarte. / Pentru aceasta te-ai sfințit / ca un mare înțelegător al harului lui Dumnezeu.',
    iconAlt: 'Icoana Sfântului Ierarh Nicolae', iconMissing: '(în curs de adăugare)',
    galleryTitle: 'Galerie imagini',
    acatistCtaTitle: 'Acatistul Sfântului Ierarh Nicolae',
    acatistCtaText: 'Citiți Acatistul Sfântului Nicolae din Biblioteca Ortodoxă digitală a parohiei.',
    goToLibrary: 'Mergi la Bibliotecă',
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
  saints: {
    subtitle: 'Calendarul Ortodox', title: 'Sfinții',
    searchPlaceholder: 'Caută un sfânt...', searchBtn: 'Caută',
    noSaintsInMonth: 'Niciun sfânt înregistrat în această lună.',
    inProgress: 'Calendarul sfinților este în curs de completare.',
    feastTypes: { MARE: 'Sărbătoare mare', MIJLOCIE: 'Sărbătoare mijlocie', MIC: 'Sfânt' },
    readLife: 'Citește viața sfântului →', backToList: '← Înapoi la sfinți',
    noLifeText: 'Viața acestui sfânt va fi adăugată în curând.',
  },
  shop: {
    subtitle: 'Obiecte bisericești', title: 'Magazin',
    inProgress: 'Magazinul este în curs de completare.', comingSoon: 'Reveniți curând',
    inStock: 'În stoc', outOfStock: 'Stoc epuizat',
    contactToOrder: 'Contactează pentru comandă', priceLabel: 'Preț',
  },
  common: { loading: 'Se încarcă...', backToTop: 'Sus', gallery: 'Galerie foto', backTo: 'Înapoi la', allCategories: 'Toate categoriile →' },
  contactPage: {
    title: 'Contactați-ne', subtitle: 'Suntem bucuroși să răspundem întrebărilor dumneavoastră',
    addressLabel: 'Adresă', hramLabel: 'Hram', hramValue: 'Sfântul Ierarh Nicolae (19 decembrie / 22 mai)',
    phoneLabel: 'Telefon', emailLabel: 'Email', facebookLabel: 'Facebook',
    scheduleTitle: 'Program slujbe',
    mapTitle: 'Cum ajungeți la noi',
    formTitle: 'Trimite un mesaj', nameLabel: 'Nume', emailLabel2: 'Email', messageLabel: 'Mesaj',
    namePlaceholder: 'Numele dumneavoastră', emailPlaceholder: 'email@exemplu.com', messagePlaceholder: 'Scrieți mesajul dumneavoastră...',
    submitBtn: 'Trimite mesajul', sendingBtn: 'Se trimite...',
    successMsg: '✓ Mesajul a fost trimis cu succes! Vă vom răspunde în cel mai scurt timp.',
    errorMsg: '✗ A apărut o eroare. Vă rugăm să încercați din nou sau să ne contactați direct.',
  },
}

export default ro
