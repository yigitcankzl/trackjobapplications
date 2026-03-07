import api from '../lib/axios'
import { CoverLetterTemplate } from '../types'

export async function getTemplates(): Promise<CoverLetterTemplate[]> {
  const { data } = await api.get<CoverLetterTemplate[]>('/applications/cover-letters/')
  return data
}

export async function getTemplate(id: number): Promise<CoverLetterTemplate> {
  const { data } = await api.get<CoverLetterTemplate>(`/applications/cover-letters/${id}/`)
  return data
}

export async function createTemplate(payload: { name: string; content: string }): Promise<CoverLetterTemplate> {
  const { data } = await api.post<CoverLetterTemplate>('/applications/cover-letters/', payload)
  return data
}

export async function updateTemplate(id: number, payload: { name?: string; content?: string }): Promise<CoverLetterTemplate> {
  const { data } = await api.patch<CoverLetterTemplate>(`/applications/cover-letters/${id}/`, payload)
  return data
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/applications/cover-letters/${id}/`)
}
