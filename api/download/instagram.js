const axios = require('axios')

async function igee_deel(url) {
  const endpoint = 'https://igram.website/content.php?url=' + encodeURIComponent(url)
  const { data } = await axios.post(endpoint, '', {
    headers: {
      authority: 'igram.website',
      accept: '*/*',
      'accept-language': 'id-ID,id;q=0.9',
      'content-type': 'application/x-www-form-urlencoded',
      referer: 'https://igram.website/',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
    }
  })
  return data
}

function parse(html) {
  const clean = html.replace(/\n|\t/g, '')

  const videos = [...clean.matchAll(/<source src="([^"]+)/g)].map(v => v[1])
  let images = [...clean.matchAll(/<img src="([^"]+)/g)].map(v => v[1])
  if (images.length > 0) images = images.slice(1)

  const captionRaw = clean.match(/<p class="text-sm"[^>]*>(.*?)<\/p>/)
  const caption = captionRaw ? captionRaw[1].replace(/<br ?\/?>/g, '\n') : ''

  const likes = clean.match(/far fa-heart"[^>]*><\/i>\s*([^<]+)/)
  const comments = clean.match(/far fa-comment"[^>]*><\/i>\s*([^<]+)/)
  const time = clean.match(/far fa-clock"[^>]*><\/i>\s*([^<]+)/)

  return {
    is_video: videos.length > 0,
    videos,
    images,
    caption,
    likes: likes ? likes[1] : null,
    comments: comments ? comments[1] : null,
    time: time ? time[1] : null
  }
}

async function instagram(url) {
  if (!/(instagram\.com|instagr\.am)/i.test(url)) {
    throw new Error('Invalid Instagram URL')
  }

  const raw = await igee_deel(url)
  if (!raw || !raw.html) {
    throw new Error('Scrape failed')
  }

  const parsed = parse(raw.html)

  return {
    title: raw.username || 'Instagram',
    thumbnail: parsed.is_video
      ? parsed.videos[0] || ''
      : parsed.images[0] || '',
    type: parsed.is_video ? 'video' : 'image',
    video: parsed.is_video ? parsed.videos : [],
    images: parsed.is_video ? [] : parsed.images,
    caption: parsed.caption,
    likes: parsed.likes,
    comments: parsed.comments,
    time: parsed.time
  }
}

module.exports = function (app) {
  app.get('/download/instagram', async (req, res) => {
    const { apikey, url } = req.query

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' })
    }

    if (!url) {
      return res.json({ status: false, error: 'Url is required' })
    }

    try {
      const result = await instagram(url)
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
