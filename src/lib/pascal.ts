function getEasterJulian(year: number): Date {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  const julian = new Date(year, month - 1, day)
  julian.setDate(julian.getDate() + 13)
  return julian
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function getPascalData(year: number) {
  const easter = getEasterJulian(year)
  return {
    year,
    florii: addDays(easter, -7),
    pasti: easter,
    tomii: addDays(easter, 7),
    inaltarea: addDays(easter, 39),
    rusalii: addDays(easter, 49),
    apostoli: addDays(easter, 57),
  }
}
