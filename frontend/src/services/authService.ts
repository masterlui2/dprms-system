import type { MockUser } from '../lib/mockAuth'
import type { ApplicationProgram } from '../types/application'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

interface BackendUser {
  email: string
  name: string
  role?: string
  roles?: Array<{ name?: string; code?: string }>
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

export class AuthError extends Error {
  constructor(message = 'Invalid email address or password.') {
    super(message)
    this.name = 'AuthError'
  }
}

function resolveRole(user: BackendUser): MockUser['role'] {
  const explicitRole = user.role?.toLowerCase()
  const relationRole = user.roles?.[0]?.code ?? user.roles?.[0]?.name
  const normalizedRelationRole = relationRole?.toLowerCase()

  if (
    explicitRole === 'admin' ||
    explicitRole === 'system_admin' ||
    normalizedRelationRole === 'admin' ||
    normalizedRelationRole === 'system_admin' ||
    normalizedRelationRole === 'administrator'
  ) {
    return 'admin'
  }

  return 'proponent'
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
  const role = (user.role ?? user.roles?.[0]?.code ?? user.roles?.[0]?.name)?.toUpperCase()

  if (role === 'GIA_PROJECT_LEADER') return 'GIA'
  if (role === 'MSME_PROPONENT') return 'SETUP'

  return undefined
}

export async function loginWithBackend(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    body: JSON.stringify({ email, password }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new AuthError()
  }

  const payload = (await response.json()) as LoginResponse
  const backendUser = payload.data.user
  const user: MockUser = {
    email: backendUser.email,
    initials: getInitials(backendUser.name),
    name: backendUser.name,
    program: resolveProgram(backendUser),
    role: resolveRole(backendUser),
  }

  return {
    token: payload.data.token,
    user,
  }
}

export async function registerWithBackend(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    if (response.status === 422) {
      const errorPayload = await response.json().catch(() => null)
      const firstError = errorPayload?.errors
        ? Object.values(errorPayload.errors)[0]
        : null
      const message = Array.isArray(firstError)
        ? firstError[0]
        : 'Please review the registration details.'

      throw new AuthError(message)
    }

    throw new AuthError('Registration failed. Please try again.')
  }

  return response.json()
}

export async function logoutFromBackend(token: string) {
  await fetch(`${API_BASE_URL}/logout`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
  })
}
