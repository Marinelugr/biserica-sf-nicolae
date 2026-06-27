'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Adresă de email invalidă'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subiectul este obligatoriu'),
  message: z.string().min(10, 'Mesajul trebuie să aibă cel puțin 10 caractere'),
})

type FormData = z.infer<typeof schema>

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-md font-body text-sm outline-none transition-all ${
      hasError
        ? 'border-2 border-red-400'
        : 'border focus:border-amber-600'
    }`

  const inputStyle = {
    backgroundColor: '#FAFAF8',
    borderColor: '#E8E5E0',
    color: '#3A1A1A',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <h2 className="font-heading text-2xl mb-6" style={{ color: '#1C1B3A' }}>
        Trimite un mesaj
      </h2>

      {/* Succes */}
      {status === 'success' && (
        <div
          className="rounded-md p-4 font-body text-sm"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' }}
        >
          ✓ Mesajul a fost trimis cu succes! Vă vom răspunde în cel mai scurt timp.
        </div>
      )}

      {/* Eroare */}
      {status === 'error' && (
        <div
          className="rounded-md p-4 font-body text-sm"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}
        >
          ✗ A apărut o eroare. Vă rugăm să încercați din nou sau să ne contactați direct.
        </div>
      )}

      {/* Rând 1: Nume + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
            Numele *
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={inputClass(!!errors.name)}
            style={inputStyle}
            placeholder="Ion Popescu"
          />
          {errors.name && (
            <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
            Email *
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={inputClass(!!errors.email)}
            style={inputStyle}
            placeholder="ion@exemplu.md"
          />
          {errors.email && (
            <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Rând 2: Telefon + Subiect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
            Telefon (opțional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            className={inputClass(false)}
            style={inputStyle}
            placeholder="+373 XX XXX XXX"
          />
        </div>

        <div>
          <label htmlFor="subject" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
            Subiect *
          </label>
          <input
            id="subject"
            type="text"
            {...register('subject')}
            className={inputClass(!!errors.subject)}
            style={inputStyle}
            placeholder="Botez / Cununie / Parastas…"
          />
          {errors.subject && (
            <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
              {errors.subject.message}
            </p>
          )}
        </div>
      </div>

      {/* Mesaj */}
      <div>
        <label htmlFor="message" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
          Mesaj *
        </label>
        <textarea
          id="message"
          rows={6}
          {...register('message')}
          className={inputClass(!!errors.message) + ' resize-none'}
          style={inputStyle}
          placeholder="Scrieți mesajul dumneavoastră…"
        />
        {errors.message && (
          <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="font-body text-sm px-8 py-3 rounded transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
      >
        {status === 'sending' ? 'Se trimite…' : 'Trimite mesajul'}
      </button>
    </form>
  )
}
