export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string | null
  resume?: string | null
  notification_email?: string
}

export interface NotificationPreference {
  email_notifications_enabled: boolean
  interview_reminder_hours: number
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

export interface Tag {
  id: number
  name: string
  color: string
}

export interface ApplicationContact {
  id: number
  name: string
  email: string
  phone: string
  role: string
  created_at: string
}

export type InterviewStageType =
  | 'phone_screen'
  | 'technical'
  | 'behavioral'
  | 'onsite'
  | 'take_home'
  | 'final'
  | 'other'

export interface InterviewStage {
  id: number
  stage_type: InterviewStageType
  scheduled_at: string
  notes: string
  completed: boolean
  created_at: string
}

export interface ApplicationAttachment {
  id: number
  file: string
  name: string
  uploaded_at: string
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
  tags?: Tag[]
  is_pinned: boolean
  notes: string
  created_at: string
  updated_at: string
  note_entries?: ApplicationNote[]
  contacts?: ApplicationContact[]
  interview_stages?: InterviewStage[]
  attachments?: ApplicationAttachment[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CoverLetterTemplate {
  id: number
  name: string
  content: string
  created_at: string
  updated_at: string
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
