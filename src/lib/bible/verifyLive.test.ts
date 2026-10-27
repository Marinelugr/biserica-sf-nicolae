import { describe, it, expect } from 'vitest'
import { pickTargets, checkChapterHtml } from './verifyLive'
import { syntheticBible } from './synthetic'

describe('pickTargets', () => {
  it('primul capitol din fiecare carte + 40 aleatoare, fără dubluri, ≤ 130', () => {
    const t = pickTargets(syntheticBible(2))
    expect(t).toHaveLength(120)
    expect(new Set(t.map(x => `${x.slug}/${x.chapter}`)).size).toBe(120)
    expect(t.slice(0, 80).every(x => x.chapter === 1)).toBe(true)
    expect(pickTargets(syntheticBible(2), 100).length).toBe(130)
  })
})

describe('checkChapterHtml', () => {
  const ok = '<title>Carte de probă 1 | Biblia Ortodoxă</title><span data-verse="1"></span><span data-verse="2"></span><p>Notă de probă</p>'
  it('în regulă / diferențe', () => {
    expect(checkChapterHtml(ok, { slug: 'x', chapter: 1, verses: 2 }, { titleIncludes: 'Biblia Ortodoxă', sourceNote: 'Notă de probă' })).toEqual([])
    expect(checkChapterHtml(ok, { slug: 'x', chapter: 1, verses: 3 }, { titleIncludes: 'Nu', sourceNote: 'Lipsă' })).toHaveLength(3)
  })
})
