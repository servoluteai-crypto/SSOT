import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getSectionById } from '../../../../../config/sections'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId')

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
  }

  const section = getSectionById(sectionId)
  if (!section?.systemPromptFile) {
    return NextResponse.json({ prompt: '' })
  }

  try {
    const filePath = path.join(process.cwd(), section.systemPromptFile)
    const prompt = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json({ prompt })
  } catch {
    return NextResponse.json({ prompt: '' })
  }
}
