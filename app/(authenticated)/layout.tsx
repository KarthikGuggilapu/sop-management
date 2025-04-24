import type React from "react"
import DashboardHeader from "@/components/dashboard-header"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader user={{
        email: user.email ?? '',
        user_metadata: {
          first_name: user.user_metadata?.first_name ?? '',
          last_name: user.user_metadata?.last_name ?? ''
        }
      }} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}