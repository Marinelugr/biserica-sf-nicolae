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

  const inputClass = (hasError: boolean) => `field ${hasError ? '!border-[#ff8a8a] border-2' : ''}`
  const inputStyle = {}

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <h2 className="h-m mb-2">
        {t.contactPage.formTitle}
      </h2>

      {status === 'success' && (
        <div
          className="rounded-2xl p-4 text-[17px]"
          role="status"
          style={{ backgroundColor: 'rgba(80, 180, 110, 0.14)', border: '1px solid rgba(120, 220, 150, 0.5)', color: '#bdf0cb' }}
        >
          {t.contactPage.successMsg}
        </div>
      )}

      {status === 'error' && (
        <div
          className="rounded-2xl p-4 text-[17px]"
          role="alert"
          style={{ backgroundColor: 'rgba(155, 28, 28, 0.25)', border: '1px solid rgba(229, 138, 138, 0.55)', color: '#ffd4d4' }}
        >
          {t.contactPage.errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="name" className="label">
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
          <p className="text-[15px] mt-1.5" style={{ color: '#ff9c9c' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="label">
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
          <p className="text-[15px] mt-1.5" style={{ color: '#ff9c9c' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="label">
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
          <p className="text-[15px] mt-1.5" style={{ color: '#ff9c9c' }}>
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn gold"
      >
        {status === 'sending' ? t.contactPage.sendingBtn : t.contactPage.submitBtn}
      </button>
    </form>
  )
}
