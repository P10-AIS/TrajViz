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

app.post('/trajectory', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const compressedBuffer = req.body
    console.log('Received compressed trajectory data:', compressedBuffer.length, 'bytes')

    // Store as Base64 in Redis
    const compressedBase64 = compressedBuffer.toString('base64')
    await redis.set(TRAJECTORY_KEY, compressedBase64)

    // Broadcast to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(JSON.stringify({ event: 'new_data_available' }))
    })

    res.json({ status: 'stored_and_broadcasted' })
  } catch (err) {
    console.error('Error storing trajectory:', err)
    res.status(500).json({ error: 'Failed to store trajectory' })
  }
})

// --- GET /latest ---
app.get('/latest', async (req, res) => {
  try {
    const compressedBase64 = await redis.get(TRAJECTORY_KEY)
    if (!compressedBase64) return res.json({ trajectory: [] })

    const buffer = Buffer.from(compressedBase64, 'base64')
    zlib.gunzip(buffer, (err, decoded) => {
      if (err) {
        console.error('Decompression error:', err)
        return res.status(500).json({ error: 'Failed to decompress trajectory data' })
      }

      try {
        const data = JSON.parse(decoded.toString())
        res.json(data)
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr)
        res.status(500).json({ error: 'Failed to parse trajectory JSON' })
      }
    })
  } catch (err) {
    console.error('Unexpected error in /latest:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/', (req, res) => {
  res.send('Trajectory Server is running')
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
