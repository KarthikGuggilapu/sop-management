export type SopStatus = 'draft' | 'published' | 'archived'

export interface SopStep {
  id: string
  title: string
  what: string
  why: string
  how: string
  videoUrl?: string
  completed: boolean
  order_index: number
}

export interface Sop {
  id: string
  title: string
  description?: string
  category: string
  status: string
  tags?: string[]
  progress: number
  completedSteps: number
  totalSteps: number
  created_at: string
  updated_at: string
  steps: SopStep[]
}
