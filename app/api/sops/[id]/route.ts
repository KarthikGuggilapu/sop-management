import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const supabase = await createClient()

    const { data: sop, error } = await supabase
      .from('sops')
      .select(`
        *,
        steps:sop_steps(
          *,
          completions:sop_step_completions(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sop)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SOP' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { title, description, category, steps } = await request.json()

    // First, update the SOP details
    const { error: sopError } = await supabase
      .from('sops')
      .update({
        title,
        description,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (sopError) {
      return NextResponse.json({ error: sopError.message }, { status: 500 })
    }

    // Then, handle the steps updates
    if (steps && steps.length > 0) {
      // Delete existing steps
      const { error: deleteError } = await supabase
        .from('sop_steps')
        .delete()
        .eq('sop_id', id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Insert new steps
      const { error: stepsError } = await supabase
        .from('sop_steps')
        .insert(
          steps.map((step: any) => ({
            sop_id: id,
            title: step.title,
            what: step.what,
            why: step.why,
            how: step.how,
            video_url: step.video_url,
            order_index: step.order_index
          }))
        )

      if (stepsError) {
        return NextResponse.json({ error: stepsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating SOP:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update SOP' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sops')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}






