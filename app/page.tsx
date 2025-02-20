import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CMSContent from './CMSContent'

export default async function CMS() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return <CMSContent />
}

