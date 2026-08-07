import axios, {AxiosError } from 'axios'
import api, { ensureCsrfCookie } from '../lib/axios'
import type { MockUser } from '../lib/mockAuth'
import type { ApplicationProgram } from '../types/application'
import { normalizeUserRole } from '../config/permissions'

interface BackendUser {
  email: string
  name: string
  program?: ApplicationProgram
  program_type?: ApplicationProgram
  role?: string
  roles?: Array<{ name?: string; code?: string; program_type?: ApplicationProgram }>
}

interface LoginResponse {
  data: {
    token: string
    user: BackendUser
  }
  message: string
}

interface RegisterPayload {
  email: string
  name: string
  password: string
  password_confirmation: string
  role: 'MSME_PROPONENT' | 'GIA_PROJECT_LEADER'
}

interface ValidationErrorPayload {
  errors?: Record<string, string[]>
  message?: string
}

export class AuthError extends Error {
  constructor(message = 'Invalid email address or password.') {
    super(message)
    this.name = 'AuthError'
  }
}

function resolveRole(user: BackendUser): MockUser['role'] {
  const relationRole = user.roles?.[0]?.code ?? user.roles?.[0]?.name
  return normalizeUserRole(user.role ?? relationRole)
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'US'
}

function resolveProgram(user: BackendUser): ApplicationProgram | undefined {
  if (user.program === 'GIA' || user.program === 'SETUP') return user.program
  if (user.program_type === 'GIA' || user.program_type === 'SETUP') return user.program_type

  const role = (user.role ?? user.roles?.[0]?.code ?? user.roles?.[0]?.name)?.toUpperCase()
  const roleProgram = user.roles?.[0]?.program_type

  if (roleProgram === 'GIA' || roleProgram === 'SETUP') return roleProgram
  if (role === 'GIA_PROJECT_LEADER') return 'GIA'
  if (role === 'MSME_PROPONENT') return 'SETUP'

  return undefined
}

export async function loginWithBackend(email: string, password: string) {
  try {
    await ensureCsrfCookie()
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
    })
 
    const backendUser = response.data.data.user
    const user: MockUser = {
      email: backendUser.email,
      initials: getInitials(backendUser.name),
      name: backendUser.name,
      program: resolveProgram(backendUser),
      role: resolveRole(backendUser),
    }
 
    return {
      token: response.data.data.token,
      user,
    }
  } catch (error) {
    // Any non-2xx (401, 422, 500, etc.) lands here as an AxiosError.
    throw new AuthError()
  }
}

export async function registerWithBackend(payload: RegisterPayload) {
  try {
    await ensureCsrfCookie()
    const response = await api.post('/register', payload)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ValidationErrorPayload>
 
      if (axiosError.response?.status === 422) {
        const errors = axiosError.response.data?.errors
        const firstError = errors ? Object.values(errors)[0] : null
        const message = Array.isArray(firstError)
          ? firstError[0]
          : 'Please review the registration details.'
 
        throw new AuthError(message)
      }
    }
 
    throw new AuthError('Registration failed. Please try again.')
  }
}

export async function logoutFromBackend(token: string) {
  await api.post(
    '/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
}
