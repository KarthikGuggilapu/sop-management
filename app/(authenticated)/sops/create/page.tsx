"use client"

import { createClient } from '@/utils/supabase/client' // Change this import
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowUp, ArrowDown, FileSpreadsheet, GripVertical, Plus, Save, Trash2, Video } from "lucide-react"

export default function CreateSOPPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    tags: "",
  })
  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "",
      what: "",
      why: "",
      how: "",
      videoUrl: "",
    },
  ])
  const [activeTab, setActiveTab] = useState("manual")

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
  const removeStep = (stepId) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== stepId))
    }
  }

  // Move step up
  const moveStepUp = (index) => {
    if (index > 0) {
      const newSteps = [...steps]
      ;[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
      setSteps(newSteps)
    }
  }

  // Move step down
  const moveStepDown = (index) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps]
      ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
      setSteps(newSteps)
    }
  }

  // Update step field
  const updateStepField = (stepId, field, value) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSOP = async () => {
    try {
      setLoading(true)

      const sopData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        steps: steps.map((step, index) => ({
          title: step.title,
          what: step.what,
          why: step.why,
          how: step.how,
          video_url: step.videoUrl,
          order_index: index
        }))
      }

      const response = await fetch('/api/sops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sopData),
        // Add credentials to ensure cookies are sent
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create SOP')
      }

      toast({
        title: "Success",
        description: "SOP created successfully"
      })

      router.push('/sops')
      router.refresh()

    } catch (error) {
      console.error('Error creating SOP:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create SOP",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Link href="/sops">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Create New SOP</h2>
        </div>
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Manual Creation</TabsTrigger>
            <TabsTrigger value="excel">Excel Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SOP Details</CardTitle>
                <CardDescription>Enter the basic information about this Standard Operating Procedure</CardDescription>
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
                    value={formData.tags}
                    onChange={(e) => handleFormChange("tags", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>SOP Steps</CardTitle>
                <CardDescription>Add detailed steps for completing this procedure</CardDescription>
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
                          placeholder="Detailed instructions on how to complete this step"
                          rows={4}
                          value={step.how}
                          onChange={(e) => updateStepField(step.id, "how", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`step-${step.id}-video`} className="flex items-center gap-2">
                          <Video className="h-4 w-4" /> Video URL
                        </Label>
                        <Input
                          id={`step-${step.id}-video`}
                          placeholder="Enter YouTube or other video embed URL"
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
            <div className="flex justify-end gap-2">
              <Link href="/sops">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button 
                className="gap-1" 
                onClick={handleSaveSOP} 
                disabled={loading}
              >
                <Save className="h-4 w-4" /> 
                {loading ? "Saving..." : "Save SOP"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="excel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Excel Template</CardTitle>
                <CardDescription>Upload an Excel file to automatically create SOP steps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    <h3 className="font-medium">Drag and drop your Excel file here</h3>
                    <p className="text-sm text-muted-foreground">or click to browse your files</p>
                    <Input type="file" className="hidden" id="excel-upload" />
                    <Button variant="outline" onClick={() => document.getElementById("excel-upload")?.click()}>
                      Select File
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Template Format</h4>
                  <p className="text-sm text-muted-foreground">Your Excel file should have the following columns:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Step Number</li>
                    <li>Step Title</li>
                    <li>What</li>
                    <li>Why</li>
                    <li>How</li>
                    <li>Video URL (optional)</li>
                  </ul>
                  <div className="pt-2">
                    <Button variant="outline" size="sm">
                      Download Template
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">SOP Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="excel-title">Title</Label>
                      <Input id="excel-title" placeholder="Enter SOP title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="excel-category">Category</Label>
                      <Select>
                        <SelectTrigger id="excel-category">
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
                    <Label htmlFor="excel-description">Description</Label>
                    <Textarea id="excel-description" placeholder="Enter a detailed description of this SOP" rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Link href="/sops">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button className="gap-1">
                <Save className="h-4 w-4" /> Process and Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}







