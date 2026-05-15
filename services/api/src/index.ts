import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import billingRoutes from './routes/billing'
import webhookRoutes from './routes/webhooks'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://fermion.io'],
    credentials: true,
  })
)

app.get('/api/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
)

app.route('/api/auth', authRoutes)
app.route('/api/projects', projectRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/webhooks', webhookRoutes)

const port = Number(process.env['PORT'] ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Fermion API running on http://localhost:${port}`)
})
