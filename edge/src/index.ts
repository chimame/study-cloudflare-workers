import { Hono } from 'hono'

const app = new Hono()

app.get('/ping', (c) => {
  const blockRequest: Promise<void> = new Promise(() => fetch('http://localhost:3000/api/hello'))
  c.executionCtx.waitUntil(blockRequest)

  return c.text('pong')
})

app.get('/json', (c) => {
  return c.json({hoge: 'fuga'})
})

app.get('/api/cache', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url)

  let response = await cache.match(cacheKey)
  if (response) {
    console.log('hit cache', c.req.url)
    return response
  }

  response = await fetch(
    'http://localhost:3000/api/cache',
    {
      cf: {
        cacheTtl: 1000,
        cacheEverything: true,
      }
    }
  )

  if (c.req.method === 'GET' && response.status === 200) {
    response = response.clone()
    response.headers.set('Cache-Control', 'max-age=604800')
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})

app.get('/ab/page', async (c) => {
  const abPath = c.req.cookie('ab')
  const { headers, body } = c.req

  const url = new URL(c.req.url)
  url.port = '3000'

  if (abPath) {
    console.log('has ab route')
    url.pathname = abPath
    const originResponse = await fetch(url, { headers, body })
    return originResponse
  }

  const access = Math.random() < 0.5 ? "page-a" : "page-b"
  const abAccessPath = `/ab/${access}`

  url.pathname = abAccessPath
  const originResponse = (await fetch(url, { headers, body })).clone()
  originResponse.headers.append('Set-Cookie', `ab=${abAccessPath}`)

  return originResponse
})

app.all('/*', async (c) => {
  c.executionCtx.passThroughOnException()

  const url = new URL(c.req.url)
  url.port = '3000'

  return await fetch(
    url.toString(),
    {
      headers: c.req.headers,
      body: c.req.body
    }
  )
})

export default app
