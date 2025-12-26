const axios = require('axios')

module.exports = function (app) {

  app.get('/tools/tts', async (req, res) => {
    try {
      const { apikey, text, lang } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!text) {
        return res.json({ status: false, error: 'Text is required' })
      }

      const language = (lang && lang.length === 2) ? lang : 'id'

      const url =
        'https://translate.google.com/translate_tts' +
        `?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`

      const audio = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      })

      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', 'inline; filename="tts.mp3"')
      res.send(Buffer.from(audio.data))

    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      })
    }
  })

}
