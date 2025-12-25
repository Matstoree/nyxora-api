const crypto = require('crypto')
const { fileTypeFromBuffer } = require('file-type/core')

if (!global.tourlStore) global.tourlStore = new Map()

module.exports = function (app) {

  app.get('/tools/tourl', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const r = await fetch(url)
      if (!r.ok) throw new Error('Failed to fetch file')

      const buffer = Buffer.from(await r.arrayBuffer())
      const f = await fileTypeFromBuffer(buffer)
      if (!f) throw new Error('Unsupported file')

      const form = new FormData()
      const file = new File([buffer], `${Date.now()}.${f.ext}`)

      form.append('file_1_', file)
      form.append('submitr', '[ رفع الملفات ]')

      const up = await fetch('https://top4top.io/index.php', {
        method: 'POST',
        body: form
      })

      const html = await up.text()
      const match = [...html.matchAll(/value="(https:\/\/top4top\.io\/downloadf\/[^"]+)"/g)]
      const realUrl = match.map(v => v[1]).find(v => v.endsWith(f.ext))
      if (!realUrl) throw new Error('Upload failed')

      const id = crypto.randomBytes(6).toString('hex')
      global.tourlStore.set(id, realUrl)

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        url: `${req.protocol}://${req.get('host')}/file/${id}`
      })

    } catch (e) {
      res.json({ status: false, error: e.message })
    }
  })

  app.get('/file/:id', (req, res) => {
    const url = global.tourlStore.get(req.params.id)
    if (!url) return res.status(404).send('File expired')
    res.redirect(url)
  })

}