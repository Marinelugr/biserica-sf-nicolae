#!/usr/bin/env node
/**
 * Proba E2E a cozii de revizuire. Date inventate, bază PGlite temporară. Vezi docs/BIBLIA-REVIZUIRE.md.
 *
 * Se rulează dintr-o copie a proiectului FĂRĂ fișiere .env, după `next build` cu aceleași variabile:
 *   PLAYWRIGHT_MODULE=/cale/playwright/index.mjs SHOTS=/cale/capturi node e2e/biblia-revizuire.e2e.mjs
 *
 * Pași: schema de pe main (OLD_SCHEMA_SQL) → SQL-ul nou (NEW_SCHEMA_SQL) → date → import (dry-run, apply, din nou apply)
 * → `next start` → browser.
 */
import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import bcrypt from 'bcryptjs'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const { OLD_SCHEMA_SQL, NEW_SCHEMA_SQL, PLAYWRIGHT_MODULE } = process.env
if (!OLD_SCHEMA_SQL || !NEW_SCHEMA_SQL || !PLAYWRIGHT_MODULE) throw new Error('Lipsesc OLD_SCHEMA_SQL, NEW_SCHEMA_SQL sau PLAYWRIGHT_MODULE.')
if (fs.existsSync('.env') || fs.existsSync('.env.local')) throw new Error('Rulează dintr-o copie fără .env: scriptul nu trebuie să poată ajunge la o bază reală.')
const { chromium } = await import(pathToFileURL(PLAYWRIGHT_MODULE).href)

const DB_PORT = 54329
const WEB_PORT = 3457
const BASE = `http://127.0.0.1:${WEB_PORT}`
const SHOTS = process.env.SHOTS || fs.mkdtempSync(path.join(os.tmpdir(), 'capturi-'))
const DB_URL = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable&connection_limit=1`
const ADMIN = { email: 'admin@exemplu.md', password: 'parola-de-proba' }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`) }

// ─── Baza ──────────────────────────────────────────────────────────────────

const pg = new PGlite()
await pg.waitReady
await pg.exec(fs.readFileSync(OLD_SCHEMA_SQL, 'utf8'))
const newSql = fs.readFileSync(NEW_SCHEMA_SQL, 'utf8')
await pg.exec(newSql)

// Testul 5: doar tabele noi, indexuri și cheia străină.
const statements = newSql.split('\n').filter(l => !l.startsWith('--')).join('\n').split(';').map(s => s.trim()).filter(Boolean)
const allowed = s => /^(BEGIN|COMMIT)$/.test(s) || /^CREATE TABLE "(BibleReviewItem|BibleReportThrottle)"/.test(s)
  || /^CREATE (UNIQUE )?INDEX "[^"]+" ON "(BibleReviewItem|BibleReportThrottle)"/.test(s)
  || /^ALTER TABLE "BibleReviewItem" ADD CONSTRAINT "BibleReviewItem_verseId_fkey" FOREIGN KEY \("verseId"\) REFERENCES "BibleVerse"\("id"\)/.test(s)
check('SQL: doar CREATE TABLE, indexuri și cheia spre BibleVerse', statements.every(allowed), `${statements.length} instrucțiuni`)
check('SQL: fără DROP', !/\bDROP\b/i.test(statements.join(' ')))

const WORDS = ['Soarele', 'răsare', 'peste', 'dealul', 'verde', 'iar', 'pâraiele', 'coboară', 'lin', 'spre', 'vale']
const text = (ch, v) => `Fraza inventată ${ch} ${v} ${WORDS[(ch * 7 + v) % WORDS.length]} ${WORDS[(ch + v * 3) % WORDS.length]} cuvântgreșit încheiere.`

async function seed() {
  await pg.exec(`
    INSERT INTO "BibleBook"(id, slug, "nameRo", testament, "orderNum") VALUES ('b1','iona','Iona','VT',1),('b2','rut','Rut','VT',2);
    INSERT INTO "BibleChapter"(id, "bookId", "chapterNum") VALUES ('c1','b1',1),('c2','b1',2),('c3','b2',1);
    INSERT INTO "Setting"(key, value) VALUES ('seed','1') ON CONFLICT DO NOTHING;
  `)
  for (const [chapterId, ch] of [['c1', 1], ['c2', 2], ['c3', 3]]) {
    for (let v = 1; v <= 12; v++) {
      const t = text(ch, v)
      await pg.query(`INSERT INTO "BibleVerse"(id, "chapterId", "verseNum", "textRo", "textSearch") VALUES ($1,$2,$3,$4,$5)`, [`v${ch}-${v}`, chapterId, v, t, t])
    }
  }
  const hash = await bcrypt.hash(ADMIN.password, 4)
  await pg.query(`INSERT INTO "User"(id, email, password, role, name) VALUES ('u1',$1,$2,'admin','Admin')`, [ADMIN.email, hash])
}
await seed()

/** 30 de rânduri inventate: fragmentul corect, cu context ca în audit. */
function syntheticCsv() {
  const rows = ['﻿carte,capitol,verset,fragment,propunere,motiv']
  const q = s => `"${s.replace(/"/g, '""')}"`
  const add = (slug, ch, v, propunere, motiv, target = 'cuvântgreșit') => {
    const t = text(ch, v), i = t.indexOf(target)
    rows.push([slug, ch === 3 ? 1 : ch, v, q(`${t.slice(0, i)}[[${target}]]${t.slice(i + target.length)}`), q(propunere), q(motiv)].join(','))
  }
  for (let v = 1; v <= 10; v++) add('iona', 1, v, v % 2 ? 'cuvânt-corect' : '', `F | ${v <= 6 ? 'medie' : 'mica'} | apariție unică | de verificat`)
  for (let v = 1; v <= 10; v++) add('iona', 2, v, '', 'F | mica | nume propriu inventat | de verificat')
  for (let v = 1; v <= 9; v++) add('rut', 3, v, 'varianta-a | varianta-b', 'E | medie | regulă de context | de verificat')
  // un rând al cărui fragment nu mai există în verset
  rows.push(`rut,1,10,"nu [[există]] deloc","x","D | medie | punctuație | de verificat"`)
  return rows.join('\n') + '\n'
}
const csvPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'csv-')), 'sintetic.csv')
fs.writeFileSync(csvPath, syntheticCsv())

const server = new PGLiteSocketServer({ db: pg, port: DB_PORT, host: '127.0.0.1', maxConnections: 20 })
await server.start()

const env = { ...process.env, DATABASE_URL: DB_URL, DIRECT_URL: DB_URL, AUTH_SECRET: 'secret-de-proba-e2e', NEXTAUTH_SECRET: 'secret-de-proba-e2e', NEXTAUTH_URL: BASE, AUTH_URL: BASE, AUTH_TRUST_HOST: 'true', NODE_ENV: 'production', PORT: String(WEB_PORT), HOSTNAME: '0.0.0.0' }

// Asincron: PGlite rulează în acest proces și trebuie să poată răspunde.
const importer = (args, importEnv = env) => promisify(execFile)('node_modules/.bin/ts-node', ['--compiler-options', '{"module":"CommonJS"}', 'prisma/bible/review-import.ts', '--file', csvPath, ...args], { env: importEnv, encoding: 'utf8' })
const runImport = async (...extra) => (await importer(extra)).stdout
const count = async (sql, ...p) => Number((await pg.query(sql, p)).rows[0].n)
const items = status => count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE status=$1`, status)

const dry = await runImport()
check('import dry-run: 30 de rânduri', /Rânduri valide: 30/.test(dry), dry.split('\n').find(l => l.startsWith('Plan')))
check('import dry-run: nimic scris', await count(`SELECT count(*)::int n FROM "BibleReviewItem"`) === 0)
await runImport('--apply')
check('import apply: 29 în așteptare + 1 învechit', await items('PENDING') === 29 && await items('STALE') === 1)
const again = await runImport('--apply')
check('import idempotent', /0 create/.test(again) && await count(`SELECT count(*)::int n FROM "BibleReviewItem"`) === 30)
let refused = false
try { await importer([], { ...env, DATABASE_URL: 'postgresql://x:x@baza.exemplu.test/x', DIRECT_URL: 'postgresql://x:x@baza.exemplu.test/x' }) }
catch (e) { refused = /nu e locală/.test(e.stderr) }
check('import: gazdă la distanță refuzată fără --allow-remote, chiar și în dry-run', refused)

// ─── Serverul ──────────────────────────────────────────────────────────────

const web = spawn('node_modules/.bin/next', ['start', '-p', String(WEB_PORT), '-H', '0.0.0.0'], { env, stdio: ['ignore', 'pipe', 'pipe'] })
const serverLog = []
web.stdout.on('data', d => serverLog.push(String(d)))
web.stderr.on('data', d => serverLog.push(String(d)))
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(`${BASE}/biblie`)).ok) break } catch { /* încă pornește */ }
  await new Promise(r => setTimeout(r, 500))
}

const browser = await chromium.launch()
const consoleErrors = []
async function newPage({ width = 1280, blockStorage = false, touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, hasTouch: touch, isMobile: touch })
  if (blockStorage) {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocat', 'SecurityError') } })
    })
  }
  const page = await context.newPage()
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`${page.url()}: ${m.text()}`) })
  page.on('pageerror', e => consoleErrors.push(`${page.url()}: ${e.message}`))
  return page
}
/** Adminul poate ține cereri deschise: se așteaptă hidratarea, fără a cere rețea complet liniștită. */
const go = async (page, url) => {
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {})
}
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
const verseText = async id => (await pg.query(`SELECT "textRo" t FROM "BibleVerse" WHERE id=$1`, [id])).rows[0].t

try {
  // ─── Pagina publică ───────────────────────────────────────────────────────
  const html = await (await fetch(`${BASE}/biblie/iona/1`)).text()
  check('HTML de pe server: fără notă și fără „Raportează”', !html.includes('în curs de verificare') && !html.includes('report-note') && !/>Raportează</.test(html))
  check('HTML de pe server: numerele versetelor rămân neschimbate', html.includes('<sup class="vnum" data-n="1"></sup>'))
  const robots = await (await fetch(`${BASE}/sitemap.xml`)).text()
  check('sitemap: fără adrese de Admin', !robots.includes('revizuire'))

  for (const [locale, url, thanks, note] of [
    ['ro', '/biblie/iona/1', 'Mulțumim! Vom verifica.', 'în curs de verificare'],
    ['en', '/en/bible/iona/1', 'Thank you! We will check it.', 'being checked'],
    ['ru', '/ru/bibliya/iona/1', 'Спасибо! Мы проверим.', 'на проверке'],
  ]) {
    const page = await newPage()
    const requests = []
    page.on('request', r => requests.push(r.url()))
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    check(`${locale}: nota apare`, (await page.getByTestId('nota-raportare').innerText()).includes(note))
    await page.locator('.vnum[data-n="3"]').hover()
    await page.locator('.report-action').waitFor()
    await page.locator('.report-action').click()
    await page.locator('dialog.report-dialog').waitFor()
    await page.locator('#raportare-mesaj').fill(`mesaj inventat ${locale}`)
    if (locale === 'ro') await page.screenshot({ path: path.join(SHOTS, 'cititor-formular-1280.png') })
    await page.locator('dialog button[type="submit"]').click()
    await page.getByText(thanks).waitFor()
    check(`${locale}: raportarea primește mulțumirile`, true)
    await page.context().close()
  }
  const reports = await pg.query(`SELECT detector, confidence, source, fragment, message, "bookSlug", "chapterNum", "verseNum" FROM "BibleReviewItem" WHERE source='cititor' ORDER BY message`)
  check('raportările: 3, cu sursa cititor, detector R, fragment gol', reports.rows.length === 3 && reports.rows.every(r => r.detector === 'R' && r.confidence === 'cititor' && r.fragment === '' && r.bookSlug === 'iona' && r.chapterNum === 1 && r.verseNum === 3))

  // Telefon: atingere, localStorage blocat, zone de atingere
  {
    const page = await newPage({ width: 390, touch: true, blockStorage: true })
    const before = consoleErrors.length
    await page.goto(`${BASE}/biblie/iona/1`, { waitUntil: 'networkidle' })
    check('390 px: fără depășire orizontală', await noOverflow(page))
    await page.screenshot({ path: path.join(SHOTS, 'cititor-nota-390.png') })
    const form0 = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /VerseReportForm|report/i.test(e.name)).length)
    check('390 px: formularul nu se descarcă înainte de interacțiune', form0 === 0)
    await page.locator('.vnum[data-n="2"]').tap()
    const action = page.locator('.report-action')
    await action.waitFor()
    const box = await action.boundingBox()
    check('390 px: acțiunea are cel puțin 44 px', box.height >= 44 && box.width >= 44, `${Math.round(box.width)}×${Math.round(box.height)}`)
    const hit = await page.locator('.vnum[data-n="2"]').evaluate(el => { const r = getComputedStyle(el, '::after'); return [parseFloat(r.width), parseFloat(r.height)] })
    check('390 px: zona de atingere a numărului are 44 px', hit[0] >= 44 && hit[1] >= 44)
    await action.tap()
    await page.locator('dialog.report-dialog').waitFor()
    await page.screenshot({ path: path.join(SHOTS, 'cititor-formular-390.png') })
    await page.locator('#raportare-mesaj').fill('vezi http://exemplu.test')
    await page.locator('dialog button[type="submit"]').tap()
    await page.getByText('adrese web').waitFor()
    check('390 px: adresa web e respinsă, cu mesaj', true)
    await page.locator('#raportare-mesaj').fill('fără adresă')
    await page.locator('dialog button[type="submit"]').tap()
    await page.getByText('Mulțumim! Vom verifica.').waitFor()
    await page.locator('dialog .btn').tap()
    check('localStorage blocat: raportarea merge', true)
    await page.locator('.report-note-close').tap()
    check('localStorage blocat: nota se închide', await page.getByTestId('nota-raportare').count() === 0)
    check('localStorage blocat: fără erori în consolă', consoleErrors.length === before, consoleErrors.slice(before).join(' | '))
    await page.context().close()
  }

  // Tastatură, memorarea notei, capcana
  {
    const page = await newPage()
    await page.goto(`${BASE}/biblie/iona/2`, { waitUntil: 'networkidle' })
    await page.locator('.report-note-close').click()
    await page.reload({ waitUntil: 'networkidle' })
    check('nota închisă rămâne închisă după reîncărcare', await page.getByTestId('nota-raportare').count() === 0)
    await page.locator('.vnum[data-n="1"]').focus()
    await page.keyboard.press('Enter')
    await page.locator('dialog.report-dialog').waitFor()
    check('tastatură: Enter pe număr deschide formularul', true)
    check('capcana: câmpul nu e vizibil', await page.locator('.report-trap input').evaluate(el => { const b = el.getBoundingClientRect(); return b.right < 0 || b.width <= 1 }))
    await page.locator('.report-trap input').evaluate(el => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      set.call(el, 'robot'); el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const n0 = await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE source='cititor'`)
    await page.locator('dialog button[type="submit"]').click()
    await page.getByText('Mulțumim! Vom verifica.').waitFor()
    check('capcana: răspuns prietenos, nimic scris', await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE source='cititor'`) === n0)
    await page.keyboard.press('Escape')
    await page.locator('dialog.report-dialog').waitFor({ state: 'detached' })
    check('Escape închide și focusul revine pe număr', await page.evaluate(() => document.activeElement?.getAttribute('data-n')) === '1')
    await page.context().close()
  }

  // ─── Coada ────────────────────────────────────────────────────────────────
  const anon = await newPage()
  await anon.goto(`${BASE}/admin/biblia/revizuire`)
  check('neautentificat: spre autentificare', anon.url().includes('/admin/login'))
  await anon.context().close()

  const admin = await newPage()
  await go(admin, `${BASE}/admin/login`)
  await admin.locator('input[type="email"]').fill(ADMIN.email)
  await admin.locator('input[type="password"]').fill(ADMIN.password)
  await admin.locator('form:has(input[type="password"]) button[type="submit"]').click()
  await admin.waitForURL(u => !u.pathname.includes('/login'))

  await go(admin, `${BASE}/admin/biblia`)
  const pendingBefore = await items('PENDING')
  check('/admin/biblia: cardul arată numărul', (await admin.getByTestId('card-revizuire').innerText()).includes(String(pendingBefore)))
  await admin.getByTestId('card-revizuire').click()
  await admin.waitForURL('**/admin/biblia/revizuire')
  const robotsMeta = await admin.locator('meta[name="robots"]').getAttribute('content')
  check('coada: noindex', /noindex/.test(robotsMeta))
  await admin.screenshot({ path: path.join(SHOTS, 'coada-1280.png'), fullPage: true })

  const el = admin.getByTestId('element')
  check('sortare: raportările de cititor sunt primele', await el.getAttribute('data-source') === 'cititor')
  check('raportarea afișează mesajul', (await el.innerText()).includes('mesaj inventat') || (await el.innerText()).includes('fără adresă') || (await el.innerText()).includes('Cititorul nu a scris'))
  check('raportarea: fără „Aplică” și fără „Ignoră toate”', await el.getByRole('button', { name: /Aplică/ }).count() === 0 && await el.getByRole('button', { name: /Ignoră toate/ }).count() === 0)

  // treci peste raportări, la audit cu propunere
  await go(admin, `${BASE}/admin/biblia/revizuire?sursa=audit&detector=F&incredere=medie`)
  const firstRef = await el.locator('strong').innerText()
  check('sortare: medie, carte, capitol, verset', firstRef.endsWith('1:1'), firstRef)
  await admin.screenshot({ path: path.join(SHOTS, 'coada-audit-1280.png'), fullPage: true })
  check('fragmentul e evidențiat', await el.locator('mark').innerText() === 'cuvântgreșit')
  check('versetele vecine sunt afișate', (await el.innerText()).includes('Fraza inventată 1 2'))

  // 1. Aplică, cu butonul
  const verseAfter = text(1, 1).replace('cuvântgreșit', 'cuvânt-corect')
  await el.getByRole('button', { name: /Aplică propunerea/ }).click()
  await admin.getByTestId('stare').getByText('Propunerea a fost aplicată.').waitFor()
  await admin.waitForFunction(() => !document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:1'))
  check('Aplică: textul, textSearch și editedAt', await verseText('v1-1') === verseAfter)
  const edit = (await pg.query(`SELECT action, editor, "oldText", "newText" FROM "BibleEdit" WHERE "verseId"='v1-1'`)).rows
  check('Aplică: un rând EDIT în jurnal', edit.length === 1 && edit[0].action === 'EDIT' && edit[0].editor === ADMIN.email)
  check('Aplică: trece automat la următorul', (await el.locator('strong').innerText()).endsWith('1:2'))

  // 2. Cititorul vede imediat versetul corectat
  const fresh = await (await fetch(`${BASE}/biblie/iona/1`)).text()
  check('cache-ul cititorului e invalidat', fresh.includes('cuvânt-corect'))

  // 3. Sari, cu tastatura
  await admin.keyboard.press('s')
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:3'))
  check('Sari (S): la următorul, fără schimbări', await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE "verseId"='v1-2' AND source='audit' AND status='PENDING'`) === 1)
  await admin.keyboard.press('ArrowLeft')
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:2'))
  await admin.keyboard.press('ArrowRight')
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:3'))
  check('săgețile navighează', true)

  // 4. Editează, cu tastatura
  await admin.keyboard.press('e')
  const area = admin.locator('#revizuire-text')
  await area.waitFor()
  await area.fill('Text corectat de mână ş.')
  await el.getByRole('button', { name: 'Salvează' }).click()
  await admin.getByTestId('stare').getByText('Versetul a fost salvat.').waitFor()
  check('Editează: normalizat (sedilă → virgulă)', await verseText('v1-3') === 'Text corectat de mână ș.')
  check('Editează: elementul e EDITED', await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE "verseId"='v1-3' AND status='EDITED'`) === 1)

  // 5. Ignoră, cu tastatura: coada merge înainte (1:4), elementul sărit rămâne în spate
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:4'))
  await admin.keyboard.press('ArrowLeft')
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:2'))
  await admin.keyboard.press('i')
  await admin.getByTestId('stare').getByText('Ignorat.').waitFor()
  check('Ignoră: versetul rămâne', await verseText('v1-2') === text(1, 2))
  check('Ignoră: fără jurnal', await count(`SELECT count(*)::int n FROM "BibleEdit" WHERE "verseId"='v1-2'`) === 0)

  // Conflict: versetul se schimbă sub ochii administratorului, dar fragmentul rămâne
  await admin.waitForFunction(() => document.querySelector('[data-testid="element"] strong')?.textContent?.endsWith('1:4'))
  const t4 = await verseText('v1-4')
  await pg.query(`UPDATE "BibleVerse" SET "textRo"=$1, "textSearch"=$1, "editedAt"=now() WHERE id='v1-4'`, [t4 + ' Adaos.'])
  await admin.keyboard.press('e')
  await area.fill('Încercare peste altă versiune.')
  await el.getByRole('button', { name: 'Salvează' }).click()
  await el.getByRole('alert').getByText('modificat de altcineva').waitFor()
  check('conflict: scrierea e respinsă', await verseText('v1-4') === t4 + ' Adaos.')
  await el.getByRole('button', { name: 'Renunță' }).click()

  // Fragment dispărut: se marchează învechit și se sare
  await pg.query(`UPDATE "BibleVerse" SET "textRo"='Text cu totul schimbat.', "textSearch"='Text cu totul schimbat.' WHERE id='v1-5'`)
  await go(admin, `${BASE}/admin/biblia/revizuire?sursa=audit&detector=F&incredere=medie&i=1`)
  check('fragment dispărut: STALE automat și sărit', await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE "verseId"='v1-5' AND status='STALE'`) === 1 && await admin.getByTestId('sarite').count() === 1)

  // Ignoră toate pentru același fragment, cu număr și confirmare
  await go(admin, `${BASE}/admin/biblia/revizuire?sursa=audit&detector=F&incredere=mica`)
  const mica = await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE detector='F' AND status='PENDING'`)
  await el.getByRole('button', { name: /Ignoră toate/ }).click()
  await el.getByRole('group', { name: 'Confirmare' }).waitFor()
  check('Ignoră toate: arată numărul', (await el.getByRole('group', { name: 'Confirmare' }).innerText()).includes(`Ignori ${mica} elemente`))
  await admin.screenshot({ path: path.join(SHOTS, 'coada-ignora-toate-1280.png'), fullPage: true })
  await el.getByRole('button', { name: 'Confirmă' }).click()
  await admin.getByTestId('stare').getByText(`Ignorate: ${mica}.`).waitFor()
  check('Ignoră toate: toate ignorate', await count(`SELECT count(*)::int n FROM "BibleReviewItem" WHERE detector='F' AND status='PENDING'`) === 0)

  // Variante de propunere: un buton pentru fiecare
  await go(admin, `${BASE}/admin/biblia/revizuire?detector=E`)
  check('propunere cu variante: câte un buton', await el.getByRole('button', { name: /Aplică:/ }).count() === 2)
  await el.getByRole('button', { name: 'Aplică: varianta-b' }).click()
  await admin.getByTestId('stare').getByText('Propunerea a fost aplicată.').waitFor()
  check('propunere cu variante: se aplică cea aleasă', (await verseText('v3-1')).includes('varianta-b'))

  // Raportarea apare în coadă, cu sursa „cititor”
  await go(admin, `${BASE}/admin/biblia/revizuire?sursa=cititor`)
  check('raportarea e în coadă, cu sursa cititor', await el.getAttribute('data-source') === 'cititor' && (await el.locator('strong').innerText()).endsWith('1:2'))
  await admin.screenshot({ path: path.join(SHOTS, 'coada-cititor-1280.png'), fullPage: true })

  // Link spre editor
  check('linkul spre editor', await el.getByRole('link', { name: 'Deschide în editor' }).getAttribute('href') === '/admin/biblia/iona/1#v2')

  // 390 px
  await admin.setViewportSize({ width: 390, height: 844 })
  await go(admin, `${BASE}/admin/biblia/revizuire?detector=E`)
  check('coada la 390 px: fără depășire orizontală', await noOverflow(admin))
  const small = await el.getByRole('button').evaluateAll(list => list.filter(b => b.getBoundingClientRect().height < 44).length)
  check('coada la 390 px: butoane de cel puțin 44 px', small === 0)
  check('coada la 390 px: elementul e vizibil fără derulare', await el.evaluate(n => { const b = n.getBoundingClientRect(); return b.top >= 0 && b.top < window.innerHeight / 2 }))
  // Adminul derulează într-un panou interior; o captură „fullPage” l-ar tăia.
  await admin.screenshot({ path: path.join(SHOTS, 'coada-390.png') })

  // Limita de 10 pe oră: sus există deja raportări de la același browser; se umple direct
  const filler = await newPage()
  await filler.goto(`${BASE}/biblie/iona/1`, { waitUntil: 'networkidle' })
  await pg.exec(`INSERT INTO "BibleReportThrottle"(id,"keyHash") SELECT 'p'||g, (SELECT "keyHash" FROM "BibleReportThrottle" LIMIT 1) FROM generate_series(1,10) g`)
  await pg.exec(`UPDATE "BibleReportThrottle" SET "keyHash"=(SELECT "keyHash" FROM "BibleReportThrottle" LIMIT 1)`)
  await filler.locator('.vnum[data-n="4"]').hover()
  await filler.locator('.report-action').click()
  await filler.locator('dialog button[type="submit"]').click()
  await filler.getByText('multe raportări').waitFor()
  check('a 11-a raportare într-o oră: mesaj de limită, pagina rămâne', await filler.locator('.reader-text').count() === 1)
  await filler.context().close()

  // Prisma nu vede indexul parțial ca diferență: nici `migrate diff`, nici `db push` nu l-ar șterge.
  const diff = await promisify(execFile)('node_modules/.bin/prisma', ['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--script'], { env, encoding: 'utf8' })
  check('prisma migrate diff: nicio diferență față de baza cu SQL-ul aplicat', !/CREATE|ALTER|DROP/.test(diff.stdout), diff.stdout.trim().split('\n')[0])

  // Tabele lipsă: cititorul merge, formularul răspunde prietenos
  await pg.exec(`DROP TABLE "BibleReviewItem"; DROP TABLE "BibleReportThrottle";`)
  const gone = await newPage()
  const goneBefore = consoleErrors.length
  await gone.goto(`${BASE}/biblie/iona/1`, { waitUntil: 'networkidle' })
  check('fără tabele: cititorul merge', await gone.locator('.reader-text').count() === 1)
  await gone.locator('.vnum[data-n="4"]').hover()
  await gone.locator('.report-action').click()
  await gone.locator('dialog button[type="submit"]').click()
  await gone.getByText('Momentan nu putem primi raportări.').waitFor()
  check('fără tabele: formularul răspunde „Momentan nu putem primi raportări”', true)
  check('fără tabele: fără erori în consolă', consoleErrors.length === goneBefore, consoleErrors.slice(goneBefore).join(' | '))
  await gone.context().close()
  await go(admin, `${BASE}/admin/biblia`)
  check('fără tabele: /admin/biblia merge, fără card', await admin.getByRole('heading', { name: 'Biblia' }).count() === 1 && await admin.getByTestId('card-revizuire').count() === 0)
  await go(admin, `${BASE}/admin/biblia/revizuire`)
  check('fără tabele: coada explică ce lipsește', await admin.getByText('Tabelele cozii nu există încă').count() === 1)
  await admin.context().close()

  const relevantErrors = consoleErrors.filter(e => !/favicon|the server responded with a status of 404/.test(e))
  check('fără erori în consolă, în toată proba', relevantErrors.length === 0, relevantErrors.slice(0, 5).join(' | '))
} catch (err) {
  check(`oprit: ${err.message.split('\n')[0]}`, false)
  console.log(serverLog.slice(-15).join('').slice(-1500))
} finally {
  await browser.close()
  web.kill()
  await server.stop()
  await pg.close()
}

const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} verificări trecute. Capturi: ${SHOTS}`)
assert.equal(failed.length, 0)
process.exit(0)
