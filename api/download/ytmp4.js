const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

const yt = {
  _static: {
    apiAudio: 'https://dlsrv.online/api/download/mp3',
    apiVideo: 'https://dlsrv.online/api/download/mp4',
    baseHeaders: {
      'accept-encoding': 'gzip, deflate, br, zstd',
      'content-type': 'application/json',
      origin: 'https://yt1s.com.co',
      'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
    }
  },

  _resolvePayload(userFormat = '360p') {
    const valid = ['64k','96k','128k','256k','320k','144p','240p','360p','480p','720p','1080p']
    if (!valid.includes(userFormat)) {
      throw new Error(`Format invalid! Pilih: ${valid.join(', ')}`)
    }
    const api = /k$/.test(userFormat) ? this._static.apiAudio : this._static.apiVideo
    const quality = parseInt(userFormat) + ''
    return { api, quality }
  },

  async download(videoId, userFormat = '360p') {
    const { api, quality } = this._resolvePayload(userFormat)
    const body = JSON.stringify({ videoId, quality })

    const r = await fetch(api, {
      method: 'POST',
      headers: this._static.baseHeaders,
      body
    })

    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)

    const html = await r.text()
    const downloadUrl = html.match(/href='(.+?)';/)?.[1]
    if (!downloadUrl) throw new Error('Gagal mendapatkan download url')

    return { downloadUrl, quality }
  }
}

function extractId(url) {
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
}

module.exports = function (app) {

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url, quality } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const id = extractId(url)
      if (!id) {
        return res.json({ status: false, error: 'Link YouTube tidak valid' })
      }

      const result = await yt.download(id, quality || '360p')

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      })
    }
  })

}
