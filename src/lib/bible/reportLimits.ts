/** Constante și tipuri fără dependențe de server: le folosește și formularul din browser. */
export const MAX_REPORT_MESSAGE = 300

export type ReportErrorCode = 'invalid' | 'too-long' | 'url' | 'limit' | 'unavailable'
export type ReportResult = { ok: true } | { ok: false; code: ReportErrorCode }
