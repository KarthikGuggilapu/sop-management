import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch the original SOP
    const { data: originalSop, error: sopError } = await supabase
      .from('sops')
      .select('*, sop_steps(*)')
      .eq('id', params.id)
      .single()

    if (sopError || !originalSop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 })
    }

    // 2. Create new SOP with copied data
    const newSopData = {
      title: `${originalSop.title} (Copy)`,
      description: originalSop.description,
      category: originalSop.category,
      created_by: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 3. Insert the new SOP
    const { data: newSop, error: newSopError } = await supabase
      .from('sops')
      .insert([newSopData])
      .select()
      .single()

    if (newSopError) {
      return NextResponse.json({ error: newSopError.message }, { status: 500 })
    }

    // 4. Copy all steps if they exist
    if (originalSop.sop_steps && originalSop.sop_steps.length > 0) {
      const newSteps = originalSop.sop_steps.map((step: any) => ({
        sop_id: newSop.id,
        title: step.title,
        what: step.what,
        why: step.why,
        how: step.how,
        video_url: step.video_url,
        order_index: step.order_index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: stepsError } = await supabase
        .from('sop_steps')
        .insert(newSteps)

      if (stepsError) {
        // If steps creation fails, delete the new SOP to maintain consistency
        await supabase.from('sops').delete().eq('id', newSop.id)
        return NextResponse.json({ error: stepsError.message }, { status: 500 })
      }
    }

    // 5. Fetch the complete new SOP with steps
    const { data: completeSop, error: fetchError } = await supabase
      .from('sops')
      .select(`
        *,
        sop_steps (
          *
        )
      `)
      .eq('id', newSop.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json(completeSop)
  } catch (error) {
    console.error('Error in duplicate SOP:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to duplicate SOP' 
    }, { status: 500 })
  }
}