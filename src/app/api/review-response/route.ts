import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceRoleClient } from '@/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const PROMPT_FILES: Record<string, string> = {
  karlo: 'config/prompts/reviews-karlo.txt',
  victor: 'config/prompts/reviews-victor.txt',
}

async function getReviewPrompt(manager: string): Promise<string> {
  const supabase = createServiceRoleClient()

  // Try database first
  const { data } = await supabase
    .from('review_prompts')
    .select('system_prompt')
    .eq('module', 'reviews')
    .eq('manager', manager)
    .single()

  if (data?.system_prompt) {
    return data.system_prompt
  }

  // Fallback to file, and seed DB for next time
  const promptFile = PROMPT_FILES[manager]
  if (!promptFile) {
    throw new Error(`Unknown manager: ${manager}`)
  }

  const filePath = path.join(process.cwd(), promptFile)
  const prompt = fs.readFileSync(filePath, 'utf-8')

  // Seed DB (fire-and-forget)
  supabase
    .from('review_prompts')
    .upsert(
      { module: 'reviews', manager, system_prompt: prompt },
      { onConflict: 'module,manager' }
    )
    .then(({ error }) => {
      if (error) console.error('Failed to seed review prompt:', error)
    })

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const { review_text, reviewer_name, manager } = await request.json()

    if (!review_text || !reviewer_name || !manager) {
      return NextResponse.json(
        { error: 'review_text, reviewer_name, and manager are required' },
        { status: 400 }
      )
    }

    if (manager !== 'karlo' && manager !== 'victor') {
      return NextResponse.json(
        { error: 'manager must be "karlo" or "victor"' },
        { status: 400 }
      )
    }

    // Load system prompt and inject reviewer name
    const rawPrompt = await getReviewPrompt(manager)
    const systemPrompt = rawPrompt.replace(/\{\{reviewer_name\}\}/g, reviewer_name)

    // Call Claude Haiku
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: review_text }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Review response API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
