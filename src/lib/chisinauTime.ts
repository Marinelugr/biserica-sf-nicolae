const TZ = 'Europe/Chisinau'

/** Convertește o valoare de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm"),
 * interpretată ca oră a Chișinăului, într-un Date UTC corect (ține cont de ora de vară). */
export function chisinauLocalToUTC(localDateTime: string): Date {
  const [datePart, timePart] = localDateTime.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart || '00:00').split(':').map(Number)

  const guess = new Date(Date.UTC(y, m - 1, d, h, mi))

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(guess)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const shown = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))

  return new Date(guess.getTime() + (guess.getTime() - shown))
}

/** Convertește un Date (UTC) în valoarea locală pentru <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") în ora Chișinăului. */
export function utcToChisinauLocalInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Formatează un Date pentru afișare (badge admin), în ora Chișinăului. */
export function formatChisinauDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ro-MD', {
    timeZone: TZ,
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}
