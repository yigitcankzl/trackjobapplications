import api from '../lib/axios'
import { ApplicationContact } from '../types'

export async function getContacts(applicationId: number): Promise<ApplicationContact[]> {
  const { data } = await api.get<ApplicationContact[]>(`/applications/${applicationId}/contacts/`)
  return data
}

export async function createContact(applicationId: number, payload: Omit<ApplicationContact, 'id' | 'created_at'>): Promise<ApplicationContact> {
  const { data } = await api.post<ApplicationContact>(`/applications/${applicationId}/contacts/`, payload)
  return data
}

export async function updateContact(applicationId: number, contactId: number, payload: Partial<Omit<ApplicationContact, 'id' | 'created_at'>>): Promise<ApplicationContact> {
  const { data } = await api.patch<ApplicationContact>(`/applications/${applicationId}/contacts/${contactId}/`, payload)
  return data
}

export async function deleteContact(applicationId: number, contactId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}/contacts/${contactId}/`)
}
