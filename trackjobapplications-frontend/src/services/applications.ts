import api from '../lib/axios'
import { ApplicationFilters, ApplicationNote, EmailLog, JobApplication, PaginatedResponse } from '../types'

type CreatePayload = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>
type UpdatePayload = Partial<CreatePayload>

export async function getApplications(page = 1, filters: ApplicationFilters = {}): Promise<PaginatedResponse<JobApplication>> {
  const params: Record<string, string | number> = { page }
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.source) params.source = filters.source
  if (filters.applied_date_after) params.applied_date_after = filters.applied_date_after
  if (filters.applied_date_before) params.applied_date_before = filters.applied_date_before
  if (filters.ordering) params.ordering = filters.ordering
  const { data } = await api.get<PaginatedResponse<JobApplication>>('/applications/', { params })
  return data
}

export async function getAllApplications(): Promise<JobApplication[]> {
  const { data } = await api.get<PaginatedResponse<JobApplication>>('/applications/', { params: { page_size: 'all' } })
  return data.results
}

export async function getApplication(id: number): Promise<JobApplication> {
  const { data } = await api.get<JobApplication>(`/applications/${id}/`)
  return data
}

export async function createApplication(payload: CreatePayload): Promise<JobApplication> {
  const { data } = await api.post<JobApplication>('/applications/', payload)
  return data
}

export async function updateApplication(id: number, payload: UpdatePayload): Promise<JobApplication> {
  const { data } = await api.patch<JobApplication>(`/applications/${id}/`, payload)
  return data
}

export async function deleteApplication(id: number): Promise<void> {
  await api.delete(`/applications/${id}/`)
}

export async function getNotes(applicationId: number): Promise<ApplicationNote[]> {
  const { data } = await api.get<ApplicationNote[]>(`/applications/${applicationId}/notes/`)
  return data
}

export async function createNote(applicationId: number, content: string): Promise<ApplicationNote> {
  const { data } = await api.post<ApplicationNote>(`/applications/${applicationId}/notes/`, { content })
  return data
}

export async function deleteNote(applicationId: number, noteId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}/notes/${noteId}/`)
}

export async function togglePin(id: number): Promise<{ is_pinned: boolean }> {
  const { data } = await api.post(`/applications/${id}/toggle-pin/`)
  return data
}

export interface AppStats {
  total: number
  to_apply: number
  applied: number
  interview: number
  offer: number
  rejected: number
  withdrawn: number
}

export async function getStats(): Promise<AppStats> {
  const { data } = await api.get<AppStats>('/applications/stats/')
  return data
}

// Export PDF
export async function exportPdf(): Promise<void> {
  const { data } = await api.get('/applications/export-pdf/', { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'applications.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Bulk actions
export async function bulkUpdateStatus(ids: number[], status: string): Promise<{ updated: number }> {
  const { data } = await api.post('/applications/bulk-update-status/', { ids, status })
  return data
}

export async function bulkDelete(ids: number[]): Promise<{ deleted: number }> {
  const { data } = await api.post('/applications/bulk-delete/', { ids })
  return data
}

// Email logs
export async function getEmailLogs(applicationId: number): Promise<EmailLog[]> {
  const { data } = await api.get<EmailLog[]>(`/applications/${applicationId}/emails/`)
  return data
}

export async function deleteEmailLog(applicationId: number, emailId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}/emails/${emailId}/`)
}

// Import
export async function importApplications(file: File, columnMapping?: Record<string, string>): Promise<{ created: number; errors: Array<{ row: number; errors: Record<string, string[]> }> }> {
  const formData = new FormData()
  formData.append('file', file)
  if (columnMapping) formData.append('column_mapping', JSON.stringify(columnMapping))
  const { data } = await api.post('/applications/import/', formData)
  return data
}
