import api from '../lib/axios'
import { ApplicationAttachment } from '../types'

export async function getAttachments(applicationId: number): Promise<ApplicationAttachment[]> {
  const { data } = await api.get<ApplicationAttachment[]>(`/applications/${applicationId}/attachments/`)
  return data
}

export async function uploadAttachment(applicationId: number, file: File, name?: string): Promise<ApplicationAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name || file.name)
  const { data } = await api.post<ApplicationAttachment>(`/applications/${applicationId}/attachments/`, formData)
  return data
}

export async function deleteAttachment(applicationId: number, attachmentId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}/attachments/${attachmentId}/`)
}
