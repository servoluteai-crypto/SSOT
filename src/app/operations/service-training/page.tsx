'use client'

import { ChatInterface } from '@/components/ChatInterface'
import { getSectionById } from '../../../../config/sections'

export default function ServiceTrainingPage() {
  const section = getSectionById('service-training')!

  return <ChatInterface section={section} />
}
