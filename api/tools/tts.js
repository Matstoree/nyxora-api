const gtts = require('node-gtts')

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
      const tts = gtts(language)

      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader(
        'Content-Disposition',
        'inline; filename="tts.mp3"'
      )

      tts.stream(text).pipe(res)

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      })
    }
  })

}
