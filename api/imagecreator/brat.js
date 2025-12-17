module.exports = function app (app) {

  app.get('/imagecreator/brat', async (req, res) => {
    try {
      const { apikey, text } = req.query
      if (!apikey || !text)
        return res.json({ status: false, error: 'Parameter tidak lengkap' })
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      const pedo = await getBuffer(
        `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`
      )

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': pedo.length
      })
      res.end(pedo)

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })


  app.get('/imagecreator/bratvideo', async (req, res) => {
    try {
      const { apikey, text } = req.query
      if (!apikey || !text)
        return res.json({ status: false, error: 'Parameter tidak lengkap' })
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      const response = await fetch(
        `https://brat.siputzx.my.id/gif?text=${encodeURIComponent(text)}`
      )

      const buffer = await response.buffer()
      const contentType =
        response.headers.get('content-type') || 'video/webm'

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': buffer.length
      })
      res.end(buffer)

    } catch (error) {
      res.status(500).send(`Error: ${error.message}`)
    }
  })

}
