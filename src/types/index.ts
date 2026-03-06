export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string | null
  resume?: string | null
  notification_email?: string
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

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ViewMode = 'table' | 'kanban'
export type SortKey = 'date' | 'company' | 'status'
export type StatusFilter = ApplicationStatus | 'all'

export interface ApplicationFilters {
  search?: string
  status?: ApplicationStatus
  source?: ApplicationSource
  applied_date_after?: string
  applied_date_before?: string
  ordering?: string
}
