import { describe, it, expect } from 'vitest'
import { TtlCache } from './cache'

describe('TtlCache', () => {
  it('expiră după TTL', () => {
    let t = 0
    const c = new TtlCache<number>(1000, 10, () => t)
    c.set('a', 1)
    t = 999; expect(c.get('a')).toBe(1)
    t = 1000; expect(c.get('a')).toBeUndefined()
  })
  it('cel mult `max` intrări — iese cea mai veche', () => {
    const c = new TtlCache<number>(60_000, 300)
    for (let i = 0; i < 350; i++) c.set(`k${i}`, i)
    expect(c.size).toBe(300)
    expect(c.get('k0')).toBeUndefined()
    expect(c.get('k349')).toBe(349)
  })
  it('getOrLoad încarcă o singură dată; erorile nu rămân în cache', async () => {
    const c = new TtlCache<number>(60_000, 10)
    let calls = 0
    expect(await c.getOrLoad('x', async () => ++calls)).toBe(1)
    expect(await c.getOrLoad('x', async () => ++calls)).toBe(1)
    await expect(c.getOrLoad('y', async () => { throw new Error('bază indisponibilă') })).rejects.toThrow()
    expect(c.get('y')).toBeUndefined()
  })
})
