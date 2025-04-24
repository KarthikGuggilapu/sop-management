"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "@/components/ui/chart"
import { toast } from "@/components/ui/use-toast"

interface AnalyticsData {
  totalSOPs: number
  avgCompletionRate: number
  activeUsers: number
  avgCompletionTime: number
  monthlyCompletionRate: Array<{ name: string; rate: number }>
  sopCompletionData: Array<{ name: string; value: number }>
  userProgressData: Array<{ 
    name: string
    completed: number
    inProgress: number
    notStarted: number 
  }>
  dropoffData: Array<{ name: string; users: number }>
  statusData: Array<{ name: string; value: number }>
}

const COLORS = ["#4f46e5", "#8b5cf6", "#d1d5db"]
const TIME_PERIODS = {
  "last7days": 7,
  "last30days": 30,
  "last90days": 90,
  "lastyear": 365,
  "alltime": 0
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState("last30days")
  const [activeTab, setActiveTab] = useState("overview")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalyticsData(timePeriod)
  }, [timePeriod, activeTab])

  const fetchAnalyticsData = async (period: string) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const daysAgo = TIME_PERIODS[period as keyof typeof TIME_PERIODS]
      const dateFilter = daysAgo > 0 
        ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Fetch total SOPs
      const { count: totalSOPs } = await supabase
        .from('sops')
        .select('*', { count: 'exact', head: true })

      // Fetch active users
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gt('last_active', dateFilter || '1970-01-01')

      // Fetch completion rates
      const { data: completionData } = await supabase
        .from('user_step_progress')
        .select('completed, created_at, updated_at')
        .gt('created_at', dateFilter || '1970-01-01')

      // Calculate monthly completion rates
      const monthlyRates = await calculateMonthlyRates(supabase, dateFilter)

      // Calculate average completion time and rate
      const avgCompletionTime = calculateAvgCompletionTime(completionData || [])
      const avgCompletionRate = calculateAvgCompletionRate(completionData || [])

      // Initialize with base data
      let newAnalyticsData: AnalyticsData = {
        totalSOPs: totalSOPs || 0,
        avgCompletionRate,
        activeUsers: activeUsers?.length || 0,
        avgCompletionTime,
        monthlyCompletionRate: monthlyRates,
        sopCompletionData: [],
        userProgressData: [],
        dropoffData: [],
        statusData: calculateStatusDistribution(completionData || [])
      }

      // Fetch additional data based on active tab
      switch (activeTab) {
        case 'sops':
          newAnalyticsData.sopCompletionData = await fetchSOPCompletionData(supabase, dateFilter)
          break
        case 'users':
          newAnalyticsData.userProgressData = await fetchUserProgressData(supabase, dateFilter)
          break
        case 'dropoff':
          newAnalyticsData.dropoffData = await calculateDropoffData(supabase, dateFilter)
          break
      }

      setAnalyticsData(newAnalyticsData)

    } catch (error: any) {
      console.error('Error fetching analytics data:', error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyRates = async (supabase: any, dateFilter: string | null) => {
    const { data } = await supabase
      .from('user_step_progress')
      .select('completed, created_at')
      .gt('created_at', dateFilter || '1970-01-01')

    const monthlyData: { [key: string]: { total: number; completed: number } } = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    data?.forEach((progress: any) => {
      const date = new Date(progress.created_at)
      const monthKey = months[date.getMonth()]
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, completed: 0 }
      }
      
      monthlyData[monthKey].total++
      if (progress.completed) {
        monthlyData[monthKey].completed++
      }
    })

    return Object.entries(monthlyData).map(([name, data]) => ({
      name,
      rate: Math.round((data.completed / data.total) * 100)
    }))
  }

  const fetchSOPCompletionData = async (supabase: any, dateFilter: string | null) => {
    const { data } = await supabase
      .from('sops')
      .select(`
        title,
        steps:sop_steps(
          id,
          progress:user_step_progress(
            completed,
            created_at
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    return data?.map((sop: any) => {
      const filteredProgress = sop.steps.flatMap((step: any) => 
        step.progress.filter((p: any) => 
          !dateFilter || new Date(p.created_at) > new Date(dateFilter)
        )
      )

      const completionRate = filteredProgress.length > 0
        ? (filteredProgress.filter((p: any) => p.completed).length / filteredProgress.length) * 100
        : 0

      return {
        name: sop.title,
        value: Math.round(completionRate)
      }
    }) || []
  }

  const fetchUserProgressData = async (supabase: any, dateFilter: string | null) => {
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        first_name,
        last_name,
        progress:user_step_progress(
          completed,
          created_at,
          updated_at
        )
      `)
      .limit(5)

    return users?.map((user: any) => {
      const filteredProgress = user.progress.filter((p: any) => 
        !dateFilter || new Date(p.created_at) > new Date(dateFilter)
      )

      return {
        name: `${user.first_name} ${user.last_name}`,
        completed: filteredProgress.filter((p: any) => p.completed).length,
        inProgress: filteredProgress.filter((p: any) => !p.completed && p.updated_at !== p.created_at).length,
        notStarted: filteredProgress.filter((p: any) => !p.completed && p.updated_at === p.created_at).length
      }
    }) || []
  }

  const calculateDropoffData = async (supabase: any, dateFilter: string | null) => {
    const { data: steps } = await supabase
      .from('sop_steps')
      .select(`
        step_number,
        progress:user_step_progress(
          completed,
          created_at
        )
      `)
      .order('step_number')

    const stepCounts: { [key: number]: number } = {}
    
    steps?.forEach((step: any) => {
      const filteredProgress = step.progress.filter((p: any) => 
        !dateFilter || new Date(p.created_at) > new Date(dateFilter)
      )
      stepCounts[step.step_number] = filteredProgress.length
    })

    return Object.entries(stepCounts).map(([step, users]) => ({
      name: `Step ${step}`,
      users
    }))
  }

  const calculateStatusDistribution = (progress: any[]) => {
    const total = progress.length
    const completed = progress.filter(p => p.completed).length
    const inProgress = progress.filter(p => !p.completed && p.updated_at !== p.created_at).length
    const notStarted = total - completed - inProgress

    return [
      { name: "Completed", value: Math.round((completed / total) * 100) },
      { name: "In Progress", value: Math.round((inProgress / total) * 100) },
      { name: "Not Started", value: Math.round((notStarted / total) * 100) }
    ]
  }

  const calculateAvgCompletionTime = (progress: any[]): number => {
    const completedProgress = progress.filter(p => p.completed)
    if (!completedProgress.length) return 0

    const totalTime = completedProgress.reduce((acc, curr) => {
      const start = new Date(curr.created_at).getTime()
      const end = new Date(curr.updated_at).getTime()
      return acc + (end - start)
    }, 0)

    return Math.round((totalTime / (completedProgress.length * 1000 * 60 * 60 * 24)) * 10) / 10
  }

  const calculateAvgCompletionRate = (progress: any[]): number => {
    if (!progress.length) return 0
    return Math.round((progress.filter(p => p.completed).length / progress.length) * 100)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <div className="flex items-center gap-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="lastyear">Last year</SelectItem>
                <SelectItem value="alltime">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {analyticsData && (
          <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sops">SOPs</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="dropoff">Drop-off Points</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total SOPs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalSOPs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.avgCompletionRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.avgCompletionTime} days</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Completion Rate</CardTitle>
                    <CardDescription>Average SOP completion rate over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.monthlyCompletionRate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name="Completion Rate (%)"
                            stroke="#4f46e5"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SOP Status Distribution</CardTitle>
                    <CardDescription>Overall progress status across all SOPs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SOPs Tab */}
            <TabsContent value="sops" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SOP Completion Rates</CardTitle>
                  <CardDescription>Completion percentage for the top 5 most active SOPs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.sopCompletionData}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Completion Rate (%)" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Progress</CardTitle>
                  <CardDescription>SOP completion status by user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.userProgressData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" stackId="a" fill="#4f46e5" />
                        <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#8b5cf6" />
                        <Bar dataKey="notStarted" name="Not Started" stackId="a" fill="#d1d5db" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Drop-off Points Tab */}
            <TabsContent value="dropoff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Step Drop-off Analysis</CardTitle>
                  <CardDescription>Number of users completing each step (aggregated across all SOPs)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsData.dropoffData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" name="Users" stroke="#4f46e5" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}



