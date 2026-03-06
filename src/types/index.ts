export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string | null
  resume?: string | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export type ApplicationStatus =
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export type ApplicationSource =
  | 'linkedin'
  | 'indeed'
  | 'glassdoor'
  | 'referral'
  | 'company_website'
  | 'other'

export interface ApplicationNote {
  id: number
  content: string
  created_at: string
}

export interface JobApplication {
  id: number
  company: string
  position: string
  status: ApplicationStatus
  applied_date: string
  url?: string
  source?: ApplicationSource | ''
  interview_date?: string | null
  notes: string
  created_at: string
  updated_at: string
  note_entries?: ApplicationNote[]
}

export type ViewMode = 'table' | 'kanban'
export type SortKey = 'date' | 'company' | 'status'
export type StatusFilter = ApplicationStatus | 'all'
