// Test E2E pentru „Continuă lectura". Se rulează pe un build local cu bază sintetică; vezi docs/BIBLIA-CONTINUA.md.
//   BASE_URL=http://127.0.0.1:3417 PLAYWRIGHT_DIR=<folder cu playwright-core> CHROMIUM_PATH=<executabil> SHOTS_DIR=<folder> node e2e/biblia-continua.mjs
import { createRequire } from 'node:module'
import path from 'node:path'

const { BASE_URL = 'http://127.0.0.1:3417', PLAYWRIGHT_DIR, CHROMIUM_PATH, SHOTS_DIR } = process.env
const { chromium } = createRequire(path.join(PLAYWRIGHT_DIR ?? process.cwd(), 'noop.js'))('playwright-core')

const POSITION = 'biblia:pozitie'
const RECENT = 'biblia:recente'
const SAVE_WAIT_MS = 1200
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
  try { await run(page, context) } finally { await context.close() }
}

const stored = (page, key = POSITION) => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), key)

async function scrollToVerse(page, n) {
  await page.evaluate(v => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))
    const top = document.getElementById(`v${v}`).getBoundingClientRect().top + window.scrollY - header - 20
    window.scrollTo({ top, behavior: 'instant' })
  }, n)
}

const inViewport = (page, n) => page.evaluate(v => {
  const { top, bottom } = document.getElementById(`v${v}`).getBoundingClientRect()
  return bottom > 71 && top < window.innerHeight
}, n)

const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  await withPage(viewport, async page => {
    await page.goto('/biblie')
    check(`${tag} fără poziție, cardul lipsește`, await page.locator('.continue-card').count() === 0)

    await page.goto('/biblie/ioan/3')
    await scrollToVerse(page, 30)
    await page.waitForTimeout(SAVE_WAIT_MS)
    const position = await stored(page)
    check(`${tag} salvează versetul de sus`, position?.carte === 'ioan' && position.capitol === 3 && position.verset === 30, JSON.stringify(position))

    await page.goto('/biblie')
    const card = page.locator('.continue-card')
    await card.waitFor()
    const link = page.locator('a.continue-link')
    check(`${tag} textul cardului`, (await link.textContent()) === 'Continuă lectura: Ioan 3, versetul 30', await link.textContent())
    check(`${tag} linkul cardului`, (await link.getAttribute('href')) === '/biblie/ioan/3#v30')
    check(`${tag} fără derulare orizontală pe /biblie`, await noHorizontalScroll(page))
    for (const target of await card.locator('a, button').all()) {
      const box = await target.boundingBox()
      check(`${tag} țintă ≥ 44 px: ${await target.textContent()}`, box.height >= 44, String(box.height))
    }
    if (SHOTS_DIR) await page.screenshot({ path: path.join(SHOTS_DIR, `card-${viewport.width}.png`) })

    await link.click()
    await page.waitForURL('**/biblie/ioan/3#v30')
    await page.locator('#v30[data-resume="on"]').waitFor()
    await page.waitForTimeout(900)
    check(`${tag} versetul e în ecran după clic`, await inViewport(page, 30))
    if (SHOTS_DIR) await page.screenshot({ path: path.join(SHOTS_DIR, `reluare-${viewport.width}.png`) })
    await page.waitForTimeout(1800)
    check(`${tag} evidențierea se stinge`, await page.evaluate(() => {
      const el = document.getElementById('v30')
      return el.dataset.resume === 'off' && getComputedStyle(el).boxShadow === 'none'
    }))
    check(`${tag} fără derulare orizontală în capitol`, await noHorizontalScroll(page))
  })

  await withPage(viewport, async page => {
    await page.goto('/biblie/ioan/3')
    await scrollToVerse(page, 44)
    await page.waitForTimeout(100)
    await page.goto('/biblie')
    check(`${tag} ieșire înainte de debounce: pagehide salvează`, (await stored(page))?.verset === 44, JSON.stringify(await stored(page)))
  })

  await withPage(viewport, async page => {
    await page.addInitScript(() => localStorage.setItem('bible-text-size', 'l'))
    await page.goto('/biblie/ioan/3')
    await page.locator('.reader[data-size="l"]').waitFor()
    await scrollToVerse(page, 40)
    await page.waitForTimeout(SAVE_WAIT_MS)
    const verse = (await stored(page))?.verset
    await page.goto('/biblie')
    await page.locator('a.continue-link').click()
    await page.waitForTimeout(1200)
    check(`${tag} text foarte mare: versetul de reluare rămâne în ecran`, verse === 40 && await inViewport(page, 40), String(verse))
  })
}

const phone = VIEWPORTS[0]

await withPage(phone, async page => {
  await page.goto('/biblie/ioan/5#v10')
  await page.waitForTimeout(SAVE_WAIT_MS + 1000)
  await page.goto('/biblie')
  check('deschis la verset, fără derulare: nu salvează', await stored(page) === null)

  await page.goto('/biblie?q=Ioan%207:4')
  await page.waitForURL('**/biblie/ioan/7#v4')
  await page.waitForTimeout(SAVE_WAIT_MS + 1000)
  check('referință căutată, fără derulare: nu salvează', await stored(page) === null)

  await page.goto('/biblie?q=Ioan%207')
  await page.waitForURL('**/biblie/ioan/7')
  await page.waitForTimeout(SAVE_WAIT_MS + 1000)
  await page.goto('/biblie')
  check('capitol căutat (redirecționare), fără derulare: nu salvează', await stored(page) === null)

  await page.goto('/biblie/ioan/5#v10')
  await page.waitForTimeout(1500)
  await scrollToVerse(page, 20)
  await page.waitForTimeout(SAVE_WAIT_MS)
  check('după derulare: salvează', (await stored(page))?.verset === 20, JSON.stringify(await stored(page)))
})

await withPage(phone, async page => {
  for (const [book, chapter] of [['matei', 1], ['matei', 2], ['ioan', 1], ['ioan', 2], ['psalmi', 1], ['psalmi', 2], ['ioan', 1]]) {
    await page.goto(`/biblie/${book}/${chapter}`)
    await page.waitForTimeout(SAVE_WAIT_MS)
  }
  const recent = await stored(page, RECENT)
  check('lista recentă: 5 capitole, fără dubluri, cel mai recent primul',
    JSON.stringify(recent.map(r => `${r.carte}/${r.capitol}`)) === JSON.stringify(['ioan/1', 'psalmi/2', 'psalmi/1', 'ioan/2', 'matei/2']), JSON.stringify(recent))
  await page.goto('/biblie')
  const links = await page.locator('.continue-recent a').evaluateAll(all => all.map(a => a.getAttribute('href')))
  check('„Citite recent" arată 4 capitole anterioare',
    JSON.stringify(links) === JSON.stringify(['/biblie/psalmi/2', '/biblie/psalmi/1', '/biblie/ioan/2', '/biblie/matei/2']), JSON.stringify(links))
  await page.locator('.continue-foot button').click()
  check('„Șterge istoricul" ascunde cardul', await page.locator('.continue-card').count() === 0)
  check('„Șterge istoricul" golește cheile', await stored(page) === null && await stored(page, RECENT) === null)
})

for (const [prefix, chapterPath, text, href] of [
  ['en', '/en/bible', 'Continue reading: John 3, verse 30', '/en/bible/ioan/3#v30'],
  ['ru', '/ru/bibliya', 'Продолжить чтение: От Иоанна 3, стих 30', '/ru/bibliya/ioan/3#v30'],
]) {
  await withPage(phone, async page => {
    await page.goto(`${chapterPath}/ioan/3`)
    await scrollToVerse(page, 30)
    await page.waitForTimeout(SAVE_WAIT_MS)
    await page.goto(chapterPath)
    const link = page.locator('a.continue-link')
    await link.waitFor()
    check(`${prefix}: text`, (await link.textContent()) === text, await link.textContent())
    check(`${prefix}: link`, (await link.getAttribute('href')) === href, await link.getAttribute('href'))
    check(`${prefix}: fără derulare orizontală`, await noHorizontalScroll(page))
    if (SHOTS_DIR) await page.screenshot({ path: path.join(SHOTS_DIR, `card-${prefix}-390.png`) })
  })
}

await withPage(phone, async page => {
  await page.goto('/biblie/ioan/3')
  await scrollToVerse(page, 30)
  await page.waitForTimeout(SAVE_WAIT_MS)
  await page.goto('/biblie')
  await page.locator('a.continue-link').click()
  await page.locator('#v30[data-resume="on"]').waitFor()
  const transition = await page.locator('#v30').evaluate(el => getComputedStyle(el).transitionDuration)
  check('prefers-reduced-motion: fără tranziție', transition === '0s', transition)
}, { reducedMotion: 'reduce' })

await withPage(phone, async page => {
  await page.addInitScript(() => {
    localStorage.setItem('biblia:pozitie', '{"carte":"nu-exista","capitol":-1}')
    localStorage.setItem('biblia:recente', 'stricat')
  })
  await page.goto('/biblie')
  await page.waitForTimeout(300)
  check('valori corupte: cardul lipsește', await page.locator('.continue-card').count() === 0)
})

for (const viewport of VIEWPORTS) {
  await withPage(viewport, async page => {
    const problems = []
    page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
    page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`) })
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocat', 'SecurityError') } })
    })
    await page.goto('/biblie/ioan/3')
    await scrollToVerse(page, 30)
    await page.waitForTimeout(SAVE_WAIT_MS)
    check(`${viewport.width}px localStorage blocat: capitolul se afișează`, await page.locator('#v30').isVisible())
    await page.goto('/biblie')
    await page.waitForTimeout(300)
    check(`${viewport.width}px localStorage blocat: pagina merge, fără card`,
      await page.locator('h1').count() > 0 && await page.locator('.continue-card').count() === 0)
    check(`${viewport.width}px localStorage blocat: fără erori în consolă`, problems.length === 0, problems.join(' | '))
  })
}

for (const url of ['/biblie', '/en/bible', '/ru/bibliya']) {
  const html = await (await fetch(BASE_URL + url)).text()
  check(`HTML pentru crawlere fără card: ${url}`, !html.includes('continue-card') && !html.includes('continue-link'))
}

await browser.close()
console.log(`\n${passes} trecute, ${failures} eșuate`)
process.exit(failures ? 1 : 0)
