export interface EscalationContact {
  name: string
  email: string
}

export interface Section {
  id: string
  label: string
  description: string
  parent: string | null
  status: 'active' | 'coming-soon' | 'hidden'
  authRequired: boolean
  escalationContact: EscalationContact | null
  systemPromptFile: string | null
  suggestedQuestions: string[]
}

export interface TopLevelSection {
  id: string
  label: string
  description: string
}

export const SECTIONS: Section[] = [
  {
    id: 'hr',
    label: 'HR',
    description: 'Get answers to your questions instantly',
    parent: null,
    status: 'active',
    authRequired: false,
    escalationContact: {
      name: 'Courtney',
      email: 'courtney@ehlexperiences.com',
    },
    systemPromptFile: 'config/prompts/hr.txt',
    suggestedQuestions: [
      "What's the holiday request process?",
      "How do I report sick leave?",
      "What's the uniform and appearance policy?",
      "How do I request a shift change?",
    ],
  },
  {
    id: 'service-training',
    label: 'Service & Training',
    description: 'Procedures, standards & guides',
    parent: 'operations',
    status: 'active',
    authRequired: false,
    escalationContact: {
      name: 'Operations Manager',
      email: 'ops@ehlexperiences.com',
    },
    systemPromptFile: 'config/prompts/service-training.txt',
    suggestedQuestions: [
      "What's the wine service procedure?",
      "How do we handle a food allergy query?",
      "What's the corkage policy?",
      "How do I handle a guest complaint?",
    ],
  },
  {
    id: 'onboarding-hub',
    label: 'Onboarding Hub',
    description: 'Role guides, videos & onboarding',
    parent: 'operations',
    status: 'coming-soon',
    authRequired: true,
    escalationContact: null,
    systemPromptFile: null,
    suggestedQuestions: [],
  },
]

export const TOP_LEVEL_SECTIONS: TopLevelSection[] = [
  { id: 'hr', label: 'HR', description: 'Get answers to your questions instantly' },
  { id: 'operations', label: 'Operations', description: 'Procedures, standards & guides' },
]

export function getSectionById(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id)
}

export function getSectionsByParent(parentId: string): Section[] {
  return SECTIONS.filter((s) => s.parent === parentId)
}
