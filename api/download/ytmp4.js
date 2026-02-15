const axios = require('axios')

let jsonCache = null
const gB = Buffer.from('ZXRhY2xvdWQub3Jn', 'base64').toString()

const headers = {
  origin: 'https://v1.y2mate.nu',
  referer: 'https://v1.y2mate.nu/',
  'user-agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  accept: '*/*'
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const ts = () => Math.floor(Date.now() / 1000)

async function getjson() {
  if (jsonCache) return jsonCache
  const get = await axios.get('https://v1.y2mate.nu')
  const html = get.data
  const m = /var json = JSON\.parse\('([^']+)'\)/.exec(html)
  if (!m) throw new Error('Gagal mengambil konfigurasi')
  jsonCache = JSON.parse(m[1])
  return jsonCache
}

function authorization(json) {
  let e = ''
  for (let i = 0; i < json[0].length; i++) {
    e += String.fromCharCode(
      json[0][i] - json[2][json[2].length - (i + 1)]
    )
  }
  if (json[1]) e = e.split('').reverse().join('')
  return e.length > 32 ? e.slice(0, 32) : e
}

function extractId(url) {
  const m =
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /v=([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/shorts\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/live\/([a-zA-Z0-9_-]{11})/.exec(url)

  if (!m) return null
  return m[1]
}

async function init(json) {
  const key = String.fromCharCode(json[6])
  const url = `https://eta.${gB}/api/v1/init?${key}=${authorization(
    json
  )}&t=${ts()}`
  const res = await axios.get(url, { headers })
  if (res.data.error && res.data.error !== 0 && res.data.error !== '0') {
    throw new Error('Init gagal')
  }
  return res.data
}

async function yt2mate(videoUrl, format = 'mp4') {
  const json = await getjson()
  const videoId = extractId(videoUrl)
  if (!videoId) throw new Error('Link YouTube tidak valid')

  const initRes = await init(json)

  let res = await axios.get(
    initRes.convertURL +
      '&v=' +
      videoId +
      '&f=' +
      format +
      '&t=' +
      ts() +
      '&_=' +
      Math.random(),
    { headers }
  )

  let data = res.data

  if (data.error && data.error !== 0) {
    throw new Error('Convert gagal')
  }

  if (data.redirect === 1 && data.redirectURL) {
    const r2 = await axios.get(
      data.redirectURL + '&t=' + ts(),
      { headers }
    )
    data = r2.data
  }

  if (data.downloadURL && !data.progressURL) {
    return {
      id: videoId,
      title: data.title,
      format,
      download: data.downloadURL
    }
  }

  for (;;) {
    await sleep(3000)

    const progressRes = await axios.get(
      data.progressURL + '&t=' + ts(),
      { headers }
    )

    const p = progressRes.data

    if (p.error && p.error !== 0) {
      throw new Error('Progress error')
    }

    if (p.progress === 3) {
      return {
        id: videoId,
        title: p.title,
        format,
        download: data.downloadURL
      }
    }
  }
}

module.exports = function (app) {
  app.get('/download/ytmp4', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url wajib diisi' })
      }

      const result = await yt2mate(url, 'mp4')

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result: {
          videoId: result.id,
          title: result.title,
          quality: 'auto',
          downloadUrl: result.download
        }
      })
    } catch (e) {
      res.json({
        status: false,
        error: e.message || 'Terjadi kesalahan'
      })
    }
  })
}
