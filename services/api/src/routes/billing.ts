import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { stripe } from '../lib/stripe'
import { supabase } from '../lib/supabase'
import type { AppVariables } from '../types'

const billing = new Hono<{ Variables: AppVariables }>()

billing.use('*', authMiddleware)

billing.post(
  '/create-checkout',
  zValidator('json', z.object({ tier: z.enum(['pro', 'team']) })),
  async (c) => {
    const user = c.get('user')
    const profile = c.get('profile')
    const { tier } = c.req.valid('json')

    const priceId =
      tier === 'pro'
        ? process.env['STRIPE_PRICE_PRO_MONTHLY']
        : process.env['STRIPE_PRICE_TEAM_MONTHLY']

    if (!priceId) return c.json({ error: 'Price not configured' }, 500)

    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? '' })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env['FRONTEND_URL']}/dashboard?upgraded=1`,
      cancel_url: `${process.env['FRONTEND_URL']}/pricing`,
      metadata: { user_id: user.id, tier },
    })

    return c.json({ url: session.url })
  }
)

billing.post('/create-portal', async (c) => {
  const profile = c.get('profile')

  if (!profile.stripe_customer_id) {
    return c.json({ error: 'No subscription found' }, 400)
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env['FRONTEND_URL']}/dashboard`,
  })

  return c.json({ url: session.url })
})

billing.get('/subscription', (c) => {
  const profile = c.get('profile')
  return c.json({
    tier: profile.tier,
    subscription_status: profile.subscription_status,
    stripe_subscription_id: profile.stripe_subscription_id,
  })
})

export default billing
