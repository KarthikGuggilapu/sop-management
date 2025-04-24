import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client that works with Next.js 15
const createServerSupabaseClient = async () => {
  const cookieStore = await cookies() // Await cookies() here
  
  // Create a Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        // Get the auth cookie directly
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          // Get the auth cookie and set it as a header
          Cookie: cookieStore.getAll()
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ')
        }
      }
    }
  )
  
  return supabase
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: sops, error } = await supabase
      .from('sops')
      .select(`
        *,
        sop_steps!sop_id (
          id,
          title,
          what,
          why,
          how,
          video_url,
          order_index,
          sop_step_completions!step_id (
            id,
            completed_at,
            user_id
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching SOPs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedSops = sops.map(sop => {
      const steps = sop.sop_steps || []
      const totalSteps = steps.length
      const completedSteps = steps.reduce((count: number, step: { sop_step_completions?: any[] }) => {
        return count + ((step.sop_step_completions && step.sop_step_completions.length > 0) ? 1 : 0)
      }, 0)
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

      return {
        ...sop,
        progress,
        completedSteps,
        totalSteps,
      }
    })

    return NextResponse.json(formattedSops)
  } catch (error) {
    console.error('Error in GET /api/sops:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch SOPs' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const json = await request.json()
    const { steps, ...sopData } = json

    // Create the SOP with RLS-compliant fields
    const sopPayload = {
      title: sopData.title,
      description: sopData.description,
      category: sopData.category,
      created_by: user.id,
      status: 'draft', 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Creating SOP with payload:', sopPayload)

    // First, create the SOP
    const { data: sop, error: sopError } = await supabase
      .from('sops')
      .insert([sopPayload])
      .select()
      .single()

    if (sopError) {
      console.error('SOP creation error:', sopError)
      return NextResponse.json({ error: sopError.message }, { status: 500 })
    }

    // Then, create the steps
    if (steps && steps.length > 0) {
      const stepsWithSopId = steps.map((step: any, index: number) => ({
        sop_id: sop.id,
        title: step.title,
        what: step.what,
        why: step.why,
        how: step.how,
        video_url: step.video_url || step.videoUrl,
        order_index: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('Creating steps:', stepsWithSopId)

      const { error: stepsError } = await supabase
        .from('sop_steps')
        .insert(stepsWithSopId)

      if (stepsError) {
        console.error('Steps creation error:', stepsError)
        return NextResponse.json({ error: stepsError.message }, { status: 500 })
      }
    }

    return NextResponse.json(sop)
  } catch (error) {
    console.error('Error creating SOP:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create SOP' 
    }, { status: 500 })
  }
}


