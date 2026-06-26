import { api } from '../api'
import type { ApiTestResponse } from '../types/api'

export async function getApiConnectionMessage(): Promise<string> {
  const response = await api.get<ApiTestResponse>('/test')

  return response.data.message
}
