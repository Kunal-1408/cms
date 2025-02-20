'use client'

import Link from "next/link"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function CMSContent() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-white min-h-screen w-full">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Inventory</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Welcome to <span className="text-orange-400">Quite Good</span>
          </h3>
          <p className="text-muted-foreground">
            You are logged in as: {session?.user?.email}
          </p>
          <Link href="/CMS/Dashboard">
            <button className="mt-4 bg-orange-400 text-sm text-white font-semibold h-10 px-4 py-2 border hover:bg-orange-500 rounded">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}