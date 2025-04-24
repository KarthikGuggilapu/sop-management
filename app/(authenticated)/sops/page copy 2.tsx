"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, MoreHorizontal, Edit, Copy, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Sop } from "@/types/sop"

export default function SOPsPage() {
  const { toast } = useToast()
  const [sops, setSops] = useState<Sop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchSOPs()
  }, [])

  const fetchSOPs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sops', {
        credentials: 'include', // Add this to ensure cookies are sent
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch SOPs')
      }
      
      const data = await response.json()
      setSops(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching SOPs:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch SOPs",
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
        credentials: 'include', // Add this
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
      const response = await fetch(`/api/sops/${sopId}/duplicate`, { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to duplicate SOP')
      }
      const newSop = await response.json()
      setSops([...sops, newSop])
      toast({
        title: "Success",
        description: "SOP duplicated successfully",
      })
    } catch (error) {
      console.error('Error duplicating SOP:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate SOP",
        variant: "destructive",
      })
    }
  }

  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch = 
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || sop.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || sop.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Standard Operating Procedures</h2>
          <Link href="/sops/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create New SOP
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="animate-pulse">
                <CardHeader className="h-[120px] bg-muted" />
                <CardContent className="h-[100px] bg-muted mt-4" />
                <CardFooter className="h-[40px] bg-muted mt-4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSOPs.map((sop) => (
              <Card key={sop.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <Link href={`/sops/${sop.id}`} className="hover:underline">
                          {sop.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>{sop.description}</CardDescription>
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
                        <DropdownMenuItem onClick={() => handleDuplicate(sop.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(sop.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{sop.category}</Badge>
                    <Badge variant="outline">{sop.status}</Badge>
                    {sop.tags && Array.isArray(sop.tags) && sop.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
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
                <CardFooter className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-between w-full">
                    <div>{sop.completedSteps} of {sop.totalSteps} steps</div>
                    <div>Updated {new Date(sop.updated_at).toLocaleDateString()}</div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}







