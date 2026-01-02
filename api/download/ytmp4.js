import crypto from 'crypto'

export default function (app) {

  const yt = {

    get baseHeaders() {
      return {
        accept: 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        origin: 'https://v2.yt1s.biz'
      }
    },

    extractId(url) {
      try {
        const u = new URL(url)
        if (u.hostname === 'youtu.be') return u.pathname.slice(1)
        if (u.searchParams.get('v')) return u.searchParams.get('v')
        if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split(/[?&]/)[0]
        if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split(/[?&]/)[0]
        return null
      } catch {
        return null
      }
    },

    handleFormat(fmt) {
      const valid = ['144p', '240p', '360p', '480p', '720p', '1080p']
      if (!valid.includes(fmt)) throw Error(`format invalid: ${valid.join(', ')}`)
      return { path: '/video', quality: fmt.replace('p', '') }
    },

    async hit(desc, url, opts, type = 'json') {
      const r = await fetch(url, opts)
      if (!r.ok) throw Error(`${desc} ${r.status}`)
      return type === 'json' ? r.json() : r.text()
    },

    async getSession() {
      const r = await fetch('https://fast.dlsrv.online/', {
        headers: this.baseHeaders
      })
      const token = r.headers.get('x-session-token')
      if (!token) throw Error('session kosong')
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
          return { nonce: nonce.toString(), powHash: h }
        }
        nonce++
      }
    },

    signature(session, path, ts) {
      const secret = 'a8d4e2456d59b90c8402fc4f060982aa'
      return crypto
        .createHmac('sha256', secret)
        .update(`${session}:${path}:${ts}`)
        .digest('hex')
    },

    async download(videoId, quality = '480p') {
      const { path, quality: q } = this.handleFormat(quality)
      const session = await this.getSession()
      const ts = Date.now().toString()
      const sig = this.signature(session, path, ts)
      const { nonce, powHash } = this.pow(session, path)

      const headers = {
        'content-type': 'application/json',
        'x-api-auth':
          'Ig9CxOQPYu3RB7GC21sOcgRPy4uyxFKTx54bFDu07G3eAMkrdVqXY9bBatu4WqTpkADrQ',
        'x-session-token': session,
        'x-signature': sig,
        'x-signature-timestamp': ts,
        nonce,
        powhash: powHash,
        ...this.baseHeaders
      }

      const api = `https://fast.dlsrv.online/gateway${path}`
      const body = JSON.stringify({ videoId, quality: q })

      return await this.hit(
        'download',
        api,
        { method: 'POST', headers, body },
        'json'
      )
    }
  }

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url, quality } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const id = yt.extractId(url)
      if (!id) throw 'Link YouTube tidak valid'

      const result = await yt.download(id, quality || '480p')

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })
    } catch (e) {
      res.json({
        status: false,
        error: e.toString()
      })
    }
  })
}
