const axios = require('axios')

module.exports = function (app) {
  app.get('/download/instagram', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        })
      }

      if (!url) {
        return res.json({
          status: false,
          error: 'Url tidak boleh kosong'
        })
      }

      const { data } = await axios.get(
        'https://api.ryzumi.vip/api/downloader/igdl',
        {
          params: { url },
          headers: {
            accept: 'application/json',
            'user-agent':
              'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
            referer: 'https://www.instagram.com/',
            origin: 'https://www.instagram.com'
          },
          timeout: 30000
        }
      )

      if (!data?.status || !Array.isArray(data.data)) {
        throw new Error('Gagal mengambil media Instagram')
      }

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result: data.data.map(v => ({
          type: v.type,
          thumbnail: v.thumbnail,
          url: v.url
        }))
      })
    } catch (e) {
      res.json({
        status: false,
        creator: 'ItsMeMatt',
        error: e.response?.status === 403
          ? '403 Forbidden (IP kamu diblok ryzumi)'
          : e.message
      })
    }
  })
}
