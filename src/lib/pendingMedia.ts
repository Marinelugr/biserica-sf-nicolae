// Pozele încărcate deja în Storage, dar încă nelegate de o entitate (formular
// nou, nesalvat). Se leagă toate odată, după salvare, prin attachPendingMedia.

export interface PendingMedia {
  tempId: string
  url: string
  thumbnailUrl?: string
  caption: string
  order: number
}

export interface AttachItem {
  url: string
  thumbnailUrl?: string
  caption: string | null
  order: number
}

function renumber(items: PendingMedia[]): PendingMedia[] {
  return items.map((item, i) => (item.order === i ? item : { ...item, order: i }))
}

export function movePending(items: PendingMedia[], index: number, dir: -1 | 1): PendingMedia[] {
  const target = index + dir
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return renumber(next)
}

export function setPendingCaption(items: PendingMedia[], tempId: string, caption: string): PendingMedia[] {
  return items.map(item => (item.tempId === tempId ? { ...item, caption } : item))
}

export function removePending(items: PendingMedia[], tempId: string): PendingMedia[] {
  return renumber(items.filter(item => item.tempId !== tempId))
}

export function toAttachPayload(items: PendingMedia[]): AttachItem[] {
  return items.map((item, i) => ({
    url: item.url,
    ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl } : {}),
    caption: item.caption.trim() || null,
    order: i,
  }))
}
