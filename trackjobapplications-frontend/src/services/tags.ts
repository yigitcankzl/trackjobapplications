import api from '../lib/axios'
import { Tag } from '../types'

export async function getTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>('/applications/tags/')
  return data
}

export async function createTag(payload: { name: string; color: string }): Promise<Tag> {
  const { data } = await api.post<Tag>('/applications/tags/', payload)
  return data
}

export async function updateTag(id: number, payload: { name?: string; color?: string }): Promise<Tag> {
  const { data } = await api.patch<Tag>(`/applications/tags/${id}/`, payload)
  return data
}

export async function deleteTag(id: number): Promise<void> {
  await api.delete(`/applications/tags/${id}/`)
}
