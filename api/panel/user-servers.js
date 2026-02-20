const axios = require('axios')

module.exports = function (app) {
  app.get('/panel/user-servers', async (req, res) => {
    try {
      const { apikey, domain, plta, name } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!domain || !plta || !name) {
        return res.json({ status: false, error: 'Parameter tidak lengkap' })
      }

      const cleanDomain = domain
        .replace(/\/+$/, '')
        .replace(/\/api$/, '')

      const serversRes = await axios.get(
        `${cleanDomain}/api/application/servers`,
        {
          headers: {
            Authorization: `Bearer ${plta}`,
            Accept: 'application/json'
          }
        }
      )

      const servers = serversRes.data.data
        .filter(s =>
          s.attributes.name.toLowerCase().trim() ===
          name.toLowerCase().trim()
        )
        .map(s => ({
          id: s.attributes.id,
          uuid: s.attributes.uuid,
          name: s.attributes.name,
          description: s.attributes.description || "",
          ram: s.attributes.limits.memory,
          disk: s.attributes.limits.disk,
          cpu: s.attributes.limits.cpu,
          owner_id: s.attributes.user
        }))

      if (servers.length === 0) {
        return res.json({ status: false, error: 'Server tidak ditemukan' })
      }

      res.json({
        creator: "ItsMeMatt",
        status: true,
        total_found: servers.length,
        servers
      })

    } catch (err) {
      res.json({
        status: false,
        error:
          err.response?.data?.errors?.[0]?.detail ||
          err.message ||
          'Terjadi kesalahan'
      })
    }
  })
}
