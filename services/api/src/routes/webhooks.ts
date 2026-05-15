import { Hono } from 'hono'
import type Stripe from 'stripe'
import { stripe } from '../lib/stripe'
import { supabase } from '../lib/supabase'

const webhooks = new Hono()

webhooks.post('/stripe', async (c) => {
  const rawBody = await c.req.text()
  const sig = c.req.header('stripe-signature') ?? ''
  const secret = process.env['STRIPE_WEBHOOK_SECRET'] ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.['user_id']
      const tier = session.metadata?.['tier']

      if (!userId || !tier) break

      await supabase
        .from('profiles')
        .update({
          tier,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id
      const tier =
        priceId === process.env['STRIPE_PRICE_PRO_MONTHLY'] ? 'pro' : 'team'

      await supabase
        .from('profiles')
        .update({
          tier,
          subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_status: 'inactive',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return c.json({ received: true })
})

export default webhooks
