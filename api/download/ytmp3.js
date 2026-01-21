const axios = require("axios")
const crypto = require("crypto")

module.exports = function (app) {

  class savetube {
    constructor() {
      this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12'
      this.fmt = ['144', '240', '360', '480', '720', '1080', 'mp3']
      this.m = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/
      this.is = axios.create({
        headers: {
          'content-type': 'application/json',
          origin: 'https://yt.savetube.me',
          'user-agent': 'Mozilla/5.0 (Android 15; Mobile)'
        }
      })
    }

    async decrypt(enc) {
      const buf = Buffer.from(enc, 'base64')
      const key = Buffer.from(this.ky, 'hex')
      const iv = buf.slice(0, 16)
      const data = buf.slice(16)
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
      return JSON.parse(
        Buffer.concat([decipher.update(data), decipher.final()]).toString()
      )
    }

    async getCdn() {
      const res = await this.is.get('https://media.savetube.vip/api/random-cdn')
      return res.data?.cdn
    }

    async download(url, format = 'mp3') {
      const id = url.match(this.m)?.[3]
      if (!id) throw new Error('Invalid YouTube URL')

      const cdn = await this.getCdn()
      if (!cdn) throw new Error('Failed to get CDN')

      const info = await this.is.post(`https://${cdn}/v2/info`, {
        url: `https://www.youtube.com/watch?v=${id}`
      })

      const meta = await this.decrypt(info.data.data)

      const dl = await this.is.post(`https://${cdn}/download`, {
        id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: meta.key
      })

      return {
        title: meta.title,
        duration: meta.duration,
        thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        download: dl.data.data.downloadUrl
      }
    }
  }

  const st = new savetube()

  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        })
      }

      if (!url) {
        return res.json({
          status: false,
          error: 'Url is required'
        })
      }

      const result = await st.download(url, 'mp3')

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
