import { supabase } from './supabase'

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001'

export type Tier = 'guest' | 'free' | 'pro' | 'team'

export interface Profile {
  id: string
  email: string
  tier: Tier
  project_count: number
  subscription_status: string
}

export interface FermionProject {
  id: string
  user_id: string
  name: string
  description: string | null
  circuit: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
}

export const api = {
  async getProfile(): Promise<Profile> {
    const res = await authFetch('/api/auth/profile')
    if (!res.ok) throw new Error('Failed to fetch profile')
    return res.json() as Promise<Profile>
  },

  async getProjects(): Promise<FermionProject[]> {
    const res = await authFetch('/api/projects')
    if (!res.ok) throw new Error('Failed to fetch projects')
    return res.json() as Promise<FermionProject[]>
  },

  async saveProject(
    project: Partial<FermionProject> & {
      name: string
      circuit: Record<string, unknown>
      metadata: Record<string, unknown>
    }
  ): Promise<void> {
    if (project.id) {
      const res = await authFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ circuit: project.circuit, metadata: project.metadata }),
      })
      if (!res.ok) throw new Error('Failed to save project')
    } else {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string; tier?: string; limit?: number }
        throw Object.assign(new Error(err.error), err)
      }
    }
  },

  async deleteProject(id: string): Promise<void> {
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete project')
  },

  async createCheckout(tier: 'pro' | 'team'): Promise<{ url: string }> {
    const res = await authFetch('/api/billing/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    })
    if (!res.ok) throw new Error('Failed to create checkout')
    return res.json() as Promise<{ url: string }>
  },

  async createPortal(): Promise<{ url: string }> {
    const res = await authFetch('/api/billing/create-portal', {
      method: 'POST',
      body: '{}',
    })
    if (!res.ok) throw new Error('Failed to create portal')
    return res.json() as Promise<{ url: string }>
  },
}
