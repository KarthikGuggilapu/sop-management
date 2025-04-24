"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import DashboardHeader from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, BookOpen, RefreshCw, Edit, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useParams, useRouter } from "next/navigation"

export default function SOPExcelViewPage() {
  const [user, setUser] = useState<User | null>(null)
  const [sop, setSop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)
    }

    const fetchSOP = async () => {
      try {
        const response = await fetch(`/api/sops/${params.id}`, {
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to fetch SOP')
        const data = await response.json()
        setSop(data)
        
        // Initialize steps from the API data
        if (data.steps) {
          setSteps(data.steps.map((step: any) => ({
            id: step.id,
            title: step.title,
            what: step.what,
            why: step.why,
            how: step.how,
            completed: step.completions && step.completions.length > 0
          })))
        }
      } catch (error) {
        console.error('Error fetching SOP:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
    fetchSOP()
  }, [params.id])

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Initial Customer Contact",
      what: "Reach out to the customer after they sign up for an account.",
      why: "To establish a personal connection and understand their needs better.",
      how: "Send a personalized welcome email within 24 hours of signup. Include your contact information and schedule a kickoff call.",
      completed: true,
    },
    {
      id: 2,
      title: "Kickoff Meeting",
      what: "Conduct an initial meeting to understand customer requirements.",
      why: "To align expectations and create a tailored onboarding plan.",
      how: "Prepare an agenda covering: introductions, product overview, customer goals, timeline, and next steps. Take detailed notes.",
      completed: true,
    },
    {
      id: 3,
      title: "Account Setup",
      what: "Configure the customer's account with their specific settings.",
      why: "To ensure the platform is ready for their specific use case.",
      how: "Use the Account Setup Wizard to configure user roles, permissions, integrations, and custom fields based on kickoff notes.",
      completed: true,
    },
    {
      id: 4,
      title: "Training Session",
      what: "Provide comprehensive training on using the platform.",
      why: "To ensure the customer can effectively use all relevant features.",
      how: "Schedule a 1-hour training session. Use the standard training deck, but customize sections based on their use case.",
      completed: false,
    },
    {
      id: 5,
      title: "Follow-up and Feedback",
      what: "Check in with the customer after 1 week of active usage.",
      why: "To address any issues, answer questions, and gather initial feedback.",
      how: "Send a follow-up email with a feedback survey. Schedule a 30-minute call to discuss their experience and address any concerns.",
      completed: false,
    },
  ])

  // Toggle step completion
  const toggleStepCompletion = async (stepId: number) => {
    try {
      // Update local state
      setSteps(steps.map((step) => (
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )))

      // TODO: Update completion status in the database
      // Add API call here to update step completion status
    } catch (error) {
      console.error('Error updating step completion:', error)
    }
  }

  // Calculate progress
  const completedStepsCount = steps.filter((step) => step.completed).length
  const progressPercentage = (completedStepsCount / steps.length) * 100

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!sop) {
    return <div className="flex min-h-screen items-center justify-center">SOP not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* <DashboardHeader user={{
        email: user?.email ?? '',
        user_metadata: {
          first_name: user?.user_metadata?.first_name ?? '',
          last_name: user?.user_metadata?.last_name ?? ''
        }
      }} /> */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Link href="/sops">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{sop.title}</h2>
            <Badge variant="secondary">{sop.category}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/sops/${params.id}/detailed-view`}>
              <Button variant="outline" className="gap-1">
                <BookOpen className="h-4 w-4" /> Detailed View
              </Button>
            </Link>
            <Button variant="outline" className="gap-1">
              <RefreshCw className="h-4 w-4" /> Reset Progress
            </Button>
            <Button variant="outline" className="gap-1">
              <Edit className="h-4 w-4" /> Edit SOP
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>SOP Progress Tracker</CardTitle>
            <CardDescription>
              Click on the status circles to mark steps as complete. For detailed instructions, use the "Detailed View"
              button. {completedStepsCount} of {steps.length} steps completed.
            </CardDescription>
            <Progress value={progressPercentage} className="h-2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Step</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[200px]">What</TableHead>
                    <TableHead className="w-[200px]">Why</TableHead>
                    <TableHead className="w-[200px]">How</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((step, index) => (
                    <TableRow key={step.id}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>{step.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">{step.what}</div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{step.what}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">{step.why}</div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{step.why}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">{step.how}</div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{step.how}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center justify-center cursor-pointer h-8 w-8 rounded-full mx-auto ${
                            step.completed
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}
                          onClick={() => toggleStepCompletion(step.id)}
                        >
                          <CheckCircle className={`h-5 w-5 ${step.completed ? "opacity-100" : "opacity-50"}`} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Hover over cell content to see full text. Need detailed instructions? Use the "Detailed View" button
              above.
            </span>
          </div>
          <Link href={`/sops/${params.id}/detailed-view`}>
            <Button variant="outline">Go to Detailed View</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}







