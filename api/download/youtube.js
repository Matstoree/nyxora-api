const axios = require('axios')
const crypto = require('crypto')

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download"
  },
  headers: {
    accept: '*/*',
    'content-type': 'application/json',
    origin: 'https://yt.savetube.me',
    referer: 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  },
  youtube(url) {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '').slice(0, 11)
      }
      if (u.hostname.includes('youtube.com')) {
        if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0, 11)
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].slice(0, 11)
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].slice(0, 11)
      }
      return null
    } catch {
      return null
    }
  },
  decrypt(enc) {
    const key = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex')
    const buf = Buffer.from(enc, 'base64')
    const iv = buf.slice(0, 16)
    const data = buf.slice(16)
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString())
  },
  async getCDN() {
    const { data } = await axios.get(this.api.base + this.api.cdn)
    return data.cdn
  },
  async post(url, data) {
    const res = await axios.post(url, data, { headers: this.headers })
    return res.data
  },
  async mp3(url) {
    const id = this.youtube(url)
    if (!id) throw new Error('URL YouTube tidak valid')
    const cdn = await this.getCDN()
    const info = await this.post(`https://${cdn}${this.api.info}`, {
      url: `https://www.youtube.com/watch?v=${id}`
    })
    const meta = this.decrypt(info.data)
    const dl = await this.post(`https://${cdn}${this.api.download}`, {
      id,
      downloadType: 'audio',
      quality: '128',
      key: meta.key
    })
    return {
      title: meta.title,
      duration: meta.duration,
      thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
      download: dl.data.downloadUrl
    }
  }
}

module.exports = function (app) {

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' })
      if (!url) return res.json({ status: false, error: 'Url is required' })
      const results = await global.fetchJson(
        `https://ytdlpyton.nvlgroup.my.id/download/?url=${encodeURIComponent(url)}&resolution=360&mode=url`,
        {
          headers: { 'X-API-Key': process.env.YTDL_KEY || 'jarr' }
        }
      )
      res.json({ status: true, result: results })
    } catch (e) {
      res.status(500).json({ status: false, error: e.message })
    }
  })

  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' })
      if (!url) return res.json({ status: false, error: 'Url is required' })
      const result = await savetube.mp3(url)
      res.json({ status: true, result })
    } catch (e) {
      res.status(500).json({ status: false, error: e.message })
    }
  })

}
