// Health check pentru deploy (TopHost): fără DB, fără cookie-uri, fără proxy.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } })
}
