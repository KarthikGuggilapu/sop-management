"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowUp, ArrowDown, Save, Trash2, GripVertical, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function EditSOPPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
  })
  const [steps, setSteps] = useState([{
    id: 1,
    title: "",
    what: "",
    why: "",
    how: "",
    videoUrl: "",
  }])

  useEffect(() => {
    fetchSOP()
  }, [params.id])

  const fetchSOP = async () => {
    try {
      const response = await fetch(`/api/sops/${params.id}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch SOP')
      }

      const data = await response.json()
      
      // Set form data
      setFormData({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        tags: data.tags?.join(", ") || "",
      })

      // Set steps data
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps.map((step: any) => ({
          id: step.id,
          title: step.title || "",
          what: step.what || "",
          why: step.why || "",
          how: step.how || "",
          videoUrl: step.video_url || "",
        })))
      }
    } catch (error) {
      console.error('Error fetching SOP:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch SOP",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a new step
  const addStep = () => {
    const newStep = {
      id: steps.length + 1,
      title: "",
      what: "",
      why: "",
      how: "",
      videoUrl: "",
    }
    setSteps([...steps, newStep])
  }

  // Remove a step
  const removeStep = (stepId: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== stepId))
    }
  }

  // Move step up
  const moveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...steps]
      ;[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
      setSteps(newSteps)
    }
  }

  // Move step down
  const moveStepDown = (index: number) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps]
      ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
      setSteps(newSteps)
    }
  }

  // Update step field
  const updateStepField = (stepId: number, field: string, value: string) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/sops/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          steps: steps.map((step, index) => ({
            title: step.title,
            what: step.what,
            why: step.why,
            how: step.how,
            video_url: step.videoUrl,
            order_index: index
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update SOP')
      }

      toast({
        title: "Success",
        description: "SOP updated successfully"
      })

      router.push(`/sops/${params.id}`)
    } catch (error) {
      console.error('Error updating SOP:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update SOP",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Link href={`/sops/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Edit SOP</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>SOP Details</CardTitle>
              <CardDescription>Edit the basic information about this Standard Operating Procedure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter SOP title" 
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleFormChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter a detailed description of this SOP" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input 
                  id="tags" 
                  placeholder="e.g., onboarding, customer, setup" 
                  value={formData.tags || ""}
                  onChange={(e) => handleFormChange("tags", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>SOP Steps</CardTitle>
              <CardDescription>Edit the detailed steps for completing this procedure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">Step {index + 1}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => moveStepUp(index)} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveStepDown(index)}
                        disabled={index === steps.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(step.id)}
                        disabled={steps.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`step-${step.id}-title`}>Title</Label>
                      <Input
                        id={`step-${step.id}-title`}
                        placeholder="Enter step title"
                        value={step.title}
                        onChange={(e) => updateStepField(step.id, "title", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`step-${step.id}-what`}>What</Label>
                        <Textarea
                          id={`step-${step.id}-what`}
                          placeholder="What needs to be done in this step"
                          rows={3}
                          value={step.what}
                          onChange={(e) => updateStepField(step.id, "what", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`step-${step.id}-why`}>Why</Label>
                        <Textarea
                          id={`step-${step.id}-why`}
                          placeholder="Why this step is important"
                          rows={3}
                          value={step.why}
                          onChange={(e) => updateStepField(step.id, "why", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`step-${step.id}-how`}>How</Label>
                      <Textarea
                        id={`step-${step.id}-how`}
                        placeholder="How to complete this step"
                        rows={3}
                        value={step.how}
                        onChange={(e) => updateStepField(step.id, "how", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`step-${step.id}-video`}>Video URL (optional)</Label>
                      <Input
                        id={`step-${step.id}-video`}
                        placeholder="Enter video URL"
                        value={step.videoUrl}
                        onChange={(e) => updateStepField(step.id, "videoUrl", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addStep} variant="outline" className="w-full gap-1">
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            <Link href={`/sops/${params.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}





