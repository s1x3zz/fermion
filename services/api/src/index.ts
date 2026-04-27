import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json({ name: 'fermion-api', version: '0.0.1' }))

export default app
