const axios = require('axios')

module.exports = function app (app) {

  app.get('/imagecreator/brat', async (req, res) => {
    try {
      const { apikey, text } = req.query
      if (!apikey || !text) return res.json({ status: false, error: 'Parameter tidak lengkap' })
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' })

      const buffer = (
        await axios.get(
          `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`,
          { responseType: 'arraybuffer' }
        )
      ).data

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length
      })
      res.end(buffer)

    } catch (e) {
      res.status(500).json({ status: false, error: e.message })
    }
  })

  app.get('/imagecreator/bratvideo', async (req, res) => {
    try {
      const { apikey, text } = req.query
      if (!apikey || !text) return res.json({ status: false, error: 'Parameter tidak lengkap' })
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' })

      const api = `https://api.mitzuki.xyz/maker/bratvid?text=${encodeURIComponent(text)}&apikey=sk-e571cf9741c2cf987ff62cfa45eddb2afdbe9b3fa01a8cd11b17aaa6572021c9`
      const result = (await axios.get(api)).data
      if (!result.status || !result.data?.video_url) return res.json({ status: false, error: 'Gagal generate video' })

      const buffer = (
        await axios.get(result.data.video_url, { responseType: 'arraybuffer' })
      ).data

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': buffer.length
      })
      res.end(buffer)

    } catch (e) {
      res.status(500).json({ status: false, error: e.message })
    }
  })

}
