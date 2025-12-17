module.exports = function (app) {

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!apikey) return res.json({ status: false, error: 'Apikey required' })
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const { data } = await axios.get(
        'https://ytdlpyton.nvlgroup.my.id/download/',
        {
          params: {
            url: url,
            resolution: 360,
            mode: 'url'
          },
          headers: {
            'accept': 'application/json',
            'X-API-Key': 'jarr'
          }
        }
      )

      res.status(200).json({
        status: true,
        result: data
      })

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })


  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!apikey) return res.json({ status: false, error: 'Apikey required' })
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const { data } = await axios.get(
        'https://ytdlpyton.nvlgroup.my.id/download/audio',
        {
          params: {
            url: url,
            mode: 'url',
            bitrate: '128k'
          },
          headers: {
            'accept': 'application/json',
            'X-API-Key': 'jarr'
          }
        }
      )

      res.status(200).json({
        status: true,
        result: data
      })

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })

}}
