"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Edit, Filter, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Sop } from "@/types/sop"
import { useRouter } from "next/navigation"

export default function SOPsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [sops, setSops] = useState<Sop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchSOPs()
  }, [])

  const fetchSOPs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sops', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch SOPs')
      }
      
      const data = await response.json()
      const sopsWithProgress = data.map((sop: any) => {
        const totalSteps = sop.steps?.length || 0
        const completedSteps = sop.steps?.filter((step: any) => 
          step.completions && step.completions.length > 0
        ).length || 0
        
        return {
          ...sop,
          progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
          completedSteps,
          totalSteps
        }
      })
      
      setSops(Array.isArray(sopsWithProgress) ? sopsWithProgress : [])
    } catch (error) {
      console.error('Error fetching SOPs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch SOPs",
        variant: "destructive",
      })
      setSops([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sopId: string) => {
    try {
      const response = await fetch(`/api/sops/${sopId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete SOP')
      }

      setSops(sops.filter(sop => sop.id !== sopId))
      toast({
        title: "Success",
        description: "SOP deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting SOP:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete SOP",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (sopId: string) => {
    try {
      const response = await fetch(`/api/sops/${sopId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate SOP')
      }

      const newSop = await response.json()
      
      // Add progress calculation for the new SOP
      const totalSteps = newSop.sop_steps?.length || 0
      const completedSteps = 0 // New SOP starts with no completed steps
      
      const sopWithProgress = {
        ...newSop,
        progress: 0,
        completedSteps,
        totalSteps
      }

      setSops(prevSops => [...prevSops, sopWithProgress])
      
      toast({
        title: "Success",
        description: "SOP duplicated successfully",
      })
    } catch (error) {
      console.error('Error duplicating SOP:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to duplicate SOP",
        variant: "destructive",
      })
    }
  }

  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch = 
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sop.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || sop.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Standard Operating Procedures</h2>
          <div className="flex items-center gap-2">
            <Link href="/sops/create">
              <Button className="gap-1">
                <Plus className="h-4 w-4" /> Create SOP
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search SOPs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All Categories</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Sales")}>Sales</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Support")}>Support</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("IT")}>IT</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Security")}>Security</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("HR")}>HR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSOPs.map((sop) => (
            <Card key={sop.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/sops/${sop.id}`} className="hover:underline">
                        {sop.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1">{sop.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/sops/${sop.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onSelect={() => handleDuplicate(sop.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onSelect={() => handleDelete(sop.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">{sop.category}</Badge>
                  {sop.tags && sop.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{sop.progress}%</span>
                  </div>
                  <Progress value={sop.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between w-full">
                  <div>Created by {sop.created_at}</div>
                  <div>
                    {sop.completedSteps} of {sop.totalSteps} steps
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}








