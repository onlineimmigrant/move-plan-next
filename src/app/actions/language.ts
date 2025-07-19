'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Locale } from '@/lib/language-utils'

export async function setLanguagePreference(locale: Locale, currentPath: string) {
  // Set the cookie on the server side
  cookies().set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  // Redirect to the new path
  redirect(currentPath)
}
