'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { redirect } from 'next/navigation'

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    if (!result?.error) {
      // Use the deployed URL for redirection
      redirect(`${process.env.NEXTAUTH_URL}/CMS`)
    }

    return 'Invalid credentials.'
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }
    throw error
  }
}

