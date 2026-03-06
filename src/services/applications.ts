import api from '../lib/axios'
import { ApplicationFilters, ApplicationNote, JobApplication, PaginatedResponse } from '../types'

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
  const { data } = await api.get<JobApplication[]>('/applications/', { params: { page_size: 'all' } })
  return data
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
