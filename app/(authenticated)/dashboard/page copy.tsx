"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "@/components/ui/chart"
import { BookOpen, CheckCircle, Clock, Plus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data for charts
  const completionData = [
    { name: "Customer Onboarding", value: 75 },
    { name: "Product Setup", value: 40 },
    { name: "Support Ticket", value: 90 },
    { name: "Data Migration", value: 60 },
    { name: "Security Protocol", value: 85 },
  ]

  const userProgressData = [
    { name: "Completed", value: 63 },
    { name: "In Progress", value: 27 },
    { name: "Not Started", value: 10 },
  ]

  const COLORS = ["#4f46e5", "#8b5cf6", "#d1d5db"]

  // Mock data for recent SOPs
  const recentSOPs = [
    {
      id: 1,
      title: "Customer Onboarding Process",
      category: "Sales",
      progress: 75,
      steps: 12,
      completedSteps: 9,
    },
    {
      id: 2,
      title: "Product Setup Guide",
      category: "Support",
      progress: 40,
      steps: 8,
      completedSteps: 3,
    },
    {
      id: 3,
      title: "Support Ticket Resolution",
      category: "Support",
      progress: 90,
      steps: 10,
      completedSteps: 9,
    },
    {
      id: 4,
      title: "Data Migration Protocol",
      category: "IT",
      progress: 60,
      steps: 15,
      completedSteps: 9,
    },
  ]

  // Mock data for user activity
  const userActivity = [
    {
      id: 1,
      user: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "completed",
      sop: "Customer Onboarding Process",
      time: "2 hours ago",
    },
    {
      id: 2,
      user: "Sarah Miller",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "started",
      sop: "Product Setup Guide",
      time: "4 hours ago",
    },
    {
      id: 3,
      user: "Michael Brown",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "completed step",
      sop: "Support Ticket Resolution",
      time: "Yesterday",
    },
    {
      id: 4,
      user: "Emily Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "commented on",
      sop: "Data Migration Protocol",
      time: "Yesterday",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* <DashboardHeader /> */}
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
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total SOPs</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-muted-foreground">+3 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2 days</div>
                  <p className="text-xs text-muted-foreground">-0.5 days from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>SOP Completion Rates</CardTitle>
                  <CardDescription>Completion percentage for the top 5 most active SOPs</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionData}
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
                        <Bar dataKey="value" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>User Progress</CardTitle>
                  <CardDescription>Overall progress status across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userProgressData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {userProgressData.map((entry, index) => (
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent SOPs</CardTitle>
                  <CardDescription>Your recently accessed SOPs and their progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSOPs.map((sop) => (
                      <div key={sop.id} className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/sops/${sop.id}`} className="font-medium hover:underline">
                              {sop.title}
                            </Link>
                            <Badge variant="outline">{sop.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {sop.completedSteps} of {sop.steps} steps completed
                            </span>
                          </div>
                          <Progress value={sop.progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{sop.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest user interactions with SOPs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={activity.avatar} alt={activity.user} />
                          <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action}{" "}
                            <Link href="#" className="font-medium text-primary hover:underline">
                              {activity.sop}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Content</CardTitle>
                <CardDescription>Detailed analytics about SOP usage and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Analytics dashboard content would go here</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="my-sops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My SOPs</CardTitle>
                <CardDescription>SOPs assigned to you or created by you</CardDescription>
              </CardHeader>
              <CardContent>
                <p>My SOPs content would go here</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>Manage your team and their access</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Team management content would go here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

