import { createMiddleware } from 'hono/factory'
import { supabase } from '../lib/supabase'
import type { AppVariables } from '../types'

export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return c.json({ error: 'Profile not found' }, 401)
  }

  c.set('user', user)
  c.set('profile', profile as AppVariables['profile'])

  await next()
})
