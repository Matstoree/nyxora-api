const axios = require('axios')

module.exports = function (app) {

  async function generateFlux(prompt) {
    if (!prompt) throw new Error('Prompt is required')

    const response = await axios.post(
      'https://flux-image-gen-proxy.iskladchikov.workers.dev/',
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    const data = response.data

    if (data.imageUrl) {
      return {
        url: data.imageUrl,
        prompt,
        type: data.type || 'text-to-image'
      }
    }

    if (data.success === false || data.error) {
      throw new Error(data.error || 'Failed generate image')
    }

    throw new Error('Invalid API response')
  }

  app.get('/imagecreator/flux', async (req, res) => {
    try {
      const { apikey, prompt } = req.query

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        })
      }

      if (!prompt) {
        return res.json({
          status: false,
          error: 'Prompt is required'
        })
      }

      const result = await generateFlux(prompt)

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      })
    }
  })

}
