import { createMiddleware } from 'hono/factory'
import type { AppVariables, Tier } from '../types'

const TIER_ORDER: Tier[] = ['guest', 'free', 'pro', 'team']

export function requireTier(minimum: Tier) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const profile = c.get('profile')
    const currentIndex = TIER_ORDER.indexOf(profile.tier)
    const requiredIndex = TIER_ORDER.indexOf(minimum)

    if (currentIndex < requiredIndex) {
      return c.json({ error: 'insufficient_tier', required: minimum, current: profile.tier }, 403)
    }

    await next()
  })
}
