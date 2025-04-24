"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft, BookOpen, CheckCircle, ChevronDown, ChevronUp,
  FileSpreadsheet, HelpCircle, Info, MessageSquare, Play,
  RefreshCw, Video,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Step {
  id: string;
  title: string;
  what: string;
  why: string;
  how: string;
  completed: boolean;
  expanded: boolean;
  progress?: Array<{ completed: boolean }>;
}

export default function SOPDetailedViewPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sop, setSop] = useState<any>(null)
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    const fetchSOP = async () => {
      try {
        const supabase = await createClient()
        
        const { data: sop, error: sopError } = await supabase
          .from('sops')
          .select(`
            *,
            steps:sop_steps(
              *,
              progress:user_step_progress(*)
            )
          `)
          .eq('id', params.id)
          .single()

        if (sopError) throw sopError

        setSop(sop)
        
        if (sop?.steps) {
          setSteps(sop.steps.map((step: any) => ({
            id: step.id,
            title: step.title,
            what: step.what,
            why: step.why,
            how: step.how,
            completed: step.progress?.[0]?.completed ?? false,
            expanded: true
          })))
        }
      } catch (error) {
        console.error('Error fetching SOP:', error)
        toast({
          title: "Error",
          description: "Failed to load SOP data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSOP()
  }, [params.id])

  // Toggle step completion
  const toggleStepCompletion = async (stepId: string) => { // Change type to string
    try {
      // Find current step
      const currentStep = steps.find(step => step.id === stepId)
      if (!currentStep) return

      // Optimistically update UI
      setSteps(steps.map((step) => (
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )))

      // Update in database
      const response = await fetch(`/api/sops/${params.id}/steps/${stepId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !currentStep.completed
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update if request fails
        setSteps(steps.map((step) => (
          step.id === stepId ? { ...step, completed: currentStep.completed } : step
        )))
        throw new Error(data.error || 'Failed to update step completion')
      }
    } catch (error) {
      console.error('Error updating step completion:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update step completion",
        variant: "destructive"
      })
    }
  }

  // Toggle step expansion
  const toggleStepExpansion = (stepId: number) => {
    setSteps(steps.map((step) => (
      step.id === stepId ? { ...step, expanded: !step.expanded } : step
    )))
  }

  // Calculate progress
  const completedStepsCount = steps.filter((step) => step.completed).length
  const progressPercentage = steps.length > 0 ? (completedStepsCount / steps.length) * 100 : 0

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!sop) {
    return <div className="flex min-h-screen items-center justify-center">SOP not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/sops/${params.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{sop.title} - Detailed View</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/sops/${params.id}`}>
              <Button variant="outline" className="gap-1">
                <FileSpreadsheet className="h-4 w-4" /> Return to Main View
              </Button>
            </Link>
            <Button variant="outline" className="gap-1">
              <RefreshCw className="h-4 w-4" /> Reset Progress
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detailed Instructions</CardTitle>
              <CardDescription>
                {completedStepsCount} of {steps.length} steps completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progressPercentage} className="h-2" />
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="rounded-lg border">
                      <div className={`flex items-center justify-between p-4 ${step.completed ? "bg-muted/50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`step-${step.id}`}
                            checked={step.completed}
                            onCheckedChange={() => toggleStepCompletion(step.id)}
                          />
                          <div>
                            <label
                              htmlFor={`step-${step.id}`}
                              className={`font-medium ${step.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              Step {index + 1}: {step.title}
                            </label>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => toggleStepExpansion(step.id)}>
                          {step.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      {step.expanded && (
                        <div className="p-4 pt-0">
                          <Tabs defaultValue="what">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="what" className="gap-1">
                                <Info className="h-4 w-4" /> What
                              </TabsTrigger>
                              <TabsTrigger value="why" className="gap-1">
                                <HelpCircle className="h-4 w-4" /> Why
                              </TabsTrigger>
                              <TabsTrigger value="how" className="gap-1">
                                <CheckCircle className="h-4 w-4" /> How
                              </TabsTrigger>
                              <TabsTrigger value="video" className="gap-1">
                                <Video className="h-4 w-4" /> Video
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="what" className="mt-4">
                              <Textarea
                                readOnly
                                value={step.what}
                                className="min-h-[100px] resize-none"
                              />
                            </TabsContent>
                            <TabsContent value="why" className="mt-4">
                              <Textarea
                                readOnly
                                value={step.why}
                                className="min-h-[100px] resize-none"
                              />
                            </TabsContent>
                            <TabsContent value="how" className="mt-4">
                              <Textarea
                                readOnly
                                value={step.how}
                                className="min-h-[100px] resize-none"
                              />
                            </TabsContent>
                            <TabsContent value="video" className="mt-4">
                              <div className="aspect-video">
                                <iframe
                                  src={step.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
                                  className="h-full w-full rounded-md"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SOP Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">{sop.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Category</h4>
                    <div className="mt-1">
                      <Badge variant="secondary">{sop.category}</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {sop.tags && sop.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium">Created By</h4>
                    <p className="text-sm text-muted-foreground">{sop.created_by}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Created On</h4>
                    <p className="text-sm text-muted-foreground">{new Date(sop.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full gap-1 justify-start">
                    <Play className="h-4 w-4" /> Start from beginning
                  </Button>
                  <Button variant="outline" className="w-full gap-1 justify-start">
                    <BookOpen className="h-4 w-4" /> View as document
                  </Button>
                  <Link href={`/sops/${params.id}`} className="w-full">
                    <Button variant="outline" className="w-full gap-1 justify-start">
                      <FileSpreadsheet className="h-4 w-4" /> Switch to Main View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}





