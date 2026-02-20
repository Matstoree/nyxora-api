const axios = require('axios')

module.exports = function (app) {
  app.get('/panel/servers', async (req, res) => {
    try {
      const { apikey, domain, plta } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!domain) {
        return res.json({ status: false, error: 'Domain wajib diisi' })
      }

      if (!plta) {
        return res.json({ status: false, error: 'PLTA wajib diisi' })
      }

      const cleanDomain = domain.replace(/\/+$/, '')

      const response = await axios.get(
        `${cleanDomain}/api/application/servers`,
        {
          headers: {
            Authorization: `Bearer ${plta}`,
            Accept: 'application/json'
          }
        }
      )

      const servers = response.data.data.map(s => ({
        id: s.attributes.id,
        uuid: s.attributes.uuid,
        name: s.attributes.name,
        identifier: s.attributes.identifier,
        owner_id: s.attributes.user,
        description: s.attributes.description || ''
      }))

      res.json({
        creator: "ItsMeMatt",
        status: true,
        total: servers.length,
        servers
      })

    } catch (err) {
      res.json({
        status: false,
        error:
          err.response?.data?.errors?.[0]?.detail ||
          err.message ||
          'Gagal mengambil data server'
      })
    }
  })
}
