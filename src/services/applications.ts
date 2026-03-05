import api from '../lib/axios'
import { ApplicationNote, JobApplication } from '../types'

type CreatePayload = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>
type UpdatePayload = Partial<CreatePayload>

export async function getApplications(): Promise<JobApplication[]> {
  const { data } = await api.get<JobApplication[]>('/applications/')
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
