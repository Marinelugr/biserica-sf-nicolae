'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useI18n } from '@/lib/i18n/context'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
})

type FormData = z.infer<typeof schema>

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactForm() {
  const { t } = useI18n()
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
        {t.contactPage.formTitle}
      </h2>

      {status === 'success' && (
        <div
          className="rounded-md p-4 font-body text-sm"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' }}
        >
          {t.contactPage.successMsg}
        </div>
      )}

      {status === 'error' && (
        <div
          className="rounded-md p-4 font-body text-sm"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}
        >
          {t.contactPage.errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="name" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
          {t.contactPage.nameLabel} *
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register('name')}
          className={inputClass(!!errors.name)}
          style={inputStyle}
          placeholder={t.contactPage.namePlaceholder}
        />
        {errors.name && (
          <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
          {t.contactPage.emailLabel2} *
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={inputClass(!!errors.email)}
          style={inputStyle}
          placeholder={t.contactPage.emailPlaceholder}
        />
        {errors.email && (
          <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="font-body text-xs uppercase tracking-wide block mb-1.5" style={{ color: '#8A7050' }}>
          {t.contactPage.messageLabel} *
        </label>
        <textarea
          id="message"
          rows={6}
          {...register('message')}
          className={inputClass(!!errors.message) + ' resize-none'}
          style={inputStyle}
          placeholder={t.contactPage.messagePlaceholder}
        />
        {errors.message && (
          <p className="font-body text-xs mt-1" style={{ color: '#991B1B' }}>
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="font-body text-sm px-8 py-3 rounded transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#1C1B3A', color: '#F2EBD9' }}
      >
        {status === 'sending' ? t.contactPage.sendingBtn : t.contactPage.submitBtn}
      </button>
    </form>
  )
}
