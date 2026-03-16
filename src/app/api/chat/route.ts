import { NextRequest, NextResponse } from 'next/server'
import { answerQuestion } from '@/lib/rag/answerQuestion'

export async function POST(request: NextRequest) {
  try {
    const { sectionId, query, conversationHistory } = await request.json()

    if (!sectionId || !query) {
      return NextResponse.json(
        { error: 'sectionId and query are required' },
        { status: 400 }
      )
    }

    const result = await answerQuestion(sectionId, query, conversationHistory || [])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
