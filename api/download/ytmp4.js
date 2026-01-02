const axios = require('axios')

async function yt1s(url, type = 'mp3', quality = '128') {
  const { data } = await axios.post(
    'https://yt1s.biz/api/ajaxSearch',
    new URLSearchParams({
      q: url,
      vt: 'home'
    }).toString(),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }
  )

  if (!data || !data.links) throw 'Gagal fetch data'

  let link
  if (type === 'mp3') {
    link = data.links.mp3[quality]
  } else {
    link = data.links.mp4[quality]
  }

  if (!link) throw 'Kualitas tidak tersedia'

  const { data: result } = await axios.post(
    'https://yt1s.biz/api/ajaxConvert',
    new URLSearchParams({
      vid: data.vid,
      k: link.k
    }).toString(),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }
  )

  return {
    title: data.title,
    duration: data.t,
    thumbnail: data.thumb,
    url: result.dlink
  }
}

module.exports = function (app) {

  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })
      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      const result = await yt1s(url, 'mp3', '128')
      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })
    } catch (e) {
      res.json({ status: false, error: e.toString() })
    }
  })

  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })
      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      const result = await yt1s(url, 'mp4', '360')
      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result
      })
    } catch (e) {
      res.json({ status: false, error: e.toString() })
    }
  })

}
