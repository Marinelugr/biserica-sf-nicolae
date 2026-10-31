export function exportHeaders(filename: string): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  }
}
