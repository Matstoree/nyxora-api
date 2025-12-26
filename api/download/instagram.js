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
          headers: { accept: 'application/json' }
        }
      )

      if (!data?.status || !data?.data?.length) {
        return res.json({
          status: false,
          error: 'Media tidak ditemukan'
        })
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
        error: e.message
      })
    }
  })
}
