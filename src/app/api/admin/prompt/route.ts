import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getSectionById } from '../../../../../config/sections'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId')
  const manager = searchParams.get('manager')

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Reviews section uses review_prompts table, keyed by manager
  if (sectionId === 'reviews') {
    if (!manager) {
      return NextResponse.json({ prompt: '', lastEdited: null })
    }

    const { data: row } = await supabase
      .from('review_prompts')
      .select('system_prompt, updated_at')
      .eq('module', 'reviews')
      .eq('manager', manager)
      .single()

    if (row?.system_prompt) {
      return NextResponse.json({ prompt: row.system_prompt, lastEdited: row.updated_at })
    }

    // Fall back to file
    const PROMPT_FILES: Record<string, string> = {
      karlo: 'config/prompts/reviews-karlo.txt',
      victor: 'config/prompts/reviews-victor.txt',
    }
    const promptFile = PROMPT_FILES[manager]
    if (promptFile) {
      try {
        const filePath = path.join(process.cwd(), promptFile)
        const prompt = fs.readFileSync(filePath, 'utf-8')
        return NextResponse.json({ prompt, lastEdited: null })
      } catch {
        // file not found
      }
    }

    return NextResponse.json({ prompt: '', lastEdited: null })
  }

  // Load from section_prompts — one row per section, independent of documents
  const { data: row } = await supabase
    .from('section_prompts')
    .select('system_prompt, updated_at')
    .eq('section_id', sectionId)
    .single()

  if (row?.system_prompt) {
    return NextResponse.json({ prompt: row.system_prompt, lastEdited: row.updated_at })
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
    const { sectionId, prompt, manager } = await request.json()

    if (!sectionId || prompt === undefined) {
      return NextResponse.json({ error: 'sectionId and prompt are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Reviews section saves to review_prompts, keyed by manager
    if (sectionId === 'reviews') {
      if (!manager) {
        return NextResponse.json({ error: 'manager is required for reviews' }, { status: 400 })
      }

      const { error } = await supabase
        .from('review_prompts')
        .upsert(
          { module: 'reviews', manager, system_prompt: prompt, updated_at: new Date().toISOString() },
          { onConflict: 'module,manager' }
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from('section_prompts')
      .upsert(
        { section_id: sectionId, system_prompt: prompt, updated_at: new Date().toISOString() },
        { onConflict: 'section_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Prompt save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
