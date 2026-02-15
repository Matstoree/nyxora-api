const axios = require('axios')
const cheerio = require('cheerio')

class SpotMate {
  constructor() {
    this._cookie = null
    this._token = null
  }

  async _visit() {
    const response = await axios.get('https://spotmate.online/en', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
      }
    })

    const setCookieHeader = response.headers['set-cookie']
    if (setCookieHeader) {
      this._cookie = setCookieHeader
        .map((cookie) => cookie.split(';')[0])
        .join('; ')
    }

    const $ = cheerio.load(response.data)
    this._token = $('meta[name="csrf-token"]').attr('content')

    if (!this._token) {
      throw new Error('Token CSRF tidak ditemukan')
    }
  }

  async info(spotifyUrl) {
    if (!this._cookie || !this._token) await this._visit()

    const response = await axios.post(
      'https://spotmate.online/getTrackData',
      { spotify_url: spotifyUrl },
      { headers: this._getHeaders() }
    )

    return response.data
  }

  async convert(spotifyUrl) {
    if (!this._cookie || !this._token) await this._visit()

    const response = await axios.post(
      'https://spotmate.online/convert',
      { urls: spotifyUrl },
      { headers: this._getHeaders() }
    )

    return response.data
  }

  clear() {
    this._cookie = null
    this._token = null
  }

  _getHeaders() {
    return {
      accept: '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/json',
      cookie: this._cookie,
      origin: 'https://spotmate.online',
      referer: 'https://spotmate.online/en',
      'user-agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
      'x-csrf-token': this._token
    }
  }
}

module.exports = function (app) {
  app.get('/download/spotify', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!apikey)
        return res.json({ status: false, error: 'Apikey required' })

      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      if (!url.includes('spotify.com/track/'))
        return res.json({ status: false, error: 'Invalid Spotify track url' })

      const spotMate = new SpotMate()

      const trackInfo = await spotMate.info(url)
      const convertResult = await spotMate.convert(url)

      if (!convertResult || !convertResult.url)
        return res.json({ status: false, error: 'Download failed' })

      spotMate.clear()

      res.status(200).json({
        status: true,
        result: {
          title: trackInfo?.album?.name || 'Unknown',
          download: convertResult.url
        }
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      })
    }
  })
}
