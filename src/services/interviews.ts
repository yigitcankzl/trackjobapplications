import api from '../lib/axios'
import { InterviewStage } from '../types'

export async function getInterviews(applicationId: number): Promise<InterviewStage[]> {
  const { data } = await api.get<InterviewStage[]>(`/applications/${applicationId}/interviews/`)
  return data
}

export async function createInterview(applicationId: number, payload: Omit<InterviewStage, 'id' | 'created_at'>): Promise<InterviewStage> {
  const { data } = await api.post<InterviewStage>(`/applications/${applicationId}/interviews/`, payload)
  return data
}

export async function updateInterview(applicationId: number, interviewId: number, payload: Partial<Omit<InterviewStage, 'id' | 'created_at'>>): Promise<InterviewStage> {
  const { data } = await api.patch<InterviewStage>(`/applications/${applicationId}/interviews/${interviewId}/`, payload)
  return data
}

export async function deleteInterview(applicationId: number, interviewId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}/interviews/${interviewId}/`)
}
