import express from 'express'
import cors from 'cors'
import zlib from 'zlib'
import Redis from 'ioredis'
import { WebSocketServer } from 'ws'
import http from 'http'

const app = express()
app.use(cors())

const redis = new Redis({
  host: "redis",
  port: 6379,
})
const TRAJECTORY_KEY = 'trajectory_data'

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  console.log('React client connected')

  redis.get(TRAJECTORY_KEY).then((compressed) => {
    if (compressed) {
      zlib.gunzip(Buffer.from(compressed, 'base64'), (err, decoded) => {
        if (!err) ws.send(decoded.toString())
      })
    }
  })
})

app.post('/trajectory', express.raw({ type: 'application/json', limit: '200mb' }), async (req, res) => {
  const compressedBuffer = req.body
  console.log('Received compressed trajectory data:', compressedBuffer.length, 'bytes')

  const compressedBase64 = compressedBuffer.toString('base64')
  await redis.set(TRAJECTORY_KEY, compressedBase64)

  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send('new data available')
  })

  res.send({ status: 'stored_and_broadcasted' })
})


app.get('/latest', async (req, res) => {
  const compressedBase64 = await redis.get(TRAJECTORY_KEY)
  if (!compressedBase64) return res.json({ trajectory: [] })

  zlib.gunzip(Buffer.from(compressedBase64, 'base64'), (err, decoded) => {
    if (err) return res.status(500).send('Failed to decompress')
    const data = JSON.parse(decoded.toString())
    res.json(data)
  })
})

app.get('/', (req, res) => {
  res.send('Trajectory Server is running')
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
