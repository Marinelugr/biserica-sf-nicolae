import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'

export interface BibleAdmin { email: string }

/** Administratorul din sesiune; null = neautentificat sau alt rol. Pentru acțiuni și exporturi. */
export async function requireBibleAdmin(): Promise<BibleAdmin | null> {
  const session = await auth()
  if (!session?.user?.email || session.user.role !== 'admin') return null
  return { email: session.user.email }
}

/** Pentru pagini: neautentificat → autentificare; alt rol → 404. */
export async function requireBibleAdminPage(): Promise<BibleAdmin> {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
  if (!session.user.email || session.user.role !== 'admin') notFound()
  return { email: session.user.email }
}
