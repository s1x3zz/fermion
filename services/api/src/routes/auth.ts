import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import type { AppVariables } from '../types'

const auth = new Hono<{ Variables: AppVariables }>()

auth.use('*', authMiddleware)

auth.get('/profile', (c) => {
  const profile = c.get('profile')
  return c.json({
    id: profile.id,
    email: profile.email,
    tier: profile.tier,
    project_count: profile.project_count,
    subscription_status: profile.subscription_status,
  })
})

auth.patch(
  '/profile',
  zValidator('json', z.object({ display_name: z.string().optional() })),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')

    const { error } = await supabase
      .from('profiles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) return c.json({ error: error.message }, 500)

    return c.json({ success: true })
  }
)

export default auth
