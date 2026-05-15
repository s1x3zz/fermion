import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import type { AppVariables } from '../types'

const TIER_LIMITS: Record<string, number | null> = {
  free: 5,
  pro: null,
  team: 20,
}

const projects = new Hono<{ Variables: AppVariables }>()

projects.use('*', authMiddleware)

projects.get('/', async (c) => {
  const user = c.get('user')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  circuit: z.record(z.unknown()),
  metadata: z.record(z.unknown()),
})

projects.post('/', zValidator('json', projectSchema), async (c) => {
  const user = c.get('user')
  const profile = c.get('profile')
  const body = c.req.valid('json')

  const limit = TIER_LIMITS[profile.tier] ?? null
  if (limit !== null && profile.project_count >= limit) {
    return c.json({ error: 'limit_reached', tier: profile.tier, limit }, 402)
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      name: body.name,
      description: body.description ?? null,
      circuit: body.circuit,
      metadata: body.metadata,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  await supabase
    .from('profiles')
    .update({
      project_count: profile.project_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return c.json(data, 201)
})

projects.put(
  '/:id',
  zValidator(
    'json',
    z.object({
      circuit: z.record(z.unknown()).optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
  async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const { data, error } = await supabase
      .from('projects')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return c.json({ error: error.message }, 500)
    if (!data) return c.json({ error: 'Not found' }, 404)

    return c.json(data)
  }
)

projects.delete('/:id', async (c) => {
  const user = c.get('user')
  const profile = c.get('profile')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return c.json({ error: error.message }, 500)

  await supabase
    .from('profiles')
    .update({
      project_count: Math.max(0, profile.project_count - 1),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return c.json({ success: true })
})

export default projects
