import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('sops')
      .select(`
        *,
        steps:sop_steps (
          id,
          title,
          completions:sop_step_completions (
            id,
            completed_at
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const json = await request.json()
    const { steps, ...sopData } = json

    const sopPayload = {
      ...sopData,
      created_by: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: sop, error: sopError } = await supabase
      .from('sops')
      .insert([sopPayload])
      .select()
      .single()

    if (sopError) {
      return NextResponse.json({ error: sopError.message }, { status: 500 })
    }

    if (steps && steps.length > 0) {
      const stepsWithSopId = steps.map((step: any, index: number) => ({
        sop_id: sop.id,
        ...step,
        order_index: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: stepsError } = await supabase
        .from('sop_steps')
        .insert(stepsWithSopId)

      if (stepsError) {
        return NextResponse.json({ error: stepsError.message }, { status: 500 })
      }
    }

    return NextResponse.json(sop)
  } catch (error) {
    console.error('Error in POST /api/sops:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create SOP' 
    }, { status: 500 })
  }
}





