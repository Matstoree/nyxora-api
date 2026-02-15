const axios = require('axios')

const SPOTIFY_CLIENT_ID = '4c4fc8c3496243cbba99b39826e2841f'
const SPOTIFY_CLIENT_SECRET = 'd598f89aba0946e2b85fb8aefa9ae4c8'

const convert = (ms) => {
  let minutes = Math.floor(ms / 60000)
  let seconds = ((ms % 60000) / 1000).toFixed(0)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const spotifyCreds = async () => {
  try {
    const { data } = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    if (!data.access_token)
      return { status: false, msg: "Can't generate token!" }

    return { status: true, token: data.access_token }
  } catch (e) {
    return { status: false, msg: e.message }
  }
}

module.exports = function (app) {
  app.get('/search/spotify', async (req, res) => {
    try {
      const { apikey, q } = req.query

      if (!apikey)
        return res.json({ status: false, error: 'Apikey required' })
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })
      if (!q)
        return res.json({ status: false, error: 'Query is required' })

      const creds = await spotifyCreds()
      if (!creds.status)
        return res.json({ status: false, error: creds.msg })

      const { data } = await axios.get(
        `https://api.spotify.com/v1/search?query=${encodeURIComponent(
          q
        )}&type=track&offset=0&limit=20`,
        {
          headers: { Authorization: `Bearer ${creds.token}` }
        }
      )

      if (!data.tracks.items.length)
        return res.json({ status: false, error: 'Music not found!' })

      const result = data.tracks.items.map((v) => ({
        title: `${v.album.artists[0].name} - ${v.name}`,
        artist: v.album.artists[0].name,
        duration: convert(v.duration_ms),
        popularity: `${v.popularity}%`,
        preview: v.preview_url,
        url: v.external_urls.spotify,
        thumbnail: v.album.images[0]?.url || null
      }))

      res.status(200).json({
        status: true,
        result
      })
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      })
    }
  })
}
