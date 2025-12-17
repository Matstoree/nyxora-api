module.exports = function (app) {

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      const results = await global.fetchJson(
        `https://ytdlpyton.nvlgroup.my.id/download/?url=${encodeURIComponent(url)}&resolution=360&mode=url`,
        {
          headers: {
            'X-API-Key': process.env.YTDL_KEY || 'jarr'
          }
        }
      )

      res.status(200).json({
        status: true,
        result: results
      })

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })


  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      const results = await global.fetchJson(
        `https://ytdlpyton.nvlgroup.my.id/download/audio?url=${encodeURIComponent(url)}&mode=url&bitrate=128k`,
        {
          headers: {
            'X-API-Key': process.env.YTDL_KEY || 'jarr'
          }
        }
      )

      res.status(200).json({
        status: true,
        result: results
      })

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })

}
