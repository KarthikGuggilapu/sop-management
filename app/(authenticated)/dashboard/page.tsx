'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from "next/link"
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "@/components/ui/chart"
import { BookOpen, CheckCircle, Clock, Plus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from '@/components/ui/use-toast'
import { COLORS } from "@/utils/chart-colors"
import { SupabaseClient } from '@supabase/supabase-js'

interface RecentSOP {
  id: string | number;
  title: string;
  category: string;
  completedSteps: number;
  steps: number;
  progress: number;
}

interface UserProgress {
  id: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  sop_steps: {
    id: string;
    sop_id: string;
  };
}

interface DashboardData {
  totalSOPs: number;
  completionRate: number;
  activeUsers: number;
  avgCompletionTime: number;
  completionData: Array<{ name: string; value: number }>;
  userProgressData: Array<{ name: string; value: number }>;
  recentSOPs: Array<{
    id: string;
    title: string;
    category: string;
    progress: number;
    steps: number;
    completedSteps: number;
  }>;
  userActivity: Array<{
    id: string;
    user: string;
    avatar: string;
    action: string;
    sop: string;
    time: string;
  }>;
  mySOPs: Array<{
    id: string;
    title: string;
    category: string;
    progress: number;
  }>;
  teamData: Array<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    progress: Array<{ completed: boolean }>;
  }>;
}

// Initialize with default values
const defaultDashboardData: DashboardData = {
  totalSOPs: 0,
  completionRate: 0,
  activeUsers: 0,
  avgCompletionTime: 0,
  completionData: [],
  userProgressData: [],
  recentSOPs: [],
  userActivity: [],
  mySOPs: [],
  teamData: []
};

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState<User | null>(null)
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (token && email) {
      handleInviteAcceptance(token, email)
    }
  }, [searchParams])

  const handleInviteAcceptance = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Team invitation accepted successfully')
      
      // Remove query parameters from URL
      const newUrl = '/dashboard'
      router.replace(newUrl)

    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invitation')
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // First get the current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!currentUser) throw new Error('No authenticated user found')
        setUser(currentUser)

        // Get total SOPs count
        const { count: totalSOPs, error: countError } = await supabase
          .from('sops')
          .select('*', { count: 'exact', head: true })
        if (countError) throw countError

        // Get active users in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: activeUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .gt('last_active', thirtyDaysAgo)
        if (usersError) throw usersError

        // Fetch step completion data
        const { data: stepCompletionData, error: completionError } = await supabase
          .from('sop_step_completions')
          .select(`
            id,
            completed,
            created_at,
            updated_at,
            sop_steps!inner(
              id,
              sop_id
            )
          `)
          .gt('created_at', thirtyDaysAgo)
        if (completionError) throw completionError

        // Calculate completion rate
        const completionRate = stepCompletionData?.length 
          ? Math.round((stepCompletionData.filter(p => p.completed).length / stepCompletionData.length) * 100)
          : 0

        // Fetch recent SOPs with progress
        const { data: recentSOPsData, error: recentError } = await supabase
          .from('sops')
          .select(`
            id,
            title,
            category,
            created_at,
            sop_steps!inner(
              id,
              title,
              sop_step_completions(
                completed,
                created_at,
                updated_at
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)
        if (recentError) throw recentError

        // Process recent SOPs data
        const recentSOPs = (recentSOPsData || []).map(sop => {
          const totalSteps = sop.sop_steps?.length || 0
          const completedSteps = sop.sop_steps?.filter(step => 
            step.sop_step_completions?.some(p => p.completed)
          ).length || 0

          return {
            id: sop.id,
            title: sop.title,
            category: sop.category,
            progress: totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0,
            steps: totalSteps,
            completedSteps
          }
        })

        // Calculate average completion time
        const avgCompletionTime = calculateAvgCompletionTime(stepCompletionData || [])

        // Prepare completion data for chart
        const completionData = await calculateSOPCompletionRates(supabase)

        const newDashboardData: DashboardData = {
          totalSOPs: totalSOPs || 0,
          completionRate,
          activeUsers: activeUsers?.length || 0,
          avgCompletionTime,
          completionData: completionData || [],
          userProgressData: calculateUserProgress(stepCompletionData || []),
          recentSOPs,
          userActivity: [],
          mySOPs: [],
          teamData: []
        }

        // Fetch tab-specific data
        if (activeTab === "my-sops") {
          const { data: mySopsData, error: mySopsError } = await supabase
            .from('sops')
            .select(`
              id,
              title,
              category,
              sop_steps!inner(
                id,
                sop_step_completions(completed)
              )
            `)
            .eq('created_by', currentUser.id)
          if (mySopsError) throw mySopsError

          if (mySopsData) {
            newDashboardData.mySOPs = mySopsData.map(sop => ({
              id: sop.id,
              title: sop.title,
              category: sop.category,
              progress: calculateSOPProgress(sop.sop_steps)
            }))
          }
        }

        if (activeTab === "team") {
          const { data: teamData, error: teamError } = await supabase
            .from('profiles')
            .select(`
              id,
              first_name,
              last_name,
              avatar_url,
              sop_step_completions(completed)
            `)
          if (teamError) throw teamError

          if (teamData) {
            newDashboardData.teamData = teamData
          }
        }

        setDashboardData(newDashboardData)

      } catch (error: any) {
        console.error('Error fetching dashboard data:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [activeTab])

  const calculateSOPCompletionRates = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .from('sops')
      .select(`
        id,
        title,
        steps:sop_steps(
          id,
          progress:sop_step_completions(completed)
        )
      `)
      .limit(5)

    if (error) throw error

    return data.map(sop => ({
      name: sop.title,
      value: calculateSOPProgress(sop.steps)
    }))
  }

  const calculateSOPProgress = (steps: any[]): number => {
    if (!steps?.length) return 0
    const completedSteps = steps.filter(step => 
      step.sop_step_completions?.some((completion: any) => completion.completed)
    ).length
    return Math.round((completedSteps / steps.length) * 100)
  }

  const calculateUserProgress = (progress: any[]): { name: string; value: number }[] => {
    if (!progress?.length) return [
      { name: "Completed", value: 0 },
      { name: "In Progress", value: 0 },
      { name: "Not Started", value: 100 }
    ]
    
    const total = progress.length
    const completed = progress.filter(p => p.completed).length
    const inProgress = progress.filter(p => !p.completed).length

    return [
      { name: "Completed", value: Math.round((completed / total) * 100) },
      { name: "In Progress", value: Math.round((inProgress / total) * 100) },
      { name: "Not Started", value: 100 - Math.round(((completed + inProgress) / total) * 100) }
    ]
  }

  const fetchRecentSOPs = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .from('sops')
      .select(`
        id,
        title,
        category,
        steps:sop_steps(
          id,
          progress:sop_step_completions(completed)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) throw error

    return data.map(sop => ({
      id: sop.id,
      title: sop.title,
      category: sop.category,
      progress: calculateSOPProgress(sop.steps),
      steps: sop.steps.length,
      completedSteps: sop.steps.filter(step => 
        step.progress?.some(p => p.completed)
      ).length
    }))
  }

  const fetchUserActivity = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .from('sop_step_completions')
      .select(`
        id,
        completed,
        updated_at,
        profiles(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        sop_steps(
          sop_id,
          sops(title)
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(4)

    if (error) throw error

    return data.map(activity => ({
      id: activity.id,
      user: `${activity.profiles[0].first_name} ${activity.profiles[0].last_name}`,
      avatar: activity.profiles[0].avatar_url,
      action: activity.completed ? "completed" : "started",
      sop: activity.sop_steps[0].sops[0].title,
      time: formatRelativeTime(activity.updated_at)
    }))
  }

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 24) return `${hours} hours ago`
    if (hours < 48) return "Yesterday"
    return `${Math.floor(hours / 24)} days ago`
  }

  const calculateOverallCompletionRate = (progress: UserProgress[]): number => {
    if (!progress?.length) return 0
    return Math.round((progress.filter(p => p.completed).length / progress.length) * 100)
  }

  const calculateAvgCompletionTime = (progress: UserProgress[]): number => {
    const completedProgress = progress.filter(p => p.completed)
    if (!completedProgress.length) return 0

    const totalTime = completedProgress.reduce((acc, curr) => {
      const start = new Date(curr.created_at).getTime()
      const end = new Date(curr.updated_at).getTime()
      return acc + (end - start)
    }, 0)

    return Math.round((totalTime / (completedProgress.length * 1000 * 60 * 60 * 24)) * 10) / 10
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total SOPs</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalSOPs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.completionRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.avgCompletionTime} days</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>SOP Completion Rates</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dashboardData.completionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>User Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={dashboardData.userProgressData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {dashboardData.userProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent SOPs</CardTitle>
                  <CardDescription>Latest SOPs and their progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {dashboardData.recentSOPs.map((sop) => (
                      <div key={sop.id} className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{sop.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {sop.completedSteps} of {sop.steps} steps completed
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {sop.progress}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest user interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {dashboardData.userActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={activity.avatar} alt="Avatar" />
                          <AvatarFallback>
                            {activity.user.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action} {activity.sop}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      
      case "analytics":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>Detailed analytics about SOP usage</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add your analytics content */}
              </CardContent>
            </Card>
          </div>
        )
      
      case "my-sops":
        return (
          <div className="space-y-4">
            {dashboardData.mySOPs.map((sop) => (
              <Card key={sop.id}>
                <CardHeader>
                  <CardTitle>{sop.title}</CardTitle>
                  <CardDescription>{sop.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={sop.progress} />
                </CardContent>
              </Card>
            ))}
          </div>
        )
      
      case "team":
        return (
          <div className="space-y-4">
            {dashboardData.teamData.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle>{`${member.first_name} ${member.last_name}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p>Completed SOPs: {member.progress?.filter((p: { completed: boolean }) => p.completed).length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Link href="/sops/create">
              <Button className="gap-1">
                <Plus className="h-4 w-4" /> Create SOP
              </Button>
            </Link>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="my-sops">My SOPs</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}












