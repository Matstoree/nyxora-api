const axios = require('axios')
const crypto = require('crypto')

module.exports = function (app) {

  const savetube = {
    api: {
      base: 'https://media.savetube.me/api',
      cdn: '/random-cdn',
      info: '/v2/info',
      download: '/download'
    },
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      origin: 'https://yt.savetube.me',
      referer: 'https://yt.savetube.me/',
      'user-agent': 'Postify/1.0.0'
    },
    youtube(url) {
      const r = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
      ]
      for (const x of r) {
        const m = url.match(x)
        if (m) return m[1]
      }
      return null
    },
    decrypt(enc) {
      const key = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex')
      const buf = Buffer.from(enc, 'base64')
      const iv = buf.slice(0, 16)
      const data = buf.slice(16)
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
      return JSON.parse(
        Buffer.concat([decipher.update(data), decipher.final()]).toString()
      )
    },
    async request(url, data = {}, method = 'post') {
      const res = await axios({
        method,
        url,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: this.headers
      })
      return res.data
    },
    async getCDN() {
      const r = await this.request(this.api.base + this.api.cdn, {}, 'get')
      return r.cdn
    },
    async mp3(url) {
      const id = this.youtube(url)
      if (!id) throw 'Invalid YouTube URL'

      const cdn = await this.getCDN()

      const info = await this.request(`https://${cdn}${this.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      })

      const meta = this.decrypt(info.data)

      const dl = await this.request(`https://${cdn}${this.api.download}`, {
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

  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const result = await savetube.mp3(url)

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
