const axios = require('axios')

module.exports = function (app) {
  app.get('/panel/user-servers', async (req, res) => {
    try {
      const { apikey, domain, plta, username } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!domain || !plta || !username) {
        return res.json({ status: false, error: 'Parameter tidak lengkap' })
      }

      const cleanDomain = domain.replace(/\/+$/, '')

      const usersRes = await axios.get(
        `${cleanDomain}/api/application/users`,
        {
          headers: {
            Authorization: `Bearer ${plta}`,
            Accept: 'application/json'
          }
        }
      )

      const user = usersRes.data.data.find(
        u =>
          u.attributes.username.toLowerCase().trim() ===
          username.toLowerCase().trim()
      )

      if (!user) {
        return res.json({ status: false, error: 'User tidak ditemukan' })
      }

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
        .filter(s => s.attributes.user === user.attributes.id)
        .map(s => ({
          id: s.attributes.id,
          uuid: s.attributes.uuid,
          name: s.attributes.name,
          ram: s.attributes.limits.memory,
          disk: s.attributes.limits.disk,
          cpu: s.attributes.limits.cpu
        }))

      res.json({
        creator: "ItsMeMatt",
        status: true,
        username: user.attributes.username,
        total_servers: servers.length,
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
