const axios = require('axios')
const cheerio = require('cheerio')

async function yt1s(url, type = 'mp3', quality = '128') {
  const api = 'https://yt1s.com/api/ajaxSearch/index'
  const convert = 'https://yt1s.com/api/ajaxConvert/convert'

  const { data: search } = await axios.post(
    api,
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

  if (!search || !search.links) throw 'Gagal mengambil data'

  let link
  if (type === 'mp3') {
    link = search.links.mp3[quality]
  } else {
    link = search.links.mp4[quality]
  }

  if (!link) throw 'Kualitas tidak tersedia'

  const { data: result } = await axios.post(
    convert,
    new URLSearchParams({
      vid: search.vid,
      k: link.k
    }).toString(),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }
  )

  return {
    title: search.title,
    duration: search.t,
    thumbnail: search.thumb,
    url: result.dlink
  }
}

module.exports = function (app) {

  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { apikey, url } = req.query
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }
      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

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
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }
      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

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
