import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
	return c.text('Hello World!')
})

app.get('/ping', (c) => {
	return c.text('pong')
})

app.get('/json', (c) => {
	return c.json({hoge: 'fuga'})
})

export default app
