// Test E2E pentru „Continuă lectura" în Bibliotecă. Build local, bază sintetică; vezi docs/CONTINUA-LECTURA-CARTI.md.
//   BASE_URL=http://127.0.0.1:3417 PLAYWRIGHT_DIR=<folder cu playwright-core> CHROMIUM_PATH=<executabil> SHOTS_DIR=<folder> node e2e/carti-continua.mjs
// Cărți așteptate în bază: proba-sectiuni (paragrafe îngroșate), proba-titluri (h2), proba-lung (fără titluri), proba-scurt (încape în ecran), proba-1…proba-6.
import { createRequire } from 'node:module'
import path from 'node:path'

const { BASE_URL = 'http://127.0.0.1:3417', PLAYWRIGHT_DIR, CHROMIUM_PATH, SHOTS_DIR } = process.env
const { chromium } = createRequire(path.join(PLAYWRIGHT_DIR ?? process.cwd(), 'noop.js'))('playwright-core')

const POSITION = 'lectura:carte:poz'
const RECENT = 'lectura:carte:recente'
const SAVE_WAIT_MS = 1200
const SETTLE_WAIT_MS = 1200
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1280, height: 800 }]

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH })
let failures = 0
let passes = 0

function check(name, ok, detail = '') {
  if (ok) passes++
  else failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${!ok && detail ? ` → ${detail}` : ''}`)
}

async function withPage(viewport, run, options = {}) {
  const context = await browser.newContext({ viewport, baseURL: BASE_URL, ...options })
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`) })
  try { await run(page, problems) } finally { await context.close() }
}

const stored = (page, key = POSITION) => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), key)

async function open(page, url) {
  await page.goto(url)
  await page.waitForTimeout(SETTLE_WAIT_MS)
}

/** Derulare ca a cititorului: rotița, până când elementul ajunge sub antet. */
async function scrollToHeading(page, text) {
  await page.evaluate(t => {
    const el = [...document.querySelectorAll('.rich.reading p, .rich.reading h2')].find(e => e.textContent.trim() === t)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' })
  }, text)
}

async function scrollToPercent(page, percent) {
  await page.evaluate(p => {
    const { top, height } = document.querySelector('.rich.reading').getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + top + height * p / 100 - window.innerHeight * 0.15, behavior: 'instant' })
  }, percent)
}

const headingInView = (page, text) => page.evaluate(t => {
  const el = [...document.querySelectorAll('.rich.reading p, .rich.reading h2')].find(e => e.textContent.trim() === t)
  const { top, bottom } = el.getBoundingClientRect()
  return bottom > 71 && top < window.innerHeight
}, text)

const currentPercent = page => page.evaluate(() => {
  const { top, height } = document.querySelector('.rich.reading').getBoundingClientRect()
  return Math.round((window.innerHeight * 0.15 - top) / height * 100)
})

const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  // Text cu secțiuni: paragrafe îngroșate și titluri h2
  for (const [slug, title, heading] of [
    ['proba-sectiuni', 'Acatist de probă', 'Icos 7'],
    ['proba-titluri', 'Carte de probă cu titluri', 'Partea 4'],
  ]) {
    await withPage(viewport, async (page, problems) => {
      await open(page, '/carti')
      check(`${tag} ${slug}: fără istoric, cardul lipsește`, await page.locator('.continue-card').count() === 0)

      await open(page, `/carti/${slug}`)
      check(`${tag} ${slug}: prima deschidere, fără buton`, await page.locator('.continue-from').count() === 0)
      await scrollToHeading(page, heading)
      await page.waitForTimeout(SAVE_WAIT_MS)
      const position = await stored(page)
      check(`${tag} ${slug}: salvează secțiunea`, position?.id === slug && position.sectiune === heading, JSON.stringify(position))

      await open(page, '/carti')
      const link = page.locator('a.continue-link')
      check(`${tag} ${slug}: textul cardului`, (await link.textContent()) === `Continuă lectura: ${title}, ${heading}`, await link.textContent())
      check(`${tag} ${slug}: fără derulare orizontală în listă`, await noHorizontalScroll(page))
      for (const target of await page.locator('.continue-card a, .continue-card button').all()) {
        const box = await target.boundingBox()
        check(`${tag} ${slug}: țintă ≥ 44 px`, box.height >= 44, String(box.height))
      }
      if (SHOTS_DIR && slug === 'proba-sectiuni') await page.screenshot({ path: path.join(SHOTS_DIR, `lista-${viewport.width}.png`) })

      await link.click()
      await page.waitForTimeout(SETTLE_WAIT_MS)
      check(`${tag} ${slug}: clic → secțiunea e în ecran`, await headingInView(page, heading))
      check(`${tag} ${slug}: ancora dispare din URL`, new URL(page.url()).hash === '', page.url())
      check(`${tag} ${slug}: după reluare, fără buton`, await page.locator('.continue-from').count() === 0)
      await page.waitForTimeout(SAVE_WAIT_MS)
      check(`${tag} ${slug}: reluarea nu mută locul`, (await stored(page))?.sectiune === heading)
      if (SHOTS_DIR && slug === 'proba-sectiuni') await page.screenshot({ path: path.join(SHOTS_DIR, `reluare-${viewport.width}.png`) })

      await open(page, `/carti/${slug}`)
      const button = page.locator('.continue-from')
      check(`${tag} ${slug}: butonul de pe pagina cărții`, (await button.textContent()) === `Continuă de la ${heading}`, await button.textContent())
      if (SHOTS_DIR && slug === 'proba-sectiuni') await page.screenshot({ path: path.join(SHOTS_DIR, `buton-${viewport.width}.png`) })
      check(`${tag} ${slug}: deschiderea normală nu derulează`, await page.evaluate(() => window.scrollY < 10))
      const box = await button.boundingBox()
      check(`${tag} ${slug}: buton ≥ 44 px`, box.height >= 44, String(box.height))
      await button.click()
      await page.waitForTimeout(200)
      check(`${tag} ${slug}: clic pe buton → secțiunea e în ecran`, await headingInView(page, heading))
      check(`${tag} ${slug}: fără derulare orizontală în carte`, await noHorizontalScroll(page))
      check(`${tag} ${slug}: fără erori în consolă`, problems.length === 0, problems.join(' | '))
    })
  }

  // Text lung fără titluri: procent, reluat doar din link sau din buton
  await withPage(viewport, async (page, problems) => {
    await open(page, '/carti/proba-lung')
    await scrollToPercent(page, 40)
    await page.waitForTimeout(SAVE_WAIT_MS)
    const position = await stored(page)
    check(`${tag} text lung: salvează procentul`, position?.id === 'proba-lung' && Math.abs(position.procent - 40) <= 1, JSON.stringify(position))

    await open(page, '/carti')
    const link = page.locator('a.continue-link')
    const expected = `Continuă lectura: Text lung de probă, ${position.procent}%`
    check(`${tag} text lung: textul cardului`, (await link.textContent()) === expected, await link.textContent())
    await link.click()
    await page.waitForTimeout(SETTLE_WAIT_MS)
    const after = await currentPercent(page)
    check(`${tag} text lung: clic → același loc`, Math.abs(after - position.procent) <= 1, String(after))

    await open(page, '/carti/proba-lung')
    check(`${tag} text lung: deschiderea normală nu derulează`, await page.evaluate(() => window.scrollY < 10))
    check(`${tag} text lung: butonul de pe pagină`, (await page.locator('.continue-from').textContent()) === `Continuă de la ${position.procent}%`)
    await page.waitForTimeout(SAVE_WAIT_MS)
    check(`${tag} text lung: deschiderea nu șterge locul`, (await stored(page))?.procent === position.procent)
    check(`${tag} text lung: fără erori în consolă`, problems.length === 0, problems.join(' | '))
  })

  // Ieșire înainte de debounce
  await withPage(viewport, async page => {
    await open(page, '/carti/proba-lung')
    await scrollToPercent(page, 55)
    await page.waitForTimeout(100)
    await page.goto('/carti')
    check(`${tag} ieșire înainte de debounce: pagehide salvează`, Math.abs(((await stored(page))?.procent ?? 0) - 55) <= 1, JSON.stringify(await stored(page)))
  })

  // Text care nu dă un loc de reluat: doar „Citite recent"
  await withPage(viewport, async (page, problems) => {
    await open(page, '/carti/proba-scurt')
    await page.waitForTimeout(SAVE_WAIT_MS)
    check(`${tag} text scurt: fără poziție`, await stored(page) === null)
    await open(page, '/carti')
    check(`${tag} text scurt: fără „Continuă lectura"`, await page.locator('a.continue-link').count() === 0)
    check(`${tag} text scurt: apare la „Citite recent"`, await page.locator('.continue-recent a').getAttribute('href') === '/carti/proba-scurt')
    check(`${tag} text scurt: fără erori în consolă`, problems.length === 0, problems.join(' | '))
  })

  // localStorage blocat
  await withPage(viewport, async (page, problems) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocat', 'SecurityError') } })
    })
    await open(page, '/carti/proba-sectiuni')
    await scrollToHeading(page, 'Icos 7')
    await page.waitForTimeout(SAVE_WAIT_MS)
    check(`${tag} localStorage blocat: cartea se afișează`, await page.locator('.rich.reading').isVisible())
    await open(page, '/carti')
    check(`${tag} localStorage blocat: lista merge, fără card`, await page.locator('h1').count() > 0 && await page.locator('.continue-card').count() === 0)
    check(`${tag} localStorage blocat: fără erori în consolă`, problems.length === 0, problems.join(' | '))
  })
}

const phone = VIEWPORTS[0]

// Lista recentă, cartea din buton și „Șterge istoricul"
await withPage(phone, async page => {
  for (let i = 1; i <= 6; i++) await open(page, `/carti/proba-${i}`)
  const ids = (await stored(page, RECENT)).map(b => b.id)
  check('recente: 5 cărți, cea mai recentă prima', JSON.stringify(ids) === JSON.stringify(['proba-6', 'proba-5', 'proba-4', 'proba-3', 'proba-2']), JSON.stringify(ids))
  await open(page, '/carti')
  check('recente: card cu cel mult 4 cărți', await page.locator('.continue-recent a').count() === 4)
  await page.locator('.continue-foot button').click()
  check('„Șterge istoricul" ascunde cardul', await page.locator('.continue-card').count() === 0)
  check('„Șterge istoricul" golește cheile', await stored(page) === null && await stored(page, RECENT) === null)
})

// Locul fiecărei cărți se păstrează separat
await withPage(phone, async page => {
  await open(page, '/carti/proba-sectiuni')
  await scrollToHeading(page, 'Icos 7')
  await page.waitForTimeout(SAVE_WAIT_MS)
  await open(page, '/carti/proba-lung')
  await scrollToPercent(page, 40)
  await page.waitForTimeout(SAVE_WAIT_MS)
  await open(page, '/carti/proba-sectiuni')
  check('două cărți: fiecare își păstrează locul', (await page.locator('.continue-from').textContent()) === 'Continuă de la Icos 7')
  await open(page, '/carti/proba-scurt')
  check('o carte fără loc nu primește locul alteia', await page.locator('.continue-from').count() === 0)
})

// Limbi
for (const [prefix, list, text, from] of [
  ['en', '/en/library', 'Continue reading: Acatist de probă, Icos 7', 'Continue from Icos 7'],
  ['ru', '/ru/biblioteka', 'Продолжить чтение: Acatist de probă, Icos 7', 'Продолжить с места: Icos 7'],
]) {
  await withPage(phone, async page => {
    await open(page, `${list}/proba-sectiuni`)
    await scrollToHeading(page, 'Icos 7')
    await page.waitForTimeout(SAVE_WAIT_MS)
    await open(page, list)
    const link = page.locator('a.continue-link')
    check(`${prefix}: text`, (await link.textContent()) === text, await link.textContent())
    check(`${prefix}: link`, (await link.getAttribute('href')).startsWith(`${list}/proba-sectiuni#s`), await link.getAttribute('href'))
    check(`${prefix}: fără derulare orizontală`, await noHorizontalScroll(page))
    await link.click()
    await page.waitForTimeout(SETTLE_WAIT_MS)
    check(`${prefix}: clic → secțiunea e în ecran`, await headingInView(page, 'Icos 7'))
    await open(page, `${list}/proba-sectiuni`)
    check(`${prefix}: buton`, (await page.locator('.continue-from').textContent()) === from)
    if (SHOTS_DIR) {
      await open(page, list)
      await page.screenshot({ path: path.join(SHOTS_DIR, `lista-${prefix}-390.png`) })
    }
  })
}

// Valori corupte
await withPage(phone, async (page, problems) => {
  await page.addInitScript(() => {
    localStorage.setItem('lectura:carte:poz', '{"id":"../x","procent":-1}')
    localStorage.setItem('lectura:carte:recente', 'stricat')
  })
  await open(page, '/carti')
  check('valori corupte: cardul lipsește', await page.locator('.continue-card').count() === 0)
  check('valori corupte: fără erori', problems.length === 0, problems.join(' | '))
})

// Carte ștearsă și ancoră necunoscută
await withPage(phone, async page => {
  await page.goto('/carti')
  await page.evaluate(() => {
    localStorage.setItem('lectura:carte:poz', JSON.stringify({ id: 'carte-stearsa', ts: 2, procent: 40 }))
    localStorage.setItem('lectura:carte:recente', JSON.stringify([{ id: 'carte-stearsa', ts: 2, procent: 40 }, { id: 'proba-lung', ts: 1 }]))
  })
  await open(page, '/carti')
  check('carte ștearsă: nu apare în card', await page.locator('a.continue-link').count() === 0)
  check('carte ștearsă: cealaltă rămâne', await page.locator('.continue-recent a').getAttribute('href') === '/carti/proba-lung')
  check('carte ștearsă: poziția e ștearsă', await stored(page) === null)

  await page.evaluate(() => {
    localStorage.setItem('lectura:carte:poz', JSON.stringify({ id: 'proba-sectiuni', ts: 3, sectiune: 'Nu există', ancora: 's999' }))
    localStorage.setItem('lectura:carte:recente', JSON.stringify([{ id: 'proba-sectiuni', ts: 3, sectiune: 'Nu există', ancora: 's999' }]))
  })
  await open(page, '/carti/proba-sectiuni')
  check('ancoră necunoscută: fără buton', await page.locator('.continue-from').count() === 0)
  check('ancoră necunoscută: locul e șters', await stored(page) === null)
})

// HTML pentru crawlere
for (const url of ['/carti', '/en/library', '/ru/biblioteka', '/carti/proba-sectiuni']) {
  const html = await (await fetch(BASE_URL + url)).text()
  const body = html.slice(html.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g, '')
  check(`HTML pentru crawlere fără card: ${url}`, !body.includes('continue-') && !body.includes('reading-section'))
}

await browser.close()
console.log(`\n${passes} trecute, ${failures} eșuate`)
process.exit(failures ? 1 : 0)
