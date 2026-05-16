import type { User } from '@supabase/supabase-js'

export type Tier = 'guest' | 'free' | 'pro' | 'ultimate'

export interface Profile {
  id: string
  email: string
  tier: Tier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  project_count: number
  created_at: string
  updated_at: string
}

export type AppVariables = {
  user: User
  profile: Profile
}
