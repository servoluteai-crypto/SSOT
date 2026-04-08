import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getSectionById } from '../../../../../config/sections'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId')

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Try Supabase first — find whichever active doc has the prompt set
  const { data: doc } = await supabase
    .from('documents')
    .select('system_prompt, uploaded_at')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .not('system_prompt', 'is', null)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single()

  if (doc?.system_prompt) {
    return NextResponse.json({ prompt: doc.system_prompt, lastEdited: doc.uploaded_at })
  }

  // Fall back to prompt file if no DB entry
  const section = getSectionById(sectionId)
  if (!section?.systemPromptFile) {
    return NextResponse.json({ prompt: '', lastEdited: null })
  }

  try {
    const filePath = path.join(process.cwd(), section.systemPromptFile)
    const prompt = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json({ prompt, lastEdited: null })
  } catch {
    return NextResponse.json({ prompt: '', lastEdited: null })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sectionId, prompt } = await request.json()

    if (!sectionId || prompt === undefined) {
      return NextResponse.json({ error: 'sectionId and prompt are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('documents')
      .update({ system_prompt: prompt })
      .eq('section_id', sectionId)
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Prompt save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
