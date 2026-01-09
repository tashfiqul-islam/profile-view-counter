import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timing } from 'hono/timing'
import { viewCounterRoute } from './routes/view-counter'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use('*', timing())
app.use('*', cors())

app.get('/favicon.ico', (c) => c.body(null, 204))

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/', (c) =>
  c.json({
    message: 'Profile View Counter API is running 🚀',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      view_counter: '/api/view-counter?username=:username',
    },
    documentation: 'https://github.com/tashfiqul-islam/profile-view-counter',
  }),
)

app.route('/api', viewCounterRoute)

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

app.onError((err, c) => {
  console.error('Error:', err.message)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
