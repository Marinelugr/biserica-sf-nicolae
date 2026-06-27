import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Log în development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Contact form]', data)
    }

    // TODO: Adaugă nodemailer sau Resend pentru email real în producție
    // const transporter = nodemailer.createTransport(...)
    // await transporter.sendMail({ to: 'inimaortodoxiei@gmail.com', ... })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
