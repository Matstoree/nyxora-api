const axios = require('axios')

const convert = (ms) => {
  let minutes = Math.floor(ms / 60000)
  let seconds = ((ms % 60000) / 1000).toFixed(0)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
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
  app.get('/download/spotify', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!apikey)
        return res.json({ status: false, error: 'Apikey required' })
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      if (!url)
        return res.json({ status: false, error: 'Url is required' })

      if (!url.includes('spotify.com/track'))
        return res.json({ status: false, error: 'Invalid Spotify track url' })

      const result = await spotifyDownload(url)

      if (!result.status)
        return res.json({ status: false, error: result.msg })

      res.status(200).json({
        status: true,
        result: result.data
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      })
    }
  })
}
