import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
})

const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'parinte.marin@biserica-sf-nicolae.org'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Formular contact <onboarding@resend.dev>',
        to: CONTACT_EMAIL_TO,
        replyTo: data.email,
        subject: `Mesaj nou de la ${data.name} — site parohie`,
        text: `Nume: ${data.name}\nEmail: ${data.email}\n\nMesaj:\n${data.message}`,
      })
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Contact form] RESEND_API_KEY lipsă — mesaj necontrimis:', data)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
