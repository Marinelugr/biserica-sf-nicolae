import { describe, it, expect } from 'vitest'
import { movePending, setPendingCaption, removePending, toAttachPayload, type PendingMedia } from '@/lib/pendingMedia'

const list: PendingMedia[] = [
  { tempId: 'a', url: 'ua', caption: '', order: 0 },
  { tempId: 'b', url: 'ub', caption: '', order: 1 },
  { tempId: 'c', url: 'uc', caption: '', order: 2 },
]

describe('pendingMedia', () => {
  it('movePending mută și renumerotează', () => {
    const next = movePending(list, 2, -1)
    expect(next.map(i => i.tempId)).toEqual(['a', 'c', 'b'])
    expect(next.map(i => i.order)).toEqual([0, 1, 2])
    expect(list.map(i => i.tempId)).toEqual(['a', 'b', 'c'])
  })

  it('movePending în afara listei nu schimbă nimic', () => {
    expect(movePending(list, 0, -1)).toBe(list)
    expect(movePending(list, 2, 1)).toBe(list)
  })

  it('setPendingCaption schimbă doar elementul cerut', () => {
    const next = setPendingCaption(list, 'b', 'Sfânta Liturghie')
    expect(next[1].caption).toBe('Sfânta Liturghie')
    expect(next[0]).toBe(list[0])
  })

  it('removePending scoate și renumerotează', () => {
    const next = removePending(list, 'a')
    expect(next.map(i => [i.tempId, i.order])).toEqual([['b', 0], ['c', 1]])
  })

  it('toAttachPayload: order de la 0, caption gol → null, fără tempId', () => {
    const payload = toAttachPayload([
      { tempId: 'x', url: 'u1', thumbnailUrl: 't1', caption: '  ', order: 7 },
      { tempId: 'y', url: 'u2', caption: 'Text', order: 3 },
    ])
    expect(payload).toEqual([
      { url: 'u1', thumbnailUrl: 't1', caption: null, order: 0 },
      { url: 'u2', caption: 'Text', order: 1 },
    ])
  })
})
