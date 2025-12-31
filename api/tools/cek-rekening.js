const axios = require('axios')

module.exports = function (app) {
  app.get('/tools/cek-rekening', async (req, res) => {
    try {
      const { apikey, bank_code, account_number } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        })
      }

      if (!bank_code || !account_number) {
        return res.json({
          status: false,
          error: 'bank_code dan account_number wajib diisi'
        })
      }

      const { data } = await axios.get(
        'https://www.rumahotp.com/api/v1/h2h/check/rekening',
        {
          params: {
            bank_code,
            account_number
          },
          timeout: 30000
        }
      )

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result: data
      })
    } catch (e) {
      res.json({
        status: false,
        error: e.response?.data || e.message
      })
    }
  })
}
