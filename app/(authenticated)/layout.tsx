import type React from "react"
import DashboardHeader from "@/components/dashboard-header"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error)
      redirect('/login')
    }

    if (!user) {
      redirect('/login')
    }

    // Safely handle potentially undefined values
    const userEmail = user.email ?? ''
    const firstName = user.user_metadata?.first_name ?? ''
    const lastName = user.user_metadata?.last_name ?? ''

    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader user={{
          email: userEmail,
          user_metadata: {
            first_name: firstName,
            last_name: lastName
          }
        }} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  } catch (error) {
    console.error('Layout error:', error)
    redirect('/login')
  }
}
