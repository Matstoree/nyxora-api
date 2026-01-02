import crypto from 'crypto'
import axios from 'axios'

const yt = {
  origin: 'https://v2.yt1s.biz',

  headers() {
    return {
      accept: 'application/json, text/plain, */*',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      origin: this.origin
    }
  },

  async session() {
    const r = await axios.get('https://fast.dlsrv.online/', {
      headers: this.headers()
    })
    const token = r.headers['x-session-token']
    if (!token) throw 'Session token kosong'
    return token
  },

  pow(session, path) {
    let nonce = 0
    while (true) {
      const h = crypto
        .createHash('sha256')
        .update(`${session}:${path}:${nonce}`)
        .digest('hex')
      if (h.startsWith('0000')) {
        return { nonce: String(nonce), powhash: h }
      }
      nonce++
    }
  },

  sign(session, path, ts) {
    const secret = 'a8d4e2456d59b90c8402fc4f060982aa'
    return crypto
      .createHmac('sha256', secret)
      .update(`${session}:${path}:${ts}`)
      .digest('hex')
  },

  async audio(videoId, quality = '128') {
    const path = '/audio'
    const session = await this.session()
    const ts = Date.now().toString()
    const sig = this.sign(session, path, ts)
    const { nonce, powhash } = this.pow(session, path)

    const headers = {
      'content-type': 'application/json',
      'x-api-auth':
        'Ig9CxOQPYu3RB7GC21sOcgRPy4uyxFKTx54bFDu07G3eAMkrdVqXY9bBatu4WqTpkADrQ',
      'x-session-token': session,
      'x-signature': sig,
      'x-signature-timestamp': ts,
      nonce,
      powhash,
      ...this.headers()
    }

    const { data } = await axios.post(
      'https://fast.dlsrv.online/gateway/audio',
      {
        videoId,
        quality
      },
      { headers }
    )

    return data
  }
}

function extractId(url) {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    if (u.pathname.includes('/shorts/'))
      return u.pathname.split('/shorts/')[1].split(/[?&]/)[0]
    return null
  } catch {
    return null
  }
}

export default function (app) {
  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })
      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      const id = extractId(url)
      if (!id)
        return res.json({ status: false, error: 'URL YouTube tidak valid' })

      const result = await yt.audio(id, '128')

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })
    } catch (e) {
      res.json({ status: false, error: e.toString() })
    }
  })
}
