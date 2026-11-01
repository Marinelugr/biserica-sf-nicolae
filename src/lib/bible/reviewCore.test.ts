import { describe, it, expect, vi } from 'vitest'
import {
  applyImportPlan, countOccurrences, highlightFragment, ignoreAllBatch, ignoreAllMarker, isStale, loadImportPlan, MAX_IGNORE_ALL,
  parseAuditCsv, parseCsv, parseFragment, planApply, planImport, ReviewCsvError, suggestionOptions,
  type AuditRow, type ExistingItem, type ImportVerse, type NewItem, type ReviewImportDb,
} from './reviewCore'

const HEAD = 'carte,capitol,verset,fragment,propunere,motiv'

describe('parseCsv', () => {
  it('virgule, ghilimele dublate, diacritice, CRLF și BOM', () => {
    const rows = parseCsv('﻿a,b\r\n"unu, doi","spune ""țară"" și șes"\r\nx,\n')
    expect(rows.map(r => r.cells)).toEqual([['a', 'b'], ['unu, doi', 'spune "țară" și șes'], ['x', '']])
  })
  it('rând nou în câmp: numerotarea rămâne corectă', () => {
    expect(parseCsv('a\n"x\ny"\nz').map(r => r.line)).toEqual([1, 2, 4])
  })
  it('ghilimele neînchise → eroare clară', () => {
    expect(() => parseCsv('a,b\n"nu se închide,1')).toThrow(/Ghilimele neînchise în rândul 2/)
  })
})

describe('parseAuditCsv', () => {
  const line = (over: Partial<Record<'carte' | 'capitol' | 'verset' | 'fragment' | 'propunere' | 'motiv', string>> = {}) => {
    const r = { carte: 'iona', capitol: '1', verset: '2', fragment: 'unu [[doi]] trei', propunere: 'dou', motiv: 'F | medie | tip inventat | detaliu inventat', ...over }
    return [r.carte, r.capitol, r.verset, `"${r.fragment.replace(/"/g, '""')}"`, `"${r.propunere}"`, `"${r.motiv}"`].join(',')
  }

  it('detectorul și încrederea vin din motiv', () => {
    const { rows, errors } = parseAuditCsv(`﻿${HEAD}\n${line()}\n`)
    expect(errors).toEqual([])
    expect(rows[0]).toEqual({
      line: 2, bookSlug: 'iona', chapterNum: 1, verseNum: 2, detector: 'F', confidence: 'medie',
      fragment: 'unu [[doi]] trei', suggestion: 'dou', reason: 'tip inventat — detaliu inventat',
    })
  })
  it('normalizează sedila din fragment și propunere; păstrează spațiul din „: ”', () => {
    const { rows } = parseAuditCsv(`${HEAD}\n${line({ fragment: 'aş [[ţine]] sus', propunere: ': ' })}\n`)
    expect(rows[0].fragment).toBe('aș [[ține]] sus')
    expect(rows[0].suggestion).toBe(': ')
  })
  it('propunere goală → null', () => {
    expect(parseAuditCsv(`${HEAD}\n${line({ propunere: '' })}\n`).rows[0].suggestion).toBeNull()
  })
  it('coloane lipsă → eroare care le numește', () => {
    expect(() => parseAuditCsv('carte,capitol,verset,fragment\niona,1,1,x\n')).toThrow(ReviewCsvError)
    expect(() => parseAuditCsv('carte,capitol,verset,fragment\niona,1,1,x\n')).toThrow(/Lipsesc coloanele: propunere, motiv/)
  })
  it('fișier gol → eroare', () => {
    expect(() => parseAuditCsv('')).toThrow(/gol/)
  })
  it.each([
    ['carte necunoscută', line({ carte: 'inventata' }), /carte necunoscută/],
    ['capitol nevalid', line({ capitol: 'x' }), /capitol sau verset/],
    ['capitolul 0', line({ capitol: '0' }), /capitol sau verset/],
    ['fragment gol', line({ fragment: '' }), /fragment gol/],
    ['marcaje rupte', line({ fragment: 'a [[b c' }), /marcaje/],
    ['două marcaje', line({ fragment: '[[a]] [[b]]' }), /marcaje/],
    ['detector nevalid', line({ motiv: 'Z | medie | x | y' }), /detector/],
    ['încredere nevalidă', line({ motiv: 'F | mare | x | y' }), /încredere/],
  ])('%s: rândul e semnalat, fără conținut', (_n, row, pattern) => {
    const { rows, errors } = parseAuditCsv(`${HEAD}\n${row}\n`)
    expect(rows).toEqual([])
    expect(errors[0].line).toBe(2)
    expect(errors[0].error).toMatch(pattern)
    expect(errors[0].error).not.toContain('doi')
  })
  it('număr greșit de coloane', () => {
    expect(parseAuditCsv(`${HEAD}\niona,1,2\n`).errors[0].error).toMatch(/3 coloane în loc de 6/)
  })
  it('versetul 0 (Psalmi) e valid', () => {
    expect(parseAuditCsv(`${HEAD}\n${line({ verset: '0' })}\n`).rows[0].verseNum).toBe(0)
  })
})

describe('fragmentul', () => {
  it('se desparte în stânga, țintă, dreapta', () => {
    expect(parseFragment('unu [[doi]] trei')).toEqual({ left: 'unu ', target: 'doi', right: ' trei', context: 'unu doi trei' })
    expect(parseFragment('fără marcaje')).toEqual({ left: '', target: 'fără marcaje', right: '', context: 'fără marcaje' })
  })
  it('evidențierea marchează doar ținta', () => {
    expect(highlightFragment('zero unu doi trei', 'unu [[doi]] trei')).toEqual([
      { text: 'zero unu ', hit: false }, { text: 'doi', hit: true }, { text: ' trei', hit: false },
    ])
  })
  it('fără potrivire sau fragment gol: textul întreg, nemarcat', () => {
    expect(highlightFragment('altceva', 'unu [[doi]]')).toEqual([{ text: 'altceva', hit: false }])
    expect(highlightFragment('altceva', '')).toEqual([{ text: 'altceva', hit: false }])
  })
  it('numără și aparițiile suprapuse', () => {
    expect(countOccurrences('aaa', 'aa')).toBe(2)
    expect(countOccurrences('abc', '')).toBe(0)
  })
  it('învechit doar dacă contextul nu mai apare; raportările de cititor niciodată', () => {
    expect(isStale('zero unu doi trei', 'unu [[doi]] trei')).toBe(false)
    expect(isStale('zero unu dou trei', 'unu [[doi]] trei')).toBe(true)
    expect(isStale('orice text', '')).toBe(false)
  })
  it('variantele propunerii', () => {
    expect(suggestionOptions('a | b')).toEqual(['a', 'b'])
    expect(suggestionOptions(': ')).toEqual([': '])
    expect(suggestionOptions(null)).toEqual([])
  })
})

describe('aplicarea propunerii', () => {
  it('înlocuiește exact o dată, doar ținta', () => {
    expect(planApply('doi unu doi trei doi', 'unu [[doi]] trei', 'dou')).toEqual({ kind: 'ok', text: 'doi unu dou trei doi' })
  })
  it('refuză la 0 apariții', () => {
    expect(planApply('altceva', 'unu [[doi]]', 'dou')).toEqual({ kind: 'stale' })
  })
  it('refuză la mai mult de o apariție', () => {
    expect(planApply('unu doi, unu doi', 'unu [[doi]]', 'dou')).toEqual({ kind: 'ambiguous', count: 2 })
  })
  it('alege varianta cerută', () => {
    expect(planApply('unu doi', 'unu [[doi]]', 'a | b', 1)).toEqual({ kind: 'ok', text: 'unu b' })
  })
  it('fără propunere sau cu variantă inexistentă: nimic', () => {
    expect(planApply('unu doi', 'unu [[doi]]', null).kind).toBe('no-suggestion')
    expect(planApply('unu doi', 'unu [[doi]]', 'a', 3).kind).toBe('no-suggestion')
    expect(planApply('unu doi', '', 'a').kind).toBe('no-suggestion')
  })
  it('„$&” din propunere nu e un tipar', () => {
    expect(planApply('unu doi', 'unu [[doi]]', '$&')).toEqual({ kind: 'ok', text: 'unu $&' })
  })
})

describe('„Ignoră toate”', () => {
  it('limita de 500 pe operație', () => {
    expect(MAX_IGNORE_ALL).toBe(500)
    expect(ignoreAllBatch(3)).toEqual({ now: 3, remaining: 0 })
    expect(ignoreAllBatch(500)).toEqual({ now: 500, remaining: 0 })
    expect(ignoreAllBatch(501)).toEqual({ now: 500, remaining: 1 })
  })
  it('se potrivește pe țintă, nu pe context', () => {
    expect(ignoreAllMarker('unu [[Numele]] trei')).toBe('[[Numele]]')
    expect(ignoreAllMarker('')).toBeNull()
  })
})

const verse = (id: string, verseNum: number, textRo: string): ImportVerse => ({ id, bookSlug: 'iona', chapterNum: 1, verseNum, textRo })
const row = (verseNum: number, fragment: string, line = verseNum + 1): AuditRow => ({
  line, bookSlug: 'iona', chapterNum: 1, verseNum, detector: 'F', fragment, suggestion: null, reason: null, confidence: 'medie',
})

describe('planul importului', () => {
  const verses = [verse('v1', 1, 'unu doi trei'), verse('v2', 2, 'patru cinci')]

  it('creează în așteptare', () => {
    const plan = planImport([row(1, 'unu [[doi]]')], verses, [])
    expect(plan.create).toHaveLength(1)
    expect(plan.create[0]).toMatchObject({ verseId: 'v1', source: 'audit', status: 'PENDING', fragment: 'unu [[doi]]' })
    expect(plan.create[0]).not.toHaveProperty('line')
  })
  it('fragment deja schimbat la import → STALE', () => {
    const plan = planImport([row(1, 'unu [[șapte]]')], verses, [])
    expect(plan.create[0].status).toBe('STALE')
    expect(plan.createdStale).toBe(1)
  })
  it('rândurile dublate din fișier intră o dată', () => {
    const plan = planImport([row(1, 'unu [[doi]]'), row(1, 'unu [[doi]]')], verses, [])
    expect(plan.create).toHaveLength(1)
    expect(plan.duplicates).toBe(1)
  })
  it('verset inexistent: raportat cu referința, fără text', () => {
    const plan = planImport([row(9, 'unu [[doi]]')], verses, [])
    expect(plan.create).toEqual([])
    expect(plan.missing).toEqual([{ line: 10, ref: 'iona 1:9' }])
  })
  it('existente în așteptare, cu fragmentul dispărut → STALE; cele rezolvate rămân', () => {
    const existing: ExistingItem[] = [
      { id: 'i1', verseId: 'v1', detector: 'F', fragment: 'unu [[șapte]]', status: 'PENDING' },
      { id: 'i2', verseId: 'v1', detector: 'F', fragment: 'unu [[opt]]', status: 'IGNORED' },
      { id: 'i3', verseId: 'v1', detector: 'F', fragment: 'unu [[doi]]', status: 'PENDING' },
    ]
    expect(planImport([], verses, existing).staleIds).toEqual(['i1'])
  })
})

/** Bază falsă, cu cheia unică a indexului parțial. */
function fakeDb(verses: ImportVerse[]) {
  const items: (NewItem & { id: string; resolvedBy?: string })[] = []
  const bibleReviewItem: ReviewImportDb['bibleReviewItem'] = {
    findMany: async () => items.map(i => ({ id: i.id, verseId: i.verseId, detector: i.detector, fragment: i.fragment, status: i.status })),
    createMany: async ({ data }) => {
      let count = 0
      for (const d of data) {
        if (items.some(i => i.verseId === d.verseId && i.detector === d.detector && i.fragment === d.fragment)) continue
        items.push({ ...d, id: `i${items.length}` })
        count++
      }
      return { count }
    },
    updateMany: async ({ where, data }) => {
      let count = 0
      for (const i of items) {
        if (where.id.in.includes(i.id) && i.status === where.status) { Object.assign(i, data); count++ }
      }
      return { count }
    },
  }
  const db: ReviewImportDb = {
    bibleVerse: {
      findMany: async () => verses.map(v => ({ id: v.id, verseNum: v.verseNum, textRo: v.textRo, chapter: { chapterNum: v.chapterNum, book: { slug: v.bookSlug } } })),
    },
    bibleReviewItem,
    $transaction: vi.fn(async fn => fn({ bibleReviewItem })) as ReviewImportDb['$transaction'],
  }
  return { db, items }
}

describe('importul, cap-coadă pe o bază falsă', () => {
  it('e idempotent: a doua rulare nu dublează nimic', async () => {
    const { db, items } = fakeDb([verse('v1', 1, 'unu doi trei')])
    const rows = [row(1, 'unu [[doi]]'), row(1, 'doi [[trei]]')]
    expect(await applyImportPlan(db, await loadImportPlan(db, rows))).toEqual({ created: 2, staled: 0 })
    const second = await loadImportPlan(db, rows)
    expect(second.create).toEqual([])
    expect(second.already).toBe(2)
    expect(await applyImportPlan(db, second)).toEqual({ created: 0, staled: 0 })
    expect(items).toHaveLength(2)
  })
  it('un element deja rezolvat nu reapare', async () => {
    const { db, items } = fakeDb([verse('v1', 1, 'unu doi trei')])
    const rows = [row(1, 'unu [[doi]]')]
    await applyImportPlan(db, await loadImportPlan(db, rows))
    items[0].status = 'IGNORED' as NewItem['status']
    await applyImportPlan(db, await loadImportPlan(db, rows))
    expect(items).toHaveLength(1)
    expect(items[0].status).toBe('IGNORED')
  })
  it('după ce versetul se schimbă, reimportul marchează STALE', async () => {
    const verses = [verse('v1', 1, 'unu doi trei')]
    const { db, items } = fakeDb(verses)
    const rows = [row(1, 'unu [[doi]]')]
    await applyImportPlan(db, await loadImportPlan(db, rows))
    verses[0].textRo = 'unu zece trei'
    expect(await applyImportPlan(db, await loadImportPlan(db, rows))).toEqual({ created: 0, staled: 1 })
    expect(items[0]).toMatchObject({ status: 'STALE', resolvedBy: 'import' })
  })
  it('scrie totul într-o singură tranzacție', async () => {
    const { db } = fakeDb([verse('v1', 1, 'unu doi trei')])
    await applyImportPlan(db, await loadImportPlan(db, [row(1, 'unu [[doi]]')]))
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })
})
