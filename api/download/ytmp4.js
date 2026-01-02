const fetch = require('node-fetch')

const yt = {
  apiVideo: 'https://dlsrv.online/api/download/mp4',
  baseHeaders: {
    'accept-encoding': 'gzip, deflate, br, zstd',
    'content-type': 'application/json',
    origin: 'https://yt1s.com.co',
    'user-agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
  },

  extractId(url) {
    try {
      const u = new URL(url)
      if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?&]/)[0]
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      if (u.pathname.includes('/shorts/'))
        return u.pathname.split('/shorts/')[1].split(/[?&]/)[0]
      if (u.pathname.includes('/embed/'))
        return u.pathname.split('/embed/')[1].split(/[?&]/)[0]
      return null
    } catch {
      return null
    }
  },

  async download(videoId, quality = '360p') {
    const q = quality.replace('p', '')
    const body = JSON.stringify({ videoId, quality: q })
    const r = await fetch(this.apiVideo, {
      method: 'POST',
      headers: this.baseHeaders,
      body
    })
    if (!r.ok) throw new Error('Gagal request ke server')
    const html = await r.text()
    const url = html.match(/href='(.+?)';/)?.[1]
    if (!url) throw new Error('Download url tidak ditemukan')
    return url
  }
}

module.exports = function (app) {
  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url, quality } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url wajib diisi' })
      }

      const id = yt.extractId(url)
      if (!id) {
        return res.json({ status: false, error: 'Link YouTube tidak valid' })
      }

      const q = quality || '360p'
      const downloadUrl = await yt.download(id, q)

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result: {
          videoId: id,
          quality: q,
          downloadUrl
        }
      })
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      })
    }
  })
  }
