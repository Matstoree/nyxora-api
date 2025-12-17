module.exports = function(app) {

  app.get('/search/gimage', async (req, res) => {
    try {
      const { apikey, q } = req.query

      if (!apikey) {
        return res.json({ status: false, error: 'Apikey required' })
      }

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!q) {
        return res.json({ status: false, error: 'Query is required' })
      }

      const results = await global.fetchJson(
        `https://api.ryzumi.vip/api/search/gimage?query=${encodeURIComponent(q)}`
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
