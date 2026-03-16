'use client'

import { ChatInterface } from '@/components/ChatInterface'
import { getSectionById } from '../../../config/sections'

export default function HRPage() {
  const section = getSectionById('hr')!

  return <ChatInterface section={section} />
}
