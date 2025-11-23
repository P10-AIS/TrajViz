import express from 'express'
import cors from 'cors'
import zlib from 'zlib'
import Redis from 'ioredis'
import multer from 'multer'
import http from 'http'

const app = express()
app.use(cors())

const redis = new Redis({
  host: "redis",
  port: 6379,
})
const TRAJECTORY_KEY = 'trajectory_data'
const PREDICTION_KEY = 'prediction_data'

const server = http.createServer(app)
const upload = multer({ storage: multer.memoryStorage() })

// Trajectory endpoints ----------------------------------------------------------

app.post('/trajectories', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const compressedBuffer = req.body
    console.log('Received compressed trajectory data:', compressedBuffer.length, 'bytes')

    const compressedBase64 = compressedBuffer.toString('base64')
    await redis.set(TRAJECTORY_KEY, compressedBase64)

    res.json({ status: 'stored_and_broadcasted' })
  } catch (err) {
    console.error('Error storing trajectory:', err)
    res.status(500).json({ error: 'Failed to store trajectory' })
  }
})

app.get('/trajectories', async (req, res) => {
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

// Prediction endpoints ----------------------------------------------------------

app.post('/predictions', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const compressedBuffer = req.body
    const base64 = compressedBuffer.toString('base64')

    // We must decompress to read "step"
    const decompressed = zlib.gunzipSync(compressedBuffer)
    const json = JSON.parse(decompressed.toString())

    const step = json.step
    if (step === undefined) {
      return res.status(400).json({ error: "Missing step in uploaded data" })
    }

    // Store the compressed base64 under prediction_data:{step}
    await redis.set(`${PREDICTION_KEY}:${step}`, base64)

    res.json({ status: "stored", step })
  } catch (err) {
    console.error("Error storing prediction:", err)
    res.status(500).json({ error: "Failed to store prediction" })
  }
})


app.get('/predictions', async (req, res) => {
  try {
    const keys = await redis.keys(`${PREDICTION_KEY}:*`)
    keys.sort((a, b) => {
      const sa = parseInt(a.split(":")[1])
      const sb = parseInt(b.split(":")[1])
      return sa - sb
    })

    const results = []

    for (const key of keys) {
      const base64 = await redis.get(key)
      if (!base64) continue

      const buf = Buffer.from(base64, 'base64')
      const decoded = zlib.gunzipSync(buf)
      results.push(JSON.parse(decoded.toString()))
    }

    res.json(results)
  } catch (err) {
    console.error("Error reading predictions:", err)
    res.status(500).json({ error: "Failed to read predictions" })
  }
})


app.get('/predictions/:step', async (req, res) => {
  try {
    const step = req.params.step
    const base64 = await redis.get(`${PREDICTION_KEY}:${step}`)

    if (!base64) {
      return res.status(404).json({ error: "Step not found" })
    }

    const buf = Buffer.from(base64, 'base64')
    const decoded = zlib.gunzipSync(buf)

    res.json(JSON.parse(decoded.toString()))
  } catch (err) {
    console.error("Error retrieving step:", err)
    res.status(500).json({ error: "Failed to retrieve prediction step" })
  }
})


app.post('/predictions/reset', async (req, res) => {
  try {
    const keys = await redis.keys(`${PREDICTION_KEY}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    res.json({ status: "all_predictions_removed" })
  } catch (err) {
    console.error("Error resetting predictions:", err)
    res.status(500).json({ error: "Failed to reset predictions" })
  }
})

// Image endpoints ----------------------------------------------------------

app.post('/image', upload.single('image'), async (req, res) => {
  console.log('Received image upload request')
  try {
    const { name, area } = req.body
    const file = req.file

    if (!file || !name || !area) {
      return res.status(400).json({ error: 'Missing image, name, or area' })
    }

    let areaObj
    try {
      areaObj = JSON.parse(area)
    } catch (err) {
      return res.status(400).json({ error: 'Invalid area JSON' })
    }

    const imageData = {
      name,
      area: areaObj,
      mimeType: file.mimetype,
      data: file.buffer.toString('base64'),
      timestamp: Date.now(),
    }

    await redis.set(`image:${name}`, JSON.stringify(imageData))
    res.json({ status: 'image_stored', key: `image:${name}` })
  } catch (err) {
    console.error('Error storing image:', err)
    res.status(500).json({ error: 'Failed to store image' })
  }
})

app.get('/image/:name', async (req, res) => {
  try {
    const { name } = req.params
    const json = await redis.get(`image:${name}`)
    if (!json) return res.status(404).json({ error: 'Image not found' })

    const imageData = JSON.parse(json)
    res.json(imageData)
  } catch (err) {
    console.error('Error retrieving image:', err)
    res.status(500).json({ error: 'Failed to retrieve image' })
  }
})

//  ----------------------------------------------------------

app.get('/', (req, res) => {
  res.send('Trajectory Server is running')
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
