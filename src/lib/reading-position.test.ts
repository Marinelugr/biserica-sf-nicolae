// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPositionSaver, createReadingStore, parseJson, parseRecentList, positionKey, recentKey, uniqueRecent } from './reading-position'

interface Item { id: string; ts: number }
const toItem = (value: unknown): Item | null => {
  const v = value as Partial<Item> | null
  return v && typeof v.id === 'string' && typeof v.ts === 'number' ? { id: v.id, ts: v.ts } : null
}
const same = (a: Item, b: Item) => a.id === b.id

/** Un tip fictiv: modulul nu știe nimic despre Biblie sau cărți. */
const makeStore = (legacy?: { position: string; recent: string }) => createReadingStore<Item, Item, { position: Item | null; recent: Item[] }>({
  tip: 'fictiv',
  parsePosition: raw => toItem(parseJson(raw)),
  parseRecent: raw => parseRecentList(raw, toItem, same),
  select: (position, recent) => (position || recent.length ? { position, recent } : null),
  legacy,
})

const item = (id: string, ts = 1): Item => ({ id, ts })

beforeEach(() => localStorage.clear())
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('createReadingStore', () => {
  it('cheile conțin tipul', () => {
    const store = makeStore()
    expect(store.positionKey).toBe('lectura:fictiv:poz')
    expect(store.recentKey).toBe('lectura:fictiv:recente')
    expect(positionKey('carte')).toBe('lectura:carte:poz')
    expect(recentKey('carte')).toBe('lectura:carte:recente')
  })

  it('tipurile nu se amestecă', () => {
    const a = makeStore()
    a.writePosition(item('x'))
    const other = createReadingStore<Item, Item, Item>({
      tip: 'altul', parsePosition: raw => toItem(parseJson(raw)), parseRecent: () => [], select: p => p,
    })
    expect(other.readPosition()).toBeNull()
    expect(a.readPosition()).toEqual(item('x'))
  })

  it('scrie și citește', () => {
    const store = makeStore()
    store.writePosition(item('x'))
    store.writeRecent([item('x'), item('y')])
    expect(store.readPosition()).toEqual(item('x'))
    expect(store.readRecent()).toEqual([item('x'), item('y')])
  })

  it.each(['{stricat', 'null', '{"id":5}'])('poziție coruptă %s: cheia se șterge', raw => {
    const store = makeStore()
    localStorage.setItem(store.positionKey, raw)
    expect(store.readPosition()).toBeNull()
    expect(localStorage.getItem(store.positionKey)).toBeNull()
  })

  it.each(['{stricat', '{"a":1}', '[{"id":5}]'])('recente corupte %s: cheia se șterge', raw => {
    const store = makeStore()
    localStorage.setItem(store.recentKey, raw)
    expect(store.readRecent()).toEqual([])
    expect(localStorage.getItem(store.recentKey)).toBeNull()
  })

  it('instantaneul e stabil și se schimbă odată cu stocarea', () => {
    const store = makeStore()
    expect(store.getSnapshot()).toBeNull()
    store.writePosition(item('x'))
    const first = store.getSnapshot()
    expect(first?.position).toEqual(item('x'))
    expect(store.getSnapshot()).toBe(first)
  })

  it('clear golește cheile și anunță abonații', () => {
    const store = makeStore()
    store.writePosition(item('x'))
    const listener = vi.fn()
    const off = store.subscribe(listener)
    store.clear()
    off()
    expect(localStorage.getItem(store.positionKey)).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('migrează cheile vechi', () => {
    const store = makeStore({ position: 'vechi:poz', recent: 'vechi:rec' })
    localStorage.setItem('vechi:poz', JSON.stringify(item('x')))
    localStorage.setItem('vechi:rec', JSON.stringify([item('x')]))
    expect(store.readPosition()).toEqual(item('x'))
    expect(store.readRecent()).toEqual([item('x')])
    expect(localStorage.getItem('vechi:poz')).toBeNull()
    expect(localStorage.getItem('vechi:rec')).toBeNull()
  })

  it('cu localStorage care aruncă, nimic nu aruncă', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocat', 'SecurityError') })
    const store = makeStore({ position: 'vechi:poz', recent: 'vechi:rec' })
    expect(() => {
      store.writePosition(item('x'))
      store.writeRecent([item('x')])
      store.removePosition()
      store.clear()
    }).not.toThrow()
    expect(store.readPosition()).toBeNull()
    expect(store.readRecent()).toEqual([])
    expect(store.getSnapshot()).toBeNull()
  })
})

describe('recente', () => {
  it('cel mult 5, fără dubluri, cel mai recent primul', () => {
    const items = ['a', 'b', 'a', 'c', 'd', 'e', 'f', 'g'].map((id, i) => item(id, 100 - i))
    expect(uniqueRecent(items, same).map(i => i.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('createPositionSaver', () => {
  it('salvează după 800 ms, cu numărătoarea reluată', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const saver = createPositionSaver(save)
    saver.schedule()
    vi.advanceTimersByTime(500)
    saver.schedule()
    vi.advanceTimersByTime(799)
    expect(save).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(save).toHaveBeenCalledOnce()
    saver.dispose()
  })

  it('salvează imediat la pagehide și la ascundere; după dispose, nu', () => {
    const save = vi.fn()
    const saver = createPositionSaver(save)
    window.dispatchEvent(new Event('pagehide'))
    expect(save).toHaveBeenCalledTimes(1)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(save).toHaveBeenCalledTimes(2)
    saver.dispose()
    window.dispatchEvent(new Event('pagehide'))
    expect(save).toHaveBeenCalledTimes(2)
  })
})
