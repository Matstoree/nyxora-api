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

const searchSpotify = async (query) => {
  const creds = await spotifyCreds()
  if (!creds.status) return creds

  const { data } = await axios.get(
    `https://api.spotify.com/v1/search?query=${encodeURIComponent(
      query
    )}&type=track&offset=0&limit=1`,
    {
      headers: { Authorization: `Bearer ${creds.token}` }
    }
  )

  if (!data.tracks.items.length)
    return { status: false, msg: 'Music not found!' }

  const v = data.tracks.items[0]

  return {
    status: true,
    data: {
      title: `${v.album.artists[0].name} - ${v.name}`,
      duration: convert(v.duration_ms),
      popularity: `${v.popularity}%`,
      preview: v.preview_url,
      url: v.external_urls.spotify,
      thumbnail: v.album.images[0]?.url || null
    }
  }
}

const spotifyDownload = async (url) => {
  try {
    const { data: meta } = await axios.get(
      `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(url)}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          Referer: 'https://spotifydownload.org/'
        }
      }
    )

    const { data: conv } = await axios.get(
      `https://api.fabdl.com/spotify/mp3-convert-task/${meta.result.gid}/${meta.result.id}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          Referer: 'https://spotifydownload.org/'
        }
      }
    )

    return {
      status: true,
      data: {
        title: meta.result.name,
        artist: meta.result.artists,
        duration: convert(meta.result.duration_ms),
        image: meta.result.image,
        download: `https://api.fabdl.com${conv.result.download_url}`
      }
    }
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

      const search = await searchSpotify(q)
      if (!search.status)
        return res.json({ status: false, error: search.msg })

      const dl = await spotifyDownload(search.data.url)
      if (!dl.status)
        return res.json({ status: false, error: dl.msg })

      res.status(200).json({
        status: true,
        result: {
          ...search.data,
          download: dl.data.download
        }
      })
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      })
    }
  })
}
