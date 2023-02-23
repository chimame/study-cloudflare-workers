import { Hono } from 'hono'

const app = new Hono()

app.get('/ping', (c) => {
	return c.text('pong')
})

app.get('/json', (c) => {
	return c.json({hoge: 'fuga'})
})

app.all('/*', async (c) => {
	c.executionCtx.passThroughOnException()

	const url = new URL(c.req.url)
	url.port = '3000'

	const blockRequest: Promise<void> = new Promise(() => fetch('http://localhost:3000/api/hello'))
	c.executionCtx.waitUntil(blockRequest)

	return await fetch(
		url.toString(),
		{
			headers: c.req.headers,
			body: c.req.body
		}
	)
})

export default app
